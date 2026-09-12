"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Send,
  Save,
  Loader2,
  RefreshCw,
  Webhook,
  Copy,
  Check,
  KeyRound,
  Truck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Download,
  Package,
  Activity,
  DollarSign,
  User,
  Link as LinkIcon,
  BadgePercent,
  Sliders,
  Calculator,
  RotateCcw,
  Plus,
  Trash2,
  AlertTriangle,
  Radio,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { formatJalaliDate, toFa } from "@/lib/date";

interface Cfg {
  enabled: boolean;
  mode: "telegram" | "api" | "manual";
  telegramBotToken: string;
  telegramSupplierChatId: string;
  apiUrl: string;
  apiKey: string;
  webhookSecret: string;
  lowStockThreshold: number;
  autoRequest: boolean;
}

interface Order {
  id: string;
  code: string;
  productTitle: string;
  quantity: number;
  status: string;
  direction: string;
  supplierRef?: string | null;
  costUsd?: number | null;
  note: string | null;
  createdAt: string;
  fulfilledAt: string | null;
  _count: { licenses: number };
}

interface Log {
  id: string;
  supplierOrderId?: string | null;
  action: string;
  status: string;
  payload: string;
  message: string | null;
  createdAt: string;
  supplierOrder?: {
    id: string;
    code: string;
    productTitle: string;
    supplierRef?: string | null;
  } | null;
}

interface PricingTierItem {
  maxUsd: number | null;
  markupPercent: number;
}

