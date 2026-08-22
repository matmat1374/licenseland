import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

// GET — list all orders (filter ?status=, search ?q=)
export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";
  const q = (searchParams.get("q") || "").trim();
  const limit = Math.min(Number(searchParams.get("limit") || 200), 500);

  const where: any = {};
  if (status && ["PENDING", "PAID", "FAILED", "CANCELLED"].includes(status)) {
    where.status = status;
  }
  if (q) {
    where.OR = [
      { code: { contains: q } },
      { guestEmail: { contains: q } },
      { guestName: { contains: q } },
      { guestPhone: { contains: q } },
    ];
  }

  const orders = await db.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      items: { select: { id: true, quantity: true, productTitle: true } },
      user: { select: { name: true, email: true, phone: true } },
    },
  });

  const list = orders.map((o) => ({
    id: o.id,
    code: o.code,
    status: o.status,
    total: o.total,
    discount: o.discount,
    discountCode: o.discountCode,
    zarinpalRefId: o.zarinpalRefId,
    userId: o.userId,
    guestEmail: o.guestEmail,
    guestName: o.guestName,
    guestPhone: o.guestPhone,
    userName: o.user?.name || null,
    userEmail: o.user?.email || null,
    userPhone: o.user?.phone || null,
    itemsCount: o.items.reduce((s, it) => s + it.quantity, 0),
    createdAt: o.createdAt.toISOString(),
    paidAt: o.paidAt?.toISOString() || null,
  }));

  return NextResponse.json({ ok: true, orders: list });
}
