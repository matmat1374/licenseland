"use client";

import Link from "next/link";
import {
  Send,
  Instagram,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Zap,
  Headphones,
  BadgePercent,
  CreditCard,
} from "lucide-react";
import { SITE, CATEGORIES, NAV_LINKS } from "@/lib/constants";
import * as Icons from "lucide-react";

const trustItems = [
  { icon: Zap, title: "تحویل آنی", desc: "خودکار و فوری" },
  { icon: ShieldCheck, title: "ضمانت اصالت", desc: "۱۰۰٪ اوریجینال" },
  { icon: Headphones, title: "پشتیبانی ۲۴/۷", desc: "همیشه در دسترس" },
  { icon: BadgePercent, title: "بهترین قیمت", desc: "تضمین ارزان‌ترین" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-card/50">
      {/* trust strip */}
      <div className="border-b">
        <div className="container mx-auto grid grid-cols-2 gap-4 px-4 py-8 md:grid-cols-4">
          {trustItems.map((t) => (
            <div key={t.title} className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <t.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold">{t.title}</div>
                <div className="text-xs text-muted-foreground">{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* main */}
      <div className="container mx-auto grid grid-cols-2 gap-8 px-4 py-12 md:grid-cols-4 lg:grid-cols-5">
        {/* brand */}
        <div className="col-span-2 lg:col-span-2">
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-emerald-500 to-teal-600 p-[1px] shadow-lg shadow-emerald-500/20 transition-transform group-hover:scale-105">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/40 to-transparent opacity-50 mix-blend-overlay blur-[2px]" />
              <div className="relative flex h-full w-full items-center justify-center rounded-[15px] bg-background/90 backdrop-blur-xl">
                <div className="absolute inset-0 rounded-[15px] bg-gradient-to-tr from-emerald-500/10 to-amber-500/10" />
                <Icons.KeyRound className="h-6 w-6 rotate-45 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all group-hover:rotate-0" />
              </div>
            </div>
            <div>
              <div className="text-xl font-black tracking-tight text-foreground">
                لایسـنـو
              </div>
              <div className="text-[10px] font-bold tracking-widest text-muted-foreground">
                LICENO <span className="text-emerald-500">•</span> LEGAL STORE
              </div>
            </div>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-7 text-muted-foreground">
            {SITE.description}
          </p>
          <div className="mt-5 flex items-center gap-2">
            <a
              href={SITE.telegram}
              target="_blank"
              rel="noreferrer"
              aria-label="تلگرام"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <Send className="h-4 w-4" />
            </a>
            <a
              href={SITE.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="اینستاگرام"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href={SITE.whatsapp}
              target="_blank"
              rel="noreferrer"
              aria-label="واتساپ"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <Phone className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* categories */}
        <div>
          <h4 className="mb-4 text-sm font-bold">دسته‌بندی‌ها</h4>
          <ul className="space-y-2.5 text-sm">
            {CATEGORIES.map((c) => {
              const Icon = (Icons as any)[c.icon] || Icons.Folder;
              return (
                <li key={c.slug}>
                  <Link
                    href={`/shop?cat=${c.slug}`}
                    className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {c.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* quick links */}
        <div>
          <h4 className="mb-4 text-sm font-bold">دسترسی سریع</h4>
          <ul className="space-y-2.5 text-sm">
            {NAV_LINKS.filter((l) => l.href !== "/").map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-muted-foreground transition-colors hover:text-primary">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/about" className="text-muted-foreground transition-colors hover:text-primary">
                درباره ما
              </Link>
            </li>
          </ul>
        </div>

        {/* contact */}
        <div>
          <h4 className="mb-4 text-sm font-bold">تماس با ما</h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <span dir="ltr">تلفن: {SITE.phone}</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <span dir="ltr">موبایل: {(SITE as any).mobile || "۰۹۱۲۱۱۴۵۶۸۷"}</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <span dir="ltr">{SITE.email}</span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>{SITE.address}</span>
            </li>
          </ul>
          <div className="mt-4 flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-2 text-xs text-muted-foreground">
            <CreditCard className="h-4 w-4 text-emerald-500" />
            پرداخت امن با درگاه زرین‌پال
          </div>
        </div>
      </div>

      {/* bottom */}
      <div className="border-t">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-muted-foreground md:flex-row">
          <p>
            © {new Date().getFullYear()} {SITE.name} — تمامی حقوق محفوظ است.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-primary">قوانین و مقررات</Link>
            <Link href="/privacy" className="hover:text-primary">حریم خصوصی</Link>
            <Link href="/sitemap.xml" className="hover:text-primary">نقشه سایت</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
