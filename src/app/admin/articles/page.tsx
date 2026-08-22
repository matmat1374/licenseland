import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { toFa, formatJalaliDate } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { ArticleManager } from "@/components/admin/article-manager";

export const metadata = { title: "مدیریت مقالات" };

export default async function AdminArticlesPage() {
  const articles = await db.article.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      category: true,
      tags: true,
      readingMinutes: true,
      published: true,
      featured: true,
      createdAt: true,
    },
  });

  const serializable = articles.map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    excerpt: a.excerpt,
    category: a.category,
    tags: a.tags,
    readingMinutes: a.readingMinutes,
    published: a.published,
    featured: a.featured,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black">مدیریت مقالات</h1>
          <p className="text-sm text-muted-foreground">مجموع {toFa(articles.length)} مقاله</p>
        </div>
        <ArticleManager mode="create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            افزودن مقاله
          </Button>
        </ArticleManager>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-right text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">عنوان</th>
                <th className="px-4 py-3 font-medium">دسته</th>
                <th className="px-4 py-3 font-medium">زمان مطالعه</th>
                <th className="px-4 py-3 font-medium">وضعیت</th>
                <th className="px-4 py-3 font-medium">ویژگی</th>
                <th className="px-4 py-3 font-medium">تاریخ</th>
                <th className="px-4 py-3 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {serializable.map((a) => (
                <tr key={a.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-medium">{a.title}</div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground" dir="ltr">/{a.slug}</div>
                  </td>
                  <td className="px-4 py-3"><Badge variant="outline">{a.category}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground">{toFa(a.readingMinutes)} دقیقه</td>
                  <td className="px-4 py-3">
                    <Badge variant={a.published ? "default" : "secondary"}>
                      {a.published ? "منتشر شده" : "پیش‌نویس"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {a.featured && <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400">ویژه</Badge>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatJalaliDate(a.createdAt)}</td>
                  <td className="px-4 py-3">
                    <ArticleManager mode="edit" article={a} />
                  </td>
                </tr>
              ))}
              {serializable.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    هنوز مقاله‌ای ثبت نشده است
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
