"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Zap, ShieldCheck, CheckCircle2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductListItem } from "@/lib/queries";
import { useCart } from "@/store/cart";
import { toast } from "sonner";
import { ProductCover } from "./product-cover";
import { toToman } from "@/lib/format";

function MiniProductCard({ product }: { product: ProductListItem }) {
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);
  const price = product.discountPrice ?? product.price;
  const inStock = product._stock > 0;

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
    toast.success(`${product.title} به سبد خرید اضافه شد`);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <Link 
      href={`/product/${product.slug}`} 
      className="group/card flex items-center gap-3 rounded-2xl bg-black/25 p-2.5 hover:bg-black/45 transition-all duration-200 border border-white/10 hover:border-white/25 backdrop-blur-md shadow-sm hover:shadow-md"
    >
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl relative border border-white/15 shadow-md bg-black/30">
        <ProductCover
          title={product.title}
          brand={product.brand}
          seed={product.slug}
          image={product.image}
          hideLabel={true}
          className="h-full w-full object-cover transition-transform duration-300 group-hover/card:scale-105"
          size="sm"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="truncate text-sm font-bold text-white transition-colors group-hover/card:text-white/95" dir="rtl">
          {product.title}
        </h4>
        <p className="truncate text-xs text-white/60 font-mono mt-0.5" dir="ltr">
          {product.shortDesc || product.slug}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs font-bold text-white/95">
            {toToman(price)} تومان
          </span>
          {product.discountPrice && product.discountPrice < product.price && (
            <span className="text-[11px] text-white/45 line-through">
              {toToman(product.price)}
            </span>
          )}
        </div>
      </div>
      <button 
        type="button"
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200 shadow-md",
          added 
            ? "bg-emerald-500 text-white scale-105" 
            : "bg-white/15 text-white hover:bg-white hover:text-black active:scale-95",
          !inStock && "opacity-40 cursor-not-allowed hover:bg-white/15 hover:text-white"
        )}
        onClick={handleAdd}
        disabled={!inStock}
        title={inStock ? "افزودن به سبد خرید" : "ناموجود"}
        aria-label="افزودن به سبد خرید"
      >
        {added ? <CheckCircle2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      </button>
    </Link>
  );
}

