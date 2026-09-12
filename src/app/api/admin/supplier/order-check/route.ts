import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSupplierOrder, logSupplier } from "@/lib/supplier";
import { sealKey } from "@/lib/licenses";
import { sendOrderFulfillmentEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { supplierOrderId } = body;

    if (!supplierOrderId) {
      return NextResponse.json({ ok: false, message: "شناسه سفارش الزامی است" }, { status: 400 });
    }

    const so = await db.supplierOrder.findUnique({
      where: { id: supplierOrderId },
      include: {
        product: true,
      },
    });

    if (!so) {
      return NextResponse.json({ ok: false, message: "سفارش تأمین‌کننده یافت نشد" }, { status: 404 });
    }

    if (!so.supplierRef) {
      return NextResponse.json({
        ok: false,
        message: "این سفارش شناسه ارجاع تأمین‌کننده (irMarket) ندارد و قابل استعلام خودکار نیست.",
      }, { status: 400 });
    }

    // Call irMarket API to get fresh order status
    const remote = await getSupplierOrder(so.supplierRef);
    if (!remote.ok) {
      return NextResponse.json({
        ok: false,
        message: remote.message || "خطا در استعلام از تأمین‌کننده",
      }, { status: 400 });
    }

    const remoteStatus = remote.status || "processing";
    const accounts = remote.accounts || [];

    // Map remote status to SupplierOrder status
    let newStatus = so.status;
    if (remoteStatus === "delivered") {
      newStatus = "FULFILLED";
    } else if (remoteStatus === "failed" || remoteStatus === "cancelled" || remote.refunded) {
      newStatus = "FAILED";
    } else if (remoteStatus === "processing") {
      newStatus = "PENDING";
    }

    // Update SupplierOrder
    await db.supplierOrder.update({
      where: { id: so.id },
      data: {
        status: newStatus,
        fulfilledAt: newStatus === "FULFILLED" ? (so.fulfilledAt || new Date()) : so.fulfilledAt,
      },
    });

    // If delivered, attach accounts to related OrderItem if not already delivered
    let deliveredCount = 0;
    if (newStatus === "FULFILLED" && accounts.length > 0) {
      // Find matching OrderItem
      let orderItem = so.orderItemId
        ? await db.orderItem.findUnique({ where: { id: so.orderItemId }, include: { order: true } })
        : null;

      if (!orderItem) {
        orderItem = await db.orderItem.findFirst({
          where: { supplierOrderId: `irm:${so.supplierRef}` },
          include: { order: true },
        });
      }

      if (orderItem) {
        const existingKeys = await db.licenseKey.findMany({
          where: { orderItemId: orderItem.id },
          select: { key: true },
        });
        const existingSet = new Set(existingKeys.map((k) => k.key));

        for (const account of accounts) {
          const sealed = sealKey(orderItem.productId, account);
          if (existingSet.has(sealed)) continue;

          await db.licenseKey.create({
            data: {
              productId: orderItem.productId,
              key: sealed,
              note: `سفارش ${orderItem.order.code} | استعلام دستی irMarket #${so.supplierRef}`,
              status: "SOLD",
              source: "supplier_api",
              orderItemId: orderItem.id,
              supplierOrderId: so.id,
              soldAt: new Date(),
            },
          });
          existingSet.add(sealed);
          deliveredCount++;
        }

        await db.orderItem.update({
          where: { id: orderItem.id },
          data: { fulfillmentStatus: "FULFILLED" },
        });

        if (deliveredCount > 0) {
          sendOrderFulfillmentEmail(orderItem.orderId).catch(() => {});
        }
      }
    }

    await logSupplier(
      so.id,
      "manual_order_poll",
      "INFO",
      { remoteStatus, accountsCount: accounts.length, deliveredCount },
      `استعلام دستی سفارش irMarket #${so.supplierRef} انجام شد (وضعیت: ${remoteStatus})`
    );

    return NextResponse.json({
      ok: true,
      status: newStatus,
      remoteStatus,
      accountsCount: accounts.length,
      deliveredCount,
      message: `وضعیت سفارش با موفقیت استعلام شد: ${remoteStatus} (${deliveredCount} کلید تحویل شد)`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error?.message || "خطای غیرمنتظره در استعلام سفارش" },
      { status: 500 }
    );
  }
}
