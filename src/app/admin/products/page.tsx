import Link from "next/link";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Star, Package } from "lucide-react";
import { toFa } from "@/lib/date";
import { toToman, calcDiscountPercent } from "@/lib/format";
import { ProductManager } from "@/components/admin/product-manager";

export const metadata = { title: "مدیریت محصولات" };

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    db.product.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        shortDesc: true,
        price: true,
        discountPrice: true,
        stock: true,
        category: true,
        featured: true,
        bestseller: true,
        isActive: true,
        salesCount: true,
        createdAt: true,
      },
    }),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const catMap = new Map(categories.map((c) => [c.slug, c.name]));

  const serializable = products.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    shortDesc: p.shortDesc,
    price: p.price,
    discountPrice: p.discountPrice,
    stock: p.stock,
    category: p.category,
    categoryName: catMap.get(p.category) || p.category,
    featured: p.featured,
    bestseller: p.bestseller,
    isActive: p.isActive,
    salesCount: p.salesCount,
    createdAt: p.createdAt.toISOString(),
  }));

  const cats = categories.map((c) => ({ name: c.name, slug: c.slug }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black">مدیریت محصولات</h1>
          <p className="text-sm text-muted-foreground">
            مجموع {toFa(products.length)} محصول
          </p>
        </div>
        <ProductManager mode="create" categories={cats}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            افزودن محصول
          </Button>
        </ProductManager>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-right text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">محصول</th>
                <th className="px-4 py-3 font-medium">دسته</th>
                <th className="px-4 py-3 font-medium">قیمت</th>
                <th className="px-4 py-3 font-medium">موجودی</th>
                <th className="px-4 py-3 font-medium">فروش</th>
                <th className="px-4 py-3 font-medium">وضعیت</th>
                <th className="px-4 py-3 font-medium">ویژگی</th>
                <th className="px-4 py-3 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {serializable.map((p) => {
                const off = calcDiscountPercent(p.price, p.discountPrice);
                return (
                  <tr key={p.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium leading-tight">{p.title}</div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground" dir="ltr">
                        /{p.slug}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{p.categoryName}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-primary">{toToman(p.discountPrice || p.price)} ت</div>
                      {p.discountPrice && (
                        <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <span className="line-through">{toToman(p.price)}</span>
                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            {toFa(off)}٪
                          </Badge>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={
                          p.stock === 0
                            ? "border-rose-500/30 text-rose-600 dark:text-rose-400"
                            : p.stock <= 2
                            ? "border-amber-500/30 text-amber-600 dark:text-amber-400"
                            : ""
                        }
                      >
                        {p.stock === 0 ? "ناموجود" : `${toFa(p.stock)} عدد`}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{toFa(p.salesCount)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={p.isActive ? "default" : "secondary"}>
                        {p.isActive ? "فعال" : "غیرفعال"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {p.featured && (
                          <Badge variant="outline" className="gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <Star className="h-3 w-3" /> ویژه
                          </Badge>
                        )}
                        {p.bestseller && (
                          <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <Package className="h-3 w-3" /> پرفروش
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ProductManager
                        mode="edit"
                        product={p}
                        categories={cats}
                      />
                    </td>
                  </tr>
                );
              })}
              {serializable.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    هنوز محصولی ثبت نشده است
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
