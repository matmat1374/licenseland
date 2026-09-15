import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  KeyRound,
  Wallet,
  Clock,
  ChevronLeft,
  ShoppingBag,
  ShieldCheck,
  Copy,
  Sparkles,
} from "lucide-react";
import { formatJalaliDate, toFa } from "@/lib/date";
import { toToman } from "@/lib/format";
import { openKeys } from "@/lib/licenses";
import { DashboardTabs } from "@/components/site/dashboard-tabs";
import { DashboardHeader } from "@/components/site/dashboard-header";
import { getLoyalty } from "@/lib/loyalty";

export const metadata = { title: "پنل کاربری", robots: { index: false } };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getServerSession(authOptions);
  logger.info("dashboard.page: session check", { hasSession: !!session, userId: session?.user?.id, role: session?.user?.role });
  if (!session?.user?.id) {
    logger.warn("dashboard.page: no session, redirecting to login");
    redirect("/login?callbackUrl=/dashboard");
  }

  const sp = await searchParams;
  const tab = sp.tab || "overview";

  const safeIso = (d: any) => {
    try {
      if (!d) return new Date().toISOString();
      const dt = new Date(d);
      return !isNaN(dt.getTime()) ? dt.toISOString() : new Date().toISOString();
    } catch {
      return new Date().toISOString();
    }
  };

  try {
    const loyaltyRecord = await getLoyalty(session.user.id);

    const [orders, user, badges, events] = await Promise.all([
      db.order.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        include: { items: { include: { licenses: true } } },
      }),
      db.user.findUnique({ where: { id: session.user.id }, select: { id: true, name: true, email: true, phone: true, nationalId: true, avatar: true, role: true, createdAt: true } }),
      db.userBadge.findMany({ where: { userId: session.user.id }, orderBy: { awardedAt: "desc" } }),
      loyaltyRecord ? db.pointEvent.findMany({ where: { loyaltyId: loyaltyRecord.id }, orderBy: { createdAt: "desc" }, take: 20 }) : Promise.resolve([]),
    ]);

    const paidOrders = orders.filter((o) => o.status === "PAID");
    const totalSpent = paidOrders.reduce((s, o) => s + o.total, 0);
    // decrypt sealed license keys (C5) — per product
    const openedByItem = new Map<string, { id: string; key: string }[]>();
    for (const o of paidOrders) {
      for (const it of o.items) {
        if (it.licenses.length) openedByItem.set(it.id, openKeys(it.productId, it.licenses));
      }
    }
    const allLicenses = paidOrders.flatMap((o) =>
      o.items.flatMap((it) => {
        const opened = openedByItem.get(it.id) || [];
        return it.licenses.map((l, i) => ({
          ...l,
          key: opened[i]?.key ?? "",
          productTitle: it.productTitle,
          orderCode: o.code,
          date: o.paidAt || o.createdAt,
        }));
      })
    );

    const stats = [
      { label: "کل سفارش‌ها", value: toFa(orders.length), icon: Package, color: "from-emerald-500 to-teal-600" },
      { label: "سفارش‌های موفق", value: toFa(paidOrders.length), icon: ShieldCheck, color: "from-amber-500 to-orange-600" },
      { label: "لایسنس‌های من", value: toFa(allLicenses.length), icon: KeyRound, color: "from-rose-500 to-pink-600" },
      { label: "مجموع خرید", value: `${toFa(totalSpent.toLocaleString("en-US"))} ت`, icon: Wallet, color: "from-cyan-500 to-emerald-600" },
    ];

    // serialize for client component — license keys ONLY for paid orders (decrypted)
    const serializableOrders = orders.map((o) => ({
      id: o.id,
      code: o.code,
      status: o.status,
      total: o.total,
      createdAt: safeIso(o.createdAt),
      paidAt: o.paidAt ? safeIso(o.paidAt) : null,
      items: o.items.map((it) => {
        const opened = o.status === "PAID" ? openedByItem.get(it.id) || [] : [];
        return {
          id: it.id,
          productTitle: it.productTitle,
          productSlug: it.productSlug,
          quantity: it.quantity,
          price: it.price,
          licenses: it.licenses.map((l, i) => ({ id: l.id, key: opened[i]?.key ?? "", note: l.note })),
        };
      }),
    }));
    const serializableLicenses = allLicenses.map((l) => ({
      id: l.id,
      key: l.key,
      note: l.note,
      productTitle: l.productTitle,
      orderCode: l.orderCode,
      date: safeIso(l.date),
    }));
    const serializableUser = user ? {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      nationalId: user.nationalId,
      avatar: user.avatar,
      role: user.role,
      createdAt: safeIso(user.createdAt),
    } : null;

    const serializableLoyalty = loyaltyRecord ? {
      id: loyaltyRecord.id,
      tier: loyaltyRecord.tier,
      totalSpent: loyaltyRecord.totalSpent,
      totalPoints: loyaltyRecord.totalPoints,
      lifetimePoints: loyaltyRecord.lifetimePoints,
    } : {
      id: "none", tier: "BRONZE", totalSpent: 0, totalPoints: 0, lifetimePoints: 0
    };
    const serializableBadges = badges.map((b) => ({ id: b.id, badge: b.badge }));
    const serializableEvents = events.map((e) => ({
      id: e.id,
      type: e.type,
      points: e.points,
      description: e.description,
      createdAt: safeIso(e.createdAt),
    }));

    return (
      <div className="container mx-auto px-4 py-8">
        {/* header */}
        <DashboardHeader userName={user?.name || user?.phone || "کاربر گرامی"} />

        {/* stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="overflow-hidden p-4">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} text-white`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div className="text-lg font-black">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </Card>
          ))}
        </div>

        <DashboardTabs 
          tab={tab} 
          orders={serializableOrders} 
          licenses={serializableLicenses} 
          user={serializableUser}
          loyalty={serializableLoyalty}
          badges={serializableBadges}
          events={serializableEvents}
        />
      </div>
    );
  } catch (error) {
    logger.error("dashboard.page: error", { error });
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center text-center min-h-[50vh]">
        <Package className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">خطا در دریافت اطلاعات</h2>
        <p className="text-muted-foreground mb-6">متأسفانه در حال حاضر امکان دریافت اطلاعات پنل کاربری شما وجود ندارد.</p>
        <Link href="/dashboard">
          <Button variant="default">تلاش مجدد</Button>
        </Link>
      </div>
    );
  }
}
