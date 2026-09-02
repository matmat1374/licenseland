import Link from "next/link";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toFa } from "@/lib/date";
import { ProductManager } from "@/components/admin/product-manager";
import { AdminProductsTable } from "@/components/admin/admin-products-table";
import { getUsdToTomanRate } from "@/lib/supplier";

export const metadata = { title: "مدیریت محصولات" };
export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const [products, categories, activeUsdRate] = await Promise.all([
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
        specifications: true,
      },
    }),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    getUsdToTomanRate(),
  ]);

  const catMap = new Map(categories.map((c) => [c.slug, c.name]));

  const serializable = products.map((p) => {
    let costUsd = null;
    let markupPercent = null;
    if (p.specifications) {
      try {
        const spec = typeof p.specifications === 'string' ? JSON.parse(p.specifications) : p.specifications;
        costUsd = spec.cost_usd ? parseFloat(spec.cost_usd) : null;
        markupPercent = spec.markup_percent ? parseFloat(spec.markup_percent) : null;
      } catch (e) {}
    }
    return {
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
      costUsd,
      markupPercent,
    };
  });

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
        <ProductManager mode="create" categories={cats} activeUsdRate={activeUsdRate}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            افزودن محصول
          </Button>
        </ProductManager>
      </div>

      <AdminProductsTable products={serializable} categories={cats} activeUsdRate={activeUsdRate} />
    </div>
  );
}
