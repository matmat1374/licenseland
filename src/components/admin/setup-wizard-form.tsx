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
import { SETUP_FIELDS, type SetupField } from "@/lib/setup-fields";

// icons live client-side; mapped by field key (data itself is shared, see lib/setup-fields.ts)
const FIELD_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  site_name: Building2,
  site_url: Globe,
  email: Mail,
  usd_to_toman_rate: DollarSign,
  base_markup_percent: Percent,
  supplier_api_key: KeyRound,
  zarinpal_merchant: CreditCard,
  telegram_bot_token: Send,
};

function fieldIcon(field: SetupField) {
  return FIELD_ICONS[field.key] ?? Building2;
}

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
          const Icon = fieldIcon(field);
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
