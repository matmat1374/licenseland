"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Zap, ShieldCheck, Headphones, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function CreativeHero() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
  }

  const tags = ["ChatGPT", "Spotify", "Gemini", "Windows", "Telegram Stars"];

  return (
    <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-20 bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[360px] bg-primary/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-tight max-w-4xl mx-auto">
          مرجع قانونی لایسنس و اشتراک‌های دیجیتال
        </h1>

        <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          دسترسی فوری به اکانت‌ها و اشتراک‌های قانونی هوش مصنوعی، گیمینگ، استریم و ابزارهای بین‌المللی با تحویل آنی خودکار
        </p>

        {/* Search */}
        <div className="mt-8 max-w-2xl mx-auto w-full">
          <form
            onSubmit={handleSearch}
            className="relative flex items-center bg-card rounded-2xl p-1.5 sm:p-2 border border-border shadow-lg shadow-black/5 focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/10 transition-all"
          >
            <Search className="w-5 h-5 text-muted-foreground mr-3 ml-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی محصول (مثلاً: اسپاتیفای، ویندوز)"
              className="w-full bg-transparent border-none outline-none text-sm sm:text-base text-foreground placeholder:text-muted-foreground py-2.5 px-1"
              dir="rtl"
            />
            <Button
              type="submit"
              className="rounded-xl px-6 sm:px-8 py-2.5 h-11 font-bold text-sm sm:text-base transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
            >
              جستجو
            </Button>
          </form>

          {/* Tags */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            {tags.map((tag) => (
              <Link
                key={tag}
                href={`/shop?search=${tag}`}
                className="text-xs font-medium px-3 py-1 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full transition-colors border border-border/50"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>

        {/* Minimal Trust Bar */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 max-w-3xl mx-auto mt-12 pt-8 border-t border-border/40">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
            <Zap className="w-4 h-4 text-emerald-500" />
            تحویل آنی خودکار
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
            <Repeat className="w-4 h-4 text-blue-500" />
            گارانتی تعویض
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
            <Headphones className="w-4 h-4 text-purple-500" />
            پشتیبانی ۲۴/۷
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            تضمین اصالت
          </div>
        </div>
      </div>
    </section>
  );
}
