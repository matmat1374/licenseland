import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Package,
  ShoppingCart,
  CreditCard,
  Settings,
  Truck,
  FileEdit,
  KeyRound,
} from "lucide-react";

export const metadata = { title: "راهنمای سایت و پنل مدیریت" };

export default async function DocsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/admin/docs");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black">
          <BookOpen className="h-6 w-6 text-primary" />
          راهنمای سایت و پنل مدیریت
        </h1>
        <p className="text-sm text-muted-foreground">داکیومنت کامل نحوه کار با سایت، پنل مدیریت و اتصال به irMarket</p>
      </div>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-bold">۱. شروع سریع</h2>
        <div className="space-y-3 text-sm leading-7">
          <p><strong>ورود به پنل ادمین:</strong></p>
          <ol className="list-decimal space-y-1 pr-5">
            <li>به آدرس <code dir="ltr" className="rounded bg-muted px-1.5 py-0.5">/login</code> بروید</li>
            <li>شماره موبایل ادمین: <code dir="ltr" className="rounded bg-muted px-1.5 py-0.5">09100000000</code></li>
            <li>کد تأیید تستی: <code dir="ltr" className="rounded bg-muted px-1.5 py-0.5">123456</code></li>
            <li>پس از ورود، به پنل کاربری هدایت می‌شوید</li>
            <li>برای دسترسی به پنل مدیریت، به <code dir="ltr" className="rounded bg-muted px-1.5 py-0.5">/admin</code> بروید</li>
          </ol>
          <div className="mt-3 rounded-lg bg-amber-500/10 p-3 text-xs">
            <strong>نکته:</strong> در محیط واقعی، کد تأیید به شماره موبایل کاربر پیامک می‌شود. فعلاً برای تست، کد <code dir="ltr">123456</code> همیشه کار می‌کند.
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-bold">۲. پنل مدیریت</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            { icon: Package, title: "محصولات", path: "/admin/products", desc: "افزودن، ویرایش و حذف محصولات." },
            { icon: KeyRound, title: "لایسنس‌ها", path: "/admin/licenses", desc: "افزودن گروهی کلیدهای لایسنس." },
            { icon: ShoppingCart, title: "سفارش‌ها", path: "/admin/orders", desc: "مشاهده و مدیریت سفارش‌ها." },
            { icon: FileEdit, title: "مدیریت محتوا", path: "/admin/content", desc: "ویرایش متن‌های صفحه اصلی بدون کد." },
            { icon: Truck, title: "تأمین‌کننده", path: "/admin/supplier", desc: "اتصال به irMarket و وارد کردن محصولات." },
            { icon: Settings, title: "تنظیمات", path: "/admin/settings", desc: "نرخ دلار، کلید API، اطلاعات سایت." },
          ].map((item) => (
            <div key={item.path} className="flex gap-3 rounded-lg border p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{item.title}</span>
                  <code dir="ltr" className="rounded bg-muted px-1.5 py-0.5 text-xs">{item.path}</code>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-bold">۳. اتصال به irMarket</h2>
        <div className="space-y-4 text-sm leading-7">
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
            <p className="font-medium">اطلاعات API:</p>
            <ul className="mt-2 space-y-1 text-xs">
              <li>آدرس: <code dir="ltr">https://api.irmarket.store</code></li>
              <li>هدر: <code dir="ltr">X-API-Key: anb_...</code></li>
            </ul>
          </div>
          <p><strong>مرحله ۱:</strong> در <code dir="ltr" className="rounded bg-muted px-1.5 py-0.5">/admin/settings</code> کلید API و نرخ دلار را تنظیم کنید.</p>
          <p><strong>مرحله ۲:</strong> در <code dir="ltr" className="rounded bg-muted px-1.5 py-0.5">/admin/supplier</code> ← «وارد کردن محصولات»، حاشیه ۲۰۰٪ را بزنید و کلیک کنید.</p>
          <div className="rounded bg-muted/40 p-3 text-xs">
            <p><strong>فرمول:</strong> قیمت = قیمت دلاری × نرخ دلار × (۱ + حاشیه/۱۰۰)</p>
            <p><strong>مثال:</strong> $۹ × ۶۰٬۰۰۰ × ۳ = ۱٬۶۲۰٬۰۰۰ تومان</p>
          </div>
          <p><strong>خرید خودکار:</strong> وقتی مشتری پرداخت می‌کند، سایت خودکار از irMarket می‌خرد و اکانت را تحویل می‌دهد.</p>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-bold">۴. مدیریت محتوا (CMS)</h2>
        <div className="space-y-3 text-sm leading-7">
          <p>در <code dir="ltr" className="rounded bg-muted px-1.5 py-0.5">/admin/content</code> می‌توانید متن‌های صفحه اصلی را ویرایش کنید: عنوان هیرو، آمار، درباره ما.</p>
          <p>تغییرات بلافاصله اعمال می‌شوند — نیاز به کدنویسی نیست.</p>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-bold">۵. درگاه زرین‌پال</h2>
        <div className="space-y-3 text-sm leading-7">
          <p>فعلاً در حالت دمو است. برای فعال‌سازی واقعی، <code dir="ltr">ZARINPAL_MERCHANT</code> را در <code dir="ltr">.env</code> قرار دهید.</p>
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400">حالت فعلی: دمو</Badge>
        </div>
      </Card>
    </div>
  );
}
