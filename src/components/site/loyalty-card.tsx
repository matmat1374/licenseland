"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toFa } from "@/lib/date";
import { toToman } from "@/lib/format";
import { Award, Crown, Diamond, Sparkles, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const TIER_META: Record<
  string,
  { label: string; icon: any; color: string; bg: string; border: string; nextTier?: string; nextMinSpent?: number }
> = {
  BRONZE: {
    label: "برنزی",
    icon: Award,
    color: "text-amber-700 dark:text-amber-500",
    bg: "bg-amber-700/10",
    border: "border-amber-700/20",
    nextTier: "SILVER",
    nextMinSpent: 500_000,
  },
  SILVER: {
    label: "نقره‌ای",
    icon: Sparkles,
    color: "text-slate-600 dark:text-slate-300",
    bg: "bg-slate-400/15",
    border: "border-slate-400/30",
    nextTier: "GOLD",
    nextMinSpent: 2_000_000,
  },
  GOLD: {
    label: "طلایی",
    icon: Crown,
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-400/15",
    border: "border-amber-400/30",
    nextTier: "DIAMOND",
    nextMinSpent: 5_000_000,
  },
  DIAMOND: {
    label: "الماس",
    icon: Diamond,
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-400/15",
    border: "border-cyan-400/30",
  },
};

export function LoyaltyCard({ loyalty, tiers }: { loyalty: any; tiers: any }) {
  if (!loyalty) return null;
  const tierKey = loyalty.tier || "BRONZE";
  const tierMeta = TIER_META[tierKey] || TIER_META.BRONZE;
  const currentTier = tiers?.[tierKey] || { pointMultiplier: 1, discountPercent: 0 };
  const TierIcon = tierMeta.icon;

  const totalSpent = loyalty.totalSpent || 0;
  const totalPoints = loyalty.totalPoints || 0;
  const pointsWorth = totalPoints * 1000;

  // Calculate progress to next tier
  let progressPercent = 100;
  let nextDiff = 0;
  if (tierMeta.nextMinSpent) {
    const minCurrent = tiers?.[tierKey]?.minSpent || 0;
    const target = tierMeta.nextMinSpent;
    const current = Math.max(0, totalSpent - minCurrent);
    const span = target - minCurrent;
    progressPercent = Math.min(100, Math.max(0, Math.round((current / span) * 100)));
    nextDiff = Math.max(0, target - totalSpent);
  }

  return (
    <Card className="overflow-hidden border border-border/80 shadow-xs">
      <div className={`p-5 ${tierMeta.bg} border-b ${tierMeta.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-background shadow-xs ${tierMeta.color}`}>
              <TierIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-medium">سطح کاربری شما</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-lg font-black">{tierMeta.label}</span>
                <Badge variant="outline" className={`${tierMeta.border} ${tierMeta.color} text-xs font-mono px-2`}>
                  {tierKey}
                </Badge>
              </div>
            </div>
          </div>

          <div className="text-left">
            <div className="text-xs text-muted-foreground">موجودی امتیازها</div>
            <div className="text-xl font-black text-primary">
              {toFa(totalPoints)} <span className="text-xs font-normal">امتیاز</span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              معادل {toToman(pointsWorth)} تومان تخفیف
            </div>
          </div>
        </div>

        {tierMeta.nextTier && (
          <div className="mt-4 space-y-1.5 pt-3 border-t border-border/40">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                پیشرفت تا سطح {TIER_META[tierMeta.nextTier]?.label || tierMeta.nextTier}
              </span>
              <span>{toFa(progressPercent)}٪</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            {nextDiff > 0 && (
              <p className="text-[11px] text-muted-foreground">
                تنها با {toToman(nextDiff)} تومان خرید دیگر به سطح بعدی ارتقا می‌یابید.
              </p>
            )}
          </div>
        )}
      </div>

      <CardContent className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
        <div className="rounded-xl border bg-muted/40 p-3">
          <div className="text-xs text-muted-foreground">ضریب کسب امتیاز</div>
          <div className="text-base font-black text-foreground mt-1">
            {toFa(currentTier.pointMultiplier)} برابر
          </div>
        </div>
        <div className="rounded-xl border bg-muted/40 p-3">
          <div className="text-xs text-muted-foreground">تخفیف پیش‌فرض سطح</div>
          <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {toFa((currentTier.discountPercent || 0) * 100)}٪
          </div>
        </div>
        <div className="rounded-xl border bg-muted/40 p-3 col-span-2 sm:col-span-1">
          <div className="text-xs text-muted-foreground">مجموع خریدهای ثبت‌شده</div>
          <div className="text-base font-black text-foreground mt-1">
            {toToman(totalSpent)} <span className="text-xs font-normal">ت</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
