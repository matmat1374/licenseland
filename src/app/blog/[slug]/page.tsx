import { notFound } from "next/navigation";
import Link from "next/link";
import { getArticleBySlug, getArticles } from "@/lib/queries";
import { ProductCover } from "@/components/site/product-cover";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { formatJalaliDate, toFa } from "@/lib/date";
import { SITE } from "@/lib/constants";
import { ShareButton } from "@/components/site/share-button";
import ReactMarkdown from "react-markdown";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = await getArticleBySlug(slug);
  if (!a) return { title: "مقاله یافت نشد" };
  return {
    title: a.seoTitle || a.title,
    description: a.seoDescription || a.excerpt,
    openGraph: {
      title: a.seoTitle || a.title,
      description: a.seoDescription || a.excerpt,
      type: "article",
      publishedTime: a.createdAt.toISOString(),
    },
    twitter: { card: "summary_large_image", title: a.title, description: a.excerpt },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article || !article.published) notFound();

  const related = (await getArticles({ limit: 6 })).filter((a) => a.slug !== slug).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.createdAt.toISOString(),
    author: { "@type": "Organization", name: SITE.name },
    publisher: { "@type": "Organization", name: SITE.name },
  };

  return (
    <article className="container mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* breadcrumb */}
      <nav className="mb-5 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">خانه</Link>
        <ChevronLeft className="h-3 w-3" />
        <Link href="/blog" className="hover:text-primary">وبلاگ</Link>
        <ChevronLeft className="h-3 w-3" />
        <span className="text-foreground line-clamp-1">{article.title}</span>
      </nav>

      <div className="mx-auto max-w-3xl">
        {/* header */}
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground hover:bg-primary">{article.category}</Badge>
            {article.featured && <Badge variant="secondary" className="gap-1"><Sparkles className="h-3 w-3" /> ویژه</Badge>}
          </div>
          <h1 className="text-3xl font-black leading-tight md:text-4xl">{article.title}</h1>
          <p className="mt-3 text-lg leading-8 text-muted-foreground">{article.excerpt}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4 border-y py-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {formatJalaliDate(article.createdAt)}</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {toFa(article.readingMinutes)} دقیقه مطالعه</span>
            <ShareButton title={article.title} url={`${SITE.url}/blog/${article.slug}`} />
          </div>
        </div>

        {/* cover */}
        <ProductCover title={article.title} seed={article.slug} className="aspect-video w-full rounded-2xl shadow-lg mb-8" size="lg" />

        {/* content */}
        <div className="prose-fa max-w-none text-base">
          <ReactMarkdown>{article.content}</ReactMarkdown>
        </div>

        {/* CTA */}
        <Card className="mt-10 overflow-hidden bg-gradient-to-br from-primary to-emerald-600 p-6 text-center text-primary-foreground">
          <h3 className="text-xl font-black">آماده خرید لایسنس هستید؟</h3>
          <p className="mt-1 text-sm text-primary-foreground/80">با بهترین قیمت و تحویل آنی از لایسنس‌لند خرید کنید</p>
          <Button asChild variant="secondary" className="mt-4">
            <Link href="/shop">مشاهده محصولات</Link>
          </Button>
        </Card>

        {/* related */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-black">
              <ChevronRight className="h-5 w-5 text-primary" /> مقالات مرتبط
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {related.map((a) => (
                <Link key={a.id} href={`/blog/${a.slug}`}>
                  <Card className="group h-full overflow-hidden p-0 transition-all hover:-translate-y-1 hover:shadow-lg">
                    <ProductCover title={a.title} seed={a.slug} className="aspect-video w-full" />
                    <div className="p-4">
                      <h3 className="line-clamp-2 text-sm font-bold group-hover:text-primary">{a.title}</h3>
                      <div className="mt-2 text-xs text-muted-foreground">{toFa(a.readingMinutes)} دقیقه</div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
