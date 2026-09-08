"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";

interface FieldDef {
  label: string;
  placeholder: string;
  type?: "text" | "password" | "boolean";
  help?: string;
}

export function SettingsForm({
  settings,
  settingLabels,
}: {
  settings: Record<string, string>;
  settingLabels: Record<string, FieldDef>;
}) {
  const router = useRouter();
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
      router.refresh(); // <--- Refresh to fetch new data
    } catch (e: any) {
      toast.error(e?.message || "خطای ناشناخته");
    } finally {
      setLoading(false);
    }
  }

  const entries = Object.entries(settingLabels);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {entries.map(([key, def]) =>
          def.type === "boolean" ? (
            <div
              key={key}
              className="flex items-center justify-between gap-4 rounded-xl border border-primary/25 bg-primary/5 p-4 sm:col-span-2 shadow-xs"
            >
              <div className="space-y-1">
                <Label htmlFor={`s-${key}`} className="cursor-pointer font-bold text-sm text-foreground">
                  {def.label}
                </Label>
                {def.help && <p className="text-xs text-muted-foreground leading-relaxed">{def.help}</p>}
              </div>
              <Switch
                id={`s-${key}`}
                checked={values[key] === "true"}
                onCheckedChange={(checked) => set(key, checked ? "true" : "false")}
              />
            </div>
          ) : (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={`s-${key}`}>{def.label}</Label>
              <Input
                id={`s-${key}`}
                type={def.type === "password" ? "password" : "text"}
                value={values[key] || ""}
                onChange={(e) => set(key, e.target.value)}
                placeholder={def.placeholder}
                dir={
                  def.type === "password" || key.includes("zarinpal") || key.includes("telegram_bot")
                    ? "ltr"
                    : undefined
                }
              />
              {def.help && <p className="text-xs text-muted-foreground">{def.help}</p>}
            </div>
          )
        )}
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          ذخیره تنظیمات
        </Button>
      </div>
    </form>
  );
}
