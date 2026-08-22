import Link from "next/link";
import {
  Sparkles,
  Zap,
  ShieldCheck,
  Headphones,
  BadgePercent,
  ArrowLeft,
  Search,
  Star,
  Check,
  CreditCard,
  Download,
  MessageCircle,
  TrendingUp,
  ArrowLeftRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProductCard } from "@/components/site/product-card";
import { SearchDialog } from "@/components/site/search-dialog";
import { getProducts, getCategories, getArticles } from "@/lib/queries";
import { CATEGORIES, SITE } from "@/lib/constants";
import { getContentMap } from "@/lib/content";
import * as Icons from "lucide-react";
import { ProductCover } from "@/components/site/product-cover";
import { toFa, formatJalaliDate } from "@/lib/date";

export default async function HomePage() {
  const [featured, bestsellers, newest, categories, articles, content] = await Promise.all([
    getProducts({ featured: true, limit: 8, sort: "popular" }),
    getProducts({ bestseller: true, limit: 4, sort: "popular" }),
    getProducts({ limit: 8, sort: "newest" }),
    getCategories(),
    getArticles({ limit: 3 }),
    getContentMap(),
  ]);

  const heroProducts = bestsellers.slice(0, 3);

  // Build stats array from content (with fallback to default STATS)
  const stats = [
    { value: content.stats_1_value, label: content.stats_1_label },
    { value: content.stats_2_value, label: content.stats_2_label },
    { value: content.stats_3_value, label: content.stats_3_label },
    { value: content.stats_4_value, label: content.stats_4_label },
  ];

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden">
        {/* background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
          <div className="absolute right-1/4 top-0 h-96 w-96 rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute left-1/4 top-20 h-80 w-80 rounded-full bg-emerald-400/10 blur-[100px]" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>

        <div className="container mx-auto px-4 pb-16 pt-12 md:pb-24 md:pt-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            {/* text */}
            <div className="flex flex-col items-start gap-6">
              <Badge className="gap-1.5 border-primary/30 bg-primary/10 px-3 py-1.5 text-primary hover:bg-primary/10">
                <Sparkles className="h-3.5 w-3.5" />
                {content.hero_badge}
              </Badge>

              <h1 className="text-4xl font-black leading-[1.15] tracking-tight md:text-5xl lg:text-6xl">
                {content.hero_title}
                <br />
                <span className="text-gradient">{content.hero_gradient_text}</span>
                <br />
                {content.hero_subtitle}
              </h1>

              <p className="max-w-xl text-base leading-8 text-muted-foreground md:text-lg">
                {content.hero_description}
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 gap-2 px-7 text-base shadow-lg shadow-primary/20">
                  <Link href="/shop">
                    {content.hero_cta_text}
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <SearchDialog>
                  <Button variant="outline" size="lg" className="h-12 gap-2 px-6 text-base">
                    <Search className="h-4 w-4" />
                    {content.hero_cta2_text}
                  </Button>
                </SearchDialog>
              </div>

              {/* stats */}
              <div className="mt-4 grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
                {stats.map((s, i) => (
                  <div key={i}>
                    <div className="text-2xl font-black text-primary md:text-3xl">{s.value}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* visual */}
            <div className="relative hidden lg:block">
              <div className="relative mx-auto aspect-square max-w-md">
                {/* glow ring */}
                <div className="absolute inset-8 rounded-full border border-primary/20" />
                <div className="absolute inset-16 rounded-full border border-primary/10" />

                {/* floating product cards */}
                {heroProducts.map((p, i) => {
                  const positions = [
                    "right-0 top-8 rotate-3",
                    "left-0 top-32 -rotate-6",
                    "right-12 bottom-0 rotate-2",
                  ];
                  return (
                    <div
                      key={p.id}
                      className={`absolute ${positions[i]} w-52 rounded-2xl border bg-card/80 p-3 shadow-2xl backdrop-blur transition-transform hover:scale-105`}
                      style={{ zIndex: 10 - i }}
                    >
                      <ProductCover
                        title={p.title}
                        brand={p.brand}
                        seed={p.slug}
                        className="mb-2 aspect-video w-full rounded-xl"
                      />
                      <div className="line-clamp-1 text-sm font-bold">{p.title}</div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-sm font-extrabold text-primary">
                          {toFa(p._effectivePrice.toLocaleString("en-US"))}
                        </span>
                        <Badge variant="secondary" className="gap-1 text-[10px]">
                          <Zap className="h-2.5 w-2.5" /> آنی
                        </Badge>
                      </div>
                    </div>
                  );
                })}

                {/* center badge */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground shadow-2xl shadow-primary/30">
                    <ShieldCheck className="h-8 w-8" />
                    <span className="mt-1 text-[10px] font-bold">۱۰۰٪ اصل</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* brands marquee */}
        <div className="border-y bg-card/30 py-4">
          <div className="container mx-auto flex items-center gap-2 px-4 text-xs text-muted-foreground">
            <span className="shrink-0 font-medium">برندهای محبوب:</span>
            <div className="relative flex-1 overflow-hidden">
              <div className="flex w-max animate-marquee gap-8">
                {[...BRANDS, ...BRANDS].map((b, i) => (
                  <span key={i} className="shrink-0 text-sm font-bold text-muted-foreground/70">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CATEGORIES ============ */}
      <section className="container mx-auto px-4 py-16">
        <SectionHeading
          eyebrow="دسته‌بندی‌ها"
          title="هر چیزی که نیاز دارید"
          desc="مجموعه کاملی از لایسنس‌های دیجیتال در دسته‌های مختلف"
        />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => {
            const Icon = (Icons as any)[c.icon || "Folder"] || Icons.Folder;
            return (
              <Link key={c.id} href={`/shop?cat=${c.slug}`}>
                <Card className="group flex flex-col items-center gap-3 p-5 text-center transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${c.color} text-white shadow-lg transition-transform group-hover:scale-110`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">{c.name}</div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ============ FEATURED ============ */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-end justify-between gap-4">
            <SectionHeading
              eyebrow="ویژه"
              title="محصولات منتخب"
              desc="بهترین پیشنهاد‌های هفته با تخفیف ویژه"
              align="right"
            />
            <Button asChild variant="outline" className="shrink-0">
              <Link href="/shop">
                همه محصولات
                <ArrowLeft className="mr-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="container mx-auto px-4 py-16">
        <SectionHeading
          eyebrow="روند خرید"
          title="فقط در ۳ مرحله ساده"
          desc="از انتخاب تا دریافت لایسنس، کمتر از یک دقیقه"
        />
        <div className="relative grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => {
            const Icon = (Icons as any)[s.icon] || Icons.Circle;
            return (
              <Card key={i} className="relative overflow-hidden p-6">
                <div className="absolute -left-4 -top-4 text-7xl font-black text-primary/5">
                  {toFa(i + 1)}
                </div>
                <div className="relative">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold">{s.title}</h3>
                  <p className="text-sm leading-7 text-muted-foreground">{s.desc}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ============ BESTSELLERS ============ */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <SectionHeading
            eyebrow="پرفروش‌ترین‌ها"
            title="محبوب‌ترین لایسنس‌ها"
            desc="انتخاب هزاران مشتری راضی"
          />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {bestsellers.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ============ WHY US ============ */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading
              eyebrow="چرا لیسانس‌لَند؟"
              title={content.about_title}
              desc={content.about_description}
              align="right"
            />
            <div className="mt-6 space-y-4">
              {WHY_US.map((w) => {
                const Icon = (Icons as any)[w.icon] || Icons.Check;
                return (
                  <div key={w.title} className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold">{w.title}</h4>
                      <p className="text-sm leading-6 text-muted-foreground">{w.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <Button asChild className="mt-8" size="lg">
              <Link href="/about">بیشتر درباره ما بدانید</Link>
            </Button>
          </div>

          {/* testimonials card */}
          <div className="grid gap-4">
            {TESTIMONIALS.slice(0, 3).map((t, i) => (
              <Card key={i} className="p-5">
                <div className="mb-3 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-7 text-foreground/90">«{t.text}»</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-600 font-bold text-primary-foreground">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-bold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ============ NEWEST ============ */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-end justify-between gap-4">
            <SectionHeading
              eyebrow="تازه‌ها"
              title="جدیدترین محصولات"
              align="right"
            />
            <Button asChild variant="outline" className="shrink-0">
              <Link href="/shop?sort=newest">
                مشاهده همه
                <ArrowLeft className="mr-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {newest.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ============ BLOG ============ */}
      {articles.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <SectionHeading
              eyebrow="وبلاگ"
              title="آخرین مقالات"
              desc="راهنمای خرید و راهنماهای تخصصی"
              align="right"
            />
            <Button asChild variant="outline" className="shrink-0">
              <Link href="/blog">
                همه مقالات
                <ArrowLeft className="mr-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {articles.map((a) => (
              <Link key={a.id} href={`/blog/${a.slug}`}>
                <Card className="group h-full overflow-hidden p-0 transition-all hover:-translate-y-1 hover:shadow-lg">
                  <ProductCover
                    title={a.title}
                    seed={a.slug}
                    className="aspect-video w-full"
                  />
                  <div className="p-5">
                    <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary">{a.category}</Badge>
                      <span>•</span>
                      <span>{toFa(a.readingMinutes)} دقیقه مطالعه</span>
                    </div>
                    <h3 className="mb-2 line-clamp-2 font-bold leading-7 group-hover:text-primary">
                      {a.title}
                    </h3>
                    <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{a.excerpt}</p>
                    <div className="mt-3 text-xs text-muted-foreground">
                      {formatJalaliDate(a.createdAt)}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ============ CTA ============ */}
      <section className="container mx-auto px-4 py-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-emerald-600 to-teal-700 p-8 text-primary-foreground md:p-14">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="relative flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-right">
            <div>
              <h2 className="text-2xl font-black md:text-3xl">آماده شروع خرید هستید؟</h2>
              <p className="mt-2 text-primary-foreground/80">
                همین حالا اولین لایسنس خود را با تخفیف ویژه دریافت کنید
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="secondary" className="gap-2">
                <Link href="/shop">
                  <CreditCard className="h-4 w-4" />
                  شروع خرید
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <a href={SITE.telegram} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-4 w-4" />
                  مشاوره رایگان
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHeading({
  eyebrow,
  title,
  desc,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  desc?: string;
  align?: "center" | "right";
}) {
  return (
    <div className={align === "center" ? "text-center" : "text-right"}>
      {eyebrow && (
        <div className={`mb-2 flex items-center gap-2 text-sm font-bold text-primary ${align === "center" ? "justify-center" : ""}`}>
          <span className="h-px w-6 bg-primary" />
          {eyebrow}
        </div>
      )}
      <h2 className="text-2xl font-black md:text-3xl">{title}</h2>
      {desc && <p className="mt-2 text-sm text-muted-foreground md:text-base">{desc}</p>}
    </div>
  );
}

const BRANDS = [
  "OpenAI", "Midjourney", "Adobe", "CapCut", "Spotify", "Netflix",
  "Canva", "Grammarly", "NordVPN", "Microsoft", "JetBrains", "Notion",
];

const STEPS = [
  {
    icon: "Search",
    title: "انتخاب محصول",
    desc: "از بین صدها لایسنس، محصول مورد نظرتان را پیدا و به سبد اضافه کنید.",
  },
  {
    icon: "CreditCard",
    title: "پرداخت امن",
    desc: "با درگاه امن زرین‌پال و تمام کارت‌های شتاب، پرداخت را انجام دهید.",
  },
  {
    icon: "Download",
    title: "دریافت آنی لایسنس",
    desc: "بلافاصله لایسنس و راهنمای فعال‌سازی را در پنل کاربری دریافت کنید.",
  },
];

const WHY_US = [
  {
    icon: "Zap",
    title: "تحویل کاملاً خودکار",
    desc: "سیستم هوشمند ما لایسنس را بلافاصله پس از پرداخت تحویل می‌دهد، بدون انتظار.",
  },
  {
    icon: "ShieldCheck",
    title: "ضمانت اصالت و عملکرد",
    desc: "تمامی لایسنس‌ها اوریجینال هستند و در صورت مشکل تا ۷ روز قابل تعویض.",
  },
  {
    icon: "BadgePercent",
    title: "بهترین قیمت بازار",
    desc: "با خرید عمده، کمترین قیمت را به شما ارائه می‌دهیم.",
  },
  {
    icon: "Headphones",
    title: "پشتیبانی حرفه‌ای",
    desc: "تیم پشتیبانی ما ۲۴ ساعته از طریق تلگرام و تیکت پاسخگوی شماست.",
  },
];

const TESTIMONIALS = [
  {
    name: "علی محمدی",
    role: "طراح گرافیک",
    text: "لایسنس Adobe رو خریدم، دقیقاً همون لحظه تحویل داده شد. واقعاً حرفه‌ای کار می‌کنن.",
  },
  {
    name: "سارا احمدی",
    role: "تولیدکننده محتوا",
    text: "بهترین قیمت برای اکانت ChatGPT پیدا کردم اینجا. پشتیبانی هم عالی بود.",
  },
  {
    name: "محمد رضایی",
    role: "برنامه‌نویس",
    text: "سومین باره که خرید می‌کنم و هیچوقت مشکلی نداشتم. قابل اعتماد و سریع.",
  },
  {
    name: "نگار کریمی",
    role: "بلاگر",
    text: "لایسنس CapCut رو با قیمت باورنکردنی گرفتم. تحویل آنی واقعاً عالیه.",
  },
];
