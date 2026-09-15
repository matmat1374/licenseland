import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { KeyRound, ShieldCheck, ArrowLeft, MessageSquareLock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "بازیابی رمز عبور",
  description: "راهنمای بازیابی دسترسی به حساب کاربری لایسنو با کد یکبارمصرف پیامکی.",
  robots: { index: false, follow: true },
};

export default function ForgotPasswordPage() {
  return (
    <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8 shadow-xl border-border/60">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground shadow-md">
            <MessageSquareLock className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">بازیابی دسترسی به حساب</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            رمز عبور خود را فراموش کرده‌اید؟ نگران نباشید.
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm leading-7 text-muted-foreground">
            <p className="mb-2 flex items-center gap-1.5 font-bold text-foreground">
              <KeyRound className="h-4 w-4 text-primary" />
              سریع‌ترین راه ورود مجدد:
            </p>
            <p>
              کافیست با شماره موبایل خود <b className="text-foreground">کد یکبارمصرف پیامکی</b> دریافت
              کنید و بدون رمز عبور وارد حساب شوید. تمام سفارش‌ها و لایسنس‌های شما دقیقاً همان‌طور که
              هستند در دسترس خواهند بود.
            </p>
          </div>

          <Button asChild size="lg" className="w-full gap-2">
            <Link href="/login?tab=otp">
              <ShieldCheck className="h-4 w-4" />
              ورود با کد پیامکی (بدون رمز)
            </Link>
          </Button>

          <div className="rounded-xl border bg-muted/30 p-4 text-xs leading-6 text-muted-foreground">
            <p className="mb-1 font-bold text-foreground">شماره موبایل شما عوض شده است؟</p>
            <p>
              از طریق{" "}
              <a href="/contact" className="font-medium text-primary hover:underline">
                صفحه راهنما و پشتیبانی
              </a>{" "}
              یا تلگرام پشتیبانی درخواست بازیابی بدهید؛ پس از احراز هویت، دسترسی حساب شما بازگردانده
              می‌شود.
            </p>
          </div>

          <Button asChild variant="ghost" className="w-full gap-2 text-sm">
            <Link href="/login">
              <ArrowLeft className="h-4 w-4" />
              بازگشت به صفحه ورود
            </Link>
          </Button>
        </div>

        <p className="mt-6 flex items-center justify-center gap-1 border-t border-border/50 pt-5 text-center text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3 w-3 text-emerald-500" />
          حساب شما با کد یکبارمصرف محافظت می‌شود.
        </p>
      </Card>
    </div>
  );
}
