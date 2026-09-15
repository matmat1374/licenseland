"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatJalaliDate, toFa } from "@/lib/date";
import { ArrowDownLeft, ArrowUpRight, Clock, Gift, History, Sparkles } from "lucide-react";

const TYPE_MAP: Record<string, { label: string; icon: any; isPositive: boolean }> = {
  EARN: { label: "کسب امتیاز خرید", icon: ArrowUpRight, isPositive: true },
  BONUS: { label: "امتیاز تشویقی / هدیه", icon: Gift, isPositive: true },
  REFUND: { label: "بازگشت امتیاز", icon: ArrowUpRight, isPositive: true },
  REDEEM: { label: "مصرف در خرید", icon: ArrowDownLeft, isPositive: false },
  EXPIRE: { label: "انقضای امتیاز", icon: Clock, isPositive: false },
};

export function PointHistory({ events = [] }: { events?: any[] }) {
  if (!events || events.length === 0) {
    return (
      <Card className="border border-border/80 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            تاریخچه امتیازات
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center text-muted-foreground">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mx-auto mb-3">
            <History className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium">هنوز تراکنش امتیازی ثبت نشده است.</p>
          <p className="text-xs text-muted-foreground mt-1">
            با تکمیل هر خرید در لایسنو، امتیاز وفاداری برای شما منظور خواهد شد.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border/80 shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          تاریخچه تراکنش‌های امتیاز
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border/60">
          {events.map((e) => {
            const meta = TYPE_MAP[e.type] || {
              label: e.type,
              icon: e.points > 0 ? ArrowUpRight : ArrowDownLeft,
              isPositive: e.points > 0,
            };
            const Icon = meta.icon;
            const isPositive = e.points > 0;

            return (
              <div key={e.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      isPositive
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">{meta.label}</div>
                    {e.description && (
                      <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                        {e.description}
                      </div>
                    )}
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {formatJalaliDate(new Date(e.createdAt), true)}
                    </div>
                  </div>
                </div>

                <div
                  className={`text-sm font-black font-mono px-2.5 py-1 rounded-lg ${
                    isPositive
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  }`}
                  dir="ltr"
                >
                  {isPositive ? `+${toFa(e.points)}` : toFa(e.points)} pt
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
