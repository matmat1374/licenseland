"use client";

import Link from "next/link";
import { Star, Zap, ShoppingCart, Check } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCover } from "./product-cover";
import { useCart } from "@/store/cart";
import { calcDiscountPercent } from "@/lib/format";
import { toToman } from "@/lib/format";
import { toast } from "sonner";
import * as Icons from "lucide-react";
import type { ProductListItem } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: ProductListItem }) {
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);
  const discount = calcDiscountPercent(product.price, product.discountPrice);
  const price = product.discountPrice ?? product.price;
  const inStock = product._stock > 0;

  const Icon = (Icons as any)[product.tags?.split(",")[0]?.trim() || ""] || Icons.KeyRound;

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
    toast.success("به سبد اضافه شد");
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <Link href={`/product/${product.slug}`} className="group block h-full">
      <Card className="relative h-full overflow-hidden p-0 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 hover:border-primary/40">
        {/* Cover */}
        <div className="relative aspect-[16/10] w-full">
          <ProductCover
            title={product.title}
            brand={product.brand}
            seed={product.slug}
            icon={<Icon className="h-full w-full" />}
            className="h-full w-full transition-transform duration-500 group-hover:scale-105"
          />
          {/* badges */}
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {discount > 0 && (
              <Badge className="bg-rose-500 text-white shadow-md hover:bg-rose-500">
                {discount}٪ تخفیف
              </Badge>
            )}
            {product.bestseller && (
              <Badge className="bg-amber-500 text-white shadow-md hover:bg-amber-500">
                پرفروش
              </Badge>
            )}
          </div>
          {product.duration && (
            <div className="absolute bottom-2 left-2">
              <Badge variant="secondary" className="glass text-foreground shadow-md">
                <Zap className="ml-1 h-3 w-3 text-primary" />
                {product.duration}
              </Badge>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 font-bold text-base leading-6 group-hover:text-primary transition-colors">
              {product.title}
            </h3>
          </div>
          <p className="line-clamp-2 text-xs text-muted-foreground leading-5 min-h-[2.5rem]">
            {product.shortDesc}
          </p>

          {/* rating */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-medium text-foreground">{(product.rating ?? 0).toFixed(1)}</span>
            <span>({product.reviewCount} نظر)</span>
            <span className="mx-1">•</span>
            <span>{product.salesCount}+ فروش</span>
          </div>

          {/* price + action */}
          <div className="mt-1 flex items-end justify-between gap-2">
            <div className="flex flex-col">
              {discount > 0 && (
                <span className="text-xs text-muted-foreground line-through">
                  {toToman(product.price)}
                </span>
              )}
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-extrabold text-primary">{toToman(price)}</span>
                <span className="text-[11px] text-muted-foreground">تومان</span>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!inStock}
              className={cn(
                "h-9 w-9 rounded-full p-0 shadow-md transition-all",
                added && "bg-emerald-500 hover:bg-emerald-500"
              )}
              aria-label="افزودن به سبد"
            >
              {added ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
            </Button>
          </div>
          {!inStock && (
            <span className="text-[11px] font-medium text-rose-500">ناموجود</span>
          )}
        </div>
      </Card>
    </Link>
  );
}
