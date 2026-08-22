import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });

  // Aggregate stats
  const [
    totalOrders,
    paidOrders,
    activeProducts,
    totalLicenses,
    availableLicenses,
    soldLicenses,
    reservedLicenses,
  ] = await Promise.all([
    db.order.count(),
    db.order.count({ where: { status: "PAID" } }),
    db.product.count({ where: { isActive: true } }),
    db.licenseKey.count(),
    db.licenseKey.count({ where: { status: "AVAILABLE" } }),
    db.licenseKey.count({ where: { status: "SOLD" } }),
    db.licenseKey.count({ where: { status: "RESERVED" } }),
  ]);

  // Revenue — sum of PAID orders total
  const revenueAgg = await db.order.aggregate({
    where: { status: "PAID" },
    _sum: { total: true },
  });
  const revenue = revenueAgg._sum.total || 0;

  // Last 7 days revenue series
  const now = new Date();
  const days: { label: string; date: string; revenue: number; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const dayOrders = await db.order.findMany({
      where: {
        status: "PAID",
        paidAt: { gte: d, lt: next },
      },
      select: { total: true },
    });
    const dayRevenue = dayOrders.reduce((s, o) => s + o.total, 0);
    const dayName = d.toLocaleDateString("fa-IR", { weekday: "short" });
    days.push({
      label: dayName,
      date: d.toISOString(),
      revenue: dayRevenue,
      count: dayOrders.length,
    });
  }

  // Low stock products (stock <= 2)
  const lowStockProducts = await db.product.findMany({
    where: { isActive: true, stock: { lte: 2 } },
    orderBy: { stock: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      stock: true,
      category: true,
    },
    take: 20,
  });

  // Recent orders (latest 8)
  const recentOrders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    include: {
      items: { select: { id: true, quantity: true } },
    },
  });

  const recent = recentOrders.map((o) => ({
    id: o.id,
    code: o.code,
    status: o.status,
    total: o.total,
    guestName: o.guestName,
    guestEmail: o.guestEmail,
    userName: null,
    itemsCount: o.items.reduce((s, it) => s + it.quantity, 0),
    createdAt: o.createdAt.toISOString(),
  }));

  return NextResponse.json({
    ok: true,
    stats: {
      revenue,
      totalOrders,
      paidOrders,
      activeProducts,
      totalLicenses,
      availableLicenses,
      soldLicenses,
      reservedLicenses,
    },
    revenueSeries: days,
    lowStock: lowStockProducts.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      stock: p.stock,
      category: p.category,
    })),
    recentOrders: recent,
  });
}
