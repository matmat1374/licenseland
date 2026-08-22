import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { zarinpalVerify, isDemoMode } from "@/lib/zarinpal";
import { getBaseUrl } from "@/lib/url";
import { purchaseFromSupplier } from "@/lib/supplier";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const authority = searchParams.get("Authority") || "";
  const status = searchParams.get("Status") || "";
  const base = getBaseUrl(req);

  if (!authority) {
    return NextResponse.redirect(new URL("/checkout?failed=1", base));
  }

  const order = await db.order.findFirst({ where: { zarinpalAuthority: authority } });

  if (!order) {
    return NextResponse.redirect(new URL("/checkout?failed=1", base));
  }

  // user cancelled
  if (status !== "OK" && !authority.startsWith("DEMO")) {
    await releaseReservedKeys(order.id);
    await db.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
    return NextResponse.redirect(new URL(`/checkout?failed=cancel`, base));
  }

  // already paid (idempotency)
  if (order.status === "PAID") {
    return NextResponse.redirect(new URL(`/order/${order.id}?paid=1`, base));
  }

  const verify = await zarinpalVerify(order.total, authority);

  if (!verify.success) {
    await releaseReservedKeys(order.id);
    await db.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
    return NextResponse.redirect(new URL(`/order/${order.id}?failed=1`, base));
  }

  // success: mark paid, sell keys, update product stats
  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { status: "PAID", zarinpalRefId: verify.refId || null, paidAt: new Date() },
    });

    // mark reserved keys as SOLD (for non-supplier products)
    await tx.licenseKey.updateMany({
      where: { orderItem: { orderId: order.id } },
      data: { status: "SOLD", soldAt: new Date() },
    });

    // decrement product stock + increment salesCount
    const items = await tx.orderItem.findMany({ where: { orderId: order.id } });
    for (const it of items) {
      const soldCount = await tx.licenseKey.count({ where: { orderItemId: it.id, status: "SOLD" } });
      await tx.product.update({
        where: { id: it.productId },
        data: {
          stock: { decrement: soldCount },
          salesCount: { increment: it.quantity },
        },
      });
    }

    // increment discount code usage
    if (order.discountCode) {
      await tx.discountCode.update({
        where: { code: order.discountCode },
        data: { usedCount: { increment: 1 } },
      }).catch(() => {});
    }
  });

  // Auto-fulfill supplier products (irMarket): buy from supplier and save accounts as license keys
  // This runs AFTER the transaction so fetch calls don't block it.
  try {
    const orderItems = await db.orderItem.findMany({ where: { orderId: order.id }, include: { product: true } });
    for (const it of orderItems) {
      let isSupplierProduct = false;
      try {
        const specs = JSON.parse(it.product.specifications || "{}");
        isSupplierProduct = !!specs.supplier_product_id;
      } catch {}
      if (isSupplierProduct) {
        const result = await purchaseFromSupplier(
          it.productId,
          it.quantity,
          order.guestEmail || undefined,
          `${order.code}-${it.id}`
        );
        if (result.ok && result.accounts && result.accounts.length > 0) {
          // save each account as a license key
          for (const account of result.accounts) {
            await db.licenseKey.create({
              data: {
                productId: it.productId,
                key: account,
                note: `سفارش ${order.code} | تأمین‌کننده: irMarket #${result.orderId || ""}`,
                status: "SOLD",
                source: "supplier_api",
                orderItemId: it.id,
                soldAt: new Date(),
              },
            });
          }
        } else {
          // log failure — customer will see "in processing" and admin can fulfill manually
          console.error(`[supplier] auto-fulfill failed for ${it.productTitle}: ${result.message}`);
        }
      }
    }
  } catch (e) {
    console.error("[supplier] auto-fulfill error:", e);
  }

  return NextResponse.redirect(new URL(`/order/${order.id}?paid=1`, base));
}

async function releaseReservedKeys(orderId: string) {
  await db.licenseKey.updateMany({
    where: { orderItem: { orderId } },
    data: { status: "AVAILABLE", orderItemId: null },
  });
}
