"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Star, MessageSquare, CheckCircle2, HelpCircle, Headset, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { toFa, timeAgo } from "@/lib/date";

interface Review {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  verified: boolean;
  reply?: string | null;
  replyAt?: Date | string | null;
  createdAt: Date | string;
}

export function ProductReviews({
  productId,
  reviews: initialReviews,
  rating: initialRating,
  reviewCount: initialReviewCount,
}: {
  productId: string;
  reviews: Review[];
  rating: number;
  reviewCount: number;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [rating, setRating] = useState(initialRating);
  const [reviewCount, setReviewCount] = useState(initialReviewCount);

  const [activeTab, setActiveTab] = useState<"review" | "question">("review");
  const [formRating, setFormRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    const pct = reviews.length ? (count / reviews.length) * 100 : 0;
    return { star, count, pct };
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (comment.trim().length < 3) {
      toast.error("متن بسیار کوتاه است.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: formRating,
          comment,
          isQuestion: activeTab === "question",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "خطا در ثبت.");
      
      toast.success("با موفقیت ثبت شد.");
      setReviews((prev) => [data.review, ...prev]);
      if (data.rating !== null) setRating(data.rating);
      if (data.reviewCount !== null) setReviewCount(data.reviewCount);
      
      setComment("");
      setFormRating(5);
    } catch (err: any) {
      toast.error(err.message || "خطا در ثبت.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-12">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-black">
        <MessageSquare className="h-5 w-5 text-primary" />
        نظرات کاربران
      </h2>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* summary */}
        <div className="space-y-6">
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

          {/* Form */}
          {status === "unauthenticated" || !session ? (
            <Card className="p-6 text-center space-y-4 bg-muted/30">
              <p className="text-sm text-muted-foreground">
                برای ثبت تجربه خرید یا طرح پرسش، لطفاً وارد حساب کاربری خود شوید.
              </p>
              <Button asChild className="w-full">
                <Link href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}>ورود / ثبت نام</Link>
              </Button>
            </Card>
          ) : (
            <Card className="p-5">
              <div className="mb-4 flex rounded-lg bg-muted p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("review")}
                  className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all ${
                    activeTab === "review" ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  ثبت نظر و امتیاز
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("question")}
                  className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all ${
                    activeTab === "question" ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  پرسش درباره محصول
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {activeTab === "review" && (
                  <div className="flex items-center justify-center gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const starValue = i + 1;
                      return (
                        <button
                          key={i}
                          type="button"
                          onMouseEnter={() => setHoverRating(starValue)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setFormRating(starValue)}
                          className="p-1 transition-transform hover:scale-110 focus:outline-none"
                        >
                          <Star
                            className={`h-7 w-7 transition-colors ${
                              starValue <= (hoverRating || formRating)
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
                
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    activeTab === "review"
                      ? "نظر و تجربه خود را در مورد کیفیت، سرعت تحویل و فعالسازی بنویسید..."
                      : "پرسش خود را در مورد نحوه فعالسازی، پیشنیازها و گارانتی بپرسید..."
                  }
                  className="min-h-[120px] resize-none text-sm"
                  maxLength={1000}
                />
                
                <Button type="submit" disabled={isSubmitting || comment.trim().length < 3} className="w-full">
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : activeTab === "review" ? (
                    "ثبت نظر"
                  ) : (
                    "ثبت پرسش"
                  )}
                </Button>
              </form>
            </Card>
          )}
        </div>

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
                          {r.verified ? (
                            <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-[10px] text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" />
                              خرید تأیید شده
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-[10px] text-muted-foreground">
                              <HelpCircle className="h-3 w-3" />
                              پرسش پیش از خرید
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{timeAgo(r.createdAt)}</div>
                      </div>
                    </div>
                    {r.rating > 0 && (
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={i < r.rating ? "h-3.5 w-3.5 fill-amber-400 text-amber-400" : "h-3.5 w-3.5 text-muted-foreground"}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm leading-7 text-foreground/90">{r.comment}</p>
                  
                  {r.reply && (
                    <div className="mt-4 rounded-xl border border-primary/10 bg-primary/5 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-primary font-bold text-sm">
                          <Headset className="h-4 w-4" />
                          پاسخ پشتیبانی لایسنو:
                        </div>
                        {r.replyAt && (
                          <div className="text-xs text-muted-foreground">{timeAgo(r.replyAt)}</div>
                        )}
                      </div>
                      <p className="text-sm leading-7 text-foreground/90">{r.reply}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
