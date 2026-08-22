import Link from "next/link";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  ShieldCheck,
  Package,
  TrendingUp,
  AlertTriangle,
  ChevronLeft,
  Target,
  Activity,
  Percent,
  Gauge,
} from "lucide-react";
import { toToman } from "@/lib/format";
import { toFa, formatJalaliDate } from "@/lib/date";
import { RevenueChart } from "@/components/admin/revenue-chart";

export const metadata = { title: "داشبورد مدیریت" };

const STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PAID: { label: "پرداخت شده", variant: "default" },
  PENDING: { label: "در انتظار", variant: "secondary" },
  FAILED: { label: "ناموفق", variant: "destructive" },
  CANCELLED: { label: "لغو شده", variant: "outline" },
};

interface DayPoint {
  label: string;
  revenue: number;
  count: number;
}

async function computeKpis() {
  // Run all aggregations in parallel for performance
  const [
    totalOrdersAgg,
    paidOrdersAgg,
    revenueAgg,
    failedOrdersAgg,
    activeProductsAgg,
    totalLicensesAgg,
    availableLicensesAgg,
    supplierTotalAgg,
    supplierFailedAgg,
    lowStockAgg,
  ] = await Promise.all([
    db.order.count(),
    db.order.count({ where: { status: "PAID" } }),
    db.order.aggregate({
      where: { status: "PAID" },
      _sum: { total: true },
    }),
    db.order.count({ where: { status: "FAILED" } }),
    db.product.count({ where: { isActive: true } }),
    db.licenseKey.count(),
    db.licenseKey.count({ where: { status: "AVAILABLE" } }),
    db.supplierOrder.count(),
    db.supplierOrder.count({ where: { status: "FAILED" } }),
    db.product.count({
      where: { isActive: true, stock: { lte: 3 } },
    }),
  ]);

  const totalOrders = totalOrdersAgg;
  const paidOrders = paidOrdersAgg;
  const revenue = revenueAgg._sum.total || 0;
  const failedOrders = failedOrdersAgg;
  const activeProducts = activeProductsAgg;
  const totalLicenses = totalLicensesAgg;
  const availableLicenses = availableLicensesAgg;
  const supplierTotal = supplierTotalAgg;
  const supplierFailed = supplierFailedAgg;
  const lowStockCount = lowStockAgg;

  // Gross margin: prefer PriceSnapshot linked to paid orders.
  // Fallback: estimate from markup (default 200% → cost = revenue / 3).
  let supplierCost = 0;
  let marginSource: "snapshot" | "estimate" = "estimate";
  try {
    const paidOrderIds = await db.order.findMany({
      where: { status: "PAID" },
      select: { id: true },
    });
    const idList = paidOrderIds.map((o) => o.id);
    if (idList.length > 0) {
      const snapshots = await db.priceSnapshot.findMany({
        where: { orderId: { in: idList } },
        select: { costMinor: true, sellMinor: true },
      });
      if (snapshots.length > 0) {
        supplierCost = snapshots.reduce((s, x) => s + (x.costMinor || 0), 0);
        marginSource = "snapshot";
        // Sanity: if snapshots sellMinor sums < revenue, prefer revenue-derived margin
        const snapshotRevenue = snapshots.reduce(
          (s, x) => s + (x.sellMinor || 0),
          0
        );
        if (snapshotRevenue === 0) {
          // Snapshots exist but all zero — fall back to estimate
          supplierCost = Math.floor(revenue / 3);
          marginSource = "estimate";
        }
      } else if (revenue > 0) {
        // No snapshots — estimate cost from default markup (200%)
        supplierCost = Math.floor(revenue / 3);
      }
    }
  } catch {
    // PriceSnapshot table may not exist or query failed — fallback
    if (revenue > 0) supplierCost = Math.floor(revenue / 3);
  }

  const grossMargin = Math.max(0, revenue - supplierCost);
  const grossMarginPct = revenue > 0 ? Math.round((grossMargin / revenue) * 100) : 0;

  const aov = paidOrders > 0 ? Math.floor(revenue / paidOrders) : 0;
  const conversionRate =
    totalOrders > 0 ? (paidOrders / totalOrders) * 100 : 0;
  const supplierFailureRate =
    supplierTotal > 0 ? (supplierFailed / supplierTotal) * 100 : 0;

  return {
    totalOrders,
    paidOrders,
    revenue,
    failedOrders,
    activeProducts,
    totalLicenses,
    availableLicenses,
    supplierTotal,
    supplierFailed,
    lowStockCount,
    supplierCost,
    grossMargin,
    grossMarginPct,
    marginSource,
    aov,
    conversionRate,
    supplierFailureRate,
  };
}

