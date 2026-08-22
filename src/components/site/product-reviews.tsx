"use client";

import { Star, MessageSquare, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toFa, timeAgo } from "@/lib/date";

interface Review {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  verified: boolean;
  createdAt: Date | string;
}

export function ProductReviews({
  reviews,
  rating,
  reviewCount,
}: {
  productId: string;
  reviews: Review[];
  rating: number;
  reviewCount: number;
}) {
  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    const pct = reviews.length ? (count / reviews.length) * 100 : 0;
    return { star, count, pct };
  });

  return (
    <div className="mt-12">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-black">
        <MessageSquare className="h-5 w-5 text-primary" />
        نظرات کاربران
      </h2>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* summary */}
        <Card className="h-fit p-5 text-center">
          <div className="text-4xl font-black text-primary">{toFa(rating.toFixed(1))}</div>
          <div className="mt-1 flex justify-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={i < Math.round(rating) ? "h-4 w-4 fill-amber-400 text-amber-400" : "h-4 w-4 text-muted-foreground"}
              />
            ))}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">از {toFa(reviewCount)} نظر</div>

          <div className="mt-4 space-y-1.5">
            {distribution.map((d) => (
              <div key={d.star} className="flex items-center gap-2 text-xs">
                <span className="flex w-8 items-center gap-0.5">
                  {toFa(d.star)}
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-amber-400" style={{ width: `${d.pct}%` }} />
                </div>
                <span className="w-6 text-muted-foreground">{toFa(d.count)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* reviews list */}
        <div className="lg:col-span-2">
          {reviews.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              هنوز نظری برای این محصول ثبت نشده است.
            </Card>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <Card key={r.id} className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-600 text-sm font-bold text-primary-foreground">
                        {r.authorName[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-sm font-bold">
                          {r.authorName}
                          {r.verified && (
                            <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-[10px] text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" />
                              خرید تأیید شده
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{timeAgo(r.createdAt)}</div>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={i < r.rating ? "h-3.5 w-3.5 fill-amber-400 text-amber-400" : "h-3.5 w-3.5 text-muted-foreground"}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm leading-7 text-foreground/90">{r.comment}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
