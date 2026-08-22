"use client";

import { useState } from "react";
import { Copy, Check, KeyRound, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { toFa } from "@/lib/date";

interface License {
  id: string;
  key: string;
  note: string | null;
  status: string;
}

export function LicenseKeys({
  productTitle,
  licenses,
  sold,
}: {
  productTitle: string;
  licenses: License[];
  sold: boolean;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("کپی شد");
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <KeyRound className="h-4 w-4 text-primary" />
          {productTitle}
        </h3>
        {sold && (
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            تحویل داده شد
          </span>
        )}
      </div>
      <div className="p-4">
        {!sold ? (
          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-4 w-4" />
            لایسنس در انتظار تأیید پرداخت است
          </div>
        ) : licenses.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-4 w-4" />
            لایسنس شما به‌زودی توسط پشتیبانی ارسال خواهد شد
          </div>
        ) : (
          <div className="space-y-2">
            {licenses.map((l, i) => (
              <div key={l.id} className="rounded-xl border bg-muted/20 p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">لایسنس {toFa(i + 1)}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1 px-2 text-xs"
                    onClick={() => copy(l.key, l.id)}
                  >
                    {copied === l.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    کپی
                  </Button>
                </div>
                <code className="block w-full break-all rounded-lg bg-background p-2 font-mono text-sm" dir="ltr">
                  {l.key}
                </code>
                {l.note && (
                  <p className="mt-2 text-xs text-muted-foreground">{l.note}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
