"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_CONTENT } from "@/lib/content";

export interface ContentField {
  key: string;
  label: string;
  type?: "text" | "textarea";
  group: string;
  placeholder?: string;
}

interface Props {
  initialContent: Record<string, string>;
  groups: { name: string; fields: ContentField[] }[];
}

export function ContentManager({ initialContent, groups }: Props) {
  const [values, setValues] = useState<Record<string, string>>(initialContent);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  function set(key: string, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: values }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "خطا");
      toast.success(json.message || "محتوا ذخیره شد");
    } catch (e: any) {
      toast.error(e?.message || "خطای ناشناخته");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(key: string) {
    setResetting(true);
    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: { [key]: DEFAULT_CONTENT[key] || "" } }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "خطا");
      set(key, DEFAULT_CONTENT[key] || "");
      toast.success("مقدار پیش‌فرض بازگردانده شد");
    } catch (e: any) {
      toast.error(e?.message || "خطا");
    } finally {
      setResetting(false);
    }
  }

  function handleResetAll() {
    setValues({ ...DEFAULT_CONTENT });
    toast.info("مقادیر به حالت پیش‌فرض بازگردانده شد — برای ذخیره دکمه «ذخیره محتوا» را بزنید");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {groups.map((g) => (
        <Card key={g.name} className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">{g.name}</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {g.fields.map((f) => (
              <div key={f.key} className={`space-y-1.5 ${f.type === "textarea" ? "sm:col-span-2" : ""}`}>
                <div className="flex items-center justify-between">
                  <Label htmlFor={`c-${f.key}`}>{f.label}</Label>
                  <button
                    type="button"
                    onClick={() => handleReset(f.key)}
                    disabled={resetting}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-primary"
                  >
                    <RotateCcw className="h-3 w-3" /> پیش‌فرض
                  </button>
                </div>
                {f.type === "textarea" ? (
                  <Textarea
                    id={`c-${f.key}`}
                    value={values[f.key] || ""}
                    onChange={(e) => set(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    rows={3}
                  />
                ) : (
                  <Input
                    id={`c-${f.key}`}
                    value={values[f.key] || ""}
                    onChange={(e) => set(f.key, e.target.value)}
                    placeholder={f.placeholder}
                  />
                )}
                <p className="text-[11px] text-muted-foreground" dir="ltr">{f.key}</p>
              </div>
            ))}
          </div>
        </Card>
      ))}

      <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-xl border bg-background/95 p-4 shadow-lg backdrop-blur">
        <Button
          type="button"
          variant="outline"
          onClick={handleResetAll}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          بازگرداندن همه به حالت پیش‌فرض
        </Button>
        <Button type="submit" disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          ذخیره محتوا
        </Button>
      </div>
    </form>
  );
}
