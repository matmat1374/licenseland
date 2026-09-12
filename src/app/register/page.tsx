"use client";

import { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Phone,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
  ArrowLeft,
  Clock,
  RotateCw,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { SITE } from "@/lib/constants";
import { normalizePersianDigits } from "@/lib/format";
import { toFa } from "@/lib/date";

export default function RegisterPage() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);

  const otpInputRef = useRef<HTMLInputElement>(null);

  // Countdown timer effect
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Focus OTP input when switching to OTP step
  useEffect(() => {
    if (step === "otp") {
      const timeout = setTimeout(() => {
        otpInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [step]);

  // Format mm:ss in Persian digits
  const formatCountdown = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    const str = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return toFa(str);
  };

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!phone) return toast.error("شماره موبایل را وارد کنید");
    const normalizedPhone = normalizePersianDigits(phone.replace(/\s/g, ""));
    if (!/^09\d{9}$/.test(normalizedPhone))
      return toast.error("شماره موبایل باید با 09 شروع شود و ۱۱ رقم باشد");

    setPhone(normalizedPhone);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "خطا در ارسال کد");
        setLoading(false);
        return;
      }

      setLoading(false);
      setStep("otp");
      setCountdown(120);
      toast.success(data.message || "کد تأیید ارسال شد");
    } catch {
      toast.error("خطا در برقراری ارتباط با سرور");
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (countdown > 0 || resending) return;
    setResending(true);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "خطا در ارسال مجدد کد");
        return;
      }
      setCountdown(120);
      toast.success(data.message || "کد تأیید جدید ارسال شد");
    } catch {
      toast.error("خطا در برقراری ارتباط با سرور");
    } finally {
      setResending(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) return toast.error("کد باید ۶ رقمی باشد");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "کد تأیید نامعتبر یا منقضی شده است");
        setLoading(false);
        return;
      }
      const r = await signIn("credentials", {
        identifier: phone,
        password: data.sessionPassword,
        redirect: false,
      });
      setLoading(false);
      if (r?.error) {
        toast.error("خطا در ورود به حساب");
      } else {
        toast.success("خوش آمدید! ثبت‌نام با موفقیت انجام شد");
        window.location.href = "/dashboard";
      }
    } catch {
      toast.error("خطا در ارتباط با سرور");
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8 shadow-xl border-border/60">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground shadow-md">
            <UserPlus className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">ثبت‌نام در {SITE.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {step === "phone"
              ? "شماره موبایل خود را برای عضویت وارد کنید"
              : "کد تأیید ارسال‌شده را وارد کنید"}
          </p>
        </div>

        {step === "phone" ? (
          <form onSubmit={sendOtp} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">شماره موبایل</Label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone"
                  dir="ltr"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09123456789"
                  className="pr-9 font-sans"
                  required
                  autoComplete="tel"
                  autoFocus
                />
              </div>
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full gap-2 mt-2"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowLeft className="h-4 w-4" />
              )}
              ارسال کد تأیید
            </Button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="otp">کد تأیید ۶ رقمی</Label>
                <span className="text-xs text-muted-foreground" dir="ltr">
                  {phone}
                </span>
              </div>
              <div className="relative">
                <KeyRound className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={otpInputRef}
                  id="otp"
                  dir="ltr"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) =>
                    setOtp(
                      normalizePersianDigits(e.target.value).replace(/\D/g, "")
                    )
                  }
                  placeholder="------"
                  className="pr-9 text-center text-2xl tracking-[0.5em] font-mono"
                  required
                  autoComplete="one-time-code"
                  autoFocus
                />
              </div>
            </div>

            {/* Countdown / Resend UI */}
            <div className="py-1">
              {countdown > 0 ? (
                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>ارسال مجدد کد تا {formatCountdown(countdown)} دیگر</span>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResendOtp}
                  disabled={resending}
                  className="w-full text-xs text-primary hover:text-primary/80 gap-1.5 h-8"
                >
                  {resending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCw className="h-3.5 w-3.5" />
                  )}
                  ارسال مجدد کد تأیید
                </Button>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full gap-2 mt-2"
              disabled={loading || otp.length !== 6}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              تأیید و ساخت حساب
            </Button>
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setOtp("");
                setCountdown(0);
              }}
              className="w-full text-sm text-muted-foreground hover:text-foreground text-center pt-1"
            >
              ← ویرایش شماره موبایل ({phone})
            </button>
          </form>
        )}

        {/* Cross link to Login */}
        <div className="mt-6 pt-5 border-t border-border/50 text-center">
          <p className="text-sm text-muted-foreground">
            قبلاً حساب کاربری دارید؟{" "}
            <Link
              href="/login"
              className="font-semibold text-primary hover:underline"
            >
              ورود به حساب
            </Link>
          </p>
          <p className="mt-3 flex items-center justify-center gap-1 text-center text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3 text-emerald-500" />
            با ثبت‌نام،{" "}
            <Link href="/terms" className="underline hover:text-foreground">
              قوانین
            </Link>{" "}
            {SITE.name} را می‌پذیرید.
          </p>
        </div>
      </Card>
    </div>
  );
}
