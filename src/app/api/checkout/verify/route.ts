import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { zarinpalVerify, isDemoMode } from "@/lib/zarinpal";
import { getBaseUrl } from "@/lib/url";
import { purchaseFromSupplier } from "@/lib/supplier";
import { signOrderAccessToken } from "@/lib/order-access";
import { sealKey } from "@/lib/licenses";

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

  // user cancelled — applies to demo AND real gateways (C3 fix: previously demo
  // authorities skipped cancellation and were marked PAID anyway)
  if (status !== "OK") {
    await releaseReservedKeys(order.id);
    await db.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
    return NextResponse.redirect(new URL(`/checkout?failed=cancel`, base));
  }

  // already processed (idempotency fast-path)
  if (order.status === "PAID") {
    const t = signOrderAccessToken(order.id);
    return NextResponse.redirect(new URL(`/order/${order.id}?paid=1&token=${t}`, base));
  }

  const verify = await zarinpalVerify(order.total, authority);

  if (!verify.success) {
    await releaseReservedKeys(order.id);
    await db.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
    return NextResponse.redirect(new URL(`/order/${order.id}?failed=1&token=${signOrderAccessToken(order.id)}`, base));
  }

  // Atomically claim the PAID transition (H6 fix): concurrent callbacks race on
  // a conditional update; the loser sees count=0 and just redirects.
  const claimed = await db.order.updateMany({
    where: { id: order.id, status: { not: "PAID" } },
    data: { status: "PAID", zarinpalRefId: verify.refId || null, paidAt: new Date() },
  });
  if (claimed.count === 0) {
    const t = signOrderAccessToken(order.id);
    return NextResponse.redirect(new URL(`/order/${order.id}?paid=1&token=${t}`, base));
  }

  // success: sell keys, update product stats — single transaction
  await db.$transaction(async (tx) => {
    await tx.licenseKey.updateMany({
      where: { orderItem: { orderId: order.id } },
      data: { status: "SOLD", soldAt: new Date() },
    });

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

    if (order.discountCode) {
      await tx.discountCode
        .update({ where: { code: order.discountCode }, data: { usedCount: { increment: 1 } } })
        .catch(() => {});
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
        // trace irMarket's numeric order id on the item (webhook + polling match on it)
        if (result.orderId) {
          await db.orderItem.update({
            where: { id: it.id },
            data: { supplierOrderId: `irm:${result.orderId}`, fulfillmentStatus: result.ok ? "FULFILLED" : "PENDING_MANUAL" },
          });
        }
        if (result.ok && result.accounts && result.accounts.length > 0) {
          for (const account of result.accounts) {
            await db.licenseKey.create({
              data: {
                productId: it.productId,
                key: sealKey(it.productId, account), // C5 fix: sealed at rest
                note: `سفارش ${order.code} | تأمین‌کننده: irMarket #${result.orderId || ""}`,
                status: "SOLD",
                source: "supplier_api",
                orderItemId: it.id,
                soldAt: new Date(),
              },
            });
          }
        } else {
          console.error(`[supplier] auto-fulfill failed for ${it.productTitle}: ${result.message}`);
        }
      }
    }
  } catch (e) {
    console.error("[supplier] auto-fulfill error:", e);
  }

  const token = signOrderAccessToken(order.id);
  return NextResponse.redirect(new URL(`/order/${order.id}?paid=1&token=${token}`, base));
}

async function releaseReservedKeys(orderId: string) {
  // conditional updateMany is atomic: only RESERVED rows flip back to AVAILABLE
  await db.licenseKey.updateMany({
    where: { orderItem: { orderId }, status: "RESERVED" },
    data: { status: "AVAILABLE", orderItemId: null },
  });
}
