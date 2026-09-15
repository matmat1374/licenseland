"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Lock, ShieldCheck, ShoppingBag, Sparkles, Trophy } from "lucide-react";

const ALL_BADGES: { code: string; title: string; desc: string; icon: any }[] = [
  {
    code: "FIRST_BUY",
    title: "اولین خرید",
    desc: "ثبت اولین سفارش موفق در لایسنو",
    icon: ShoppingBag,
  },
  {
    code: "FIVE_ORDERS",
    title: "مشتری وفادار",
    desc: "ثبت حداقل ۵ سفارش موفق",
    icon: Award,
  },
  {
    code: "HIGH_SPENDER",
    title: "خریدار برتر",
    desc: "مجموع خرید بیش از ۵ میلیون تومان",
    icon: Trophy,
  },
  {
    code: "POINT_MASTER",
    title: "استاد امتیاز",
    desc: "کسب بیش از ۱۰۰۰ امتیاز در کل",
    icon: Sparkles,
  },
];

export function BadgeGrid({ badges = [] }: { badges?: any[] }) {
  const earnedCodes = new Set((badges || []).map((b) => b.badge));

  return (
    <Card className="border border-border/80 shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            نشان‌های افتخار و دستاوردها
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {badges.length} از {ALL_BADGES.length} نشان کسب شده
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ALL_BADGES.map((b) => {
            const isEarned = earnedCodes.has(b.code);
            const Icon = b.icon;

            return (
              <div
                key={b.code}
                className={`relative flex flex-col items-center justify-center p-3.5 text-center rounded-xl border transition-all ${
                  isEarned
                    ? "bg-primary/5 border-primary/30 shadow-xs"
                    : "bg-muted/30 border-dashed border-border/60 opacity-60"
                }`}
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl mb-2 transition-transform ${
                    isEarned
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isEarned ? <Icon className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                </div>

                <div className="text-xs font-bold text-foreground line-clamp-1">{b.title}</div>
                <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                  {b.desc}
                </div>

                <div className="mt-2">
                  <Badge
                    variant={isEarned ? "default" : "outline"}
                    className={`text-[10px] px-2 py-0 h-4 ${
                      isEarned ? "bg-emerald-600 text-white" : "text-muted-foreground"
                    }`}
                  >
                    {isEarned ? "کسب شده" : "قفل"}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