export function PromoBentoBanners({ 
  content, 
  banner1Products = [], 
  banner2Products = [] 
}: { 
  content: Record<string, string>;
  banner1Products?: ProductListItem[];
  banner2Products?: ProductListItem[];
}) {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Banner 1: AI Elite Suite */}
        <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900 via-fuchsia-900 to-indigo-950 p-8 text-white shadow-2xl transition-all duration-300 hover:shadow-purple-500/20 md:p-10 flex flex-col justify-between">
          <div className="pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          {/* Neon Glow */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-purple-500/30 blur-3xl transition-all group-hover:bg-fuchsia-500/40"></div>
          
          {/* 3D Floating Images - Pure Alpha Transparent */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <img src="/slider/brain.png" alt="" className="absolute -left-6 -top-6 h-52 w-52 object-contain opacity-85 drop-shadow-[0_0_25px_rgba(168,85,247,0.6)] transition-all duration-700 group-hover:scale-110 group-hover:rotate-12 group-hover:opacity-100" />
            <img src="/slider/bubble.png" alt="" className="absolute left-1/3 -bottom-8 h-32 w-32 object-contain opacity-70 drop-shadow-[0_0_20px_rgba(217,70,239,0.6)] mix-blend-screen transition-all duration-700 delay-100 group-hover:scale-110 group-hover:-translate-y-3 group-hover:opacity-100" />
            <img src="/slider/owl.png" alt="" className="absolute -right-6 bottom-1/4 h-40 w-40 object-contain opacity-75 drop-shadow-[0_0_20px_rgba(99,102,241,0.6)] transition-all duration-700 delay-200 group-hover:scale-110 group-hover:-translate-x-3 group-hover:rotate-6 group-hover:opacity-100" />
          </div>
          
          <div className="relative z-10 flex h-full flex-col justify-between gap-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/20 px-3 py-1 text-xs font-medium text-purple-200 backdrop-blur-md">
                  <Zap className="h-3 w-3 text-fuchsia-400" />
                  <span>{content.banner1_badge || "⚡ دسترسی سریع و قانونی"}</span>
                </div>
                <h3 className="text-3xl font-black md:text-4xl leading-tight">
                  {content.banner1_title_line1 || "مجموعه برگزیده"}<br />
                  <span className="bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                    {content.banner1_title_line2 || "هوش مصنوعی"}
                  </span>
                </h3>
              </div>
              <div className="flex px-4 py-2 items-center justify-center rounded-2xl bg-white/10 text-sm font-black backdrop-blur-md">
                {content.banner1_discount || "🔥 پرطرفدار"}
              </div>
            </div>

            <div>
              <p className="mb-6 text-purple-200/80 leading-relaxed text-sm">
                {content.banner1_description || "اشتراک قانونی برترین هوش‌های مصنوعی جهان (Gemini، Claude، Cursor) با فعالسازی آنی و گارانتی."}
              </p>
              
              <div className="mb-6 flex flex-col gap-3">
                {banner1Products.map((p) => (
                  <MiniProductCard key={p.id} product={p} />
                ))}
              </div>

              <Link
                href={content.banner1_link || "/shop?cat=ai"}
                className="group/btn flex w-full items-center justify-center gap-2.5 rounded-2xl bg-white px-6 py-3.5 text-sm font-black text-purple-950 shadow-xl shadow-purple-950/30 transition-all duration-300 hover:bg-purple-50 hover:shadow-purple-500/30 hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>{content.banner1_button_text || "مشاهده همه سرویس‌های هوش مصنوعی"}</span>
                <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover/btn:-translate-x-1.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Banner 2: Under 500k Tomans (Popular & Budget-Friendly) */}
        <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-950 p-8 text-white shadow-2xl transition-all duration-300 hover:shadow-cyan-500/20 md:p-10 flex flex-col justify-between">
          <div className="pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          {/* Neon Glow */}
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/30 blur-3xl transition-all group-hover:bg-emerald-500/40"></div>
          
          {/* 3D Floating Images - Pure Alpha Transparent */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <img src="/slider/alberto.png" alt="" className="absolute -right-6 -top-6 h-52 w-52 object-contain opacity-85 drop-shadow-[0_0_25px_rgba(16,185,129,0.6)] transition-all duration-700 group-hover:scale-110 group-hover:-rotate-12 group-hover:opacity-100" />
            <img src="/slider/bubble.png" alt="" className="absolute right-1/3 -bottom-8 h-32 w-32 object-contain opacity-70 drop-shadow-[0_0_20px_rgba(20,184,166,0.6)] mix-blend-screen transition-all duration-700 delay-100 group-hover:scale-110 group-hover:-translate-y-3 group-hover:opacity-100" />
            <img src="/slider/lion.png" alt="" className="absolute -left-6 bottom-1/4 h-40 w-40 object-contain opacity-80 drop-shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-all duration-700 delay-200 group-hover:scale-110 group-hover:translate-x-3 group-hover:-rotate-6 group-hover:opacity-100" />
          </div>
          
          <div className="relative z-10 flex h-full flex-col justify-between gap-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/20 px-3 py-1 text-xs font-medium text-cyan-200 backdrop-blur-md">
                  <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  <span>{content.banner2_badge || "💎 اقتصادی و کاربردی"}</span>
                </div>
                <h3 className="text-3xl font-black md:text-4xl leading-tight">
                  {content.banner2_title_line1 || "اشتراک‌های محبوب"}<br />
                  <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    {content.banner2_title_line2 || "زیر ۵۰۰ هزار تومان"}
                  </span>
                </h3>
              </div>
              <div className="flex px-4 py-2 items-center justify-center rounded-2xl bg-white/10 text-sm font-black backdrop-blur-md">
                {content.banner2_discount || "ارزش خرید بالا"}
              </div>
            </div>

            <div>
              <p className="mb-6 text-cyan-200/80 leading-relaxed text-sm">
                {content.banner2_description || "سرویس‌های اوریجینال اسپاتیفای، تلگرام استارز و کپکات با قیمت به‌صرفه و تحویل آنی."}
              </p>
              
              <div className="mb-6 flex flex-col gap-3">
                {banner2Products.map((p) => (
                  <MiniProductCard key={p.id} product={p} />
                ))}
              </div>

              <Link
                href={content.banner2_link || "/shop"}
                className="group/btn flex w-full items-center justify-center gap-2.5 rounded-2xl bg-white px-6 py-3.5 text-sm font-black text-teal-950 shadow-xl shadow-teal-950/30 transition-all duration-300 hover:bg-cyan-50 hover:shadow-cyan-500/30 hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>{content.banner2_button_text || "مشاهده همه محصولات اقتصادی"}</span>
                <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover/btn:-translate-x-1.5" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
