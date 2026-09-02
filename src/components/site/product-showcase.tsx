"use client";

import Link from "next/link";
import { ProductCard } from "@/components/site/product-card";
import type { ProductListItem } from "@/lib/queries";
import { getBrandIconUrl } from "@/lib/brand-icons";
import { getProductTitleFa } from "@/lib/translations";
import { calcDiscountPercent, toToman } from "@/lib/format";
import { cn } from "@/lib/utils";

const AI_BRANDS = [
  { title: "دستیار هوشمند OpenAI", brand: "ChatGPT", en: "ChatGPT Plus", icon: "https://cdn.simpleicons.org/openai/ffffff", color: "from-emerald-500 to-teal-600" },
  { title: "هوش مصنوعی Anthropic", brand: "Claude", en: "Claude Pro", icon: "https://cdn.simpleicons.org/anthropic/ffffff", color: "from-amber-600 to-orange-500" },
  { title: "مدل پیشرفته Google", brand: "Gemini", en: "Gemini Advanced", icon: "https://cdn.simpleicons.org/google/ffffff", color: "from-blue-500 to-indigo-600" },
  { title: "تولید تصویر شاهکار", brand: "Midjourney", en: "Midjourney Pro", icon: "https://cdn.simpleicons.org/midjourney/ffffff", color: "from-zinc-700 to-black" },
  { title: "ابزار کدنویسی سریع", brand: "Cursor AI", en: "Cursor Pro", icon: "https://cdn.simpleicons.org/cursor/ffffff", color: "from-slate-600 to-slate-800" },
];

export function ProductShowcase({ products }: { products: ProductListItem[] }) {
  if (!products || products.length === 0) return null;

  
  return (
    <div className="w-full overflow-hidden bg-muted/30 py-10 relative border-y border-border/50">
      <div className="container mx-auto px-4 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">🔥 پرفروش‌ترین‌ها</h2>
        </div>
      </div>
      <div className="absolute inset-y-0 z-10 pointer-events-none bg-gradient-to-l from-muted/30 via-transparent w-24 left-0"></div>
      <div className="absolute inset-y-0 z-10 pointer-events-none bg-gradient-to-r from-muted/30 via-transparent w-24 right-0"></div>
      
      <div className="flex w-max animate-marquee gap-5 hover:[animation-play-state:paused]">
        {[...AI_BRANDS, ...AI_BRANDS, ...AI_BRANDS].map((p, i) => (
          <Link href={`/shop?q=${p.brand}`} key={`${p.brand}-${i}`} className="w-64 bg-card rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 border border-border flex items-center gap-4 shrink-0 cursor-pointer group hover:-translate-y-1">
            <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br shadow-inner", p.color)}>
              <img src={p.icon} width={28} height={28} alt={p.brand} className="object-contain filter invert brightness-0 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="flex flex-col flex-1 truncate">
              <span className="font-extrabold text-sm text-foreground truncate group-hover:text-primary transition-colors">{p.en}</span>
              <span className="text-xs text-muted-foreground mt-0.5 truncate">{p.title}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
