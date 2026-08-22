"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Save,
  Building2,
  Globe,
  Mail,
  DollarSign,
  Percent,
  KeyRound,
  CreditCard,
  Send,
} from "lucide-react";
import { toast } from "sonner";

export interface SetupField {
  key: string;
  label: string;
  placeholder: string;
  type?: "text" | "password" | "number";
  help: string;
  optional?: boolean;
  ltr?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

// Settings covered by the wizard — stored in the `Setting` table (key/value).
// `base_markup_percent` is a new key introduced for the setup wizard (default 200%).
export const SETUP_FIELDS: SetupField[] = [
  {
    key: "site_name",
    label: "نام برند",
    placeholder: "لیسانس‌لَند",
    help: "نام تجاری سایت که در هدر، فوتر و نقشه سایت نمایش داده می‌شود.",
    icon: Building2,
  },
  {
    key: "site_url",
    label: "آدرس دامنه (URL)",
    placeholder: "https://licenseland.ir",
    help: "دامنه اصلی سایت — برای ساخت لینک canonical و متادیتای سئو استفاده می‌شود. معادل NEXTAUTH_URL.",
    ltr: true,
    icon: Globe,
  },
  {
    key: "email",
    label: "ایمیل پشتیبانی",
    placeholder: "support@licenseland.ir",
    help: "ایمیلی که مشتریان برای پشتیبانی از آن استفاده می‌کنند. در فوتر و صفحه تماس نمایش داده می‌شود.",
    ltr: true,
    icon: Mail,
  },
  {
    key: "usd_to_toman_rate",
    label: "نرخ دلار به تومان",
    placeholder: "60000",
    type: "number",
    help: "نرخ تبدیل هر دلار به تومان — برای محاسبه قیمت محصولات وارداتی از تأمین‌کننده. مثلاً ۶۰۰۰۰ یعنی هر دلار ۶۰٬۰۰۰ تومان.",
    ltr: true,
    icon: DollarSign,
  },
  {
    key: "base_markup_percent",
    label: "درصد حاشیه سود پایه",
    placeholder: "200",
    type: "number",
    help: "درصدی که روی قیمت تمام‌شده اضافه می‌شود تا قیمت نهایی فروش محاسبه شود. پیش‌فرض: ۲۰۰٪ (یعنی قیمت نهایی = ۳ برابر قیمت تمام‌شده).",
    ltr: true,
    icon: Percent,
  },
  {
    key: "supplier_api_key",
    label: "کلید API تأمین‌کننده (irMarket)",
    placeholder: "anb_...",
    type: "password",
    help: "کلید API از پنل irMarket — برای وارد کردن محصولات و خرید خودکار لایسنس. مستندات: api.irmarket.store/buyer/docs",
    ltr: true,
    icon: KeyRound,
  },
  {
    key: "zarinpal_merchant",
    label: "مرچنت زرین‌پال",
    placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    type: "password",
    help: "کد مرچنت زرین‌پال برای درگاه پرداخت واقعی. در حال حاضر پرداخت در حالت دمو فعال است. این مقدار صرفاً برای نمایش است؛ پرداخت واقعی با متغیر محیطی ZARINPAL_MERCHANT انجام می‌شود.",
    ltr: true,
    icon: CreditCard,
  },
  {
    key: "telegram_bot_token",
    label: "توکن بات تلگرام",
    placeholder: "123456789:ABCdef...",
    type: "password",
    help: "برای خودکارسازی تأمین لایسنس و نوتیفیکیشن‌ها (آینده). اختیاری — در صورت تنظیم، سفارش‌های جدید و هشدار موجودی کم از طریق بات اطلاع‌رسانی می‌شود.",
    optional: true,
    ltr: true,
    icon: Send,
  },
];

export function SetupWizardForm({
  settings,
}: {
  settings: Record<string, string>;
}) {
  const [values, setValues] = useState<Record<string, string>>(settings);
  const [loading, setLoading] = useState(false);

  function set(key: string, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: values }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "خطا");
      toast.success("تنظیمات ذخیره شد");
    } catch (e: any) {
      toast.error(e?.message || "خطای ناشناخته");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {SETUP_FIELDS.map((field) => {
          const Icon = field.icon;
          const filled = !!values[field.key]?.trim();
          return (
            <div key={field.key} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Icon className="h-4 w-4" />
                </div>
                <Label htmlFor={`setup-${field.key}`} className="font-bold">
                  {field.label}
                  {field.optional ? (
                    <span className="mr-1 text-xs font-normal text-muted-foreground">
                      (اختیاری)
                    </span>
                  ) : (
                    <span className="mr-1 text-rose-500">*</span>
                  )}
                </Label>
                {filled && (
                  <span className="mr-auto text-xs text-emerald-600 dark:text-emerald-400">
                    ذخیره‌شده ✓
                  </span>
                )}
              </div>
              <Input
                id={`setup-${field.key}`}
                type={
                  field.type === "password"
                    ? "password"
                    : field.type === "number"
                    ? "text"
                    : "text"
                }
                inputMode={field.type === "number" ? "numeric" : undefined}
                value={values[field.key] || ""}
                onChange={(e) => set(field.key, e.target.value)}
                placeholder={field.placeholder}
                dir={field.ltr ? "ltr" : undefined}
                className={field.ltr ? "text-left" : undefined}
              />
              <p className="text-xs leading-relaxed text-muted-foreground">
                {field.help}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          فیلدهای با <span className="text-rose-500">*</span> ضروری هستند.
          تغییرات بلافاصله در پایگاه داده ذخیره می‌شوند.
        </p>
        <Button type="submit" disabled={loading} className="gap-2 sm:min-w-40">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          ذخیره تنظیمات
        </Button>
      </div>
    </form>
  );
}
