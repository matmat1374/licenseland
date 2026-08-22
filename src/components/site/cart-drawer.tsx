"use client";

import Link from "next/link";
import { ShoppingCart, X, Plus, Minus, Trash2, ShieldCheck } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/store/cart";
import { ProductCover } from "./product-cover";
import { toToman } from "@/lib/format";
import { useMounted } from "@/hooks/use-mounted";

export function CartDrawer() {
  const { items, isOpen, close, setQty, remove, subtotal, count } = useCart();
  const mounted = useMounted();

  const total = mounted ? subtotal() : 0;
  const cnt = mounted ? count() : 0;

  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && close()}>
      <SheetContent side="left" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="flex items-center justify-between text-right">
            <span className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              سبد خرید {cnt > 0 && <span className="text-sm text-muted-foreground">({cnt})</span>}
            </span>
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <ShoppingCart className="h-9 w-9 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">سبد خرید شما خالی است</p>
              <p className="mt-1 text-sm text-muted-foreground">محصولات مورد علاقه را اضافه کنید</p>
            </div>
            <Button asChild onClick={close}>
              <Link href="/shop">مشاهده محصولات</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-3">
              {items.map((item) => (
                <div key={item.id} className="mb-2 flex gap-3 rounded-xl border bg-card p-3">
                  <ProductCover
                    title={item.title}
                    seed={item.slug}
                    className="h-16 w-16 shrink-0 rounded-lg"
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/product/${item.slug}`}
                        onClick={close}
                        className="line-clamp-2 text-sm font-medium hover:text-primary"
                      >
                        {item.title}
                      </Link>
                      <button
                        onClick={() => remove(item.id)}
                        className="text-muted-foreground hover:text-rose-500"
                        aria-label="حذف"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {item.duration && (
                      <span className="text-xs text-muted-foreground">{item.duration}</span>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1 rounded-lg border">
                        <button
                          onClick={() => setQty(item.id, item.quantity - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-r-lg hover:bg-accent"
                          aria-label="کاهش"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => setQty(item.id, item.quantity + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-l-lg hover:bg-accent"
                          aria-label="افزایش"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="text-sm font-bold text-primary">
                        {toToman((item.discountPrice ?? item.price) * item.quantity)}
                        <span className="mr-1 text-[10px] text-muted-foreground">ت</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">مبلغ قابل پرداخت</span>
                <div className="text-left">
                  <span className="text-lg font-extrabold text-primary">{toToman(total)}</span>
                  <span className="mr-1 text-xs text-muted-foreground">تومان</span>
                </div>
              </div>
              <div className="mb-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                پرداخت امن از طریق درگاه زرین‌پال
              </div>
              <Button asChild size="lg" className="w-full" onClick={close}>
                <Link href="/checkout">تسویه حساب و پرداخت</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="mt-2 w-full" onClick={close}>
                <Link href="/cart">مشاهده سبد کامل</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
