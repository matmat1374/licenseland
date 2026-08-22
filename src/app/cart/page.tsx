"use client";

import Link from "next/link";
import { useCart } from "@/store/cart";
import { ProductCover } from "@/components/site/product-cover";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, ShieldCheck, Tag } from "lucide-react";
import { toToman } from "@/lib/format";
import { useState } from "react";
import { toast } from "sonner";
import { useMounted } from "@/hooks/use-mounted";

export default function CartPage() {
  const { items, setQty, remove, subtotal, clear } = useCart();
  const mounted = useMounted();
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState("");

  const sub = mounted ? subtotal() : 0;
  const total = Math.max(0, sub - discount);

  async function applyCoupon() {
    if (!coupon.trim()) return;
    try {
      const res = await fetch(`/api/discount?code=${encodeURIComponent(coupon.trim())}&total=${sub}`);
      const data = await res.json();
      if (data.ok) {
        setDiscount(data.discount);
        setCouponApplied(coupon.trim());
        toast.success(`کد تخفیف اعمال شد: ${data.discount.toLocaleString("fa-IR")} تومان تخفیف`);
      } else {
        toast.error(data.message || "کد تخفیف نامعتبر است");
      }
    } catch {
      toast.error("خطا در بررسی کد تخفیف");
    }
  }

  if (mounted && items.length === 0) {
    return (
      <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 py-12 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="h-11 w-11 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-black">سبد خرید شما خالی است</h1>
          <p className="mt-2 text-muted-foreground">برای شروع، محصولات مورد علاقه‌تان را انتخاب کنید</p>
        </div>
        <Button asChild size="lg">
          <Link href="/shop">مشاهده محصولات</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-black">سبد خرید ({toToman(mounted ? items.length : 0)} مورد)</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* items */}
        <div className="lg:col-span-2">
          <div className="space-y-3">
            {items.map((item) => (
              <Card key={item.id} className="flex gap-3 p-3">
                <ProductCover
                  title={item.title}
                  brand={item.brand}
                  seed={item.slug}
                  className="h-20 w-20 shrink-0 rounded-xl"
                  size="sm"
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/product/${item.slug}`} className="line-clamp-2 text-sm font-bold hover:text-primary">
                      {item.title}
                    </Link>
                    <button
                      onClick={() => remove(item.id)}
                      className="text-muted-foreground hover:text-rose-500"
                      aria-label="حذف"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {item.duration && (
                    <span className="mt-0.5 text-xs text-muted-foreground">{item.duration}</span>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1 rounded-lg border">
                      <button
                        onClick={() => setQty(item.id, item.quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-r-lg hover:bg-accent"
                        aria-label="کاهش"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => setQty(item.id, item.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-l-lg hover:bg-accent"
                        aria-label="افزایش"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="text-left">
                      {item.discountPrice && (
                        <div className="text-xs text-muted-foreground line-through">
                          {toToman(item.price * item.quantity)}
                        </div>
                      )}
                      <div className="font-bold text-primary">
                        {toToman((item.discountPrice ?? item.price) * item.quantity)}
                        <span className="mr-1 text-[10px] text-muted-foreground">ت</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <Button asChild variant="ghost">
              <Link href="/shop"><ArrowLeft className="ml-1 h-4 w-4" /> ادامه خرید</Link>
            </Button>
            <Button variant="ghost" className="text-rose-500" onClick={() => { clear(); setDiscount(0); }}>
              <Trash2 className="ml-1 h-4 w-4" /> خالی کردن سبد
            </Button>
          </div>
        </div>

        {/* summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24 p-5">
            <h2 className="mb-4 font-bold">خلاصه سفارش</h2>

            {/* coupon */}
            <div className="mb-4">
              <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Tag className="h-3 w-3" /> کد تخفیف
              </label>
              <div className="flex gap-2">
                <Input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="مثلاً WELCOME10"
                  className="text-sm"
                />
                <Button variant="secondary" onClick={applyCoupon} disabled={!coupon.trim()}>
                  اعمال
                </Button>
              </div>
              {couponApplied && (
                <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                  ✓ کد «{couponApplied}» اعمال شد
                </p>
              )}
            </div>

            <Separator className="my-4" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">جمع کل</span>
                <span>{toToman(sub)} تومان</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>تخفیف</span>
                  <span>- {toToman(discount)} تومان</span>
                </div>
              )}
            </div>

            <Separator className="my-4" />

            <div className="flex items-center justify-between">
              <span className="font-bold">مبلغ نهایی</span>
              <div className="text-left">
                <span className="text-xl font-black text-primary">{toToman(total)}</span>
                <span className="mr-1 text-xs text-muted-foreground">تومان</span>
              </div>
            </div>

            <Button asChild size="lg" className="mt-4 w-full">
              <Link href={{ pathname: "/checkout", query: couponApplied ? { coupon: couponApplied } : {} }}>
                ادامه و پرداخت
              </Link>
            </Button>

            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              پرداخت امن از طریق درگاه زرین‌پال
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
