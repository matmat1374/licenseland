"use client";

import { useState } from "react";
import { ShoppingCart, Zap, Check, ShieldCheck, RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/store/cart";
import { calcDiscountPercent, toToman } from "@/lib/format";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { ProductListItem } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function ProductPurchase({ product }: { product: ProductListItem }) {
  const add = useCart((s) => s.add);
  const openCart = useCart((s) => s.open);
  const router = useRouter();
  const [added, setAdded] = useState(false);

  const discount = calcDiscountPercent(product.price, product.discountPrice);
  const price = product.discountPrice ?? product.price;
  const inStock = product._stock > 0;

  function handleAdd() {
    if (!inStock) return toast.error("این محصول فعلاً ناموجود است");
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

  function handleBuyNow() {
    if (!inStock) return toast.error("این محصول فعلاً ناموجود است");
    add(
      {
        id: product.id,
        slug: product.slug,
        title: product.title,
        price: product.price,
        discountPrice: product.discountPrice,
        image: product.image,
        duration: product.duration,
      },
      1,
      false
    );
    router.push("/checkout");
  }

  return (
    <div className="flex flex-col gap-4">
      {/* price box */}
      <div className="rounded-2xl border bg-card p-5">
        <div className="mb-3 flex items-end justify-between gap-2">
          <div>
            {discount > 0 && (
              <div className="mb-1 flex items-center gap-2">
                <Badge className="bg-rose-500 text-white hover:bg-rose-500">{discount}٪ تخفیف</Badge>
                <span className="text-sm text-muted-foreground line-through">
                  {toToman(product.price)}
                </span>
              </div>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-primary">{toToman(price)}</span>
              <span className="text-sm text-muted-foreground">تومان</span>
            </div>
          </div>
          {product.duration && (
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />
              {product.duration}
            </Badge>
          )}
        </div>

        {/* stock */}
        <div className="mb-4 flex items-center gap-2 text-sm">
          {inStock ? (
            <>
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="font-medium text-emerald-600 dark:text-emerald-400">موجود در انبار</span>
              <span className="text-muted-foreground">({product._stock} عدد آماده تحویل)</span>
            </>
          ) : (
            <>
              <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500" />
              <span className="font-medium text-rose-500">ناموجود</span>
            </>
          )}
        </div>

        {/* actions */}
        <div className="flex flex-col gap-2">
          <Button
            size="lg"
            onClick={handleBuyNow}
            disabled={!inStock}
            className="h-12 gap-2 text-base shadow-lg shadow-primary/20"
          >
            <Zap className="h-4 w-4" />
            خرید و پرداخت آنی
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={handleAdd}
            disabled={!inStock}
            className={cn("h-12 gap-2 text-base", added && "border-emerald-500 text-emerald-600")}
          >
            {added ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
            {added ? "اضافه شد" : "افزودن به سبد"}
          </Button>
        </div>
      </div>

      {/* guarantees */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Zap, label: "تحویل آنی" },
          { icon: ShieldCheck, label: "ضمانت اصالت" },
          { icon: RefreshCw, label: "تعویض ۷ روزه" },
        ].map((g) => (
          <div key={g.label} className="flex flex-col items-center gap-1.5 rounded-xl border bg-card p-3 text-center">
            <g.icon className="h-5 w-5 text-primary" />
            <span className="text-[11px] font-medium">{g.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
