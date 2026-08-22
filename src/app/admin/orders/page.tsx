import { db } from "@/lib/db";
import { toFa } from "@/lib/date";
import { OrdersClient } from "@/components/admin/orders-client";

export const metadata = { title: "مدیریت سفارش‌ها" };

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const status = sp.status || "";
  const q = (sp.q || "").trim();

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
    take: 500,
    include: {
      items: { select: { id: true, quantity: true } },
    },
  });

  const serializable = orders.map((o) => ({
    id: o.id,
    code: o.code,
    status: o.status,
    total: o.total,
    discount: o.discount,
    discountCode: o.discountCode,
    zarinpalRefId: o.zarinpalRefId,
    guestEmail: o.guestEmail,
    guestName: o.guestName,
    guestPhone: o.guestPhone,
    itemsCount: o.items.reduce((s, it) => s + it.quantity, 0),
    createdAt: o.createdAt.toISOString(),
    paidAt: o.paidAt?.toISOString() || null,
  }));

  const counts = {
    all: await db.order.count(),
    PAID: await db.order.count({ where: { status: "PAID" } }),
    PENDING: await db.order.count({ where: { status: "PENDING" } }),
    FAILED: await db.order.count({ where: { status: "FAILED" } }),
    CANCELLED: await db.order.count({ where: { status: "CANCELLED" } }),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black">مدیریت سفارش‌ها</h1>
          <p className="text-sm text-muted-foreground">نمایش {toFa(serializable.length)} سفارش</p>
        </div>
      </div>

      <OrdersClient orders={serializable} counts={counts} initialStatus={status} initialQuery={q} />
    </div>
  );
}
