"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send, Mail, Phone, MapPin, MessageCircle, Loader2 } from "lucide-react";
import { SITE } from "@/lib/constants";
import { toast } from "sonner";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return toast.error("لطفاً فیلدها را تکمیل کنید");
    setLoading(true);
    // simulate (no backend email in demo)
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    toast.success("پیام شما دریافت شد. به‌زودی پاسخ می‌دهیم.");
    setForm({ name: "", email: "", subject: "", message: "" });
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black">تماس با ما</h1>
          <p className="mt-2 text-muted-foreground">هر سوال یا پیشنهادی دارید، خوشحال می‌شویم بشنویم</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* info */}
          <div className="space-y-3">
            {[
              { icon: Phone, label: "تلفن", value: SITE.phone, href: `tel:${SITE.phone}`, ltr: true },
              { icon: Mail, label: "ایمیل", value: SITE.email, href: `mailto:${SITE.email}`, ltr: true },
              { icon: MapPin, label: "آدرس", value: SITE.address },
              { icon: MessageCircle, label: "تلگرام", value: "@licenseland", href: SITE.telegram, ltr: true },
            ].map((c) => (
              <Card key={c.label} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <c.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">{c.label}</div>
                    {c.href ? (
                      <a href={c.href} className="block truncate text-sm font-medium hover:text-primary" dir={c.ltr ? "ltr" : undefined}>{c.value}</a>
                    ) : (
                      <div className="text-sm font-medium">{c.value}</div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* form */}
          <Card className="p-6 md:col-span-2">
            <form onSubmit={submit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">نام</Label>
                  <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="نام شما" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">ایمیل</Label>
                  <Input id="email" type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subject">موضوع</Label>
                <Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="موضوع پیام" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message">پیام</Label>
                <Textarea id="message" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="پیام خود را بنویسید..." />
              </div>
              <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                ارسال پیام
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
