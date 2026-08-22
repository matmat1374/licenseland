import { SITE, STATS } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { ShieldCheck, Zap, Headphones, BadgePercent, Target, Eye, Heart, Users } from "lucide-react";
import { toFa } from "@/lib/date";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "درباره ما",
  description: `درباره ${SITE.name} — بازار لایسنس دیجیتال ایران با هدف ارائه لایسنس اوریجینال با بهترین قیمت.`,
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black md:text-4xl">درباره {SITE.name}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{SITE.tagline}</p>
        </div>

        <div className="prose-fa mb-10 max-w-none text-base leading-8">
          <p>
            {SITE.name} با هدف ارائه <strong>لایسنس اوریجینال</strong> هوش مصنوعی و نرم‌افزار با بهترین قیمت و
            تحویل آنی به مشتریان ایرانی تأسیس شد. ما باور داریم هر کاربری باید بتواند به‌راحتی و با خیال راحت
            به ابزارهای دیجیتال لازم برای کار و خلاقیت خود دسترسی داشته باشد.
          </p>
          <p>
            از سال ۱۴۰۲، بیش از <strong>{STATS[0].value} کاربر</strong> به ما اعتماد کرده‌اند و بیش از
            <strong> {STATS[1].value} لایسنس</strong> از طریق پلتفرم ما تحویل داده شده است. سیستم هوشمند ما
            لایسنس‌ها را بلافاصله پس از پرداخت به‌صورت خودکار تحویل می‌دهد تا شما بدون انتظار به محصول خود برسید.
          </p>
        </div>

        {/* values */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2">
          {[
            { icon: Target, title: "مأموریت ما", desc: "دسترسی آسان و قانونی به نرم‌افزارهای اوریجینال برای همه ایرانیان" },
            { icon: Eye, title: "چشم‌انداز", desc: "تبدیل‌شدن به بزرگ‌ترین بازار لایسنس دیجیتال خاورمیانه" },
            { icon: Heart, title: "ارزش‌ها", desc: "صداقت، سرعت، پشتیبانی واقعی و احترام به مشتری" },
            { icon: Users, title: "تیم ما", desc: "متخصصان حوزه فناوری و پشتیبانی ۲۴ ساعته" },
          ].map((v) => (
            <Card key={v.title} className="flex gap-3 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <v.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold">{v.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{v.desc}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* why */}
        <h2 className="mb-4 text-xl font-black">چرا ما را انتخاب کنید؟</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { icon: Zap, title: "تحویل آنی خودکار", desc: "لایسنس بلافاصله پس از پرداخت" },
            { icon: ShieldCheck, title: "ضمانت اصالت", desc: "۱۰۰٪ اوریجینال و قانونی" },
            { icon: Headphones, title: "پشتیبانی ۲۴/۷", desc: "همیشه در دسترس" },
            { icon: BadgePercent, title: "بهترین قیمت", desc: "ارزان‌تر از همه‌جا" },
          ].map((w) => (
            <Card key={w.title} className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <w.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold">{w.title}</div>
                <div className="text-xs text-muted-foreground">{w.desc}</div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
