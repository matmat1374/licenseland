"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Loader2, CheckCircle2, ShieldCheck, KeyRound, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { SITE } from "@/lib/constants";

const TEST_OTP = "123456";
const IS_DEV = process.env.NODE_ENV !== "production";

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/dashboard";
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!phone) return toast.error("شماره موبایل را وارد کنید");
    if (!/^09\d{9}$/.test(phone.replace(/\s/g, "")))
      return toast.error("شماره موبایل باید با 09 شروع شود و ۱۱ رقم باشد");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setLoading(false);
    setStep("otp");
    if (IS_DEV) toast.success(`کد تستی ارسال شد: ${TEST_OTP}`);
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp !== TEST_OTP) return toast.error("کد اشتباه است (کد تستی: ۱۲۳۴۵۶)");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "خطا");
        setLoading(false);
        return;
      }
      // Sign in with credentials (password was set to TEST_OTP by the API)
      const r = await signIn("credentials", {
        identifier: phone,
        password: "123456",
        redirect: false,
      });
      setLoading(false);
      if (r?.error) {
        toast.error("خطا در ورود");
      } else {
        toast.success("خوش آمدید!");
        window.location.href = callbackUrl;
      }
    } catch {
      toast.error("ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black">ورود به حساب</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {step === "phone" ? "شماره موبایل خود را وارد کنید" : "کد تأیید را وارد کنید"}
          </p>
        </div>

        {step === "phone" ? (
          <form onSubmit={sendOtp} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">شماره موبایل</Label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone" dir="ltr" inputMode="tel"
                  value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="09123456789" className="pr-9" required
                />
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              ارسال کد تأیید
            </Button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-4">
            <div className="rounded-lg bg-emerald-500/10 p-3 text-center text-sm">
              <p className="font-medium text-emerald-700 dark:text-emerald-400">
                کد تستی: <span dir="ltr" className="font-bold text-lg">{TEST_OTP}</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">(در محیط واقعی، کد به شماره شما پیامک می‌شود)</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="otp">کد تأیید ۶ رقمی</Label>
              <div className="relative">
                <KeyRound className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="otp" dir="ltr" inputMode="numeric" maxLength={6}
                  value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="------" className="pr-9 text-center text-2xl tracking-[0.5em]" required
                />
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full gap-2" disabled={loading || otp.length !== 6}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              تأیید و ورود
            </Button>
            <button type="button" onClick={() => { setStep("phone"); setOtp(""); }}
              className="w-full text-sm text-muted-foreground hover:text-foreground">
              ← تغییر شماره موبایل
            </button>
          </form>
        )}

        <p className="mt-5 text-center text-sm text-muted-foreground">
          حساب ندارید؟{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">ثبت‌نام</Link>
        </p>
        <p className="mt-3 flex items-center justify-center gap-1 text-center text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3 w-3" />
          با ورود، <Link href="/terms" className="underline">قوانین</Link> {SITE.name} را می‌پذیرید.
        </p>
        <div className="mt-4 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">حساب مدیریت:</span>{" "}
          شماره <span dir="ltr">09100000000</span> با کد تستی
        </div>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[80vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
