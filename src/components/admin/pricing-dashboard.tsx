"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DollarSign,
  TrendingUp,
  RefreshCw,
  Zap,
  ShieldCheck,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Sliders,
  Sparkles,
  Link as LinkIcon,
  Play,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { toFa } from "@/lib/date";
import { toToman } from "@/lib/format";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Exchange {
  name: string;
  rate: number | null;
  status: "ONLINE" | "OFFLINE";
  ping: number;
  error: string | null;
}

interface StatsData {
  activeRate: number;
  mode: "auto" | "manual";
  manualRate: number;
  autoRate: number;
  exchanges: Exchange[];
  stats: {
    totalProducts: number;
    torobConnectedProducts: number;
  };
  timestamp: string;
}

interface ProductPricingItem {
  id: string;
  title: string;
  slug: string;
  currentPrice: number;
  discountPrice?: number | null;
  category: string;
  brand?: string | null;
  costUsd?: number | null;
  activeUsdRate: number;
  supplierCostToman?: number | null;
  isPriceLocked: boolean;
  customMarkup?: number | null;
  torobUrl?: string | null;
  torobUndercut: number;
  torobFloor: number;
  lastTorobPrice?: number | null;
  lastTorobSync?: string | null;
  hasTorob: boolean;
}

interface TorobFetchResult {
  productName: string;
  torobMinPrice: number;
  currentPrice: number;
  supplierCostToman: number;
  costUsd: number;
  usdRate: number;
  undercutPct: number;
  floorPct: number;
  floorPriceToman: number;
  recommendedPrice: number;
  diffWithCurrent: number;
  diffWithTorob: number;
  isFloorHit: boolean;
}

