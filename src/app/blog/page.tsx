import Link from "next/link";
import { getArticles, getCategories } from "@/lib/queries";
import { ProductCover } from "@/components/site/product-cover";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ChevronLeft, Newspaper } from "lucide-react";
import { formatJalaliDate, toFa } from "@/lib/date";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "وبلاگ — راهنما و مقالات",
  description: "راهنمای خرید لایسنس، مقالات تخصصی هوش مصنوعی و نرم‌افزار، و نکات کاربردی.",
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const sp = await searchParams;
  const cat = sp.cat || "all";
  const [articles, categories] = await Promise.all([
    getArticles({ category: cat, limit: 50 }),
    getCategories(),
  ]);

  const cats = Array.from(new Set(articles.map((a) => a.category)));
  const featured = articles.find((a) => a.featured) || articles[0];
  const rest = articles.filter((a) => a.id !== featured?.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <div className="mb-2 flex items-center justify-center gap-2 text-sm font-bold text-primary">
          <Newspaper className="h-4 w-4" /> وبلاگ لیسانس‌لَند
        </div>
        <h1 className="text-3xl font-black">مقالات و راهنماها</h1>
        <p className="mt-2 text-muted-foreground">جدیدترین مطالب درباره لایسنس، هوش مصنوعی و نرم‌افزار</p>
      </div>

      {/* featured */}
      {featured && (
        <Link href={`/blog/${featured.slug}`} className="mb-8 block">
          <Card className="grid overflow-hidden p-0 md:grid-cols-2">
            <ProductCover title={featured.title} seed={featured.slug} className="aspect-video w-full md:aspect-auto" size="lg" />
            <div className="flex flex-col justify-center gap-3 p-6">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary text-primary-foreground hover:bg-primary">مقاله ویژه</Badge>
                <Badge variant="secondary">{featured.category}</Badge>
              </div>
              <h2 className="text-xl font-black leading-8 md:text-2xl">{featured.title}</h2>
              <p className="line-clamp-3 text-sm leading-7 text-muted-foreground">{featured.excerpt}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatJalaliDate(featured.createdAt)}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {toFa(featured.readingMinutes)} دقیقه</span>
              </div>
              <span className="mt-2 flex items-center gap-1 text-sm font-bold text-primary">ادامه مطلب <ChevronLeft className="h-4 w-4" /></span>
            </div>
          </Card>
        </Link>
      )}

      {/* category filter */}
      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto">
        <Link href="/blog" className="shrink-0 rounded-full border bg-background px-4 py-1.5 text-sm font-medium hover:border-primary/50">همه</Link>
        {cats.map((c) => (
          <Link key={c} href={`/blog?cat=${encodeURIComponent(c)}`} className="shrink-0 rounded-full border bg-background px-4 py-1.5 text-sm font-medium hover:border-primary/50">{c}</Link>
        ))}
      </div>

      {/* grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rest.map((a) => (
          <Link key={a.id} href={`/blog/${a.slug}`}>
            <Card className="group h-full overflow-hidden p-0 transition-all hover:-translate-y-1 hover:shadow-lg">
              <ProductCover title={a.title} seed={a.slug} className="aspect-video w-full" />
              <div className="p-5">
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">{a.category}</Badge>
                  <span>•</span>
                  <span>{toFa(a.readingMinutes)} دقیقه</span>
                </div>
                <h3 className="mb-2 line-clamp-2 font-bold leading-7 group-hover:text-primary">{a.title}</h3>
                <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{a.excerpt}</p>
                <div className="mt-3 text-xs text-muted-foreground">{formatJalaliDate(a.createdAt)}</div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