export function SupplierPanel({ initialConfig }: { initialConfig: Cfg }) {
  const [cfg, setCfg] = useState<Cfg>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"status" | "pricing" | "orders" | "logs" | "rebuild" | "config" | "guide">("status");
  const [products, setProducts] = useState<{ id: string; title: string }[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [logFilter, setLogFilter] = useState<"all" | "errors" | "webhooks" | "requests">("all");
  const [logSearch, setLogSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [status, setStatus] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Health check test
  const [healthTesting, setHealthTesting] = useState(false);
  const [healthResult, setHealthResult] = useState<any>(null);

  // Pricing tiers state
  const [tiers, setTiers] = useState<PricingTierItem[]>([]);
  const [defaultTiers, setDefaultTiers] = useState<PricingTierItem[]>([]);
  const [loadingTiers, setLoadingTiers] = useState(false);
  const [savingTiers, setSavingTiers] = useState(false);

  // Profit preview calculator state
  const [calcCostUsd, setCalcCostUsd] = useState<number>(15);

  // Rebuild catalog state
  const [rebuildCleanFirst, setRebuildCleanFirst] = useState(false);
  const [rebuildMarkup, setRebuildMarkup] = useState<number | "">("");
  const [rebuilding, setRebuilding] = useState(false);
  const [rebuildResult, setRebuildResult] = useState<any>(null);

  // Order checking state
  const [checkingOrderId, setCheckingOrderId] = useState<string | null>(null);

  // Expanded payload log ID
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    setWebhookUrl(`${window.location.origin}/api/supplier/webhook`);
    loadStatus();
    loadPricingTiers();
  }, []);

  useEffect(() => {
    if (tab === "orders" || tab === "logs") {
      loadLogs(logFilter);
    }
  }, [tab, logFilter]);

  async function loadStatus() {
    setStatusLoading(true);
    try {
      const res = await fetch("/api/supplier/status", { cache: "no-store" });
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({ ok: false, message: "ارتباط با سرور برقرار نشد" });
    } finally {
      setStatusLoading(false);
    }
  }

  async function testHealthCheck() {
    setHealthTesting(true);
    setHealthResult(null);
    try {
      const res = await fetch("/api/admin/supplier/test", { method: "POST" });
      const data = await res.json();
      setHealthResult(data);
      if (data.ok) {
        toast.success(data.message || "اتصال با موفقیت برقرار شد");
        loadStatus();
      } else {
        toast.error(data.message || "خطا در تست اتصال");
      }
    } catch {
      toast.error("ارتباط با سرور برقرار نشد");
    } finally {
      setHealthTesting(false);
    }
  }

  async function loadPricingTiers() {
    setLoadingTiers(true);
    try {
      const res = await fetch("/api/admin/pricing/tiers", { cache: "no-store" });
      const data = await res.json();
      if (data.ok) {
        setTiers(data.tiers || []);
        setDefaultTiers(data.defaultTiers || []);
      }
    } catch {
      toast.error("خطا در بارگذاری پلکان‌های قیمت‌گذاری");
    } finally {
      setLoadingTiers(false);
    }
  }

  async function saveTiersToApi() {
    setSavingTiers(true);
    try {
      const res = await fetch("/api/admin/pricing/tiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tiers }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(data.message || "پلکان‌ها با موفقیت ذخیره شدند");
        setTiers(data.tiers);
      } else {
        toast.error(data.message || "خطا در ذخیره پلکان‌ها");
      }
    } catch {
      toast.error("ارتباط با سرور برقرار نشد");
    } finally {
      setSavingTiers(false);
    }
  }

  function resetTiersToDefaults() {
    if (defaultTiers.length > 0) {
      setTiers([...defaultTiers]);
      toast.info("پلکان‌ها به تنظیمات پیش‌فرض بازگردانی شدند. برای ثبت نهایی، دکمه ذخیره را بزنید.");
    }
  }

  function addTierRow() {
    setTiers((prev) => [
      ...prev,
      { maxUsd: 150, markupPercent: 20 },
    ]);
  }

  function removeTierRow(index: number) {
    setTiers((prev) => prev.filter((_, i) => i !== index));
  }

  function updateTierRow(index: number, field: "maxUsd" | "markupPercent", val: any) {
    setTiers((prev) => {
      const next = [...prev];
      if (field === "maxUsd") {
        next[index].maxUsd = val === "" || val === null ? null : Number(val);
      } else {
        next[index].markupPercent = Number(val) || 0;
      }
      return next;
    });
  }

  // Calculate live preview
  const calculatorResult = useMemo(() => {
    const costUsd = Number(calcCostUsd) || 0;
    const usdRate = status?.usd_rate || 224000;

    let matchedMarkup = 10;
    const sorted = [...tiers].sort((a, b) => {
      const aVal = a.maxUsd === null ? Number.POSITIVE_INFINITY : a.maxUsd;
      const bVal = b.maxUsd === null ? Number.POSITIVE_INFINITY : b.maxUsd;
      return aVal - bVal;
    });

    for (const t of sorted) {
      const max = t.maxUsd === null ? Number.POSITIVE_INFINITY : t.maxUsd;
      if (costUsd < max) {
        matchedMarkup = t.markupPercent;
        break;
      }
    }

    const costToman = Math.round(costUsd * usdRate);
    const rawSell = costUsd * usdRate * (1 + matchedMarkup / 100);
    const sellPriceToman = Math.ceil(rawSell / 1000) * 1000;
    const profitToman = Math.max(0, sellPriceToman - costToman);
    const profitUsd = usdRate > 0 ? profitToman / usdRate : 0;

    return {
      costUsd,
      usdRate,
      matchedMarkup,
      costToman,
      sellPriceToman,
      profitToman,
      profitUsd,
    };
  }, [calcCostUsd, tiers, status?.usd_rate]);

  async function loadLogs(filter = logFilter) {
    try {
      const res = await fetch(`/api/supplier/logs?limit=100&filter=${filter}`, { cache: "no-store" });
      const data = await res.json();
      if (data.ok) {
        setOrders(data.orders || []);
        setLogs(data.logs || []);
      }
    } catch {
      toast.error("خطا در بارگذاری لاگ‌ها");
    }
  }

  async function checkOrderStatus(so: Order) {
    setCheckingOrderId(so.id);
    try {
      const res = await fetch("/api/admin/supplier/order-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierOrderId: so.id }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(data.message);
        loadLogs(logFilter);
      } else {
        toast.error(data.message || "خطا در استعلام سفارش");
      }
    } catch {
      toast.error("ارتباط با سرور برقرار نشد");
    } finally {
      setCheckingOrderId(null);
    }
  }

  async function handleRebuildCatalog() {
    if (!confirm("آیا از بازسازی کاتالوگ اطمینان دارید؟ این عملیات محصولات را از API تأمین‌کننده فراخوانی و بروزرسانی می‌کند.")) {
      return;
    }
    setRebuilding(true);
    setRebuildResult(null);
    try {
      const res = await fetch("/api/admin/products/rebuild-catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cleanFirst: rebuildCleanFirst,
          markupPercent: rebuildMarkup !== "" ? Number(rebuildMarkup) : null,
        }),
      });
      const data = await res.json();
      setRebuildResult(data);
      if (data.ok) {
        toast.success(data.message || "کاتالوگ با موفقیت بازسازی شد");
      } else {
        toast.error(data.message || "خطا در بازسازی کاتالوگ");
      }
    } catch {
      toast.error("ارتباط با سرور برقرار نشد");
    } finally {
      setRebuilding(false);
    }
  }

  async function saveConfig() {
    setSaving(true);
    try {
      const res = await fetch("/api/supplier/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "تنظیمات ذخیره شد");
        const r2 = await fetch("/api/supplier/config");
        const d2 = await r2.json();
        if (d2.ok) setCfg(d2.config);
      } else {
        toast.error(data.message || "خطا در ذخیره");
      }
    } catch {
      toast.error("ارتباط با سرور برقرار نشد");
    } finally {
      setSaving(false);
    }
  }

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("کپی شد");
    setTimeout(() => setCopied(null), 1500);
  }

  const filteredLogs = useMemo(() => {
    if (!logSearch.trim()) return logs;
    const q = logSearch.toLowerCase();
    return logs.filter((l) =>
      l.action.toLowerCase().includes(q) ||
      (l.message && l.message.toLowerCase().includes(q)) ||
      (l.payload && l.payload.toLowerCase().includes(q)) ||
      (l.supplierOrder?.code && l.supplierOrder.code.toLowerCase().includes(q)) ||
      (l.supplierOrder?.productTitle && l.supplierOrder.productTitle.toLowerCase().includes(q))
    );
  }, [logs, logSearch]);

  const isLowBalance = typeof status?.balance_usd === "number" && status.balance_usd < 50;

  return (
    <div className="space-y-6">
      {/* Navigation tabs */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto border-b pb-3">
        {[
          { id: "status", label: "وضعیت و سلامت زنده", icon: Activity },
          { id: "pricing", label: "مدیریت پلکان‌های سود", icon: Sliders },
          { id: "orders", label: "مانیتورینگ سفارش‌ها", icon: Truck },
          { id: "logs", label: "لاگ‌های سیستمی", icon: Webhook },
          { id: "rebuild", label: "بازسازی کاتالوگ", icon: Download },
          { id: "config", label: "تنظیمات اتصال", icon: KeyRound },
          { id: "guide", label: "راهنمای اتصال", icon: Sparkles },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all shadow-sm ${
              tab === t.id
                ? "border-primary bg-primary text-primary-foreground shadow-primary/20"
                : "border-border/60 bg-card hover:bg-accent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB: STATUS & LIVE BALANCE */}
      {tab === "status" && (
        <div className="space-y-6">
          {/* CRITICAL LOW BALANCE ALERT */}
          {isLowBalance && (
            <div className="flex items-start gap-4 rounded-2xl border-2 border-rose-500/60 bg-rose-500/10 p-5 shadow-lg shadow-rose-500/5 animate-pulse">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500 text-white">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-rose-700 dark:text-rose-400">
                    اخطار بحرانی: موجودی کیف پول کمتر از ۵۰ دلار است!
                  </h3>
                  <Badge variant="destructive" className="font-mono text-xs">
                    ${status.balance_usd?.toFixed(2)} USD
                  </Badge>
                </div>
                <p className="mt-1 text-xs leading-5 text-rose-800/90 dark:text-rose-300">
                  موجودی فعلی حساب شما در irMarket به حد بحرانی رسیده است. در صورت رسیدن موجودی به صفر، خریدهای خودکار با خطای ۴۰۲ (کسری موجودی) متوقف شده و تحویل لایسنس به خریداران معلق خواهد شد. لطفاً فوراً کیف پول تأمین‌کننده را شارژ فرمایید.
                </p>
              </div>
            </div>
          )}

          {/* BALANCE AND RATE CARDS */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: USD Balance */}
            <Card className={`p-5 transition-all ${isLowBalance ? "border-rose-500/40 bg-rose-500/5" : "bg-card"}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">موجودی کیف پول تامین‌کننده</span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isLowBalance ? "bg-rose-500/20 text-rose-600" : "bg-primary/10 text-primary"}`}>
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className={`text-3xl font-black ${isLowBalance ? "text-rose-600 dark:text-rose-400" : "text-primary"}`} dir="ltr">
                  ${typeof status?.balance_usd === "number" ? status.balance_usd.toFixed(2) : "0.00"}
                </span>
                <span className="text-xs text-muted-foreground">USD</span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                معادل تومانی:{" "}
                <span className="font-bold text-foreground" dir="ltr">
                  {status?.balance_usd && status?.usd_rate
                    ? (Math.round(status.balance_usd * status.usd_rate)).toLocaleString("fa-IR")
                    : "—"}{" "}
                  تومان
                </span>
              </div>
            </Card>

            {/* Card 2: USDT Live Rate */}
            <Card className="p-5 bg-card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">نرخ تبدیل تتر (USDT)</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                  <Activity className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground" dir="ltr">
                  {status?.usd_rate ? status.usd_rate.toLocaleString("fa-IR") : "—"}
                </span>
                <span className="text-xs text-muted-foreground">تومان</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                نرخ فعال در محاسبات قیمت‌گذاری
              </div>
            </Card>

            {/* Card 3: Supplier Key & Discount */}
            <Card className="p-5 bg-card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">تخفیف همکاری تامین‌کننده</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
                  <BadgePercent className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400" dir="ltr">
                  {status?.discount_percent ?? 0}٪
                </span>
                <span className="text-xs text-muted-foreground">تخفیف اعمالی خرید</span>
              </div>
              <div className="mt-2 truncate text-xs text-muted-foreground" dir="ltr">
                کلید: {status?.name || status?.key || "—"}
              </div>
            </Card>

            {/* Card 4: Webhook Status */}
            <Card className="p-5 bg-card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">وب‌هوک تحویل لحظه‌ای</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                  <Webhook className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                {status?.webhook_url ? (
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
                    ثبت شده در irMarket
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600">
                    وب‌هوک ثبت نشده
                  </Badge>
                )}
              </div>
              <div className="mt-2 truncate font-mono text-[11px] text-muted-foreground" dir="ltr">
                {status?.webhook_url || "در انتظار رجیستر"}
              </div>
            </Card>
          </div>

          {/* ONLINE HEALTH CHECK TOOL */}
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="flex items-center gap-2 text-base font-bold">
                  <Radio className="h-5 w-5 text-primary" />
                  تست آنلاین اتصال و فلو (Connection & Health Check)
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  ارزیابی زنده اتصال، اعتبارسنجی کلید API، استعلام پینگ و موجودی بدون کسر اعتبار
                </p>
              </div>
              <Button
                onClick={testHealthCheck}
                disabled={healthTesting}
                className="gap-2 font-semibold shadow-md shadow-primary/20"
              >
                {healthTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                اجرای تست آنلاین اتصال
              </Button>
            </div>

            {healthResult && (
              <div className={`mt-5 rounded-xl border p-4 transition-all ${healthResult.ok ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {healthResult.ok ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-rose-600" />
                    )}
                    <span className="font-bold text-sm">
                      {healthResult.message}
                    </span>
                  </div>
                  {healthResult.pingMs !== undefined && (
                    <Badge variant="secondary" className="gap-1 font-mono text-xs" dir="ltr">
                      Ping: {healthResult.pingMs} ms
                    </Badge>
                  )}
                </div>

                {healthResult.ok && (
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                    <div className="rounded-lg bg-background/60 p-2.5">
                      <span className="text-muted-foreground">احراز هویت:</span>
                      <div className="font-bold text-emerald-600">تایید شده ✓</div>
                    </div>
                    <div className="rounded-lg bg-background/60 p-2.5">
                      <span className="text-muted-foreground">نام کلید:</span>
                      <div className="font-bold truncate" dir="ltr">{healthResult.keyName}</div>
                    </div>
                    <div className="rounded-lg bg-background/60 p-2.5">
                      <span className="text-muted-foreground">موجودی دلاری:</span>
                      <div className="font-bold text-primary" dir="ltr">${healthResult.balanceUsd}</div>
                    </div>
                    <div className="rounded-lg bg-background/60 p-2.5">
                      <span className="text-muted-foreground">نرخ تتر:</span>
                      <div className="font-bold" dir="ltr">{healthResult.usdRate?.toLocaleString("fa-IR")} ت</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB: PRICING TIERS MANAGER */}
      {tab === "pricing" && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="flex items-center gap-2 text-base font-bold">
                  <Sliders className="h-5 w-5 text-primary" />
                  مدیریت پلکان‌های قیمت‌گذاری (Pricing Tiers Manager)
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  تنظیم درصدهای حاشیه سود پویا بر اساس بازه هزینه دلاری محصولات وارداتی از irMarket
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={resetTiersToDefaults}
                  disabled={loadingTiers || savingTiers}
                  className="gap-1.5 text-xs"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  بازگشت به پیش‌فرض
                </Button>
                <Button
                  size="sm"
                  onClick={saveTiersToApi}
                  disabled={savingTiers || loadingTiers}
                  className="gap-1.5 text-xs font-semibold"
                >
                  {savingTiers ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  ذخیره پلکان‌ها
                </Button>
              </div>
            </div>

            {loadingTiers ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                در حال بارگذاری پلکان‌های قیمت‌گذاری...
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="p-3">ردیف</th>
                        <th className="p-3">سقف قیمت خرید دلاری (USD)</th>
                        <th className="p-3">درصد سود اعمالی (Markup ٪)</th>
                        <th className="p-3">توضیحات بازه</th>
                        <th className="p-3 text-center">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {tiers.map((t, idx) => {
                        const prevMax = idx === 0 ? 0 : tiers[idx - 1]?.maxUsd || 0;
                        const isUnlimited = t.maxUsd === null;

                        return (
                          <tr key={idx} className="hover:bg-muted/20 transition-colors">
                            <td className="p-3 font-mono text-muted-foreground">{toFa(idx + 1)}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-2 max-w-[140px]">
                                {isUnlimited ? (
                                  <Badge variant="outline" className="font-mono text-xs">
                                    بی‌نهایت (بالای ${prevMax})
                                  </Badge>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-muted-foreground">$</span>
                                    <Input
                                      type="number"
                                      step="any"
                                      min={0}
                                      value={t.maxUsd ?? ""}
                                      onChange={(e) => updateTierRow(idx, "maxUsd", e.target.value)}
                                      className="h-8 font-mono text-xs"
                                    />
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1.5 max-w-[120px]">
                                <Input
                                  type="number"
                                  min={0}
                                  max={1000}
                                  value={t.markupPercent}
                                  onChange={(e) => updateTierRow(idx, "markupPercent", e.target.value)}
                                  className="h-8 font-mono text-xs font-bold"
                                />
                                <span className="text-muted-foreground">٪</span>
                              </div>
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {isUnlimited
                                ? `از ${prevMax}$ به بالا`
                                : `از ${prevMax}$ تا کمتر از ${t.maxUsd}$`}
                            </td>
                            <td className="p-3 text-center">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeTierRow(idx)}
                                className="h-7 w-7 p-0 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addTierRow}
                    className="gap-1.5 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    افزودن پله جدید
                  </Button>
                  <span className="text-[11px] text-muted-foreground">
                    نکته: پله‌ها به صورت صعودی بر اساس سقف قیمت مرتب و اعمال می‌شوند.
                  </span>
                </div>
              </div>
            )}
          </Card>

          {/* LIVE PROFIT PREVIEW CALCULATOR */}
          <Card className="p-6 bg-gradient-to-br from-card to-primary/5">
            <h3 className="flex items-center gap-2 text-base font-bold">
              <Calculator className="h-5 w-5 text-primary" />
              ماشین‌حساب پیش‌نمایش لحظه‌ای سود (Live Margin Calculator)
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              هزینه خرید دلاری را وارد نمایید تا نحوه تشخیص پله، نرخ تتر و قیمت نهایی فروش محاسبه شود.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-xs">هزینه خرید محصول از تأمین‌کننده (USD)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.1"
                    min={0.1}
                    value={calcCostUsd}
                    onChange={(e) => setCalcCostUsd(Number(e.target.value) || 0)}
                    className="font-mono text-base font-black"
                  />
                </div>
              </div>

              <div className="rounded-xl border bg-background/80 p-4 space-y-1">
                <div className="text-xs text-muted-foreground">پله شناسایی‌شده و درصد سود:</div>
                <div className="text-2xl font-black text-primary" dir="ltr">
                  {calculatorResult.matchedMarkup}٪ Markup
                </div>
                <div className="text-[11px] text-muted-foreground">
                  قیمت پایه دلاری: ${calculatorResult.costUsd} × {calculatorResult.usdRate.toLocaleString("fa-IR")} تومان
                </div>
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-1">
                <div className="text-xs text-emerald-700 dark:text-emerald-400">قیمت نهایی فروش به کاربر (گردشده):</div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400" dir="ltr">
                  {calculatorResult.sellPriceToman.toLocaleString("fa-IR")} تومان
                </div>
                <div className="text-[11px] font-semibold text-emerald-700/80 dark:text-emerald-300">
                  سود خالص: {calculatorResult.profitToman.toLocaleString("fa-IR")} تومان (~${calculatorResult.profitUsd.toFixed(2)})
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB: SUPPLIER ORDERS MONITORING */}
      {tab === "orders" && (
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="flex items-center gap-2 text-base font-bold">
                <Truck className="h-5 w-5 text-primary" />
                سفارش‌های ارسالی به تأمین‌کننده ({toFa(orders.length)})
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                تاریخچه خریدهای خودکار ارسال‌شده به irMarket همراه با وضعیت، شناسه تامین‌کننده و استعلام برخط
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => loadLogs(logFilter)} className="gap-2">
              <RefreshCw className="h-3.5 w-3.5" />
              بروزرسانی
            </Button>
          </div>

          {orders.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              هنوز هیچ سفارشی برای تامین‌کننده ثبت نشده است.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="p-3">کد سفارش</th>
                    <th className="p-3">محصول</th>
                    <th className="p-3">تعداد</th>
                    <th className="p-3">شناسه irMarket</th>
                    <th className="p-3">هزینه دلاری</th>
                    <th className="p-3">وضعیت</th>
                    <th className="p-3">کلیدهای صادرشده</th>
                    <th className="p-3">تاریخ ثبت</th>
                    <th className="p-3 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-mono font-bold" dir="ltr">{o.code}</td>
                      <td className="p-3 max-w-[200px] truncate font-medium">{o.productTitle}</td>
                      <td className="p-3 font-mono">{toFa(o.quantity)}</td>
                      <td className="p-3 font-mono text-muted-foreground" dir="ltr">
                        {o.supplierRef ? `#${o.supplierRef}` : "—"}
                      </td>
                      <td className="p-3 font-mono font-bold text-primary" dir="ltr">
                        {typeof o.costUsd === "number" ? `$${o.costUsd.toFixed(2)}` : "—"}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={
                            o.status === "FULFILLED"
                              ? "default"
                              : o.status === "FAILED"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-[11px]"
                        >
                          {o.status === "FULFILLED"
                            ? "تحویل شده"
                            : o.status === "FAILED"
                            ? "ناموفق"
                            : "در حال پردازش"}
                        </Badge>
                      </td>
                      <td className="p-3 font-mono">
                        {toFa(o._count?.licenses ?? 0)} عدد
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {formatJalaliDate(o.createdAt, true)}
                      </td>
                      <td className="p-3 text-center">
                        {o.supplierRef ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => checkOrderStatus(o)}
                            disabled={checkingOrderId === o.id}
                            className="h-7 text-[11px] gap-1"
                          >
                            {checkingOrderId === o.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                            استعلام وضعیت
                          </Button>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB: SYSTEM AUDIT LOGS */}
      {tab === "logs" && (
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="flex items-center gap-2 text-base font-bold">
                <Webhook className="h-5 w-5 text-primary" />
                لاگ‌های سیستمی تأمین‌کننده
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                ثبت دقیق وقایع، ریکوئست‌ها، ریسپانس‌ها، خطاها و وب‌هوک‌های دریافتی
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border bg-muted/40 p-1">
                {[
                  { id: "all", label: "همه" },
                  { id: "errors", label: "فقط خطاها" },
                  { id: "webhooks", label: "وب‌هوک‌ها" },
                  { id: "requests", label: "درخواست‌ها" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setLogFilter(f.id as any)}
                    className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                      logFilter === f.id
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <Input
                placeholder="جستجو در لاگ‌ها..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="h-8 w-44 text-xs"
              />

              <Button size="sm" variant="outline" onClick={() => loadLogs(logFilter)} className="gap-1.5 h-8">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              هیچ لاگی با فیلتر انتخابی یافت نشد.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[65vh] overflow-y-auto">
              {filteredLogs.map((l) => {
                const isExpanded = expandedLogId === l.id;
                const isError = l.status === "ERROR";
                const isSuccess = l.status === "SUCCESS";

                return (
                  <div
                    key={l.id}
                    className={`rounded-xl border p-3.5 text-xs transition-all ${
                      isError
                        ? "border-rose-500/30 bg-rose-500/5"
                        : isSuccess
                        ? "border-emerald-500/20 bg-emerald-500/5"
                        : "border-border/60 bg-card"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isSuccess ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : isError ? (
                          <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span className="font-mono font-bold text-foreground">{l.action}</span>
                        {l.supplierOrder?.code && (
                          <Badge variant="outline" className="font-mono text-[10px]" dir="ltr">
                            {l.supplierOrder.code}
                          </Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {formatJalaliDate(l.createdAt, true)}
                      </span>
                    </div>

                    {l.message && (
                      <p className="mt-1.5 text-foreground/90 font-medium">{l.message}</p>
                    )}

                    {/* Expand payload */}
                    {l.payload && (
                      <div className="mt-2">
                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : l.id)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                        >
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          {isExpanded ? "بستن جزئیات Payload" : "مشاهده Payload (ریکوئست / ریسپانس)"}
                        </button>

                        {isExpanded && (
                          <div className="mt-2 space-y-1.5">
                            <pre
                              className="overflow-x-auto rounded-lg bg-muted/60 p-3 font-mono text-[11px] leading-5 text-foreground/90 max-h-60"
                              dir="ltr"
                            >
                              {(() => {
                                try {
                                  return JSON.stringify(JSON.parse(l.payload), null, 2);
                                } catch {
                                  return l.payload;
                                }
                              })()}
                            </pre>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copy(l.payload, l.id)}
                              className="h-6 text-[10px] gap-1"
                            >
                              {copied === l.id ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
                              کپی JSON
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* TAB: REBUILD CATALOG */}
      {tab === "rebuild" && (
        <Card className="p-6">
          <h3 className="flex items-center gap-2 text-base font-bold">
            <Download className="h-5 w-5 text-primary" />
            بازسازی تمیز کاتالوگ (Rebuild Catalog)
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            فراخوانی مجدد تمام محصولات از API تامین‌کننده irMarket، دسته‌بندی خودکار و محاسبه قیمت فروش با پلکان‌های سود
          </p>

          <div className="mt-6 space-y-4 max-w-xl">
            <div className="flex items-center justify-between rounded-xl border p-4">
              <div>
                <Label className="text-sm font-semibold">پاکسازی کامل کاتالوگ پیشین (Clean First)</Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  محصولات قدیمی تامین‌کننده که دیگر در انبار موجود نیستند را غیرفعال یا بازسازی می‌کند.
                </p>
              </div>
              <Switch checked={rebuildCleanFirst} onCheckedChange={setRebuildCleanFirst} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">درصد سود ثابت (اختیاری - در صورت خالی بودن، پلکان‌ها اعمال می‌شوند)</Label>
              <Input
                type="number"
                placeholder="مثلاً: 25"
                value={rebuildMarkup}
                onChange={(e) => setRebuildMarkup(e.target.value === "" ? "" : Number(e.target.value))}
                className="font-mono text-xs w-48"
              />
            </div>

            <Button
              onClick={handleRebuildCatalog}
              disabled={rebuilding}
              size="lg"
              className="gap-2 font-bold shadow-md shadow-primary/20"
            >
              {rebuilding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {rebuilding ? "در حال بازسازی کاتالوگ..." : "شروع بازسازی تمیز کاتالوگ"}
            </Button>

            {rebuildResult && (
              <div className={`mt-4 rounded-xl border p-4 ${rebuildResult.ok ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5"}`}>
                <div className="flex items-center gap-2">
                  {rebuildResult.ok ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-rose-600" />
                  )}
                  <span className="font-bold text-sm">{rebuildResult.message}</span>
                </div>

                {rebuildResult.ok && (
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                    <div className="rounded-lg bg-background/60 p-2">
                      <span className="text-muted-foreground">کل محصولات خوانده‌شده:</span>
                      <div className="font-bold">{toFa(rebuildResult.totalFetched)}</div>
                    </div>
                    <div className="rounded-lg bg-background/60 p-2">
                      <span className="text-muted-foreground">محصولات وارد شده:</span>
                      <div className="font-bold text-emerald-600">{toFa(rebuildResult.imported)}</div>
                    </div>
                    <div className="rounded-lg bg-background/60 p-2">
                      <span className="text-muted-foreground">بروزرسانی شده:</span>
                      <div className="font-bold text-primary">{toFa(rebuildResult.updated)}</div>
                    </div>
                    <div className="rounded-lg bg-background/60 p-2">
                      <span className="text-muted-foreground">دسته‌ها:</span>
                      <div className="font-bold">{toFa(rebuildResult.categoriesRebuilt)}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* TAB: CONFIGURATION */}
      {tab === "config" && (
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-base">پیکربندی اتصال به تأمین‌کننده</h3>
            <div className="flex items-center gap-2">
              <Switch checked={cfg.enabled} onCheckedChange={(v) => setCfg({ ...cfg, enabled: v })} />
              <Label>{cfg.enabled ? "فعال" : "غیرفعال"}</Label>
            </div>
          </div>

          <div className="space-y-4 max-w-xl">
            <div className="space-y-1.5">
              <Label>نحوه اتصال</Label>
              <Select value={cfg.mode} onValueChange={(v) => setCfg({ ...cfg, mode: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="api">API (ارتباط مستقیم و خودکار HTTP با irMarket)</SelectItem>
                  <SelectItem value="telegram">بات تلگرام (ارسال پیام)</SelectItem>
                  <SelectItem value="manual">دستی (فقط ثبت درخواست)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Webhook className="h-4 w-4 text-primary" />
                آدرس وب‌هوک سایت ما برای irMarket
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-background px-3 py-2 text-xs font-mono" dir="ltr">
                  {webhookUrl}
                </code>
                <Button size="sm" variant="outline" onClick={() => copy(webhookUrl, "wh-url")}>
                  {copied === "wh-url" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </div>

            {cfg.mode === "api" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>آدرس پایه API تأمین‌کننده</Label>
                  <Input
                    dir="ltr"
                    value={cfg.apiUrl || "https://api.irmarket.store"}
                    onChange={(e) => setCfg({ ...cfg, apiUrl: e.target.value })}
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>کلید API تأمین‌کننده (irMarket)</Label>
                  <Input
                    dir="ltr"
                    type="password"
                    value={cfg.apiKey}
                    onChange={(e) => setCfg({ ...cfg, apiKey: e.target.value })}
                    placeholder="anb_..."
                    className="font-mono text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">کلید API اختصاصی شما با پیشوند anb_</p>
                </div>
              </div>
            )}

            <Button onClick={saveConfig} disabled={saving} className="gap-2 font-semibold">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              ذخیره تنظیمات
            </Button>
          </div>
        </Card>
      )}

      {/* TAB: GUIDE */}
      {tab === "guide" && (
        <Card className="p-6 space-y-4">
          <h3 className="flex items-center gap-2 text-base font-bold">
            <Sparkles className="h-5 w-5 text-primary" />
            راهنمای جامع ادغام و فلوهای خودکار
          </h3>
          <p className="text-xs leading-6 text-muted-foreground">
            فروشگاه لایسنو به صورت کاملاً خودکار به وب‌سرویس irMarket متصل است. در زمان پرداخت کاربر، سفارش به طور مستقیم به API ارسال شده و در صورت آماده بودن اکانت، با کلید امنیتی رمزنگاری شده و به خریدار تحویل داده می‌شود.
          </p>
          <div className="rounded-xl bg-muted/40 p-4 text-xs leading-6 text-muted-foreground space-y-2">
            <div><strong className="text-foreground">۱. خطای ۴۰۲ (موجودی ناکافی):</strong> در صورت کسر موجودی دلاری شما در تامین‌کننده، سفارش متوقف و برچسب «در انتظار پشتیبانی» می‌خورد و تیکت فوری در سیستم ثبت می‌شود.</div>
            <div><strong className="text-foreground">۲. خطای ۴۰۹ (ناموجود):</strong> در صورتی که آیتم در انبار تامین‌کننده تمام شود، سفارش کاربر وضعیت «ناموجود نزد تامین‌کننده» می‌گیرد.</div>
            <div><strong className="text-foreground">۳. پردازش تاخیری (Processing):</strong> اگر تامین‌کننده سفارش را بلافاصله تحویل ندهد، وضعیت «در حال پردازش نزد تامین‌کننده» شده و به محض ارسال وب‌هوک با امضای دیجیتال HMAC-SHA256، اکانت‌ها برای کاربر فعال و ایمیل می‌شوند.</div>
          </div>
        </Card>
      )}
    </div>
  );
}
