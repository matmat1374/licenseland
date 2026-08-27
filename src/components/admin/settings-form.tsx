"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface FieldDef {
  label: string;
  placeholder: string;
  type?: "text" | "password";
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
        {entries.map(([key, def]) => (
          <div key={key} className="space-y-1.5">
            <Label htmlFor={`s-${key}`}>{def.label}</Label>
            <Input
              id={`s-${key}`}
              type={def.type === "password" ? "password" : "text"}
              value={values[key] || ""}
              onChange={(e) => set(key, e.target.value)}
              placeholder={def.placeholder}
              dir={def.type === "password" || key.includes("zarinpal") || key.includes("telegram_bot") ? "ltr" : undefined}
            />
            {def.help && <p className="text-xs text-muted-foreground">{def.help}</p>}
          </div>
        ))}
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
