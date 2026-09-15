"use client";

import Link from "next/link";
import { Star, Zap, Check } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCover } from "./product-cover";
import { useCart } from "@/store/cart";
import { calcDiscountPercent, toToman } from "@/lib/format";
import { toast } from "sonner";
import type { ProductListItem } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { trackSelectItem } from "@/lib/gtag";

export function ProductCard({ product }: { product: ProductListItem }) {
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);
  const discount = calcDiscountPercent(product.price, product.discountPrice);
  const price = product.discountPrice ?? product.price;
  const inStock = Boolean(product.isActive) && (product.stock ?? 0) > 0 && (product._stock ?? 0) > 0;

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) {
      toast.error("محصول ناموجود است.");
      return;
    }
    add({
      id: product.id,
      slug: product.slug,
      title: product.title,
      price: product.price,
      discountPrice: product.discountPrice,
      image: product.image,
      duration: product.duration,
    });
    setAdded(true);
    toast.success("به سبد خرید اضافه شد.");
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <Link 
      href={`/product/${product.slug}`} 
      className="group block h-full"
      onClick={() => trackSelectItem({
        id: product.id,
        title: product.title,
        price: price,
        category: product.category,
      })}
    >
      <Card className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-0 transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:-translate-y-1",
        !inStock && "opacity-75 grayscale-[20%] hover:opacity-95 hover:grayscale-0 transition-all"
      )}>
        {/* Cover 16:10 with soft transition */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted/40">
          <ProductCover
            title={product.title}
            brand={product.brand}
            seed={product.slug}
            image={product.image}
            className="h-full w-full transition-transform duration-500 group-hover:scale-105"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Badges on Top: Only ONE badge */}
          <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 z-10">
            {!inStock ? (
              <Badge variant="secondary" className="bg-muted/90 text-muted-foreground border border-border/60 text-[11px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm shadow-xs">
                ناموجود
              </Badge>
            ) : discount > 0 ? (
              <Badge className="bg-rose-500/90 backdrop-blur-sm text-white shadow-sm border-none px-2 py-0.5 text-[11px] font-bold rounded-md">
                {discount}٪ تخفیف
              </Badge>
            ) : product.bestseller ? (
              <Badge className="bg-amber-500/90 backdrop-blur-sm text-white shadow-sm border-none px-2.5 py-0.5 text-[11px] font-bold rounded-md">
                پرفروش‌ترین
              </Badge>
            ) : null}
          </div>
        </div>

        {/* Card Body */}
        <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-4 gap-2.5">
          <div>
            {product.duration && !product.duration.includes("گیفت کارت") && !product.title?.includes(product.duration) ? (
              <span className="mb-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md w-fit">
                {product.duration}
              </span>
            ) : product.duration?.includes("گیفت کارت") && !product.title?.includes("گیفت کارت") ? (
              <span className="mb-2 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md w-fit">
                💳 گیفت کارت
              </span>
            ) : null}
            <h3
              className="text-xs sm:text-sm font-bold line-clamp-2 leading-relaxed break-words text-foreground group-hover:text-primary transition-colors min-h-[2.6rem]"
              dir="rtl"
            >
              {product.title}
            </h3>

            <div className="flex items-center justify-between text-xs mt-2.5">
              {product.rating && product.rating > 0 && product.reviewCount > 0 ? (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-foreground text-xs">
                    {product.rating.toFixed(1)}
                  </span>
                </div>
              ) : <div className="h-4"></div>}
            </div>
          </div>

          {/* Price + Action Row */}
          <div className="mt-1 pt-3 border-t border-border/40 flex items-center justify-between gap-2">
            <div className="flex flex-col justify-end">
              {discount > 0 && (
                <span className="text-[11px] text-muted-foreground/70 line-through leading-none mb-0.5">
                  {toToman(product.price)}
                </span>
              )}
              <div className="flex items-baseline gap-1">
                <span className="text-lg sm:text-xl font-black tracking-tight text-foreground">
                  {toToman(price)}
                </span>
                <span className="text-[11px] font-bold text-muted-foreground">تومان</span>
              </div>
            </div>

            {!inStock ? (
              <Button
                size="sm"
                disabled
                variant="secondary"
                className="h-8 sm:h-9 px-3 rounded-xl font-bold text-xs opacity-60 cursor-not-allowed bg-muted text-muted-foreground border border-border/50"
              >
                ناموجود
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={!inStock}
                className={cn(
                  "h-8 sm:h-9 px-3 sm:px-4 rounded-xl font-bold text-xs transition-all shadow-sm shrink-0 cursor-pointer",
                  added
                    ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-primary/25"
                )}
                aria-label="افزودن"
              >
                {added ? <Check className="h-4 w-4" /> : "افزودن"}
              </Button>
            )}
          </div>
        </div>

      </Card>
    </Link>
  );
}
