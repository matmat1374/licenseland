import Link from "next/link";
import {
  Sparkles,
  Zap,
  ShieldCheck,
  Headphones,
  BadgePercent,
  ArrowLeft,
  Star,
  Check,
  CreditCard,
  Download,
  MessageCircle,
  ArrowLeftRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getProducts, getArticles, getBannerProducts } from "@/lib/queries";
import { SITE } from "@/lib/constants";
import { getContentMap } from "@/lib/content";
import * as Icons from "lucide-react";
import { ArticleCover } from "@/components/site/article-cover";
import { toFa, formatJalaliDate } from "@/lib/date";
import { CreativeHero } from "@/components/site/creative-hero";
import { BrandMarquee } from "@/components/site/brand-marquee";
import { PromoBentoBanners } from "@/components/site/promo-bento-banners";
import { CategoryProductRow } from "@/components/site/category-product-row";
import { BestsellersSlider } from "@/components/site/bestsellers-slider";

export default async function HomePage() {
  const [bestsellers, articles, content] = await Promise.all([
    getProducts({ bestseller: true, limit: 10, sort: "popular" }),
    getArticles({ limit: 3 }),
    getContentMap(),
  ]);

  const banner1Ids = content.banner1_product_ids ? content.banner1_product_ids.split(",") : [];
  const banner2Ids = content.banner2_product_ids ? content.banner2_product_ids.split(",") : [];

  const [banner1Products, banner2Products] = await Promise.all([
    getBannerProducts(banner1Ids, ["ai"], 3),
    getBannerProducts(banner2Ids, ["design", "dev-tools", "productivity"], 3),
  ]);

  // Fetch products for separated categories (Virtual numbers is hidden on homepage as requested)
  const [
    aiProducts,
    streamingProducts,
    gamingProducts,
    designProducts,
    devToolsProducts,
  ] = await Promise.all([
    getProducts({ limit: 8, category: "ai", sort: "popular" }),
    getProducts({ limit: 8, category: "streaming", sort: "popular" }),
    getProducts({ limit: 8, category: "gaming", sort: "popular" }),
    getProducts({ limit: 8, category: "design", sort: "popular" }),
    getProducts({ limit: 8, category: "dev-tools", sort: "popular" }),
  ]);

  return (
    <>
      {/* ============ HERO SECTION ============ */}
      <CreativeHero />

      {/* ============ SECTION 1: BESTSELLERS (10 SELECTED PRODUCTS) ============ */}
      <BestsellersSlider products={bestsellers} />

      {/* ============ BRANDS MARQUEE ============ */}
      <BrandMarquee />

      {/* ============ CATEGORY ROWS ============ */}
      {/* 1. هوش مصنوعی */}
      <CategoryProductRow
        categorySlug="ai"
        categoryNameEn="Artificial Intelligence"
        products={aiProducts.filter((p) => p.isActive !== false)}
      />

      {/* 2. استریم و فیلم */}
      <CategoryProductRow
        categorySlug="streaming"
        categoryNameEn="Streaming & Movies"
        products={streamingProducts.filter((p) => p.isActive !== false)}
      />

      {/* 3. گیمینگ و بازی‌ها */}
      <CategoryProductRow
        categorySlug="gaming"
        categoryNameEn="Gaming & Gift Cards"
        products={gamingProducts.filter((p) => p.isActive !== false)}
      />

      {/* ============ PROMO BENTO BANNERS ============ */}
      <PromoBentoBanners
        content={content}
        banner1Products={banner1Products}
        banner2Products={banner2Products}
      />

      {/* 4. طراحی و گرافیک */}
      <CategoryProductRow
        categorySlug="design"
        categoryNameEn="Design Tools"
        products={designProducts.filter((p) => p.isActive !== false)}
      />

      {/* 5. ابزارهای توسعه و برنامه‌نویسی */}
      <CategoryProductRow
        categorySlug="dev-tools"
        categoryNameEn="Developer Tools"
        products={devToolsProducts.filter((p) => p.isActive !== false)}
      />

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
              <Card key={i} className="relative overflow-hidden p-6 rounded-2xl border-border/60">
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
      <section className="bg-muted/10 py-16 border-y border-border/40">
        <div className="container mx-auto px-4">
          <SectionHeading
            eyebrow="چرا لایسنو؟"
            title={content.about_title || "خرید امن و مطمئن لایسنس و اکانت"}
            desc={content.about_description || "تحویل آنی، ضمانت بازگشت وجه و پشتیبانی ۲۴ ساعته"}
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
          desc="بیش از ۵۰،۰۰۰ سفارش موفق در لایسنو"
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map((t, i) => (
            <Card key={i} className="p-5 rounded-2xl border-border/60">
              <div className="mb-3 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm leading-7 text-foreground/90">«{t.text}»</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-600 font-bold text-primary-foreground text-sm">
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
        <section className="bg-muted/10 py-16 border-y border-border/40">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex items-end justify-between gap-4">
              <SectionHeading
                eyebrow="وبلاگ"
                title="آخرین مقالات"
                desc="راهنمای خرید و ترفندهای هوش مصنوعی و نرم‌افزار"
                align="right"
              />
              <Button asChild variant="outline" className="shrink-0 rounded-xl">
                <Link href="/blog">
                  همه مقالات
                  <ArrowLeft className="mr-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {articles.map((a) => (
                <Link key={a.id} href={`/blog/${a.slug}`}>
                  <Card className="group h-full overflow-hidden p-0 rounded-2xl border-border/60 transition-all hover:-translate-y-1 hover:shadow-lg">
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
                      <h3 className="mb-2 line-clamp-2 font-bold leading-7 group-hover:text-primary transition-colors">
                        {a.title}
                      </h3>
                      <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {a.excerpt}
                      </p>
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

      {/* ============ LUXURY TRUST & IDENTITY ============ */}
      <section className="container mx-auto px-4 py-12">
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-background via-amber-500/5 to-background p-8 md:p-12 shadow-[0_0_40px_rgba(245,158,11,0.05)]">
          <div className="relative z-10 flex flex-col items-center text-center">
            <Badge className="mb-4 bg-amber-500 text-white border-none shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              تضمین کیفیت لایسنو
            </Badge>
            <h2 className="text-2xl font-black md:text-3xl mb-8 bg-gradient-to-l from-amber-400 to-amber-600 bg-clip-text text-transparent">
              خرید با اطمینان کامل
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-10">
              {[
                { label: "تضمین اصالت", icon: ShieldCheck },
                { label: "بازگشت وجه", icon: ArrowLeftRight },
                { label: "گارانتی تعویض", icon: Check },
                { label: "تحویل آنی خودکار زیر ۵ دقیقه", icon: Zap },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-amber-500/10 bg-card/60 p-4 backdrop-blur-xs transition-transform hover:-translate-y-1"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-bold text-foreground/90">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="w-full max-w-2xl rounded-2xl border border-border/60 bg-card/80 p-5 backdrop-blur-md">
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm text-muted-foreground text-center">
                <div className="flex items-center gap-2 justify-center">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>دفتر مرکزی: جزیره کیش، بازار شارستان، پلاک ۲۹</span>
                </div>
                <div className="hidden md:block w-px h-4 bg-border" />
                <div className="flex items-center gap-2 justify-center">
                  <Check className="h-4 w-4 text-amber-500" />
                  <span>شرکت ثبت شده رسمی با مجوز دیجیتال</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="container mx-auto px-4 pb-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-purple-600 to-indigo-700 p-8 text-primary-foreground md:p-14 shadow-xl">
          <div className="relative flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-right">
            <div>
              <h2 className="text-2xl font-black md:text-3xl">آماده شروع خرید هستید؟</h2>
              <p className="mt-2 text-primary-foreground/85">
                همین حالا اولین لایسنس خود را با تخفیف ویژه و تحویل فوری دریافت کنید
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="secondary" className="gap-2 rounded-xl font-bold">
                <Link href="/shop">
                  <CreditCard className="h-4 w-4" />
                  شروع خرید
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="gap-2 rounded-xl border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <a href={SITE.telegram} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-4 w-4" />
                  مشاوره تلگرام
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
        <div
          className={`mb-2 flex items-center gap-2 text-sm font-bold text-primary ${
            align === "center" ? "justify-center" : ""
          }`}
        >
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
    desc: "از بین صدها اشتراک و لایسنس، سرویس مورد نظرتان را انتخاب و به سبد اضافه کنید.",
  },
  {
    icon: "CreditCard",
    title: "پرداخت امن",
    desc: "با درگاه امن بانکی و تمام کارت‌های عضو شتاب، پرداخت را در کمتر از ۱ دقیقه انجام دهید.",
  },
  {
    icon: "Download",
    title: "دریافت آنی لایسنس",
    desc: "بلافاصله پس از پرداخت، مشخصات اکانت و راهنمای فعال‌سازی را تحویل بگیرید.",
  },
];

const WHY_US = [
  {
    icon: "Zap",
    title: "تحویل کاملاً خودکار",
    desc: "سیستم هوشمند ما سفارش را بلافاصله پس از پرداخت تحویل می‌دهد، بدون معطلی.",
  },
  {
    icon: "ShieldCheck",
    title: "ضمانت اصالت و سلامت",
    desc: "تمامی اشتراک‌ها اوریجینال هستند و با گارانتی سلامت کامل ارائه می‌شوند.",
  },
  {
    icon: "BadgePercent",
    title: "بهترین قیمت رقابتی",
    desc: "با تامین مستقیم، کمترین قیمت ممکن در بازار را برای شما فراهم کرده‌ایم.",
  },
  {
    icon: "Headphones",
    title: "پشتیبانی حرفه‌ای ۲۴ ساعته",
    desc: "تیم پشتیبانی ما همیشه از طریق تلگرام و تیکت پاسخگوی سوالات شماست.",
  },
];

const TESTIMONIALS = [
  {
    name: "علی محمدی",
    role: "طراح گرافیک",
    text: "لایسنس کانوا پرو رو خریدم، دقیقاً همون لحظه تحویل داده شد. واقعاً عالی و بی‌نقص.",
  },
  {
    name: "سارا احمدی",
    role: "تولیدکننده محتوا",
    text: "اشتراک جمنای پرو ۱۸ ماهه همراه با ۵ ترابایت ابری با قیمت فوق‌العاده؛ پشتیبانی هم عالی بود.",
  },
  {
    name: "محمد رضایی",
    role: "برنامه‌نویس",
    text: "برای Cursor Pro خرید کردم و زیر ۱ دقیقه فعال شد. از سرعت و برخورد تیم بسیار راضی‌ام.",
  },
  {
    name: "نگار کریمی",
    role: "بلاگر",
    text: "لایسنس CapCut پرو رو بدون معطلی گرفتم. قیمت عالی و تحویل آنی واقعاً بینظیره.",
  },
];
