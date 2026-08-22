"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { formatJalaliDate } from "@/lib/date";
import { toFa } from "@/lib/date";

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
  note: string | null;
  createdAt: string;
  fulfilledAt: string | null;
  _count: { licenses: number };
}
interface Log {
  id: string;
  action: string;
  status: string;
  payload: string;
  message: string | null;
  createdAt: string;
}

export function SupplierPanel({ initialConfig }: { initialConfig: Cfg }) {
  const [cfg, setCfg] = useState<Cfg>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"config" | "status" | "request" | "orders" | "logs" | "guide" | "import">("config");
  const [products, setProducts] = useState<{ id: string; title: string }[]>([]);
  const [reqForm, setReqForm] = useState({ productId: "", quantity: 5, note: "" });
  const [requesting, setRequesting] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [importForm, setImportForm] = useState({ apiUrl: "", apiKey: "", markupPercent: 200 });
  const [status, setStatus] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    setWebhookUrl(`${window.location.origin}/api/supplier/webhook`);
    loadProducts();
    if (tab === "orders" || tab === "logs") loadLogs();
    if (tab === "status") loadStatus();
  }, [tab]);

  async function loadProducts() {
    const res = await fetch("/api/admin/products?limit=200");
    const data = await res.json();
    setProducts((data.products || []).map((p: any) => ({ id: p.id, title: p.title })));
  }
  async function loadLogs() {
    const res = await fetch("/api/supplier/logs?limit=50");
    const data = await res.json();
    setOrders(data.orders || []);
    setLogs(data.logs || []);
  }

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

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/supplier/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "ذخیره شد");
        // reload to get masked values
        const r2 = await fetch("/api/supplier/config");
        const d2 = await r2.json();
        if (d2.ok) setCfg(d2.config);
      } else toast.error(data.message || "خطا");
    } catch {
      toast.error("ارتباط با سرور برقرار نشد");
    } finally {
      setSaving(false);
    }
  }

  async function regenerateSecret() {
    setSaving(true);
    try {
      const res = await fetch("/api/supplier/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerate_webhook_secret: true }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("رمز جدید تولید شد");
        const r2 = await fetch("/api/supplier/config");
        const d2 = await r2.json();
        if (d2.ok) setCfg(d2.config);
      }
    } finally {
      setSaving(false);
    }
  }

  async function sendRequest() {
    if (!reqForm.productId) return toast.error("محصول را انتخاب کنید");
    setRequesting(true);
    try {
      const res = await fetch("/api/supplier/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqForm),
      });
      const data = await res.json();
      if (res.ok) toast.success(data.message || "درخواست ارسال شد");
      else toast.error(data.message || "خطا");
    } catch {
      toast.error("ارتباط با سرور");
    } finally {
      setRequesting(false);
    }
  }

  async function handleImport() {
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch("/api/supplier/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(importForm),
      });
      const data = await res.json();
      setImportResult(data);
      if (res.ok && data.ok) toast.success(data.message || "وارد کردن موفق");
      else toast.error(data.message || "خطا در وارد کردن");
    } catch {
      toast.error("ارتباط با سرور");
    } finally {
      setImporting(false);
    }
  }

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("کپی شد");
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="space-y-6">
      {/* tabs */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {[
          { id: "status", label: "وضعیت اتصال", icon: Activity },
          { id: "config", label: "تنظیمات", icon: KeyRound },
          { id: "import", label: "وارد کردن محصولات", icon: Download },
          { id: "guide", label: "راهنمای اتصال", icon: Sparkles },
          { id: "request", label: "درخواست لایسنس", icon: Send },
          { id: "orders", label: "سوابق درخواست", icon: Truck },
          { id: "logs", label: "لاگ‌ها", icon: Webhook },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* STATUS TAB */}
      {tab === "status" && (
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold">
              <Activity className="h-4 w-4 text-primary" />
              وضعیت اتصال به irMarket
            </h2>
            <Button size="sm" variant="outline" onClick={loadStatus} disabled={statusLoading} className="gap-2">
              {statusLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              بروزرسانی
            </Button>
          </div>

          {statusLoading && !status ? (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              در حال بررسی وضعیت اتصال...
            </div>
          ) : status?.ok ? (
            <div className="space-y-5">
              <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                <div>
                  <div className="font-bold text-emerald-700 dark:text-emerald-400">اتصال برقرار است</div>
                  <p className="text-xs text-muted-foreground">کلید API معتبر است و به‌درستی با API irMarket ارتباط برقرار می‌کند.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <DollarSign className="h-4 w-4 text-primary" />
                    موجودی حساب (USD)
                  </div>
                  <div className="text-2xl font-black text-primary" dir="ltr">
                    ${status.balance_usd?.toFixed(2) || "0.00"}
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <BadgePercent className="h-4 w-4 text-primary" />
                    درصد تخفیف
                  </div>
                  <div className="text-2xl font-black text-primary" dir="ltr">
                    {status.discount_percent ?? 0}%
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-4 w-4 text-primary" />
                    نام کلید
                  </div>
                  <div className="truncate font-bold" dir="ltr">{status.name || "—"}</div>
                  <div className="mt-1 truncate text-xs text-muted-foreground" dir="ltr">{status.key || "—"}</div>
                </div>

                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <LinkIcon className="h-4 w-4 text-primary" />
                    آدرس وب‌هوک
                  </div>
                  {status.webhook_url ? (
                    <div className="truncate font-mono text-xs" dir="ltr">{status.webhook_url}</div>
                  ) : (
                    <div className="text-xs italic text-muted-foreground">وب‌هوک ثبت نشده</div>
                  )}
                </div>
              </div>

              <div className="rounded-lg bg-muted/30 p-4 text-xs text-muted-foreground">
                <strong className="text-foreground">نکته:</strong> این اطلاعات مستقیم از API تأمین‌کننده خوانده شده‌اند. موجودی به دلار است و در خریدهای خودکار استفاده می‌شود.
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-rose-500/30 bg-rose-500/5 p-4">
                <XCircle className="h-6 w-6 text-rose-500" />
                <div className="flex-1">
                  <div className="font-bold text-rose-700 dark:text-rose-400">اتصال برقرار نیست</div>
                  <p className="mt-1 text-xs text-muted-foreground">{status?.message || "خطای ناشناخته — لطفاً کلید API را بررسی کنید."}</p>
                </div>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                <p className="mb-2 font-bold">برای فعال‌سازی اتصال:</p>
                <ol className="list-decimal space-y-1.5 pr-5 text-xs text-muted-foreground">
                  <li>کلید API خود را از پنل irMarket دریافت کنید (با پیشوند <code dir="ltr" className="rounded bg-muted px-1">anb_...</code>)</li>
                  <li>به <a href="/admin/settings" className="text-primary underline">صفحه تنظیمات</a> بروید</li>
                  <li>کلید را در فیلد «کلید API تأمین‌کننده (irMarket)» قرار دهید و ذخیره کنید</li>
                  <li>به این صفحه برگردید و دوباره روی «بروزرسانی» بزنید</li>
                </ol>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* CONFIG TAB */}
      {tab === "config" && (
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">پیکربندی اتصال به تأمین‌کننده</h2>
            <div className="flex items-center gap-2">
              <Switch checked={cfg.enabled} onCheckedChange={(v) => setCfg({ ...cfg, enabled: v })} />
              <Label>{cfg.enabled ? "فعال" : "غیرفعال"}</Label>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>نحوه اتصال</Label>
              <Select value={cfg.mode} onValueChange={(v) => setCfg({ ...cfg, mode: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="telegram">بات تلگرام (ارسال پیام)</SelectItem>
                  <SelectItem value="api">API (فراخوانی HTTP)</SelectItem>
                  <SelectItem value="manual">دستی (فقط ثبت درخواست)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {cfg.mode === "telegram" && "پیام درخواست از طریق بات تلگرام به چت تأمین‌کننده ارسال می‌شود."}
                {cfg.mode === "api" && "درخواست به‌صورت POST به آدرس API تأمین‌کننده ارسال می‌شود."}
                {cfg.mode === "manual" && "درخواست ثبت می‌شود و کلیدها را خودتان در پنل لایسنس‌ها وارد می‌کنید."}
              </p>
            </div>

            {(cfg.mode === "telegram" || cfg.mode === "api") && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
                  <Webhook className="h-4 w-4 text-primary" />
                  آدرس وب‌هوک (برای دریافت کلیدها از تأمین‌کننده)
                </h3>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded bg-background px-3 py-2 text-xs" dir="ltr">{webhookUrl}</code>
                  <Button size="sm" variant="outline" onClick={() => copy(webhookUrl, "url")}>
                    {copied === "url" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
                <div className="mt-3 space-y-2">
                  <Label className="text-xs">رمز وب‌هوک (X-Supplier-Key)</Label>
                  <div className="flex items-center gap-2">
                    <Input dir="ltr" value={cfg.webhookSecret} readOnly className="font-mono text-xs" />
                    <Button size="sm" variant="outline" onClick={() => copy(cfg.webhookSecret, "secret")}>
                      {copied === "secret" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={regenerateSecret} disabled={saving}>
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">این رمز را به تأمین‌کننده بدهید تا در هدر X-Supplier-Key بفرستد.</p>
                </div>
              </div>
            )}

            {cfg.mode === "telegram" && (
              <>
                <div className="space-y-1.5">
                  <Label>توکن بات تلگرام</Label>
                  <Input dir="ltr" value={cfg.telegramBotToken} onChange={(e) => setCfg({ ...cfg, telegramBotToken: e.target.value })} placeholder="123456789:ABCdef..." className="font-mono text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label>چت آیدی تأمین‌کننده</Label>
                  <Input dir="ltr" value={cfg.telegramSupplierChatId} onChange={(e) => setCfg({ ...cfg, telegramSupplierChatId: e.target.value })} placeholder="123456789 یا @channel" className="font-mono text-xs" />
                  <p className="text-[11px] text-muted-foreground">برای دریافت چت‌آیدی عددی، از بات @userinfobot استفاده کنید.</p>
                </div>
              </>
            )}

            {cfg.mode === "api" && (
              <>
                <div className="space-y-1.5">
                  <Label>آدرس API تأمین‌کننده</Label>
                  <Input dir="ltr" value={cfg.apiUrl} onChange={(e) => setCfg({ ...cfg, apiUrl: e.target.value })} placeholder="https://supplier.com/api/deliver" className="font-mono text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label>کلید API (Bearer)</Label>
                  <Input dir="ltr" value={cfg.apiKey} onChange={(e) => setCfg({ ...cfg, apiKey: e.target.value })} placeholder="sk_..." className="font-mono text-xs" />
                </div>
              </>
            )}

            <Separator />

            <div className="space-y-3">
              <h3 className="text-sm font-bold">سفارش خودکار</h3>
              <div className="flex items-center justify-between">
                <div>
                  <Label>سفارش خودکار هنگام کاهش موجودی</Label>
                  <p className="text-xs text-muted-foreground">وقتی موجودی محصول به حد نصاب برسد، خودکار سفارش داده شود</p>
                </div>
                <Switch checked={cfg.autoRequest} onCheckedChange={(v) => setCfg({ ...cfg, autoRequest: v })} />
              </div>
              <div className="space-y-1.5">
                <Label>حد نصاب موجودی (تعداد)</Label>
                <Input type="number" min={1} max={50} value={cfg.lowStockThreshold} onChange={(e) => setCfg({ ...cfg, lowStockThreshold: Number(e.target.value) })} className="w-32" />
              </div>
            </div>

            <Button onClick={save} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              ذخیره تنظیمات
            </Button>
          </div>
        </Card>
      )}

      {/* GUIDE TAB */}
      {/* IMPORT TAB */}
      {tab === "import" && (
        <Card className="p-6">
          <h2 className="mb-1 flex items-center gap-2 font-bold"><Download className="h-4 w-4 text-primary" /> وارد کردن محصولات از API تأمین‌کننده</h2>
          <p className="mb-5 text-sm text-muted-foreground">تمام محصولات تأمین‌کننده با حاشیه سود مشخص وارد می‌شود</p>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>آدرس API تأمین‌کننده (لیست محصولات)</Label>
              <Input
                dir="ltr"
                value={importForm.apiUrl}
                onChange={(e) => setImportForm({ ...importForm, apiUrl: e.target.value })}
                placeholder="https://supplier.com/api/products"
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground">لینک API‌ای که فروشنده به شما داده — لیست تمام محصولات را برمی‌گرداند.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>کلید API (اختیاری)</Label>
                <Input
                  dir="ltr"
                  type="password"
                  value={importForm.apiKey}
                  onChange={(e) => setImportForm({ ...importForm, apiKey: e.target.value })}
                  placeholder="sk_..."
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label>درصد حاشیه سود (Markup)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={1000}
                    value={importForm.markupPercent}
                    onChange={(e) => setImportForm({ ...importForm, markupPercent: Number(e.target.value) })}
                    className="w-32"
                  />
                  <span className="text-sm text-muted-foreground">٪</span>
                  {importForm.markupPercent > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      <Package className="h-3 w-3" />
                      مثال: ۱۰۰٬۰۰۰ → {(100000 * (100 + importForm.markupPercent) / 100).toLocaleString("fa-IR")} ت
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">۲۰۰٪ یعنی قیمت پایه × ۳ (۱۰۰٪ + ۲۰۰٪ سود)</p>
              </div>
            </div>

            <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
              <p className="text-sm font-medium">فرمت قابل‌پذیرش:</p>
              <p className="mt-1 text-xs text-muted-foreground">API باید یک آرایه محصولات برگرداند. هر محصول باید حداقل <code dir="ltr" className="rounded bg-muted px-1">title</code> و <code dir="ltr" className="rounded bg-muted px-1">price</code> داشته باشد. فیلدهای اختیاری: description, shortDesc, features, category, brand, duration, tags, image.</p>
            </div>

            <Button onClick={handleImport} disabled={importing} size="lg" className="gap-2">
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {importing ? "در حال وارد کردن..." : "وارد کردن محصولات"}
            </Button>

            {importResult && (
              <div className={`rounded-lg border p-4 ${importResult.ok ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5"}`}>
                <div className="flex items-center gap-2">
                  {importResult.ok ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-rose-500" />}
                  <p className="font-bold">{importResult.message}</p>
                </div>
                {importResult.details && importResult.details.length > 0 && (
                  <div className="mt-3 max-h-60 overflow-y-auto rounded bg-muted/40 p-3 text-xs">
                    {importResult.details.map((d: string, i: number) => (
                      <div key={i} className="py-0.5">{d}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {tab === "guide" && <SupplierGuide webhookUrl={webhookUrl} webhookSecret={cfg.webhookSecret} />}

      {/* REQUEST TAB */}
      {tab === "request" && (
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 font-bold"><Send className="h-4 w-4 text-primary" /> درخواست لایسنس از تأمین‌کننده</h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>محصول</Label>
              <Select value={reqForm.productId} onValueChange={(v) => setReqForm({ ...reqForm, productId: v })}>
                <SelectTrigger><SelectValue placeholder="انتخاب محصول" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>تعداد</Label>
              <Input type="number" min={1} max={100} value={reqForm.quantity} onChange={(e) => setReqForm({ ...reqForm, quantity: Number(e.target.value) })} className="w-32" />
            </div>
            <div className="space-y-1.5">
              <Label>توضیحات (اختیاری)</Label>
              <Textarea value={reqForm.note} onChange={(e) => setReqForm({ ...reqForm, note: e.target.value })} placeholder="مثلاً: مورد فوری، تحویل تا فردا" rows={3} />
            </div>
            <Button onClick={sendRequest} disabled={requesting} className="gap-2">
              {requesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              ارسال درخواست به تأمین‌کننده
            </Button>
            <div className="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground">
              پس از ارسال درخواست، تأمین‌کننده باید کلیدها را به وب‌هوک ارسال کند. در صورت غیرفعال بودن ادغام، درخواست فقط ثبت شده و باید کلیدها را دستی وارد کنید.
            </div>
          </div>
        </Card>
      )}

      {/* ORDERS TAB */}
      {tab === "orders" && (
        <Card className="p-4">
          <h2 className="mb-4 flex items-center gap-2 font-bold"><Truck className="h-4 w-4 text-primary" /> سوابق درخواست ({toFa(orders.length)})</h2>
          {orders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">هنوز درخواستی ثبت نشده</p>
          ) : (
            <div className="space-y-2">
              {orders.map((o) => (
                <div key={o.id} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-mono text-sm font-bold" dir="ltr">{o.code}</span>
                      <Badge className="mr-2" variant={o.status === "FULFILLED" ? "default" : o.status === "FAILED" ? "destructive" : "secondary"}>
                        {o.status === "FULFILLED" ? "تحویل شده" : o.status === "FAILED" ? "ناموفق" : "در انتظار"}
                      </Badge>
                      <Badge variant="outline" className="mr-1">{o.direction === "INBOUND" ? "ورودی" : "خروجی"}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatJalaliDate(o.createdAt, true)}</span>
                  </div>
                  <div className="mt-1 text-sm">{o.productTitle}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    تعداد: {toFa(o.quantity)} • کلید دریافت‌شده: {toFa(o._count.licenses)}
                    {o.fulfilledAt && ` • تحویل: ${formatJalaliDate(o.fulfilledAt)}`}
                  </div>
                  {o.note && <div className="mt-1 text-xs italic text-muted-foreground">{o.note}</div>}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* LOGS TAB */}
      {tab === "logs" && (
        <Card className="p-4">
          <h2 className="mb-4 flex items-center gap-2 font-bold"><Webhook className="h-4 w-4 text-primary" /> لاگ‌های یکپارچه‌سازی</h2>
          {logs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">هیچ رویدادی ثبت نشده</p>
          ) : (
            <div className="max-h-[60vh] space-y-2 overflow-y-auto">
              {logs.map((l) => (
                <div key={l.id} className="flex items-start gap-2 rounded-lg border p-2 text-xs">
                  {l.status === "SUCCESS" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> :
                   l.status === "ERROR" ? <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" /> :
                   <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold">{l.action}</span>
                      <span className="text-muted-foreground">{formatJalaliDate(l.createdAt, true)}</span>
                    </div>
                    {l.message && <p className="mt-0.5 text-muted-foreground">{l.message}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function SupplierGuide({ webhookUrl, webhookSecret }: { webhookUrl: string; webhookSecret: string }) {
  const [copied, setCopied] = useState<string | null>(null);
  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("کپی شد");
    setTimeout(() => setCopied(null), 1500);
  }

  const samplePayload = JSON.stringify({
    supplierOrderId: "(اختیاری) شناسه درخواست",
    productId: "شناسه محصول از ما",
    keys: [
      { key: "CHATGPT-AB12-CD34", note: "email: user@gmail.com" },
      { key: "CHATGPT-EF56-GH78", note: "" }
    ]
  }, null, 2);

  return (
    <div className="space-y-6">
      <Card className="border-primary/30 bg-primary/5 p-6">
        <h2 className="mb-2 flex items-center gap-2 text-lg font-black">
          <Sparkles className="h-5 w-5 text-primary" />
          چطور به تأمین‌کننده وصل شویم؟
        </h2>
        <p className="text-sm leading-7 text-muted-foreground">
          شما یک ربات تلگرام پیدا کرده‌اید که لایسنس می‌فروشد. برای وصل کردن اتوماتیک، باید به فروشنده بگویید
          چه اطلاعاتی به شما بدهد. دو راه وجود دارد:
        </p>
      </Card>

      {/* Option A */}
      <Card className="p-6">
        <div className="mb-3 flex items-center gap-2">
          <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">راهکار ۱ — ساده</Badge>
          <h3 className="font-bold">ربات تلگرام را به ما بدید</h3>
        </div>
        <p className="mb-3 text-sm leading-7 text-muted-foreground">
          اگر ربات تلگرام، API یا قابلیت ارسال خودکار نداشته باشد، این ساده‌ترین راه است:
        </p>
        <ol className="list-decimal space-y-2 pr-5 text-sm leading-7">
          <li>به فروشنده بگویید: «می‌خواهم لایسنس‌ها را اتوماتیک تحویل بگیرم. لطفاً با هر سفارش، کلیدها را به این آدرس ارسال کنید.»</li>
          <li>این آدرس وب‌هوک را به او بدهید:</li>
        </ol>
        <div className="mt-2 flex items-center gap-2">
          <code className="flex-1 truncate rounded bg-muted px-3 py-2 text-xs" dir="ltr">{webhookUrl}</code>
          <Button size="sm" variant="outline" onClick={() => copy(webhookUrl, "url2")}>
            {copied === "url2" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">۳. این رمز را هم بدهید تا در هدر <code dir="ltr" className="rounded bg-muted px-1">X-Supplier-Key</code> بفرستد:</p>
        <div className="mt-2 flex items-center gap-2">
          <code className="flex-1 truncate rounded bg-muted px-3 py-2 text-xs font-mono" dir="ltr">{webhookSecret || "(ابتدا تولید کنید)"}</code>
          <Button size="sm" variant="outline" onClick={() => copy(webhookSecret, "sec2")}>
            {copied === "sec2" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">۴. به او بگویید بدنه JSON را این‌گونه بفرستد:</p>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-3 text-xs" dir="ltr">{samplePayload}</pre>
        <Button size="sm" variant="outline" className="mt-2 gap-1" onClick={() => copy(samplePayload, "payload")}>
          {copied === "payload" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} کپی نمونه بدنه
        </Button>
      </Card>

      {/* Option B */}
      <Card className="p-6">
        <div className="mb-3 flex items-center gap-2">
          <Badge className="bg-amber-500 text-white hover:bg-amber-500">راهکار ۲ — حرفه‌ای</Badge>
          <h3 className="font-bold">اگر ربات/API دارد</h3>
        </div>
        <p className="mb-3 text-sm leading-7 text-muted-foreground">
          اگر فروشنده یک API دارد که با فراخوانی آن، کلید برمی‌گرداند:
        </p>
        <ol className="list-decimal space-y-2 pr-5 text-sm leading-7">
          <li>آدرس API و کلید احراز هویت را از او بگیرید</li>
          <li>در تب «تنظیمات»، حالت را روی <strong>API</strong> بگذارید</li>
          <li>آدرس API و کلید را وارد و ذخیره کنید</li>
          <li>سایت خودکار با کم‌شدن موجودی، به API او درخواست می‌فرستد و کلیدها را از پاسخ یا وب‌هوک می‌گیرد</li>
        </ol>
        <div className="mt-3 rounded-lg bg-muted/40 p-3 text-xs leading-6 text-muted-foreground">
          <strong className="text-foreground">نکته برای گفتگو با فروشنده:</strong> از او بپرسید «آیا API برای تحویل اتوماتیک لایسنس داری؟
          اگر بله، آدرس و توکنش را بده. اگر نه، می‌توانی با هر سفارش کلیدها را به این آدرس POST کنی؟»
        </div>
      </Card>

      {/* Option C */}
      <Card className="p-6">
        <div className="mb-3 flex items-center gap-2">
          <Badge variant="outline">راهکار ۳ — دستی</Badge>
          <h3 className="font-bold">خرید دستی و افزودن گروهی</h3>
        </div>
        <p className="text-sm leading-7 text-muted-foreground">
          اگر هیچ اتوماسیونی ممکن نبود، می‌توانید لایسنس‌ها را دستی از ربات بخرید و در پنل ادمین ← مدیریت لایسنس‌ها،
          به‌صورت گروهی (یک کلید در هر خط) وارد کنید. سایت خودکار موجودی را مدیریت و با هر خرید تحویل می‌دهد.
        </p>
        <Button asChild variant="outline" size="sm" className="mt-3">
          <a href="/admin/licenses">رفتن به مدیریت لایسنس‌ها</a>
        </Button>
      </Card>

      {/* Cheat sheet */}
      <Card className="p-6">
        <h3 className="mb-3 font-bold">پیام آماده برای فرستادن به فروشنده</h3>
        <div className="rounded-lg bg-muted p-4 text-sm leading-8">
          سلام، می‌خوام لایسنس‌ها رو اتوماتیک ازت بگیرم. لطفاً با هر سفارش، کلیدها رو به این آدرس ارسال کن:
          <br />
          <code dir="ltr" className="text-primary">{webhookUrl}</code>
          <br />
          متد: POST، نوع محتوا: application/json
          <br />
          در هدر این رمز رو بفرست: X-Supplier-Key: <code dir="ltr" className="text-primary">{webhookSecret || "(رمز را تولید کنید)"}</code>
          <br />
          بدنه:
          <pre className="mt-1 overflow-x-auto text-xs" dir="ltr">{samplePayload}</pre>
        </div>
        <Button size="sm" variant="outline" className="mt-3 gap-1" onClick={() => copy(`سلام، می‌خوام لایسنس‌ها رو اتوماتیک ازت بگیرم. لطفاً با هر سفارش، کلیدها رو به این آدرس ارسال کن:\n${webhookUrl}\nمتد: POST، نوع محتوا: application/json\nدر هدر این رمز رو بفرست: X-Supplier-Key: ${webhookSecret}\nبدنه:\n${samplePayload}`, "msg")}>
          {copied === "msg" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} کپی پیام کامل
        </Button>
      </Card>
    </div>
  );
}
