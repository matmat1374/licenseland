import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getProductBySlug, getRelatedProducts, getCategories } from "@/lib/queries";
import { ProductCard } from "@/components/site/product-card";
import { ProductCover } from "@/components/site/product-cover";
import { ProductPurchase } from "@/components/site/product-purchase";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Star, Check, ChevronLeft, TrendingUp } from "lucide-react";
import { ProductReviews } from "@/components/site/product-reviews";
import { toFa } from "@/lib/date";
import { SITE, FAQS } from "@/lib/constants";
import ReactMarkdown from "react-markdown";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "محصول یافت نشد" };

  const price = product.discountPrice ?? product.price;
  const canonical = `${SITE.url}/product/${slug}`;
  const outOfStock = product._stock === 0;

  return {
    title: product.title,
    description: product.shortDesc,
    alternates: { canonical },
    robots: outOfStock
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      title: product.title,
      description: `${product.shortDesc} — قیمت: ${toFa(price.toLocaleString("en-US"))} تومان`,
      type: "website",
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description: product.shortDesc,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || !product.isActive) notFound();

  const [related, categories] = await Promise.all([
    getRelatedProducts(product.category, product.slug, 4),
    getCategories(),
  ]);

  const features: string[] = (() => {
    try {
      return JSON.parse(product.features || "[]");
    } catch {
      return [];
    }
  })();
  const cat = categories.find((c) => c.slug === product.category);

  // ---------- SEO: structured data (JSON-LD) ----------
  const canonical = `${SITE.url}/product/${slug}`;
  const finalPrice = product.discountPrice ?? product.price;
  const inStock = product._stock > 0;
  const hasRating =
    product.rating !== null &&
    product.rating !== undefined &&
    product.reviewCount > 0;

  // BreadcrumbList JSON-LD
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "خانه",
        item: SITE.url,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "فروشگاه",
        item: `${SITE.url}/shop`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: cat?.name || product.category,
        item: `${SITE.url}/shop?cat=${product.category}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: product.title,
        item: canonical,
      },
    ],
  };

  // Product + Offer JSON-LD — aggregateRating only when rating exists & reviewCount > 0
  const productLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.shortDesc,
    sku: `LL-${product.slug.slice(0, 8).toUpperCase()}`,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    category: cat?.name || product.category,
    url: canonical,
    offers: {
      "@type": "Offer",
      price: finalPrice,
      priceCurrency: "IRT",
      priceValidUntil: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: canonical,
      seller: { "@type": "Organization", name: SITE.name },
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  if (hasRating) {
    productLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      bestRating: 5,
      worstRating: 1,
      reviewCount: product.reviewCount,
    };
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* SEO: canonical link + JSON-LD structured data */}
      <link rel="canonical" href={canonical} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />

      {/* breadcrumb */}
      <Breadcrumb className="mb-5">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link href="/">خانه</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link href="/shop">فروشگاه</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link href={`/shop?cat=${product.category}`}>{cat?.name || product.category}</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{product.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* cover + info */}
        <div className="flex flex-col gap-4">
          <ProductCover
            title={product.title}
            brand={product.brand}
            seed={product.slug}
            className="aspect-square w-full rounded-3xl shadow-xl"
            size="lg"
          />
          {/* quick badges */}
          <div className="flex flex-wrap gap-2">
            {product.bestseller && <Badge className="bg-amber-500 text-white hover:bg-amber-500">پرفروش</Badge>}
            {product.featured && <Badge variant="secondary">محصول منتخب</Badge>}
            <Badge variant="outline" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              {toFa(product.salesCount)}+ فروش
            </Badge>
          </div>
        </div>

        {/* details */}
        <div className="flex flex-col gap-4">
          <div>
            {product.brand && (
              <span className="text-sm font-bold text-primary">{product.brand}</span>
            )}
            <h1 className="mt-1 text-2xl font-black leading-8 md:text-3xl">{product.title}</h1>
            <p className="mt-2 text-muted-foreground">{product.shortDesc}</p>
          </div>

          {/* rating */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={i < Math.round(product.rating ?? 0) ? "h-4 w-4 fill-amber-400 text-amber-400" : "h-4 w-4 text-muted-foreground"}
                />
              ))}
              <span className="mr-1 font-bold">{toFa((product.rating ?? 0).toFixed(1))}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              ({toFa(product.reviewCount)} نظر)
            </span>
          </div>

          {/* features */}
          {features.length > 0 && (
            <div className="rounded-2xl border bg-card p-4">
              <h3 className="mb-3 flex items-center gap-2 font-bold">
                <Check className="h-4 w-4 text-emerald-500" />
                ویژگی‌های محصول
              </h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
                      <Check className="h-3 w-3" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* purchase box (desktop) */}
          <div className="hidden lg:block">
            <ProductPurchase product={product} />
          </div>
        </div>
      </div>

      {/* mobile purchase */}
      <div className="mt-6 lg:hidden">
        <ProductPurchase product={product} />
      </div>

      {/* description */}
      <div className="mt-12 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-xl font-black">توضیحات محصول</h2>
          <div className="prose-fa max-w-none rounded-2xl border bg-card p-6 text-sm leading-8">
            <ReactMarkdown>{product.description}</ReactMarkdown>
          </div>
        </div>

        {/* sidebar */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border bg-card p-5">
            <h3 className="mb-3 font-bold">مشخصات محصول</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between border-b pb-2">
                <dt className="text-muted-foreground">برند</dt>
                <dd className="font-medium">{product.brand || "—"}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-muted-foreground">دوره</dt>
                <dd className="font-medium">{product.duration || "—"}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-muted-foreground">دسته‌بندی</dt>
                <dd className="font-medium">{cat?.name || "—"}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-muted-foreground">موجودی</dt>
                <dd className="font-medium">{toFa(product._stock)} عدد</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">کد محصول</dt>
                <dd className="font-medium font-mono" dir="ltr">LL-{product.slug.slice(0, 8).toUpperCase()}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* reviews */}
      <ProductReviews productId={product.id} reviews={product.reviews || []} rating={product.rating ?? 0} reviewCount={product.reviewCount} />

      {/* FAQ */}
      <div className="mt-12">
        <h2 className="mb-4 text-xl font-black">سوالات متداول</h2>
        <Accordion type="single" collapsible className="rounded-2xl border bg-card px-4">
          {FAQS.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-right">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* related */}
      {related.length > 0 && (
        <div className="mt-12">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-black">محصولات مرتبط</h2>
            <Link href={`/shop?cat=${product.category}`} className="flex items-center gap-1 text-sm text-primary hover:underline">
              مشاهده همه <ChevronLeft className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
