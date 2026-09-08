"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ProductCard } from "./product-card";
import { CATEGORIES } from "@/lib/constants";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

type CategoryProductRowProps = {
  categorySlug: string;
  categoryNameEn?: string;
  products: any[];
};

export function CategoryProductRow({ categorySlug, categoryNameEn, products }: CategoryProductRowProps) {
  if (!products || products.length === 0) return null;

  const category = CATEGORIES.find((c) => c.slug === categorySlug);
  if (!category) return null;

  // @ts-ignore
  const Icon = Icons[category.icon] || Icons.Folder;
  const gradient = category.color || "from-primary to-primary/60";

  return (
    <section className="w-full py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={cn("w-1.5 h-6 rounded-full bg-gradient-to-b", gradient)} />
            <div className="flex items-center gap-2">
              <div className={cn("p-1.5 rounded-md bg-gradient-to-br opacity-90 text-white", gradient)}>
                <Icon className="w-4 h-4" />
              </div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight">{category.name}</h2>
              {categoryNameEn && (
                <span className="hidden sm:inline-block ml-2 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  {categoryNameEn}
                </span>
              )}
            </div>
          </div>
          <Link
            href={`/shop?cat=${categorySlug}`}
            className="group flex items-center gap-1 text-sm font-bold text-primary hover:text-primary/80 transition-colors"
          >
            مشاهده همه
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          </Link>
        </div>

        {/* Product List */}
        <div className="relative">
          <div className="flex overflow-x-auto gap-4 no-scrollbar snap-x snap-mandatory pb-4 md:grid md:grid-cols-4 lg:grid-cols-5 md:gap-4 md:pb-0 md:overflow-visible">
            {products.map((product) => (
              <div key={product.id} className="w-[260px] shrink-0 snap-start md:w-auto md:shrink-1">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
