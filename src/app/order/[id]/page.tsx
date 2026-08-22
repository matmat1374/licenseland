import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/queries";
import { verifyOrderAccessToken } from "@/lib/order-access";
import { openKeys } from "@/lib/licenses";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LicenseKeys } from "@/components/site/license-keys";
import {
  CheckCircle2,
  XCircle,
  Package,
  Download,
  Home,
  Headphones,
} from "lucide-react";
import { PrintButton } from "@/components/site/print-button";
import { formatJalaliDate, toFa } from "@/lib/date";
import { toToman } from "@/lib/format";
import { SITE } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "جزئیات سفارش",
  robots: { index: false, follow: false },
};

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string; failed?: string; token?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getCurrentUser();

  // C1 fix — authorization (was: public guest fallback by id/code, with
  // sequential order codes this leaked every sold license key):
  //   owner session | admin session | guest with valid signed token
  const order = await db.order.findFirst({
    where: { OR: [{ id }, { code: id }] },
    include: { items: { include: { licenses: true } } },
  });
  if (!order) notFound();

  const isOwner = !!user && order.userId === user.id;
  const isAdmin = user?.role === "ADMIN";
  const hasToken = verifyOrderAccessToken(order.id, sp.token);
  if (!isOwner && !isAdmin && !hasToken) notFound();

  // decrypt sealed license keys for display (C5)
  for (const it of order.items) {
    (it as any).licenses = openKeys(it.productId, it.licenses).map((k, i) => ({
      ...it.licenses[i],
      key: k.key,
    }));
  }

  const finalOrder = order;

  const paid = finalOrder.status === "PAID";
  const failed = finalOrder.status === "FAILED" || finalOrder.status === "CANCELLED" || sp.failed;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-3xl">
        {/* status banner */}
        {paid ? (
          <Card className="mb-6 overflow-hidden border-emerald-500/30 p-0">
            <div className="flex flex-col items-center gap-3 bg-gradient-to-br from-emerald-500/10 to-transparent p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
                <CheckCircle2 className="h-9 w-9 text-emerald-500" />
              </div>
              <div>
                <h1 className="text-2xl font-black">پرداخت موفق بود!</h1>
                <p className="mt-1 text-muted-foreground">
                  سفارش شما با کد <span className="font-bold text-foreground">{finalOrder.code}</span> ثبت شد
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                لایسنس‌های شما در زیر نمایش داده شده‌اند. یک کپی نیز به ایمیل{" "}
                <span className="font-medium text-foreground" dir="ltr">{finalOrder.guestEmail || user?.email}</span>{" "}
                ارسال شد.
              </p>
            </div>
          </Card>
        ) : failed ? (
          <Card className="mb-6 border-rose-500/30 p-8 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/15">
              <XCircle className="h-9 w-9 text-rose-500" />
            </div>
            <h1 className="text-2xl font-black">پرداخت ناموفق بود</h1>
            <p className="mt-1 text-muted-foreground">
              متأسفانه پرداخت شما ناموفق بود یا لغو شد. در صورت کسر وجه، تا ۲۴ ساعت بازگردانده می‌شود.
            </p>
            <Button asChild className="mt-4">
              <Link href="/checkout">تلاش مجدد</Link>
            </Button>
          </Card>
        ) : (
          <Card className="mb-6 p-8 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15">
              <Package className="h-9 w-9 text-amber-500" />
            </div>
            <h1 className="text-2xl font-black">سفارش در حال پردازش</h1>
            <p className="mt-1 text-muted-foreground">کد سفارش: {finalOrder.code}</p>
          </Card>
        )}

        {/* order details */}
        <Card className="mb-6 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">جزئیات سفارش</h2>
            <PrintButton />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <div className="text-xs text-muted-foreground">کد سفارش</div>
              <div className="font-bold" dir="ltr">{finalOrder.code}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">تاریخ</div>
              <div className="font-medium">{formatJalaliDate(finalOrder.createdAt, true)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">وضعیت</div>
              <div className="font-medium">
                {paid ? "پرداخت شده" : failed ? "ناموفق" : "در انتظار"}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">کد پیگیری</div>
              <div className="font-mono text-xs" dir="ltr">{finalOrder.zarinpalRefId || "—"}</div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* items */}
          <div className="space-y-3">
            {finalOrder.items.map((it: any) => (
              <div key={it.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold">
                    {toFa(it.quantity)}
                  </span>
                  <Link href={`/product/${it.productSlug}`} className="font-medium hover:text-primary">
                    {it.productTitle}
                  </Link>
                  {it.duration && <span className="text-xs text-muted-foreground">— {it.duration}</span>}
                </div>
                <div className="font-bold">{toToman(it.price * it.quantity)} ت</div>
              </div>
            ))}
          </div>

          <Separator className="my-4" />
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">جمع کل</span>
              <span>{toToman(finalOrder.total + finalOrder.discount)} ت</span>
            </div>
            {finalOrder.discount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>تخفیف {finalOrder.discountCode && `(${finalOrder.discountCode})`}</span>
                <span>- {toToman(finalOrder.discount)} ت</span>
              </div>
            )}
          </div>
          <Separator className="my-3" />
          <div className="flex items-center justify-between">
            <span className="font-bold">مبلغ پرداخت شده</span>
            <div className="text-left">
              <span className="text-xl font-black text-primary">{toToman(finalOrder.total)}</span>
              <span className="mr-1 text-xs text-muted-foreground">تومان</span>
            </div>
          </div>
        </Card>

        {/* licenses */}
        {paid && (
          <div className="mb-6">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-black">
              <Download className="h-5 w-5 text-primary" />
              لایسنس‌های شما
            </h2>
            <div className="space-y-3">
              {finalOrder.items.map((it: any) => (
                <LicenseKeys
                  key={it.id}
                  productTitle={it.productTitle}
                  licenses={it.licenses}
                  sold={paid}
                />
              ))}
            </div>
          </div>
        )}

        {/* actions */}
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/shop"><Home className="ml-1 h-4 w-4" /> بازگشت به فروشگاه</Link>
          </Button>
          {user && (
            <Button asChild variant="outline">
              <Link href="/dashboard?tab=orders"><Package className="ml-1 h-4 w-4" /> سفارش‌های من</Link>
            </Button>
          )}
          <Button asChild variant="ghost" className="text-muted-foreground">
            <a href={SITE.telegram} target="_blank" rel="noreferrer">
              <Headphones className="ml-1 h-4 w-4" /> پشتیبانی
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
