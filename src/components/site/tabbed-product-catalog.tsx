"use client";

import { useState } from "react";
import { ProductCard } from "./product-card";
import type { ProductListItem } from "@/lib/queries";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryData {
  id: string;
  label: string;
  href: string;
  products: ProductListItem[];
}

export function TabbedProductCatalog({
  bestsellers,
  ai,
  streaming,
  gaming,
  devTools,
  design,
}: {
  bestsellers: ProductListItem[];
  ai: ProductListItem[];
  streaming: ProductListItem[];
  gaming: ProductListItem[];
  devTools: ProductListItem[];
  design: ProductListItem[];
}) {
  const tabs: CategoryData[] = [
    { id: "bestsellers", label: "پرفروش‌ترین‌ها", href: "/shop", products: bestsellers },
    { id: "ai", label: "هوش مصنوعی", href: "/shop?cat=ai", products: ai },
    { id: "streaming", label: "استریم و فیلم", href: "/shop?cat=streaming", products: streaming },
    { id: "gaming", label: "گیمینگ و بازی‌ها", href: "/shop?cat=gaming", products: gaming },
    { id: "devtools", label: "ابزارهای توسعه", href: "/shop?cat=developer-tools", products: devTools },
    { id: "design", label: "طراحی و گرافیک", href: "/shop?cat=design-graphics", products: design },
  ];

  const [activeTab, setActiveTab] = useState(tabs[0].id);

  const activeCategory = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        
        {/* Tabs - horizontal scroll on mobile */}
        <div className="flex overflow-x-auto pb-4 mb-6 md:mb-8 hide-scrollbar scroll-smooth">
          <div className="flex items-center gap-2 sm:gap-4 mx-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "whitespace-nowrap px-4 py-2.5 rounded-full text-sm font-bold transition-all",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {activeCategory.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        
        {/* Empty state handle */}
        {activeCategory.products.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            هیچ محصولی در این دسته یافت نشد.
          </div>
        )}

        {/* View all button */}
        <div className="mt-10 text-center flex justify-center">
          <Link
            href={activeCategory.href}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-card border border-border/60 hover:bg-muted text-sm font-bold transition-colors shadow-sm"
          >
            مشاهده همه محصولات این دسته
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
