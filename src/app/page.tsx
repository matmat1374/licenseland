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
import { getProducts, getCategories, getArticles, getBannerProducts } from "@/lib/queries";
import { CATEGORIES, SITE } from "@/lib/constants";
import { getContentMap } from "@/lib/content";
import * as Icons from "lucide-react";
import { ProductCover } from "@/components/site/product-cover";
import { ArticleCover } from "@/components/site/article-cover";
import { toFa, formatJalaliDate } from "@/lib/date";
import { CreativeHero } from "@/components/site/creative-hero";
import { BrandMarquee } from "@/components/site/brand-marquee";
import { PromoBentoBanners } from "@/components/site/promo-bento-banners";
import { CategoryProductRow } from "@/components/site/category-product-row";

export default async function HomePage() {
  const [bestsellers, articles, content] = await Promise.all([
    getProducts({ bestseller: true, limit: 6, sort: "price-asc" }),
    getArticles({ limit: 3 }),
    getContentMap(),
  ]);

  const banner1Ids = content.banner1_product_ids ? content.banner1_product_ids.split(",") : [];
  const banner2Ids = content.banner2_product_ids ? content.banner2_product_ids.split(",") : [];

  const [banner1Products, banner2Products] = await Promise.all([
    getBannerProducts(banner1Ids, ["ai"], 3),
    getBannerProducts(banner2Ids, ["design", "software"], 3)
  ]);

  // Fetch products for each category
  const [
    aiProducts,
    virtualNumbersProducts,
    streamingProducts,
    designProducts,
    softwareProducts,
    apiCreditsProducts,
    gamingProducts,
    socialProducts,
  ] = await Promise.all([
    getProducts({ limit: 5, category: "ai", sort: "price-asc" }),
    getProducts({ limit: 5, category: "virtual-numbers", sort: "price-asc" }),
    getProducts({ limit: 5, category: "streaming", sort: "price-asc" }),
    getProducts({ limit: 5, category: "design", sort: "price-asc" }),
    getProducts({ limit: 5, category: "software", sort: "price-asc" }),
    getProducts({ limit: 5, category: "api-credits", sort: "price-asc" }),
    getProducts({ limit: 5, category: "gaming", sort: "price-asc" }),
    getProducts({ limit: 5, category: "social", sort: "price-asc" }),
  ]);

  // Keep hero products simple for hero slider
  let heroProducts = bestsellers.filter(p => p.isActive !== false).slice(0, 6);

  const stats = [
    { value: content.stats_1_value, label: content.stats_1_label },
    { value: content.stats_2_value, label: content.stats_2_label },
    { value: content.stats_3_value, label: content.stats_3_label },
    { value: content.stats_4_value, label: content.stats_4_label },
  ];

  return (
    <>
      <CreativeHero content={content} categories={CATEGORIES} heroProducts={heroProducts} />
      
      {/* ============ BRANDS MARQUEE ============ */}
      <BrandMarquee />

      {/* ============ CATEGORIES ============ */}
      <CategoryProductRow categorySlug="ai" categoryNameEn="AI & Machine Learning" products={aiProducts.filter(p => p.isActive !== false)} />
      <CategoryProductRow categorySlug="virtual-numbers" categoryNameEn="Virtual Numbers" products={virtualNumbersProducts.filter(p => p.isActive !== false)} />
      <CategoryProductRow categorySlug="streaming" categoryNameEn="Streaming" products={streamingProducts.filter(p => p.isActive !== false)} />
      
      {/* ============ PROMO BENTO BANNERS ============ */}
      <PromoBentoBanners content={content} banner1Products={banner1Products} banner2Products={banner2Products} />

      <CategoryProductRow categorySlug="design" categoryNameEn="Design Tools" products={designProducts.filter(p => p.isActive !== false)} />
      <CategoryProductRow categorySlug="software" categoryNameEn="Software" products={softwareProducts.filter(p => p.isActive !== false)} />
      <CategoryProductRow categorySlug="api-credits" categoryNameEn="API Credits" products={apiCreditsProducts.filter(p => p.isActive !== false)} />
      <CategoryProductRow categorySlug="gaming" categoryNameEn="Gaming" products={gamingProducts.filter(p => p.isActive !== false)} />
      <CategoryProductRow categorySlug="social" categoryNameEn="Social Boost" products={socialProducts.filter(p => p.isActive !== false)} />

      {/* ============ HOW IT WORKS ============ */}
      <section className="container mx-auto px-4 py-16">
        <SectionHeading
          eyebrow="روند خرید"
          title="فقط در ۳ مرحله ساده"
          desc="از انتخاب تا دریافت لایسنس، کمتر از یک دقیقه"
        />
        <div className="relative grid gap-6 md:grid-cols-3 mt-8">
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

      {/* ============ WHY US & GUARANTEES ============ */}
      <section className="bg-muted/10 py-16 border-y border-white/5">
        <div className="container mx-auto px-4">
          <SectionHeading
            eyebrow="چرا لایسنو؟"
            title={content.about_title}
            desc={content.about_description}
          />
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {WHY_US.map((w) => {
              const Icon = (Icons as any)[w.icon] || Icons.Check;
              return (
                <div key={w.title} className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-8 w-8" />
                  </div>
                  <h4 className="font-bold mb-2">{w.title}</h4>
                  <p className="text-sm leading-6 text-muted-foreground">{w.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS & TRUST ============ */}
      <section className="container mx-auto px-4 py-16">
        <SectionHeading
          eyebrow="نظرات مشتریان"
          title="اعتماد شما، افتخار ماست"
          desc="بیش از ۵۰،۰۰۰ مشتری راضی در لایسنو"
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map((t, i) => (
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
      </section>

      {/* ============ BLOG ============ */}
      {articles.length > 0 && (
        <section className="bg-muted/10 py-16 border-y border-white/5">
          <div className="container mx-auto px-4">
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
                    <ArticleCover
                      title={a.title}
                      category={a.category}
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
          </div>
        </section>
      )}

      {/* ============ STATS BAR ============ */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl md:text-5xl font-black text-primary mb-2">{toFa(s.value)}</div>
              <div className="text-sm md:text-base text-muted-foreground font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ LUXURY TRUST & IDENTITY ============ */}
      <section className="container mx-auto px-4 py-12">
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-background via-amber-500/5 to-background p-8 md:p-12 shadow-[0_0_40px_rgba(245,158,11,0.05)]">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
          <div className="relative z-10 flex flex-col items-center text-center">
            <Badge className="mb-4 bg-amber-500 text-white border-none shadow-[0_0_20px_rgba(245,158,11,0.3)]">تضمین کیفیت لایسنو</Badge>
            <h2 className="text-2xl font-black md:text-3xl mb-8 bg-gradient-to-l from-amber-400 to-amber-600 bg-clip-text text-transparent">خرید با اطمینان کامل</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-12">
              {[
                { label: "تضمین اصالت", icon: ShieldCheck },
                { label: "بازگشت وجه", icon: ArrowLeftRight },
                { label: "گارانتی تعویض", icon: Check },
                { label: "تحویل آنی خودکار زیر ۵ دقیقه", icon: Zap }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-3 rounded-2xl border border-amber-500/10 bg-white/5 p-4 backdrop-blur-sm transition-transform hover:-translate-y-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-bold text-foreground/90">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md">
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm text-muted-foreground text-right md:text-center">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>دفتر مرکزی: جزیره کیش، برج نوآوری، طبقه ۷، واحد ۷۰۲</span>
                </div>
                <div className="hidden md:block w-px h-4 bg-white/10" />
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-amber-500" />
                  <span>شرکت ثبت شده رسمی</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="container mx-auto px-4 pb-16">
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
