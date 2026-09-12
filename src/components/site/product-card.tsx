"use client";

import Link from "next/link";
import { Star, Zap, Check } from "lucide-react";
import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCover } from "./product-cover";
import { useCart } from "@/store/cart";
import { calcDiscountPercent, toToman } from "@/lib/format";
import { toast } from "sonner";
import type { ProductListItem } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: ProductListItem }) {
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);
  const discount = calcDiscountPercent(product.price, product.discountPrice);
  const price = product.discountPrice ?? product.price;
  const inStock = product._stock > 0;

  // Calculate approximate or recorded USD price
  const usdPrice = useMemo(() => {
    if (product.specifications) {
      try {
        const s =
          typeof product.specifications === "string"
            ? JSON.parse(product.specifications)
            : product.specifications;
        const val = s?.price_usd ?? s?.cost_usd;
        if (val && !isNaN(Number(val)) && Number(val) > 0) {
          return `$${Number(val).toFixed(2)}`;
        }
      } catch (e) {}
    }
    if (price > 0) {
      const est = price / 95000;
      return `$${est.toFixed(2)}`;
    }
    return null;
  }, [product.specifications, price]);

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) {
      toast.error("این محصول فعلاً ناموجود است");
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
    toast.success("به سبد خرید اضافه شد");
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <Link href={`/product/${product.slug}`} className="group block h-full">
      <Card className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-0 transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:-translate-y-1">
        {/* Cover 16:10 with soft transition */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted/40">
          <ProductCover
            title={product.title}
            brand={product.brand}
            seed={product.slug}
            image={product.image}
            className="h-full w-full transition-transform duration-500 group-hover:scale-105"
          />

          {/* Subtle overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Badges on Top */}
          <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 z-10">
            {product.bestseller && (
              <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md border-none px-2.5 py-0.5 text-[11px] font-bold rounded-md">
                پرفروش‌ترین
              </Badge>
            )}
            {discount > 0 && (
              <Badge className="bg-rose-500 text-white shadow-md border-none px-2 py-0.5 text-[11px] font-bold rounded-md animate-in zoom-in">
                {discount}٪ تخفیف
              </Badge>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-4 gap-2.5">
          <div>
            {/* Clean Persian 2-line title */}
            <h3
              className="line-clamp-2 font-bold text-sm sm:text-base leading-snug text-foreground group-hover:text-primary transition-colors min-h-[2.6rem]"
              dir="rtl"
            >
              {product.title}
            </h3>

            {/* Clean Row: Star Rating + Small Green Badge "تحویل آنی" */}
            <div className="flex items-center justify-between text-xs mt-2.5">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="font-bold text-foreground text-xs">
                  {(product.rating && product.rating > 0 ? product.rating : 4.8).toFixed(1)}
                </span>
                {product.salesCount > 0 && (
                  <>
                    <span className="text-muted-foreground/30">•</span>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {product.salesCount}+ فروش
                    </span>
                  </>
                )}
              </div>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Zap className="h-2.5 w-2.5 fill-current" />
                تحویل آنی
              </span>
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
                <span className="text-base sm:text-lg font-black tracking-tight text-foreground">
                  {toToman(price)}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">تومان</span>
              </div>
              {usdPrice && (
                <span className="text-[10px] font-mono text-muted-foreground/75 dir-ltr">
                  ~ {usdPrice}
                </span>
              )}
            </div>

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
              aria-label="خرید"
            >
              {added ? (
                <span className="flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" />
                  ثبت شد
                </span>
              ) : (
                "خرید"
              )}
            </Button>
          </div>
        </div>

        {/* Out of Stock Overlay */}
        {!inStock && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center z-20">
            <Badge variant="destructive" className="px-3 py-1 text-xs font-bold shadow-xl">
              ناموجود
            </Badge>
          </div>
        )}
      </Card>
    </Link>
  );
}
