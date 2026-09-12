"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { signIn, getSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Phone,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
  ArrowLeft,
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  Clock,
  RotateCw,
} from "lucide-react";
import { toast } from "sonner";
import { SITE } from "@/lib/constants";
import { normalizePersianDigits } from "@/lib/format";
import { toFa } from "@/lib/date";

function LoginContent() {
  const params = useSearchParams();
  const callbackParam = params.get("callbackUrl");

  // Tabs state: "otp" or "password"
  const [activeTab, setActiveTab] = useState<string>("otp");

  // Password state
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  // OTP state
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otpLoading, setOtpLoading] = useState(false);
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

  // Redirect helper
  const handleRedirectAfterLogin = async () => {
    try {
      const session = await getSession();
      const target =
        callbackParam ||
        (session?.user?.role === "ADMIN" ? "/admin" : "/dashboard");
      window.location.href = target;
    } catch {
      window.location.href = callbackParam || "/dashboard";
    }
  };

  // Password Login Handler
  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    const cleanId = normalizePersianDigits(identifier.trim());
    if (!cleanId) return toast.error("شماره موبایل یا ایمیل را وارد کنید");
    if (!password) return toast.error("رمز عبور را وارد کنید");

    setPwLoading(true);
    try {
      const res = await signIn("credentials", {
        identifier: cleanId,
        password,
        redirect: false,
      });

      if (res?.error) {
        toast.error("شماره، ایمیل یا رمز عبور اشتباه است");
        setPwLoading(false);
        return;
      }

      toast.success("ورود موفقیت‌آمیز بود");
      await handleRedirectAfterLogin();
    } catch (err) {
      toast.error("خطا در برقراری ارتباط با سرور");
      setPwLoading(false);
    }
  }

  // OTP Send Handler
  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!phone) return toast.error("شماره موبایل را وارد کنید");
    const normalizedPhone = normalizePersianDigits(phone.replace(/\s/g, ""));
    if (!/^09\d{9}$/.test(normalizedPhone))
      return toast.error("شماره موبایل باید با 09 شروع شود و ۱۱ رقم باشد");

    setPhone(normalizedPhone);
    setOtpLoading(true);

    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "خطا در ارسال کد");
        setOtpLoading(false);
        return;
      }

      setOtpLoading(false);
      setStep("otp");
      setCountdown(120);
      toast.success(data.message || "کد تأیید ارسال شد");
    } catch {
      toast.error("خطا در برقراری ارتباط با سرور");
      setOtpLoading(false);
    }
  }

  // OTP Resend Handler
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

  // OTP Verify Handler
  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) return toast.error("کد باید ۶ رقمی باشد");
    setOtpLoading(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "کد تأیید نامعتبر یا منقضی شده است");
        setOtpLoading(false);
        return;
      }

      const r = await signIn("credentials", {
        identifier: phone,
        password: data.sessionPassword,
        redirect: false,
      });

      if (r?.error) {
        toast.error("خطا در ورود به حساب");
        setOtpLoading(false);
        return;
      }

      toast.success("خوش آمدید!");
      await handleRedirectAfterLogin();
    } catch {
      toast.error("خطا در ارتباط با سرور");
      setOtpLoading(false);
    }
  }

  return (
    <div className="container mx-auto flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8 shadow-xl border-border/60">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground shadow-md">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">ورود به حساب کاربری</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            برای دسترسی به پنل کاربری یا سفارش‌ها وارد شوید
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="otp" className="text-xs sm:text-sm">
              ورود با پیامک (کد یکبار مصرف)
            </TabsTrigger>
            <TabsTrigger value="password" className="text-xs sm:text-sm">
              ورود با رمز عبور
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: OTP LOGIN */}
          <TabsContent value="otp" className="space-y-4">
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
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full gap-2 mt-2"
                  disabled={otpLoading}
                >
                  {otpLoading ? (
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
                          normalizePersianDigits(e.target.value).replace(
                            /\D/g,
                            ""
                          )
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
                  disabled={otpLoading || otp.length !== 6}
                >
                  {otpLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  تأیید و ورود
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
          </TabsContent>

          {/* TAB 2: PASSWORD LOGIN */}
          <TabsContent value="password" className="space-y-4">
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="identifier">شماره موبایل یا ایمیل</Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="identifier"
                    dir="ltr"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="09121145687 یا email@example.com"
                    className="pr-9 font-sans"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">رمز عبور</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    فراموشی رمز؟
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    dir="ltr"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pr-9 pl-10"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full gap-2 mt-2"
                disabled={pwLoading}
              >
                {pwLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                ورود به حساب
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="mt-6 pt-5 border-t border-border/50 text-center">
          <p className="text-sm text-muted-foreground">
            حساب کاربری ندارید؟{" "}
            <Link
              href="/register"
              className="font-semibold text-primary hover:underline"
            >
              ثبت‌نام سریع
            </Link>
          </p>
          <p className="mt-3 flex items-center justify-center gap-1 text-center text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3 text-emerald-500" />
            با ورود، <Link href="/terms" className="underline hover:text-foreground">قوانین</Link> {SITE.name} را می‌پذیرید.
          </p>
        </div>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[80vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
