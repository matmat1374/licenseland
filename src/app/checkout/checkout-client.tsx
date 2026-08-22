"use client";

import { useCart } from "@/store/cart";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ProductCover } from "@/components/site/product-cover";
import {
  ShieldCheck,
  CreditCard,
  Loader2,
  Lock,
  Mail,
  Phone,
  User as UserIcon,
  LogIn,
  Tag,
  CheckCircle2,
} from "lucide-react";
import { toToman } from "@/lib/format";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { useMounted } from "@/hooks/use-mounted";

export function CheckoutClient({ coupon = "" }: { coupon?: string }) {
  const { items, subtotal } = useCart();
  const { data: session } = useSession();
  const router = useRouter();
  
  

  const mounted = useMounted();
  const [loading, setLoading] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [prevSessionEmail, setPrevSessionEmail] = useState<string | null | undefined>(null);

  // Prefill from session (render-time state adjustment — lint clean, no refs)
  const sessionEmail = session?.user?.email;
  if (sessionEmail && sessionEmail !== prevSessionEmail) {
    setPrevSessionEmail(sessionEmail);
    if (!form.email) {
      const sessionName = session?.user?.name || "";
      setForm((f) => ({ name: f.name || sessionName, email: sessionEmail, phone: f.phone }));
    }
  }

  // validate coupon
  useEffect(() => {
    if (!coupon || !mounted) return;
    fetch(`/api/discount?code=${encodeURIComponent(coupon)}&total=${subtotal()}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setDiscount(d.discount);
        else setDiscount(0);
      })
      .catch(() => setDiscount(0));
  }, [coupon, mounted, subtotal]);

  const sub = mounted ? subtotal() : 0;
  const total = Math.max(0, sub - discount);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!items.length) return toast.error("سبد خرید خالی است");

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      return toast.error("لطفاً تمام فیلدها را تکمیل کنید");
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
    if (!emailOk) return toast.error("ایمیل معتبر نیست");
    const phoneOk = /^09\d{9}$/.test(form.phone.replace(/\s/g, ""));
    if (!phoneOk) return toast.error("شماره موبایل معتبر نیست (مثال: 09123456789)");

    setLoading(true);
    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            id: i.id,
            slug: i.slug,
            title: i.title,
            price: i.discountPrice ?? i.price,
            quantity: i.quantity,
            duration: i.duration,
          })),
          customer: form,
          coupon: coupon || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.message || "خطا در ایجاد سفارش");
        setLoading(false);
        return;
      }
      // redirect to payment
      window.location.href = data.paymentUrl;
    } catch {
      toast.error("ارتباط با سرور برقرار نشد");
      setLoading(false);
    }
  }

  if (mounted && items.length === 0) {
    return (
      <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg font-bold">سبد خرید شما خالی است</p>
        <Button asChild><Link href="/shop">مشاهده محصولات</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-black">تسویه حساب</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* form */}
        <div className="lg:col-span-2">
          {!session?.user && (
            <Card className="mb-4 flex items-center justify-between gap-3 border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center gap-2 text-sm">
                <LogIn className="h-4 w-4 text-primary" />
                <span>برای پیگیری سفارش‌تان وارد حساب کاربری شوید (اختیاری)</span>
              </div>
              <Button asChild size="sm" variant="secondary">
                <Link href="/login?callbackUrl=/checkout">ورود</Link>
              </Button>
            </Card>
          )}

          <Card className="p-5">
            <h2 className="mb-4 flex items-center gap-2 font-bold">
              <UserIcon className="h-4 w-4 text-primary" />
              اطلاعات تماس
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">نام و نام خانوادگی</Label>
                  <div className="relative">
                    <UserIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="مثال: علی محمدی"
                      className="pr-9"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">شماره موبایل</Label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="09123456789"
                      className="pr-9"
                      dir="ltr"
                      inputMode="tel"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">ایمیل</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    className="pr-9"
                    dir="ltr"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  لایسنس و رسید خرید به این ایمیل ارسال می‌شود.
                </p>
              </div>

              <div className="rounded-xl border bg-muted/30 p-4">
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span className="text-muted-foreground">
                    با کلیک روی «پرداخت»، شما{" "}
                    <Link href="/terms" className="text-primary hover:underline">قوانین و مقررات</Link>{" "}
                    سایت را می‌پذیرید. پرداخت از طریق درگاه امن زرین‌پال انجام می‌شود.
                  </span>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> در حال اتصال به درگاه...</>
                ) : (
                  <><CreditCard className="h-4 w-4" /> پرداخت {toToman(total)} تومان</>
                )}
              </Button>
            </form>
          </Card>
        </div>

        {/* summary */}
        <div>
          <Card className="sticky top-24 p-5">
            <h2 className="mb-4 font-bold">خلاصه سفارش</h2>
            <div className="max-h-64 space-y-3 overflow-y-auto pl-1">
              {(mounted ? items : []).map((item) => (
                <div key={item.id} className="flex gap-2.5">
                  <ProductCover
                    title={item.title}
                    seed={item.slug}
                    className="h-12 w-12 shrink-0 rounded-lg"
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-1 text-xs font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.quantity} × {toToman(item.discountPrice ?? item.price)}</div>
                  </div>
                  <div className="text-xs font-bold">
                    {toToman((item.discountPrice ?? item.price) * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            {coupon && (
              <div className="mb-3 flex items-center justify-between rounded-lg bg-emerald-500/10 px-3 py-2 text-xs">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Tag className="h-3 w-3" /> کد {coupon}
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">- {toToman(discount)}</span>
              </div>
            )}

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">جمع کل</span>
                <span>{toToman(sub)} ت</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>تخفیف</span>
                  <span>- {toToman(discount)} ت</span>
                </div>
              )}
            </div>
            <Separator className="my-3" />
            <div className="flex items-center justify-between">
              <span className="font-bold">مبلغ نهایی</span>
              <div className="text-left">
                <span className="text-xl font-black text-primary">{toToman(total)}</span>
                <span className="mr-1 text-xs text-muted-foreground">ت</span>
              </div>
            </div>

            <div className="mt-4 space-y-2 rounded-xl bg-muted/30 p-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> پرداخت امن و رمزنگاری‌شده</div>
              <div className="flex items-center gap-2"><Lock className="h-3.5 w-3.5 text-emerald-500" /> اطلاعات شما محفوظ است</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
