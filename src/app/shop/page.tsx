import { getProducts, getCategories } from "@/lib/queries";
import { ProductCard } from "@/components/site/product-card";
import { ProductFilters } from "@/components/site/product-filters";
import * as Icons from "lucide-react";
import { PackageX } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "فروشگاه لایسنس — همه محصولات",
  description:
    "خرید لایسنس اوریجینال هوش مصنوعی و نرم‌افزار: ChatGPT، Midjourney، CapCut، Adobe، Spotify و...",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; search?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const cat = sp.cat || "all";
  const search = sp.search || "";
  const sort = (sp.sort as any) || "newest";

  const [products, categories] = await Promise.all([
    getProducts({ category: cat, search, sort, limit: 100 }),
    getCategories(),
  ]);

  const currentCat = categories.find((c) => c.slug === cat);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* header */}
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          {currentCat ? (
            <>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${currentCat.color} text-white shadow-lg`}
              >
                {(() => {
                  const Icon = (Icons as any)[currentCat.icon || "Folder"] || Icons.Folder;
                  return <Icon className="h-6 w-6" />;
                })()}
              </div>
              <div>
                <h1 className="text-2xl font-black">{currentCat.name}</h1>
                <p className="text-sm text-muted-foreground">{currentCat.description}</p>
              </div>
            </>
          ) : (
            <div>
              <h1 className="text-2xl font-black">فروشگاه لایسنس</h1>
              <p className="text-sm text-muted-foreground">
                {search ? `نتایج جستجو برای «${search}»` : "تمام محصولات موجود در یک نگاه"}
              </p>
            </div>
          )}
        </div>

        <ProductFilters totalCount={products.length} />
      </div>

      {/* products */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <PackageX className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-bold">محصولی یافت نشد</p>
            <p className="mt-1 text-sm text-muted-foreground">
              فیلترها را تغییر دهید یا عبارت دیگری جستجو کنید
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
