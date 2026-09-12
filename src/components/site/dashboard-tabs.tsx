"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Package,
  KeyRound,
  User as UserIcon,
  ChevronLeft,
  Copy,
  Check,
  ShoppingBag,
  Mail,
  Phone,
  Calendar,
  LogOut,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatJalaliDate, toFa } from "@/lib/date";
import { toToman } from "@/lib/format";
import { ProfileEditor } from "@/components/site/profile-editor";

interface OrderItem {
  id: string;
  productTitle: string;
  productSlug: string;
  quantity: number;
  price: number;
  licenses: { id: string; key: string; note: string | null }[];
}

interface Order {
  id: string;
  code: string;
  status: string;
  total: number;
  createdAt: string;
  paidAt: string | null;
  items: OrderItem[];
}

interface License {
  id: string;
  key: string;
  note: string | null;
  productTitle: string;
  orderCode: string;
  date: string;
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  nationalId: string | null;
  avatar: string | null;
  role: string;
  createdAt: string;
}

const STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any; className?: string }
> = {
  PAID: {
    label: "پرداخت شده",
    variant: "default",
    icon: CheckCircle2,
    className: "bg-emerald-500 hover:bg-emerald-600 text-white border-transparent",
  },
  PENDING: {
    label: "در انتظار پرداخت",
    variant: "secondary",
    icon: Clock,
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
  FAILED: {
    label: "پرداخت ناموفق",
    variant: "destructive",
    icon: XCircle,
    className: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/20",
  },
  CANCELLED: {
    label: "لغو شده",
    variant: "outline",
    icon: AlertCircle,
    className: "text-muted-foreground",
  },
};

export function DashboardTabs({
  tab,
  orders,
  licenses,
  user,
}: {
  tab: string;
  orders: Order[];
  licenses: License[];
  user: User | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showProfileBanner, setShowProfileBanner] = useState(true);

  const needsProfileCompletion = !user?.name?.trim() || !user?.email || user.email.endsWith("@liceno.ir");

  function setTab(t: string) {
    window.location.href = `${pathname}?tab=${t}`;
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await signOut({ redirect: false });
      toast.success("با موفقیت خارج شدید");
      window.location.href = "/";
    } catch {
      toast.error("خطا در خروج از حساب");
      setLoggingOut(false);
    }
  }

  return (
    <div>
      {/* Friendly banner to complete profile optionally */}
      {needsProfileCompletion && showProfileBanner && (
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 sm:p-5 shadow-xs">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">تکمیل اختیاری اطلاعات حساب</h4>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                برای دریافت فاکتور و اطلاع‌رسانی لایسنس‌ها، می‌توانید در صورت تمایل اطلاعات خود (نام و ایمیل) را در بخش پروفایل تکمیل کنید (اختیاری).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <Button
              type="button"
              size="sm"
              onClick={() => setTab("profile")}
              className="gap-1.5 text-xs font-bold shadow-xs"
            >
              <UserIcon className="h-3.5 w-3.5" />
              تکمیل پروفایل
            </Button>
            <button
              type="button"
              onClick={() => setShowProfileBanner(false)}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
              title="بستن اعلان"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6 grid w-full grid-cols-3 h-11">
        <TabsTrigger value="overview" className="gap-2 text-sm font-medium">
          <Package className="h-4 w-4" />
          <span>سفارش‌ها</span>
          {orders.length > 0 && (
            <span className="mr-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary font-bold">
              {toFa(orders.length)}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="licenses" className="gap-2 text-sm font-medium">
          <KeyRound className="h-4 w-4" />
          <span>لایسنس‌ها</span>
          {licenses.length > 0 && (
            <span className="mr-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary font-bold">
              {toFa(licenses.length)}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="profile" className="gap-2 text-sm font-medium">
          <UserIcon className="h-4 w-4" />
          <span>پروفایل و امنیت</span>
        </TabsTrigger>
      </TabsList>

      {/* 1. ORDERS TAB */}
      <TabsContent value="overview" className="space-y-4">
        {orders.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="هنوز سفارشی ثبت نکرده‌اید"
            desc="محصولات متنوع و لایسنس‌های اورجینال را مشاهده کنید و اولین سفارش خود را ثبت نمایید."
            cta={{ href: "/shop", label: "مشاهده محصولات / خرید لایسنس" }}
          />
        ) : (
          <div className="space-y-3">
            {orders.map((o) => {
              const st = STATUS_MAP[o.status] || STATUS_MAP.PENDING;
              const StatusIcon = st.icon;
              return (
                <Card
                  key={o.id}
                  className="p-5 transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Package className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold tracking-wider" dir="ltr">
                            {o.code}
                          </span>
                          <Badge
                            variant={st.variant}
                            className={`flex items-center gap-1 text-xs px-2.5 py-0.5 ${st.className || ""}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {st.label}
                          </Badge>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                          <span>{formatJalaliDate(o.createdAt, true)}</span>
                          <span>•</span>
                          <span>{toFa(o.items.length)} قلم کالا</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-left">
                      <div>
                        <div className="text-xs text-muted-foreground">مبلغ پرداختی</div>
                        <div className="font-black text-lg text-primary">
                          {toToman(o.total)} <span className="text-xs font-normal">تومان</span>
                        </div>
                      </div>
                      <Button asChild size="sm" variant="outline" className="gap-1 px-3">
                        <Link href={`/order/${o.id}`}>
                          جزئیات <ChevronLeft className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </TabsContent>

      {/* 2. LICENSES TAB */}
      <TabsContent value="licenses" className="space-y-4">
        {licenses.length === 0 ? (
          <EmptyState
            icon={KeyRound}
            title="هیچ لایسنسی ثبت نشده است"
            desc="پس از تکمیل سفارش و پرداخت موفق، لایسنس‌های خریداری‌شده فوراً در این بخش نمایش داده می‌شوند."
            cta={{ href: "/shop", label: "مشاهده محصولات / خرید لایسنس" }}
          />
        ) : (
          <div className="space-y-3">
            {licenses.map((l) => (
              <LicenseRow key={l.id} license={l} />
            ))}
          </div>
        )}
      </TabsContent>

      {/* 3. PROFILE TAB */}
      <TabsContent value="profile">
        {user && (
          <div className="mx-auto max-w-3xl space-y-6">
            <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-600 text-2xl font-black text-primary-foreground shadow-md font-mono">
                  {user.name?.trim() ? user.name.trim()[0].toUpperCase() : (user.phone ? user.phone.slice(-2) : "U")}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{user.name?.trim() || user.phone || "کاربر گرامی"}</span>
                    {user.role === "ADMIN" ? (
                      <Badge className="bg-primary text-primary-foreground">مدیر سیستم</Badge>
                    ) : (
                      <Badge variant="secondary">کاربر</Badge>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {user.phone && (
                      <span className="flex items-center gap-1" dir="ltr">
                        <Phone className="h-3.5 w-3.5 text-primary" /> {user.phone}
                      </span>
                    )}
                    {user.email && !user.email.endsWith("@liceno.ir") && (
                      <span className="flex items-center gap-1" dir="ltr">
                        <Mail className="h-3.5 w-3.5 text-primary" /> {user.email}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-primary" /> عضو از {formatJalaliDate(user.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                disabled={loggingOut}
                className="gap-1.5 shrink-0"
              >
                {loggingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                <span>خروج از حساب</span>
              </Button>
            </Card>

            <ProfileEditor user={user} />
          </div>
        )}
      </TabsContent>
    </Tabs>
    </div>
  );
}

function LicenseRow({ license }: { license: License }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(license.key);
    setCopied(true);
    toast.success("کد لایسنس در کلیپ‌بورد کپی شد");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="p-4 transition-all hover:border-primary/40 hover:shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <KeyRound className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-foreground">{license.productTitle}</div>
            <div className="text-xs text-muted-foreground">
              سفارش <span dir="ltr" className="font-semibold">{license.orderCode}</span> • {formatJalaliDate(license.date, true)}
            </div>
          </div>
        </div>

        <Button
          size="sm"
          variant={copied ? "default" : "outline"}
          className={`gap-1.5 h-8 text-xs font-medium transition-all ${
            copied ? "bg-emerald-600 hover:bg-emerald-600 text-white" : ""
          }`}
          onClick={copy}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "کپی شد!" : "کپی لایسنس"}
        </Button>
      </div>

      <div
        onClick={copy}
        title="برای کپی کلیک کنید"
        className="group relative cursor-pointer rounded-xl border border-border/60 bg-muted/70 p-3 transition-colors hover:bg-muted"
      >
        <code
          className="block w-full break-all font-mono text-sm tracking-wider text-foreground select-all"
          dir="ltr"
        >
          {license.key}
        </code>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100 hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground bg-background/90 px-2 py-0.5 rounded shadow-xs">
          <Copy className="h-3 w-3" /> کلیک برای کپی
        </div>
      </div>

      {license.note && (
        <div className="mt-2.5 rounded-lg bg-amber-500/10 p-2.5 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{license.note}</span>
        </div>
      )}
    </Card>
  );
}

function EmptyState({
  icon: Icon,
  title,
  desc,
  cta,
}: {
  icon: any;
  title: string;
  desc: string;
  cta: { href: string; label: string };
}) {
  return (
    <Card className="flex flex-col items-center gap-4 p-12 text-center border-dashed border-2">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-xs">
        <Icon className="h-10 w-10" />
      </div>
      <div className="max-w-md space-y-1.5">
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground leading-6">{desc}</p>
      </div>
      <Button asChild size="lg" className="mt-2 gap-2 shadow-sm">
        <Link href={cta.href}>
          <ShoppingBag className="h-4 w-4" />
          {cta.label}
        </Link>
      </Button>
    </Card>
  );
}
