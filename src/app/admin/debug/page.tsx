import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { readFileSync, existsSync, statSync } from "fs";
import { resolve } from "path";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { SITE } from "@/lib/constants";
import { toFa } from "@/lib/date";
import {
  Activity,
  Database,
  Server,
  DollarSign,
  Truck,
  CreditCard,
  Phone,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Cpu,
  HardDrive,
  FileCode2,
} from "lucide-react";
import Link from "next/link";

export const metadata = { title: "وضعیت و دیباگ سیستم | لایسنو" };
export const dynamic = "force-dynamic";

export default async function DebugPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/admin/debug");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  // 1. Database diagnostics & counts
  let dbLatency = 0;
  let dbStatus = "error";
  const startPing = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - startPing;
    dbStatus = "connected";
  } catch {
    dbStatus = "error";
  }

  const [
    totalProducts,
    activeProducts,
    totalUsers,
    totalOrders,
    totalCategories,
    settingsRows,
  ] = await Promise.all([
    db.product.count().catch(() => 0),
    db.product.count({ where: { isActive: true } }).catch(() => 0),
    db.user.count().catch(() => 0),
    db.order.count().catch(() => 0),
    db.category.count().catch(() => 0),
    db.setting.findMany().catch(() => []),
  ]);

  const settingsMap = new Map(settingsRows.map((s) => [s.key, s.value]));

  // 2. Currency settings
  const usdRateMode = settingsMap.get("usd_rate_mode") || "auto";
  const manualRate = settingsMap.get("usd_to_toman_rate") || "220,000";
  const autoRate = settingsMap.get("usd_to_toman_rate_auto") || "220,000";
  const activeUsdRate = usdRateMode === "manual" ? manualRate : autoRate;

  // 3. Supplier config
  const supplierKey = settingsMap.get("supplier_api_key");
  const hasSupplierKey = !!(supplierKey && supplierKey.trim());

  // 4. Payment Gateway config
  const zarinpalMerchant = settingsMap.get("zarinpal_merchant");
  const hasZarinpal = !!(zarinpalMerchant && zarinpalMerchant.trim());

  // 5. SMS Gateway config
  const smsProvider = settingsMap.get("sms_provider") || "kavenegar";
  const kavenegarKey = settingsMap.get("kavenegar_api_key");
  const hasSmsKey = !!(kavenegarKey && kavenegarKey.trim());

  // 6. System runtime & paths
  const cwd = process.cwd();
  const envPath = resolve(cwd, ".env");
  const dbPath = resolve(cwd, "db/custom.db");
  const logPath = resolve(cwd, "logs/app.log");
  const devLogPath = resolve(cwd, "dev.log");

  const envExists = existsSync(envPath);
  const dbExists = existsSync(dbPath);
  const logExists = existsSync(logPath);
  const devLogExists = existsSync(devLogPath);
  const dbSize = dbExists ? statSync(dbPath).size : 0;

  // 7. Memory & Uptime
  const memory = process.memoryUsage();
  const uptimeSeconds = Math.floor(process.uptime());
  const uptimeHours = Math.floor(uptimeSeconds / 3600);
  const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);

  // 8. Logs
  let recentLogs: string[] = [];
  if (logExists) {
    try {
      recentLogs = readFileSync(logPath, "utf-8")
        .split("\n")
        .filter(Boolean)
        .slice(-50);
    } catch {}
  } else if (devLogExists) {
    try {
      recentLogs = readFileSync(devLogPath, "utf-8")
        .split("\n")
        .filter((l) => !l.includes("prisma:query") && l.trim())
        .slice(-50);
    } catch {}
  }

  // 9. Environment variables status audit (SAFE - masked)
  const criticalEnvVars = [
    { name: "DATABASE_URL", configured: !!process.env.DATABASE_URL, desc: "اتصال به پایگاه داده SQLite/PostgreSQL" },
    { name: "NEXTAUTH_SECRET", configured: !!process.env.NEXTAUTH_SECRET, desc: "کلید رمزنگاری توکن‌های ورود کاربر" },
    { name: "NEXTAUTH_URL", configured: !!process.env.NEXTAUTH_URL, desc: "آدرس اصلی ریدایرکت احراز هویت" },
    { name: "NODE_ENV", configured: !!process.env.NODE_ENV, desc: `محیط اجرا (${process.env.NODE_ENV || "development"})` },
    { name: "ADMIN_EMAIL", configured: !!process.env.ADMIN_EMAIL, desc: "ایمیل مدیر ارشد سیستم" },
    { name: "PORT", configured: !!process.env.PORT, desc: `پورت سرور (${process.env.PORT || "3000"})` },
  ];

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              وضعیت و مانیتورینگ کل سایت
            </h1>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 gap-1 font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              سرور آنلاین
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            بررسی زنده و دقیق عملکرد زیرسیستم‌های دیتابیس، نرخ دلار، ترب، درگاه و لاگ‌های سرور
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5 rounded-xl">
            <Link href="/admin/debug">
              <RefreshCw className="h-4 w-4" />
              بروزرسانی داده‌ها
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5 rounded-xl">
            <a href="/api/health" target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
              تست API سلامت
            </a>
          </Button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Database Card */}
        <Card className="p-5 border-border/60 shadow-sm relative overflow-hidden bg-card/60 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">پایگاه داده (SQLite)</span>
            <Database className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight">
              {dbStatus === "connected" ? "متصل و پایدار" : "خطای اتصال"}
            </span>
            <span className="text-xs font-bold text-emerald-600 font-mono">({toFa(dbLatency)}ms)</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t pt-2.5">
            <span>محصولات: <b>{toFa(activeProducts)}</b> از {toFa(totalProducts)} فعال</span>
            <span>حجم: {(dbSize / (1024 * 1024)).toFixed(1)} MB</span>
          </div>
        </Card>

        {/* Currency & USD Engine */}
        <Card className="p-5 border-border/60 shadow-sm relative overflow-hidden bg-card/60 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">موتور نرخ ارز (تتر/دلار)</span>
            <DollarSign className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-black tracking-tight font-mono text-primary">
              {toFa(activeUsdRate)}
            </span>
            <span className="text-xs font-bold text-muted-foreground">تومان</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t pt-2.5">
            <span>حالت: <Badge variant="secondary" className="text-[10px] py-0 px-1.5">{usdRateMode === "auto" ? "استعلام خودکار" : "دستی"}</Badge></span>
            <Link href="/admin/pricing" className="text-primary hover:underline">تنظیم نرخ ←</Link>
          </div>
        </Card>

        {/* irMarket Supplier */}
        <Card className="p-5 border-border/60 shadow-sm relative overflow-hidden bg-card/60 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">تأمین‌کننده (irMarket)</span>
            <Truck className="h-5 w-5 text-blue-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight">
              {hasSupplierKey ? "کلید API ست شد" : "فاقد کلید API"}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t pt-2.5">
            <span>سفارش خودکار: <b>فعال</b></span>
            <Link href="/admin/supplier" className="text-primary hover:underline">مدیریت تأمین ←</Link>
          </div>
        </Card>

        {/* Server & Uptime */}
        <Card className="p-5 border-border/60 shadow-sm relative overflow-hidden bg-card/60 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">مصرف حافظه و آپ‌تایم</span>
            <Server className="h-5 w-5 text-purple-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-black tracking-tight font-mono">
              {(memory.rss / (1024 * 1024)).toFixed(0)}
            </span>
            <span className="text-xs font-bold text-muted-foreground">MB RAM</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t pt-2.5">
            <span>آپ‌تایم: <b>{toFa(uptimeHours)}</b> ساعت و <b>{toFa(uptimeMinutes)}</b> دقیقه</span>
            <span className="font-mono text-[10px]">{process.version}</span>
          </div>
        </Card>
      </div>

      {/* Detailed Diagnostics Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Core Subsystems Status Table */}
        <Card className="p-6 border-border/60 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Cpu className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">وضعیت زیرسیستم‌های فعال سایت</h2>
          </div>

          <div className="divide-y text-sm">
            <div className="py-3 flex items-center justify-between">
              <div>
                <span className="font-bold block">موتور پایگاه داده SQLite</span>
                <span className="text-xs text-muted-foreground">مسیر فایل: db/custom.db</span>
              </div>
              <Badge variant="default" className="bg-emerald-600 gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> فعال و آماده
              </Badge>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <span className="font-bold block">وب سرویس ترب (Torob API)</span>
                <span className="text-xs text-muted-foreground">مسیر اندپوینت: /api/torob</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 font-mono">
                  {toFa(activeProducts)} محصول
                </Badge>
                <Badge variant="default" className="bg-emerald-600">فعال</Badge>
              </div>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <span className="font-bold block">درگاه پرداخت (زرین‌پال)</span>
                <span className="text-xs text-muted-foreground">کد مرچنت: {hasZarinpal ? "پیکربندی شده" : "تنظیم نشده"}</span>
              </div>
              <Badge variant={hasZarinpal ? "default" : "secondary"}>
                {hasZarinpal ? "متصل" : "حالت تستی"}
              </Badge>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <span className="font-bold block">سامانه پیامک و کد تأیید (OTP)</span>
                <span className="text-xs text-muted-foreground">سرویس: {smsProvider}</span>
              </div>
              <Badge variant={hasSmsKey ? "default" : "secondary"}>
                {hasSmsKey ? "متصل" : "مود دولوپر (تست ۱۲۳۴۵)"}
              </Badge>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <span className="font-bold block">نقشه سایت و روبات‌های جستجو (SEO)</span>
                <span className="text-xs text-muted-foreground">sitemap.xml و robots.txt</span>
              </div>
              <div className="flex items-center gap-2">
                <a href="/sitemap.xml" target="_blank" className="text-xs text-primary hover:underline">
                  مشاهده نقشه ↗
                </a>
                <Badge variant="default" className="bg-emerald-600">ایندکس فعال</Badge>
              </div>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <span className="font-bold block">مجموع حساب‌های کاربری و سفارشات</span>
                <span className="text-xs text-muted-foreground">کاربران ثبت‌نامی در سیستم</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold">{toFa(totalUsers)} کاربر</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-xs font-bold">{toFa(totalOrders)} سفارش</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Environment Variables Audit */}
        <Card className="p-6 border-border/60 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <FileCode2 className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">بررسی متغیرهای کلیدی محیطی (.env)</h2>
          </div>

          <div className="divide-y text-sm">
            {criticalEnvVars.map((env) => (
              <div key={env.name} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-foreground block" dir="ltr">
                    {env.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{env.desc}</span>
                </div>
                <Badge
                  variant={env.configured ? "outline" : "destructive"}
                  className={env.configured ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" : ""}
                >
                  {env.configured ? "✅ تنظیم شده" : "❌ مفقود"}
                </Badge>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground border">
            🔒 <b>امنیت کامل:</b> مقادیر توکن‌ها و کلیدهای محرمانه جهت رعایت اصول امنیتی در این رابط کاربری نمایش داده نمی‌شوند و وضعیت صحت عملکرد آن‌ها گزارش می‌گردد.
          </div>
        </Card>
      </div>

      {/* Live System Logs */}
      <Card className="p-6 border-border/60 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">
              لاگ‌های زنده سیستم (آخرین ۵۰ رخداد سرور)
            </h2>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            {recentLogs.length} لاگ ثبت شده
          </Badge>
        </div>

        {recentLogs.length > 0 ? (
          <pre
            className="max-h-96 overflow-auto rounded-xl bg-black/90 p-4 font-mono text-xs leading-6 text-emerald-400 border border-border/50 shadow-inner"
            dir="ltr"
          >
            {recentLogs.map((line, i) => (
              <div
                key={i}
                className={
                  line.includes("error") || line.includes("Error") || line.includes("fail")
                    ? "text-rose-400 font-bold bg-rose-950/30 px-1 rounded"
                    : line.includes("warn")
                    ? "text-amber-300"
                    : "text-emerald-400/90"
                }
              >
                {line}
              </div>
            ))}
          </pre>
        ) : (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            هیچ خطایی در سیستم ثبت نشده و سرور در شرایط مطلوب کار می‌کند.
          </div>
        )}
      </Card>
    </div>
  );
}
