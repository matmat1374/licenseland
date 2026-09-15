import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProducts, getArticles, getBannerProducts } from "@/lib/queries";
import { getContentMap } from "@/lib/content";
import { ArticleCover } from "@/components/site/article-cover";
import { toFa, formatJalaliDate } from "@/lib/date";
import { CreativeHero } from "@/components/site/creative-hero";
import { BrandMarquee } from "@/components/site/brand-marquee";
import { PromoBentoBanners } from "@/components/site/promo-bento-banners";
import { BestsellersSlider } from "@/components/site/bestsellers-slider";
import { TabbedProductCatalog } from "@/components/site/tabbed-product-catalog";
import { UnifiedTrustSection } from "@/components/site/unified-trust-section";

// Storefront content (featured products, prices, banners) must not be cached for a
// year at the CDN — revalidate every 5 minutes instead.
export const revalidate = 300;

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
    getBannerProducts(banner2Ids, ["streaming", "productivity", "gaming"], 3, 500000),
  ]);

  // Fetch products for separated categories
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
      <CreativeHero />

      {/* Brand Marquee */}
      <BrandMarquee />

      {/* Tabbed Product Catalog replacing individual rows */}
      <TabbedProductCatalog
        bestsellers={bestsellers}
        ai={aiProducts}
        streaming={streamingProducts}
        gaming={gamingProducts}
        devTools={devToolsProducts}
        design={designProducts}
      />

      <PromoBentoBanners
        content={content}
        banner1Products={banner1Products}
        banner2Products={banner2Products}
      />

      <UnifiedTrustSection />

      {/* Blog Section */}
      {articles.length > 0 && (
        <section className="py-16 md:py-24 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black md:text-3xl">آخرین مقالات وبلاگ</h2>
                <p className="mt-2 text-muted-foreground">آموزش‌ها و اخبار دنیای فناوری</p>
              </div>
              <Link href="/blog" className="hidden sm:inline-flex items-center text-sm font-bold text-primary hover:underline">
                مشاهده همه
                <ArrowLeft className="w-4 h-4 mr-1" />
              </Link>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/blog/${article.slug}`}
                  className="group flex flex-col gap-4 rounded-2xl bg-card p-4 border border-border/50 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="aspect-video w-full overflow-hidden rounded-xl bg-muted">
                    <ArticleCover
                      title={article.title}
                      category={article.category}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="bg-muted px-2 py-1 rounded-md">{article.category}</span>
                        <span>{formatJalaliDate(article.createdAt)}</span>
                      </div>
                      <h3 className="line-clamp-2 text-base font-bold leading-tight group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {article.excerpt}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            <div className="mt-8 text-center sm:hidden">
              <Link href="/blog">
                <Button variant="outline" className="w-full rounded-xl">
                  مشاهده همه مقالات
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