async function getLast7Days(): Promise<DayPoint[]> {
  const now = new Date();
  const weekdayNames = [
    "یکشنبه",
    "دوشنبه",
    "سه‌شنبه",
    "چهارشنبه",
    "پنجشنبه",
    "جمعه",
    "شنبه",
  ];
  const days: DayPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const dayOrders = await db.order.findMany({
      where: { status: "PAID", paidAt: { gte: d, lt: next } },
      select: { total: true },
    });
    const dayRevenue = dayOrders.reduce((s, o) => s + o.total, 0);
    days.push({
      label: weekdayNames[d.getDay()],
      revenue: dayRevenue,
      count: dayOrders.length,
    });
  }
  return days;
}

export default async function AdminDashboardPage() {
  const kpis = await computeKpis();
  const days = await getLast7Days();

  // Recent orders (latest 10)
  const recentOrders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { items: { select: { id: true, quantity: true } } },
  });

  // Low stock products (stock <= 3, take 10)
  const lowStock = await db.product.findMany({
    where: { isActive: true, stock: { lte: 3 } },
    orderBy: { stock: "asc" },
    select: { id: true, title: true, slug: true, stock: true, category: true },
    take: 10,
  });

  const kpiCards = [
    {
      label: "درآمد کل",
      value: `${toFa(kpis.revenue.toLocaleString("en-US"))} ت`,
      sub: `${toFa(kpis.paidOrders)} سفارش پرداخت‌شده`,
      icon: Wallet,
      color: "from-emerald-500 to-teal-600",
    },
    {
      label: "حاشیه سود ناخالص",
      value: `${toFa(kpis.grossMargin.toLocaleString("en-US"))} ت`,
      sub: `${toFa(kpis.grossMarginPct)}٪ ${
        kpis.marginSource === "snapshot"
          ? "(از اسنپ‌شات)"
          : "(تخمینی ۲۰۰٪)"
      }`,
      icon: Percent,
      color: "from-teal-500 to-emerald-600",
    },
    {
      label: "میانگین ارزش سفارش",
      value: `${toFa(kpis.aov.toLocaleString("en-US"))} ت`,
      sub: "AOV",
      icon: Target,
      color: "from-amber-500 to-orange-600",
    },
    {
      label: "نرخ تبدیل",
      value: `${toFa(kpis.conversionRate.toFixed(1))}٪`,
      sub: `${toFa(kpis.totalOrders)} جلسه checkout`,
      icon: Gauge,
      color: "from-rose-500 to-pink-600",
    },
    {
      label: "نرخ شکست تأمین",
      value: `${toFa(kpis.supplierFailureRate.toFixed(1))}٪`,
      sub: `${toFa(kpis.supplierFailed)} از ${toFa(kpis.supplierTotal)}`,
      icon: Activity,
      color: "from-violet-500 to-fuchsia-600",
    },
    {
      label: "هشدار موجودی کم",
      value: `${toFa(kpis.lowStockCount)} محصول`,
      sub: "موجودی ≤ ۳",
      icon: AlertTriangle,
      color: "from-amber-500 to-rose-600",
    },
    {
      label: "محصولات فعال",
      value: toFa(kpis.activeProducts),
      sub: "محصول در سایت",
      icon: Package,
      color: "from-cyan-500 to-emerald-600",
    },
    {
      label: "لایسنس‌های موجود",
      value: toFa(kpis.availableLicenses),
      sub: `از ${toFa(kpis.totalLicenses)} کل`,
      icon: ShieldCheck,
      color: "from-emerald-500 to-cyan-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">داشبورد مدیریت</h1>
        <p className="text-sm text-muted-foreground">
          KPIهای زنده — تمام اعداد از پایگاه داده محاسبه می‌شوند
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {kpiCards.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} text-white shadow-md`}
              >
                <s.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="text-lg font-black leading-tight">{s.value}</div>
            <div className="mt-0.5 text-xs font-medium text-foreground/80">
              {s.label}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">{s.sub}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Revenue chart */}
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-bold">درآمد ۷ روز اخیر</h2>
              <p className="text-xs text-muted-foreground">
                بر اساس سفارش‌های پرداخت‌شده
              </p>
            </div>
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              {toFa(days.reduce((s, d) => s + d.revenue, 0).toLocaleString("en-US"))}{" "}
              ت
            </Badge>
          </div>
          <RevenueChart data={days} />
        </Card>

        {/* Low stock */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">هشدار موجودی کم</h2>
            <Badge variant="outline" className="gap-1 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3 w-3" />
              {toFa(lowStock.length)} محصول
            </Badge>
          </div>
          {lowStock.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              همه محصولات موجودی کافی دارند ✓
            </p>
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto pl-1">
              {lowStock.map((p) => (
                <Link
                  key={p.id}
                  href={`/admin/licenses?productId=${p.id}`}
                  className="flex items-center justify-between gap-2 rounded-lg border p-3 transition-colors hover:bg-accent"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{p.title}</div>
                    <div className="text-xs text-muted-foreground">{p.category}</div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      p.stock === 0
                        ? "border-rose-500/30 text-rose-600 dark:text-rose-400"
                        : "border-amber-500/30 text-amber-600 dark:text-amber-400"
                    }
                  >
                    {p.stock === 0 ? "ناموجود" : `${toFa(p.stock)} عدد`}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent orders */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold">آخرین سفارش‌ها</h2>
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link href="/admin/orders">
              مشاهده همه <ChevronLeft className="h-3 w-3" />
            </Link>
          </Button>
        </div>
        {recentOrders.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            هنوز سفارشی ثبت نشده است
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-right text-xs text-muted-foreground">
                  <th className="px-2 py-2 font-medium">کد سفارش</th>
                  <th className="px-2 py-2 font-medium">مشتری</th>
                  <th className="px-2 py-2 font-medium">تعداد</th>
                  <th className="px-2 py-2 font-medium">مبلغ</th>
                  <th className="px-2 py-2 font-medium">وضعیت</th>
                  <th className="px-2 py-2 font-medium">تاریخ</th>
                  <th className="px-2 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => {
                  const st = STATUS_MAP[o.status] || STATUS_MAP.PENDING;
                  const itemsCount = o.items.reduce((s, it) => s + it.quantity, 0);
                  return (
                    <tr key={o.id} className="border-b last:border-0">
                      <td className="px-2 py-3 font-mono font-medium" dir="ltr">
                        {o.code}
                      </td>
                      <td className="px-2 py-3">{o.guestName || o.guestEmail || "—"}</td>
                      <td className="px-2 py-3">{toFa(itemsCount)}</td>
                      <td className="px-2 py-3 font-bold text-primary">
                        {toToman(o.total)} ت
                      </td>
                      <td className="px-2 py-3">
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </td>
                      <td className="px-2 py-3 text-xs text-muted-foreground">
                        {formatJalaliDate(o.createdAt, true)}
                      </td>
                      <td className="px-2 py-3">
                        <Button
                          asChild
                          size="sm"
                          variant="ghost"
                          className="h-7 gap-1 px-2 text-xs"
                        >
                          <Link href={`/order/${o.id}`}>جزئیات</Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
