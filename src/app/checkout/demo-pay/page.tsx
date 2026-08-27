"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldCheck, Loader2, CheckCircle2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function DemoPayContent() {
  const params = useSearchParams();
  const authority = params.get("Authority") || "";
  const [status, setStatus] = useState<"idle" | "paying" | "done">("idle");

  function pay() {
    setStatus("paying");
    setTimeout(() => {
      setStatus("done");
      setTimeout(() => {
        window.location.href = `/api/checkout/verify?Authority=${authority}&Status=OK`;
      }, 800);
    }, 1400);
  }

  function cancel() {
    window.location.href = `/api/checkout/verify?Authority=${authority}&Status=NOK`;
  }

  return (
    <Card className="w-full max-w-md overflow-hidden p-0">
      <div className="bg-gradient-to-br from-primary to-emerald-600 p-6 text-center text-primary-foreground">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h1 className="text-lg font-black">درگاه پرداخت نمایشی</h1>
        <p className="mt-1 text-xs text-primary-foreground/80">
          این یک پرداخت شبیه‌سازی‌شده است — هیچ مبلغی واقعاً کسر نمی‌شود
        </p>
      </div>

      <div className="p-6">
        <div className="mb-5 space-y-2 rounded-xl bg-muted/40 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">پذیرنده</span>
            <span className="font-medium">لایسنس‌لند</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">کد پیگیری</span>
            <span className="font-mono" dir="ltr">{authority.slice(0, 16)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">درگاه</span>
            <span className="font-medium">زرین‌پال (حالت تست)</span>
          </div>
        </div>

        {status === "idle" && (
          <>
            <Button onClick={pay} size="lg" className="w-full gap-2">
              <CreditCard className="h-4 w-4" />
              پرداخت موفق (شبیه‌سازی)
            </Button>
            <Button onClick={cancel} variant="ghost" size="sm" className="mt-2 w-full text-muted-foreground">
              انصراف از پرداخت
            </Button>
          </>
        )}

        {status === "paying" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">در حال پردازش پرداخت...</p>
          </div>
        )}

        {status === "done" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <p className="font-bold">پرداخت موفق بود!</p>
            <p className="text-sm text-muted-foreground">در حال انتقال به صفحه سفارش...</p>
          </div>
        )}
      </div>

      <div className="border-t bg-muted/30 px-6 py-3 text-center text-[11px] text-muted-foreground">
        برای فعال‌سازی درگاه واقعی، کد پذیرنده زرین‌پال را در فایل .env قرار دهید
      </div>
    </Card>
  );
}

export default function DemoPayPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Suspense fallback={
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          در حال بارگذاری...
        </div>
      }>
        <DemoPayContent />
      </Suspense>
    </div>
  );
}
