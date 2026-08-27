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
      <Card className="glass relative h-full overflow-hidden p-0 border border-white/5 transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 hover:border-primary/30">
        {/* Cover */}
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <ProductCover
            title={product.title}
            brand={product.brand}
            seed={product.slug}
            icon={<Icon className="h-full w-full" />}
            className="h-full w-full transition-transform duration-700 group-hover:scale-110"
          />
          {/* overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
          
          {/* badges */}
          <div className="absolute top-2 right-2 flex flex-col gap-1.5">
            {discount > 0 && (
              <Badge className="bg-destructive text-destructive-foreground shadow-md hover:bg-destructive border-none px-2 py-0.5 animate-in zoom-in font-black">
                {discount}٪ تخفیف
              </Badge>
            )}
            {product.bestseller && (
              <Badge className="bg-amber-500 text-white shadow-md hover:bg-amber-500 border-none px-2 py-0.5">
                پرفروش
              </Badge>
            )}
          </div>
          
          {/* Instant Delivery Tag */}
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="glass border-white/10 text-xs shadow-lg backdrop-blur-md font-medium text-primary">
              <Zap className="mr-1 ml-0.5 h-3 w-3 fill-primary" />
              تحویل آنی
            </Badge>
          </div>
        </div>

        {/* Body */}
        <div className="relative flex flex-col gap-2 p-4">
          <h3 className="line-clamp-1 font-bold text-base leading-6 transition-colors group-hover:text-primary">
            {product.title}
          </h3>
          <p className="line-clamp-2 text-xs text-muted-foreground leading-5 min-h-[2.5rem]">
            {product.shortDesc}
          </p>

          {/* rating */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
            <div className="flex items-center">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-bold text-foreground ml-1">{(product.rating ?? 0).toFixed(1)}</span>
            </div>
            <span className="opacity-40">•</span>
            <span>{product.salesCount}+ فروش</span>
          </div>

          {/* price + action */}
          <div className="mt-2 flex items-end justify-between gap-2 border-t border-white/5 pt-3">
            <div className="flex flex-col">
              {discount > 0 ? (
                <span className="text-xs text-muted-foreground line-through decoration-destructive/50">
                  {toToman(product.price)}
                </span>
              ) : (
                <span className="h-4"></span>
              )}
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-foreground">{toToman(price)}</span>
                <span className="text-[10px] text-muted-foreground font-medium">تومان</span>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!inStock}
              className={cn(
                "h-9 px-4 rounded-xl shadow-md shadow-primary/20 transition-all font-bold",
                added ? "bg-emerald-500 hover:bg-emerald-500 text-white" : "bg-primary hover:bg-primary/90 text-primary-foreground"
              )}
              aria-label="افزودن به سبد"
            >
              {added ? <Check className="h-4 w-4" /> : "خرید"}
            </Button>
          </div>
          {!inStock && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] flex items-center justify-center">
              <Badge variant="destructive" className="px-3 py-1 text-sm font-bold shadow-xl">ناموجود</Badge>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
