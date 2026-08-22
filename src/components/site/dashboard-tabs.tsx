"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Package, KeyRound, User as UserIcon, ChevronLeft, Copy, Check, ShoppingBag, Mail, Phone, Calendar } from "lucide-react";
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

const STATUS_MAP: Record<string, { label: string; variant: any }> = {
  PAID: { label: "پرداخت شده", variant: "default" },
  PENDING: { label: "در انتظار", variant: "secondary" },
  FAILED: { label: "ناموفق", variant: "destructive" },
  CANCELLED: { label: "لغو شده", variant: "destructive" },
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

  function setTab(t: string) {
    // Use window.location for a full navigation — more reliable than router.push in production
    window.location.href = `${pathname}?tab=${t}`;
  }

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="mb-4 grid w-full grid-cols-3">
        <TabsTrigger value="overview" className="gap-1"><Package className="h-4 w-4" /> سفارش‌ها</TabsTrigger>
        <TabsTrigger value="licenses" className="gap-1"><KeyRound className="h-4 w-4" /> لایسنس‌ها</TabsTrigger>
        <TabsTrigger value="profile" className="gap-1"><UserIcon className="h-4 w-4" /> پروفایل</TabsTrigger>
      </TabsList>

      {/* orders */}
      <TabsContent value="overview">
        {orders.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="هنوز سفارشی ندارید"
            desc="اولین خرید خود را انجام دهید"
            cta={{ href: "/shop", label: "مشاهده فروشگاه" }}
          />
        ) : (
          <div className="space-y-3">
            {orders.map((o) => {
              const st = STATUS_MAP[o.status] || STATUS_MAP.PENDING;
              return (
                <Card key={o.id} className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold" dir="ltr">{o.code}</span>
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {formatJalaliDate(o.createdAt, true)} • {toFa(o.items.length)} محصول
                        </div>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="font-black text-primary">{toToman(o.total)} ت</div>
                      <Button asChild size="sm" variant="ghost" className="mt-1 h-7 gap-1 px-2 text-xs">
                        <Link href={`/order/${o.id}`}>
                          جزئیات <ChevronLeft className="h-3 w-3" />
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

      {/* licenses */}
      <TabsContent value="licenses">
        {licenses.length === 0 ? (
          <EmptyState
            icon={KeyRound}
            title="لایسنسی ندارید"
            desc="پس از خرید موفق، لایسنس‌های شما اینجا نمایش داده می‌شوند"
            cta={{ href: "/shop", label: "خرید لایسنس" }}
          />
        ) : (
          <div className="space-y-3">
            {licenses.map((l) => (
              <LicenseRow key={l.id} license={l} />
            ))}
          </div>
        )}
      </TabsContent>

      {/* profile */}
      <TabsContent value="profile">
        {user && (
          <div className="mx-auto max-w-3xl">
            <Card className="mb-6 flex items-center gap-4 p-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-600 text-2xl font-black text-primary-foreground">
                {user.name?.[0] || "U"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{user.name || "کاربر"}</span>
                  {user.role === "ADMIN" && (
                    <Badge className="bg-primary text-primary-foreground hover:bg-primary">مدیر</Badge>
                  )}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1" dir="ltr"><Mail className="h-3.5 w-3.5" /> {user.email}</span>
                  {user.phone && <span className="flex items-center gap-1" dir="ltr"><Phone className="h-3.5 w-3.5" /> {user.phone}</span>}
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatJalaliDate(user.createdAt)}</span>
                </div>
              </div>
            </Card>
            <ProfileEditor user={user} />
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

function LicenseRow({ license }: { license: License }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(license.key);
    setCopied(true);
    toast.success("کپی شد");
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <KeyRound className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-bold">{license.productTitle}</div>
            <div className="text-xs text-muted-foreground">
              {formatJalaliDate(license.date)} • سفارش {license.orderCode}
            </div>
          </div>
        </div>
        <Button size="sm" variant="outline" className="gap-1" onClick={copy}>
          {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          {copied ? "کپی شد" : "کپی لایسنس"}
        </Button>
      </div>
      <code className="block w-full break-all rounded-lg bg-muted p-2.5 font-mono text-sm" dir="ltr">
        {license.key}
      </code>
      {license.note && <p className="mt-2 text-xs text-muted-foreground">{license.note}</p>}
    </Card>
  );
}

function InfoRow({ icon: Icon, label, value, ltr }: { icon: any; label: string; value: string; ltr?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b pb-3">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </span>
      <span className="text-sm font-medium" dir={ltr ? "ltr" : undefined}>{value}</span>
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc, cta }: { icon: any; title: string; desc: string; cta: { href: string; label: string } }) {
  return (
    <Card className="flex flex-col items-center gap-4 p-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <div>
        <p className="font-bold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </div>
      <Button asChild><Link href={cta.href}>{cta.label}</Link></Button>
    </Card>
  );
}
