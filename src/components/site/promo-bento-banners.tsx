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
import * as Icons from "lucide-react";

function MiniProductCard({ product }: { product: ProductListItem }) {
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);
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
    <Link href={`/product/${product.slug}`} className="group flex items-center gap-3 rounded-xl bg-black/20 p-2 hover:bg-black/40 transition-colors border border-white/5 hover:border-white/20">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg relative">
        <ProductCover
          title={product.title}
          brand={product.brand}
          seed={product.slug}
          icon={<Icon className="h-full w-full" />}
          className="h-full w-full"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="truncate text-sm font-bold text-white" dir="rtl">{product.title}</h4>
        <p className="truncate text-xs text-white/60 font-mono mt-0.5" dir="ltr">{product.shortDesc}</p>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs font-bold text-white/90">{toToman(price)} تومان</span>
        </div>
      </div>
      <button 
        type="button"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white hover:text-black disabled:opacity-50"
        onClick={handleAdd}
        disabled={!inStock}
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
        <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900 via-fuchsia-900 to-indigo-950 p-8 text-white shadow-2xl transition-all duration-300 hover:shadow-purple-500/20 md:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          {/* Neon Glow */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-purple-500/30 blur-3xl transition-all group-hover:bg-fuchsia-500/40"></div>
          
          {/* 3D Floating Images */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <img src="/slider/brain.png" alt="" className="absolute -left-8 -top-8 h-48 w-48 object-contain opacity-80 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all duration-700 group-hover:scale-110 group-hover:rotate-12 group-hover:opacity-100" />
            <img src="/slider/gemini.png" alt="" className="absolute left-1/3 -bottom-10 h-32 w-32 object-contain opacity-60 drop-shadow-[0_0_15px_rgba(217,70,239,0.5)] transition-all duration-700 delay-100 group-hover:scale-110 group-hover:-translate-y-4 group-hover:-rotate-6 group-hover:opacity-100" />
            <img src="/slider/owl.png" alt="" className="absolute -right-4 bottom-1/4 h-36 w-36 object-contain opacity-60 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-700 delay-200 group-hover:scale-110 group-hover:-translate-x-4 group-hover:rotate-6 group-hover:opacity-100" />
          </div>
          
          <div className="relative z-10 flex h-full flex-col justify-between gap-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/20 px-3 py-1 text-xs font-medium text-purple-200 backdrop-blur-md">
                  <Zap className="h-3 w-3 text-fuchsia-400" />
                  <span>{content.banner1_badge || "⚡ تحویل زیر ۵ دقیقه"}</span>
                </div>
                <h3 className="text-3xl font-black md:text-4xl">
                  {content.banner1_title_line1 || "پکیج سلطنتی"}<br />
                  <span className="bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">{content.banner1_title_line2 || "هوش مصنوعی"}</span>
                </h3>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-xl font-bold backdrop-blur-md">
                {content.banner1_discount || "-۴۰٪"}
              </div>
            </div>

            <div>
              <p className="mb-6 text-purple-200/80">
                {content.banner1_description || "قدرتمندترین مدل‌های زبانی جهان را در یک پکیج شگفت‌انگیز تجربه کنید."}
              </p>
              
              <div className="mb-8 flex flex-col gap-3">
                {banner1Products.map((p) => (
                  <MiniProductCard key={p.id} product={p} />
                ))}
              </div>

              <Link
                href={content.banner1_link || "/shop?cat=ai"}
                className="inline-flex w-full justify-center items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-purple-900 transition-transform hover:scale-[1.02] hover:bg-purple-50"
              >
                {content.banner1_button_text || "خرید سریع پکیج"}
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Banner 2: Developer & Pro Creator */}
        <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-950 p-8 text-white shadow-2xl transition-all duration-300 hover:shadow-cyan-500/20 md:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          {/* Neon Glow */}
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/30 blur-3xl transition-all group-hover:bg-emerald-500/40"></div>
          
          {/* 3D Floating Images */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <img src="/slider/alberto.png" alt="" className="absolute -right-8 -top-8 h-48 w-48 object-contain opacity-80 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-700 group-hover:scale-110 group-hover:-rotate-12 group-hover:opacity-100" />
            <img src="/slider/youtube.png" alt="" className="absolute right-1/3 -bottom-10 h-32 w-32 object-contain opacity-60 drop-shadow-[0_0_15px_rgba(20,184,166,0.5)] transition-all duration-700 delay-100 group-hover:scale-110 group-hover:-translate-y-4 group-hover:rotate-6 group-hover:opacity-100" />
            <img src="/slider/lion.png" alt="" className="absolute -left-4 bottom-1/4 h-36 w-36 object-contain opacity-60 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all duration-700 delay-200 group-hover:scale-110 group-hover:translate-x-4 group-hover:-rotate-6 group-hover:opacity-100" />
          </div>
          
          <div className="relative z-10 flex h-full flex-col justify-between gap-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/20 px-3 py-1 text-xs font-medium text-cyan-200 backdrop-blur-md">
                  <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  <span>{content.banner2_badge || "💎 لایسنس ۱۰۰٪ قانونی"}</span>
                </div>
                <h3 className="text-3xl font-black md:text-4xl">
                  {content.banner2_title_line1 || "کیت تخصصی"}<br />
                  <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">{content.banner2_title_line2 || "دولوپر و طراح"}</span>
                </h3>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-xl font-bold backdrop-blur-md">
                {content.banner2_discount || "ویژه"}
              </div>
            </div>

            <div>
              <p className="mb-6 text-cyan-200/80">
                {content.banner2_description || "ابزارهای حرفه‌ای برای کدنویسی سریع‌تر و طراحی خلاقانه‌تر."}
              </p>
              
              <div className="mb-8 flex flex-col gap-3">
                {banner2Products.map((p) => (
                  <MiniProductCard key={p.id} product={p} />
                ))}
              </div>

              <Link
                href={content.banner2_link || "/shop?cat=developer"}
                className="inline-flex w-full justify-center items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-teal-900 transition-transform hover:scale-[1.02] hover:bg-cyan-50"
              >
                {content.banner2_button_text || "ورود به کاتالوگ محصولات"}
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
