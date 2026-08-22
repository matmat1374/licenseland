"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User as UserIcon, Mail, Phone, Lock, Loader2, Save, ShieldCheck, KeyRound, IdCard } from "lucide-react";
import { toast } from "sonner";
import { formatJalaliDate } from "@/lib/date";

interface ProfileData {
  name: string | null;
  email: string | null;
  phone: string | null;
  nationalId: string | null;
  avatar: string | null;
  role: string;
  createdAt: string;
}

export function ProfileEditor({ user }: { user: ProfileData }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    nationalId: user.nationalId || "",
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) toast.error(data.message || "خطا در به‌روزرسانی");
      else toast.success(data.message || "ذخیره شد");
    } catch {
      toast.error("ارتباط با سرور برقرار نشد");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-bold">
            <UserIcon className="h-4 w-4 text-primary" />
            اطلاعات حساب کاربری
          </h3>
          <span className="text-xs text-muted-foreground">
            عضو از {formatJalaliDate(user.createdAt)}
          </span>
        </div>

        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">نام و نام خانوادگی</Label>
              <div className="relative">
                <UserIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="pr-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">شماره موبایل</Label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="phone" dir="ltr" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="pr-9" />
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="email">ایمیل</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="pr-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nationalId">کد ملی (اختیاری)</Label>
              <div className="relative">
                <IdCard className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="nationalId" dir="ltr" inputMode="numeric" value={form.nationalId} onChange={(e) => setForm({ ...form, nationalId: e.target.value })} placeholder="۱۰ رقم" className="pr-9" />
              </div>
            </div>
          </div>

          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            ذخیره تغییرات
          </Button>
        </form>
      </Card>

      <PasswordChanger />
    </div>
  );
}

function PasswordChanger() {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword)
      return toast.error("تکرار رمز جدید مطابقت ندارد");
    setSaving(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) toast.error(data.message || "خطا");
      else {
        toast.success(data.message || "رمز تغییر کرد");
        setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch {
      toast.error("ارتباط با سرور برقرار نشد");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-6">
      <h3 className="mb-1 flex items-center gap-2 font-bold">
        <KeyRound className="h-4 w-4 text-primary" />
        تغییر رمز عبور
      </h3>
      <p className="mb-4 text-xs text-muted-foreground">برای امنیت بیشتر، رمز خود را به‌صورت دوره‌ای تغییر دهید</p>

      <form onSubmit={save} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="cur">رمز عبور فعلی</Label>
          <div className="relative">
            <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="cur" type="password" dir="ltr" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} className="pr-9" required />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="new">رمز عبور جدید</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="new" type="password" dir="ltr" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} className="pr-9" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="conf">تکرار رمز جدید</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="conf" type="password" dir="ltr" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className="pr-9" required />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          رمز عبور باید حداقل ۶ کاراکتر باشد و شامل حروف و اعداد باشد.
        </div>

        <Button type="submit" variant="outline" disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          تغییر رمز
        </Button>
      </form>
    </Card>
  );
}