export function PricingDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [savingRate, setSavingRate] = useState(false);
  const [manualRateInput, setManualRateInput] = useState<string>("");

  const [products, setProducts] = useState<ProductPricingItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "torob_only" | "no_torob">("all");

  const [inspectingProduct, setInspectingProduct] = useState<ProductPricingItem | null>(null);
  const [torobResult, setTorobResult] = useState<TorobFetchResult | null>(null);
  const [fetchingTorob, setFetchingTorob] = useState(false);
  const [applyingPrice, setApplyingPrice] = useState(false);

  const [runningRepricerAll, setRunningRepricerAll] = useState(false);
  const [repriceLog, setRepriceLog] = useState<string[] | null>(null);

  // Load stats
  async function loadStats() {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/admin/pricing/stats");
      const data = await res.json();
      if (data.ok) {
        setStats(data);
        setManualRateInput(String(data.manualRate));
      }
    } catch {
      toast.error("خطا در دریافت نرخ‌های صرافی");
    } finally {
      setLoadingStats(false);
    }
  }

  // Load products
  async function loadProducts() {
    setLoadingProducts(true);
    try {
      const res = await fetch(`/api/admin/pricing/products?filter=${filter}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.ok) {
        setProducts(data.products || []);
      }
    } catch {
      toast.error("خطا در دریافت لیست محصولات");
    } finally {
      setLoadingProducts(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [filter, search]);

  // Save rate setting
  async function handleSaveRateSetting(newMode?: "auto" | "manual") {
    setSavingRate(true);
    const targetMode = newMode || stats?.mode || "auto";
    try {
      const res = await fetch("/api/admin/usdt-rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: targetMode,
          manualRate: Number(manualRateInput),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("تنظیمات نرخ ارز با موفقیت ذخیره شد");
        await loadStats();
        await loadProducts();
      } else {
        toast.error(data.message || "خطا در ثبت نرخ");
      }
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setSavingRate(false);
    }
  }

  // Test / Fetch Torob for a single product
  async function handleFetchTorob(prod: ProductPricingItem) {
    setInspectingProduct(prod);
    setTorobResult(null);
    setFetchingTorob(true);
    try {
      const res = await fetch("/api/admin/pricing/torob-fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: prod.id }),
      });
      const data = await res.json();
      if (data.ok) {
        setTorobResult(data);
        toast.success("قیمت لحظه‌ای ترب دریافت شد");
      } else {
        toast.error(data.message || "خطا در دریافت قیمت ترب");
      }
    } catch {
      toast.error("خطا در استعلام ترب");
    } finally {
      setFetchingTorob(false);
    }
  }

  // Apply single Torob recommended price
  async function handleApplyRecommendedPrice() {
    if (!inspectingProduct || !torobResult) return;
    setApplyingPrice(true);
    try {
      const res = await fetch("/api/admin/pricing/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: inspectingProduct.id,
          price: torobResult.recommendedPrice,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`قیمت جدید (${toToman(torobResult.recommendedPrice)} ت) اعمال شد`);
        setInspectingProduct(null);
        setTorobResult(null);
        await loadProducts();
      } else {
        toast.error(data.message || "خطا در اعمال قیمت");
      }
    } catch {
      toast.error("خطا در اعمال قیمت");
    } finally {
      setApplyingPrice(false);
    }
  }

  // Run Batch Repricer for all products
  async function handleRunBatchRepricer() {
    setRunningRepricerAll(true);
    setRepriceLog(null);
    try {
      const res = await fetch("/api/admin/pricing/reprice-all", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        toast.success(`ربات ترب اجرا شد: ${data.repricedCount} محصول بروزرسانی شد`);
        setRepriceLog(data.details || []);
        await loadProducts();
      } else {
        toast.error(data.message || "خطا در اجرای ربات ترب");
      }
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setRunningRepricerAll(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <TrendingUp className="h-5 w-5" />
            </span>
            داشبورد هوشمند نرخ ارز و مقایسه قیمت ترب
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            مدیریت زنده نرخ تتر، اتصال به صرافی‌های داخلی و ربات قیمت‌شکن ترب
          </p>
          <div className="mt-3 bg-muted/50 p-3 rounded-lg border text-xs">
            <p className="font-bold mb-1">فرمول محاسبه قیمت در سیستم ترب:</p>
            <p className="font-mono text-muted-foreground" dir="ltr">
              Base Cost = Cost (USD) × Active Tether Rate<br />
              Recommended Price = Min(Competitor - Discount%, Base Cost + Minimum Profit%)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadStats();
              loadProducts();
            }}
            disabled={loadingStats || loadingProducts}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", (loadingStats || loadingProducts) && "animate-spin")} />
            بروزرسانی داده‌ها
          </Button>

          <Button
            size="sm"
            onClick={handleRunBatchRepricer}
            disabled={runningRepricerAll}
            className="gap-1.5 text-xs bg-red-600 hover:bg-red-700 text-white font-bold shadow-md shadow-red-600/20"
          >
            {runningRepricerAll ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Zap className="h-3.5 w-3.5 fill-current" />
            )}
            اجرای ربات ترب برای همه محصولات
          </Button>
        </div>
      </div>

      {/* SECTION 1: Live Exchanges & USD Rate Control */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Active Rate Hero Card */}
        <Card className="lg:col-span-1 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                <DollarSign className="h-4 w-4" />
                نرخ مبنای محاسبه سیستم
              </CardTitle>
              <Badge variant={stats?.mode === "auto" ? "default" : "secondary"} className="text-[10px]">
                {stats?.mode === "auto" ? "🟢 همگام با صرافی (خودکار)" : "🟡 نرخ دستی ادمین"}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              قیمت تمام محصولات بر اساس این نرخ در ضریب سود ضرب می‌شود
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono" dir="ltr">
                {stats ? toFa(stats.activeRate.toLocaleString("fa-IR")) : "..."}
              </span>
              <span className="text-sm font-bold text-muted-foreground">تومان / تتر</span>
            </div>

            {/* Mode Switch & Manual Input */}
            <div className="space-y-3 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">دریافت خودکار از صرافی‌ها:</span>
                <Switch
                  checked={stats?.mode === "auto"}
                  onCheckedChange={(checked) => handleSaveRateSetting(checked ? "auto" : "manual")}
                  disabled={savingRate}
                />
              </div>

              {stats?.mode === "manual" && (
                <div className="flex gap-2 items-center">
                  <Input
                    value={manualRateInput}
                    onChange={(e) => setManualRateInput(e.target.value)}
                    placeholder="مثلاً: 205000"
                    dir="ltr"
                    className="h-9 text-xs font-mono"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleSaveRateSetting("manual")}
                    disabled={savingRate}
                    className="h-9 shrink-0 text-xs"
                  >
                    {savingRate ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "ثبت نرخ"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 4 Exchanges Live Status Cards */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats?.exchanges.map((ex) => (
            <Card key={ex.name} className="flex flex-col justify-between p-3.5 border-border/60">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{ex.name.split(" ")[0]}</span>
                  <span
                    className={cn(
                      "flex h-2 w-2 rounded-full",
                      ex.status === "ONLINE" ? "bg-emerald-500" : "bg-rose-500"
                    )}
                  />
                </div>
                <div className="text-[10px] text-muted-foreground">{ex.name}</div>
              </div>

              <div className="mt-3 pt-2 border-t border-border/40">
                {ex.rate ? (
                  <div>
                    <div className="text-sm font-black font-mono" dir="ltr">
                      {toFa(ex.rate.toLocaleString("fa-IR"))}
                    </div>
                    <div className="text-[9px] text-muted-foreground flex justify-between mt-0.5">
                      <span>تومان</span>
                      <span>{ex.ping}ms</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs font-medium text-rose-500">غیرفعال / خطا</div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* SECTION 2: Reprice Batch Log if exists */}
      {repriceLog && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center justify-between">
              <span>گزارش آخرین اجرای ربات ترب ({repriceLog.length} تغییر)</span>
              <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setRepriceLog(null)}>بستن</Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4 text-xs font-mono max-h-40 overflow-y-auto space-y-1" dir="rtl">
            {repriceLog.map((log, i) => (
              <div key={i} className="text-muted-foreground">• {log}</div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* SECTION 3: Torob Products Comparison & Repricer Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <span className="text-red-500 font-black">ترب</span>
                جدول مقایسه و مانیتورینگ قیمت ترب
              </CardTitle>
              <CardDescription className="text-xs">
                استعلام قیمت ارزان‌ترین رقیب در ترب و اعمال هوشمند کمترین قیمت با محافظت از ضرر (کف سود)
              </CardDescription>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-48 sm:w-64">
                <Search className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="جستجوی محصول..."
                  className="h-8 pr-8 text-xs"
                />
              </div>

              <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-0.5 text-xs">
                <Button
                  size="sm"
                  variant={filter === "all" ? "secondary" : "ghost"}
                  onClick={() => setFilter("all")}
                  className="h-7 px-2.5 text-xs"
                >
                  همه ({products.length})
                </Button>
                <Button
                  size="sm"
                  variant={filter === "torob_only" ? "secondary" : "ghost"}
                  onClick={() => setFilter("torob_only")}
                  className="h-7 px-2.5 text-xs text-red-600 dark:text-red-400 font-bold"
                >
                  متصل به ترب
                </Button>
                <Button
                  size="sm"
                  variant={filter === "no_torob" ? "secondary" : "ghost"}
                  onClick={() => setFilter("no_torob")}
                  className="h-7 px-2.5 text-xs text-muted-foreground"
                >
                  بدون لینک
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="w-[300px]">نام محصول</TableHead>
                  <TableHead className="text-center">قیمت تمام‌شده (خرید)</TableHead>
                  <TableHead className="text-center">قیمت فعلی ما</TableHead>
                  <TableHead className="text-center">ارزان‌ترین رقیب در ترب</TableHead>
                  <TableHead className="text-center">تنظیمات ربات ترب</TableHead>
                  <TableHead className="text-left">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingProducts ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                      در حال بارگذاری محصولات...
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-28 text-center text-xs text-muted-foreground">
                      محصولی یافت نشد.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((p) => (
                    <TableRow key={p.id} className="text-xs hover:bg-muted/30">
                      {/* Title & Brand */}
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1 max-w-[280px]">
                          <span className="font-bold line-clamp-1">{p.title}</span>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            {p.brand && <span>{p.brand}</span>}
                            <span>• {p.category}</span>
                            {p.isPriceLocked && (
                              <Badge variant="outline" className="text-[9px] text-rose-500 border-rose-500/30">
                                قفل قیمت
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Cost USD + Toman */}
                      <TableCell className="text-center font-mono" dir="ltr">
                        {p.costUsd ? (
                          <div>
                            <div className="font-bold">${p.costUsd}</div>
                            <div className="text-[10px] text-muted-foreground">
                              ≈ {toToman(p.supplierCostToman || 0)} ت
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Current Price */}
                      <TableCell className="text-center">
                        <span className="font-black text-sm text-primary">{toToman(p.currentPrice)}</span>
                        <span className="text-[10px] text-muted-foreground mr-1">ت</span>
                      </TableCell>

                      {/* Torob Competitor Price */}
                      <TableCell className="text-center">
                        {p.hasTorob ? (
                          p.lastTorobPrice ? (
                            <div>
                              <div className="font-bold text-red-600 dark:text-red-400">
                                {toToman(p.lastTorobPrice)} ت
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                {p.currentPrice < p.lastTorobPrice ? (
                                  <span className="text-emerald-500 font-bold flex items-center justify-center gap-0.5">
                                    <ArrowDownRight className="h-3 w-3" />
                                    {toToman(p.lastTorobPrice - p.currentPrice)} ت ارزان‌تریم
                                  </span>
                                ) : p.currentPrice > p.lastTorobPrice ? (
                                  <span className="text-rose-500 font-bold flex items-center justify-center gap-0.5">
                                    <ArrowUpRight className="h-3 w-3" />
                                    {toToman(p.currentPrice - p.lastTorobPrice)} ت گران‌تریم
                                  </span>
                                ) : (
                                  <span>برابر با رقیب</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">هنوز استعلام نشده</span>
                          )
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            لینک ترب ندارد
                          </Badge>
                        )}
                      </TableCell>

                      {/* Torob Settings */}
                      <TableCell className="text-center">
                        {p.hasTorob ? (
                          <div className="flex flex-col gap-0.5 text-[10px] text-muted-foreground">
                            <span>کاهش: <strong className="text-foreground">{p.torobUndercut}٪</strong></span>
                            <span>کف سود: <strong className="text-foreground">{p.torobFloor}٪</strong></span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-[10px]">—</span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          {p.hasTorob ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleFetchTorob(p)}
                              className="h-7 text-xs gap-1 border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10"
                            >
                              <Search className="h-3 w-3" />
                              استعلام ترب
                            </Button>
                          ) : (
                            <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground">
                              <Link href={`/admin/products?edit=${p.id}`}>
                                <LinkIcon className="h-3 w-3 ml-1" />
                                افزودن لینک ترب
                              </Link>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Torob Single Product Comparison Dialog */}
      <Dialog open={Boolean(inspectingProduct)} onOpenChange={(open) => !open && setInspectingProduct(null)}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <span className="text-red-500 font-black">ترب</span>
              استعلام و مقایسه زنده محصول
            </DialogTitle>
            <DialogDescription className="text-xs">
              {inspectingProduct?.title}
            </DialogDescription>
          </DialogHeader>

          {fetchingTorob ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-red-500" />
              در حال اتصال به API ترب و دریافت کمترین قیمت رقبا...
            </div>
          ) : torobResult ? (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border p-3 bg-muted/20">
                  <span className="text-muted-foreground">قیمت تمام‌شده (خرید ما):</span>
                  <div className="font-bold text-sm mt-1">{toToman(torobResult.supplierCostToman)} تومان</div>
                  <div className="text-[10px] text-muted-foreground font-mono" dir="ltr">(${torobResult.costUsd} × {toFa(torobResult.usdRate)})</div>
                </div>

                <div className="rounded-xl border p-3 bg-red-500/5 border-red-500/20">
                  <span className="text-red-600 dark:text-red-400 font-bold">ارزان‌ترین قیمت رقیب در ترب:</span>
                  <div className="font-black text-sm mt-1 text-red-600 dark:text-red-400">{toToman(torobResult.torobMinPrice)} تومان</div>
                  <div className="text-[10px] text-muted-foreground">کمترین قیمت موجود در ترب</div>
                </div>
              </div>

              {/* Recommended Calculation */}
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">قیمت فعلی در سایت ما:</span>
                  <span className="font-bold">{toToman(torobResult.currentPrice)} تومان</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">درصد ارزان‌تر از ترب:</span>
                  <span className="font-bold text-emerald-600">{toFa(torobResult.undercutPct)}٪ کمتر</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">کف سود مجاز (حفاظت از ضرر):</span>
                  <span>حداقل {toFa(torobResult.floorPct)}٪ سود ({toToman(torobResult.floorPriceToman)} ت)</span>
                </div>

                <div className="pt-2 border-t border-primary/20 flex justify-between items-center">
                  <span className="font-bold text-primary">قیمت پیشنهادی و برنده ترب:</span>
                  <span className="text-xl font-black text-primary">{toToman(torobResult.recommendedPrice)} تومان</span>
                </div>

                {torobResult.isFloorHit && (
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2 rounded-lg mt-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>کف سود فعال شد: جهت جلوگیری از ضرر، قیمت کمتر از کف سود مجاز نخواهد شد.</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setInspectingProduct(null)} disabled={applyingPrice}>
                  انصراف
                </Button>
                <Button
                  size="sm"
                  onClick={handleApplyRecommendedPrice}
                  disabled={applyingPrice}
                  className="gap-1.5 bg-primary text-primary-foreground font-bold"
                >
                  {applyingPrice ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  اعمال قیمت پیشنهادی ({toToman(torobResult.recommendedPrice)} ت)
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-muted-foreground">
              اطلاعاتی دریافت نشد.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
