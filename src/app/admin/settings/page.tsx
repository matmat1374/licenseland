import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SettingsForm } from "@/components/admin/settings-form";
import { Info, CreditCard, Send, ShieldCheck } from "lucide-react";

export const metadata = { title: "تنظیمات سایت" };
export const dynamic = "force-dynamic";

const SETTING_KEYS = [
  "site_name",
  "site_tagline",
  "telegram",
  "instagram",
  "phone",
  "email",
  "usd_to_toman_rate",
  "supplier_api_key",
  "zarinpal_merchant",
  "telegram_bot_token",
  "telegram_supplier_chat_id",
] as const;

const SETTING_LABELS: Record<string, { label: string; placeholder: string; type?: "text" | "password"; help?: string }> = {
  site_name: { label: "نام سایت", placeholder: "لایسنس‌لند" },
  site_tagline: { label: "شعار سایت", placeholder: "بازار لایسنس دیجیتال ایران" },
  telegram: { label: "تلگرام", placeholder: "https://t.me/licenseland" },
  instagram: { label: "اینستاگرام", placeholder: "https://instagram.com/licenseland" },
  phone: { label: "تلفن تماس", placeholder: "۰۲۱-۹۱۰۰۰۰۰۰" },
  email: { label: "ایمیل پشتیبانی", placeholder: "support@licenseland.ir" },
  usd_to_toman_rate: {
    label: "نرخ دلار (تومان)",
    placeholder: "60000",
    help: "نرخ تبدیل هر دلار به تومان — برای قیمت‌گذاری محصولات وارداتی از تأمین‌کننده. مثلاً ۶۰۰۰۰ یعنی هر دلار ۶۰٬۰۰۰ تومان.",
  },
  supplier_api_key: {
    label: "کلید API تأمین‌کننده (irMarket)",
    placeholder: "anb_...",
    type: "password",
    help: "کلید API از irMarket — برای وارد کردن محصولات و خرید خودکار. در docs: api.irmarket.store/buyer/docs",
  },
  zarinpal_merchant: {
    label: "مرچنت زرین‌پال",
    placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    help: "این مقدار صرفاً برای نمایش است. پرداخت واقعی از طریق متغیر محیطی ZARINPAL_MERCHANT انجام می‌شود.",
  },
  telegram_bot_token: {
    label: "توکن بات تلگرام",
    placeholder: "123456789:ABCdef...",
    type: "password",
    help: "برای خودکارسازی تأمین لایسنس (آینده). باتی که سفارش‌های جدید و کلیدهای فروخته‌شده را اطلاع می‌دهد.",
  },
  telegram_supplier_chat_id: {
    label: "چت آیدی تأمین‌کننده تلگرام",
    placeholder: "123456789",
    help: "آیدی عددی چت تأمین‌کننده برای دریافت نوتیفیکیشن‌های موجودی کم.",
  },
};

export default async function AdminSettingsPage() {
  const rows = await db.setting.findMany();
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;

  const settings: Record<string, string> = {};
  for (const k of SETTING_KEYS) settings[k] = map[k] || "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">تنظیمات سایت</h1>
        <p className="text-sm text-muted-foreground">پیکربندی عمومی و یکپارچه‌سازی‌ها</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="mb-1 font-bold">اطلاعات عمومی</h2>
            <p className="mb-5 text-xs text-muted-foreground">این مقادیر در پایگاه داده ذخیره می‌شوند</p>
            <SettingsForm settings={settings} settingLabels={SETTING_LABELS} />
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CreditCard className="h-5 w-5" />
              </div>
              <h3 className="font-bold">فعال‌سازی زرین‌پال واقعی</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              در حال حاضر پرداخت‌ها در حالت دمو (شبیه‌سازی) انجام می‌شوند. برای فعال‌سازی درگاه واقعی:
            </p>
            <ol className="mt-2 list-decimal space-y-1 pr-5 text-sm text-muted-foreground">
              <li>مرچنت کد را از پنل زرین‌پال دریافت کنید</li>
              <li>
                متغیر محیطی <code dir="ltr" className="rounded bg-muted px-1.5 py-0.5 text-xs">ZARINPAL_MERCHANT</code> را در فایل{" "}
                <code dir="ltr" className="rounded bg-muted px-1.5 py-0.5 text-xs">.env</code> قرار دهید
              </li>
              <li>سرور را ری‌استارت کنید</li>
            </ol>
            <Badge variant="outline" className="mt-3 bg-amber-500/10 text-amber-600 dark:text-amber-400">
              حالت فعلی: دمو
            </Badge>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                <Send className="h-5 w-5" />
              </div>
              <h3 className="font-bold">تأمین خودکار تلگرام</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              در آینده می‌توانید با تنظیم توکن بات تلگرام، فرآیند زیر را خودکارسازی کنید:
            </p>
            <ul className="mt-2 list-disc space-y-1 pr-5 text-sm text-muted-foreground">
              <li>اطلاع‌رسانی سفارش‌های جدید به تأمین‌کننده</li>
              <li>هشدار موجودی کم محصولات</li>
              <li>دریافت کلیدهای جدید از طریق بات</li>
              <li>گزارش روزانه فروش</li>
            </ul>
            <Badge variant="outline" className="mt-3 bg-muted">
              به‌زودی
            </Badge>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold">نکته امنیتی</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              کلیدهای حساس مانند توکن بات و مرچنت زرین‌پال را ترجیحاً در متغیرهای محیطی نگه دارید. مقادیر این صفحه صرفاً برای راهنمایی و نمایش ذخیره می‌شوند.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
