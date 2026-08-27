import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });

  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          licenses: true,
          product: { select: { title: true, slug: true } },
        },
      },
      user: { select: { name: true, email: true, phone: true } },
    },
  });

  if (!order)
    return NextResponse.json({ ok: false, message: "یافت نشد" }, { status: 404 });

  return NextResponse.json({
    ok: true,
    order: {
      id: order.id,
      code: order.code,
      status: order.status,
      total: order.total,
      discount: order.discount,
      discountCode: order.discountCode,
      zarinpalRefId: order.zarinpalRefId,
      zarinpalAuthority: order.zarinpalAuthority,
      userId: order.userId,
      guestEmail: order.guestEmail,
      guestName: order.guestName,
      guestPhone: order.guestPhone,
      userName: order.user?.name || null,
      userEmail: order.user?.email || null,
      userPhone: order.user?.phone || null,
      createdAt: order.createdAt.toISOString(),
      paidAt: order.paidAt?.toISOString() || null,
      items: order.items.map((it) => ({
        id: it.id,
        productId: it.productId,
        productTitle: it.productTitle,
        productSlug: it.productSlug,
        price: it.price,
        quantity: it.quantity,
        duration: it.duration,
        licenses: it.licenses.map((l) => {
          let decrypted = l.key;
          try {
            if (l.key.startsWith("SEALED:")) {
              const { openKey } = require("@/lib/licenses");
              decrypted = openKey(it.productId, l.key);
            }
          } catch (e) {}
          return {
            id: l.id,
            key: decrypted,
            note: l.note,
            status: l.status,
          };
        }),
      })),
    },
  });
}

// PATCH — update status. If marking PAID manually, also sell reserved keys + update stock.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });

  const { id } = await params;
  try {
    const body = await req.json();
    const newStatus = body?.status;
    if (!["PENDING", "PAID", "FAILED", "CANCELLED"].includes(newStatus)) {
      return NextResponse.json(
        { ok: false, message: "وضعیت نامعتبر است" },
        { status: 400 }
      );
    }

    const order = await db.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order)
      return NextResponse.json({ ok: false, message: "سفارش یافت نشد" }, { status: 404 });

    // If already PAID, prevent re-paying
    if (order.status === "PAID" && newStatus === "PAID") {
      return NextResponse.json({ ok: true, order, message: "قبلاً پرداخت شده" });
    }

    // If cancelling or failing, release reserved keys
    if (newStatus === "CANCELLED" || newStatus === "FAILED") {
      await db.$transaction(async (tx) => {
        await tx.licenseKey.updateMany({
          where: { orderItem: { orderId: order.id } },
          data: { status: "AVAILABLE", orderItemId: null },
        });
        await tx.order.update({
          where: { id: order.id },
          data: { status: newStatus },
        });
        // Recount stock for each item's product
        for (const it of order.items) {
          const cnt = await tx.licenseKey.count({
            where: { productId: it.productId, status: "AVAILABLE" },
          });
          await tx.product.update({
            where: { id: it.productId },
            data: { stock: cnt },
          });
        }
      });
      return NextResponse.json({ ok: true, message: "وضعیت بروزرسانی شد" });
    }

    // If marking PAID manually — sell reserved keys + decrement stock
    if (newStatus === "PAID") {
      await db.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: { status: "PAID", paidAt: new Date() },
        });

        // mark reserved keys as SOLD
        await tx.licenseKey.updateMany({
          where: { orderItem: { orderId: order.id } },
          data: { status: "SOLD", soldAt: new Date() },
        });

        // decrement stock + increment salesCount per product
        for (const it of order.items) {
          const soldCount = await tx.licenseKey.count({
            where: { orderItemId: it.id, status: "SOLD" },
          });
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
          await tx.discountCode
            .update({
              where: { code: order.discountCode },
              data: { usedCount: { increment: 1 } },
            })
            .catch(() => {});
        }
      });
      return NextResponse.json({
        ok: true,
        message: "سفارش به‌عنوان پرداخت‌شده ثبت شد و لایسنس‌ها تحویل داده شدند",
      });
    }

    // PENDING — just update status
    await db.order.update({ where: { id: order.id }, data: { status: newStatus } });
    return NextResponse.json({ ok: true, message: "وضعیت بروزرسانی شد" });
  } catch (e: any) {
    console.error("admin orders PATCH error:", e);
    return NextResponse.json(
      { ok: false, message: e?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}
