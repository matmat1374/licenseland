"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Flame, Sparkles } from "lucide-react";
import { ProductCard } from "./product-card";
import { Button } from "@/components/ui/button";
import type { ProductListItem } from "@/lib/queries";

export function BestsellersSlider({ products }: { products: ProductListItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(direction: "left" | "right") {
    if (!scrollRef.current) return;
    const offset = direction === "left" ? -320 : 320;
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  }

  if (!products || products.length === 0) return null;

  return (
    <section className="w-full py-10 bg-gradient-to-b from-amber-500/[0.03] via-transparent to-transparent">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-1.5 text-amber-500 font-bold text-xs mb-1.5">
              <Flame className="w-4 h-4 fill-amber-500" />
              <span>انتخاب اول کاربران</span>
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                پرفروش‌ترین‌ها
              </h2>
              <span className="text-xs text-muted-foreground font-medium hidden sm:inline-block">
                (۱۰ محصول منتخب با بیشترین رضایت و تحویل فوری)
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            <Link
              href="/shop?sort=popular"
              className="text-xs sm:text-sm font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              مشاهده همه
              <ChevronLeft className="w-4 h-4" />
            </Link>

            {/* Scroll Navigation Arrows */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                onClick={() => scroll("right")}
                className="h-8 w-8 rounded-full border-border/60 hover:border-primary/50"
                aria-label="قبلی"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => scroll("left")}
                className="h-8 w-8 rounded-full border-border/60 hover:border-primary/50"
                aria-label="بعدی"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Horizontal Smooth Snap Scroll */}
        <div
          ref={scrollRef}
          className="flex overflow-x-auto gap-4 no-scrollbar snap-x snap-mandatory pb-4 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="w-[240px] sm:w-[260px] md:w-[280px] shrink-0 snap-start"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
