"use client";

import { useState, useEffect } from "react";
import { Sparkles, X, ChevronUp, Bot, Code, Palette, Film, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function AiAdvisor() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const categories = [
    { id: "dev", label: "من برنامه‌نویسم", icon: Code, products: [{ name: "اشتراک ChatGPT Plus", slug: "chatgpt-plus" }, { name: "لایسنس GitHub Copilot", slug: "github-copilot" }] },
    { id: "design", label: "من طراح گرافیکم", icon: Palette, products: [{ name: "اشتراک Midjourney", slug: "midjourney" }, { name: "لایسنس Adobe Creative Cloud", slug: "adobe-cc" }] },
    { id: "entertainment", label: "برای دیدن فیلم و سریال", icon: Film, products: [{ name: "اشتراک Netflix", slug: "netflix" }, { name: "اشتراک Spotify", slug: "spotify" }] },
    { id: "video", label: "برای تولید ویدیو با AI", icon: Video, products: [{ name: "اشتراک Runway Gen-2", slug: "runway" }, { name: "اشتراک CapCut Pro", slug: "capcut" }] },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <div 
        className={cn(
          "mb-4 overflow-hidden rounded-2xl border border-primary/30 bg-background/95 p-0 shadow-[0_0_30px_rgba(var(--primary),0.2)] backdrop-blur-xl transition-all duration-300 ease-out",
          isOpen ? "w-[340px] opacity-100 translate-y-0" : "w-0 opacity-0 translate-y-10 pointer-events-none"
        )}
        role="dialog"
        aria-label="مشاور هوشمند لایسنو"
        aria-hidden={!isOpen}
      >
        <div className="bg-gradient-to-r from-primary/20 to-primary/5 p-4 flex items-center justify-between border-b border-primary/10">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" aria-hidden="true" />
            <h3 className="font-bold text-primary" id="advisor-title">مشاور هوشمند لایسنو</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="بستن مشاور هوشمند" className="h-8 w-8 rounded-full hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-primary">
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-4 flex flex-col gap-4">
          <p className="text-sm text-foreground/90 font-medium">به دنبال چه نوع لایسنسی هستید؟ من کمکتون می‌کنم بهترین انتخاب رو داشته باشید.</p>
          
          {!selectedCategory ? (
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={`انتخاب دسته: ${cat.label}`}
                >
                  <cat.icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  {cat.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setSelectedCategory(null)}
                  className="text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1"
                  aria-label="بازگشت به دسته‌ها"
                >
                  بازگشت
                </button>
                <span className="text-xs text-muted-foreground">پیشنهادهای ما:</span>
              </div>
              <div className="flex flex-col gap-2">
                {categories.find(c => c.id === selectedCategory)?.products.map(p => (
                  <Link 
                    key={p.slug} 
                    href={`/product/${p.slug}`}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-sm font-bold transition-colors hover:bg-primary/10 hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {p.name}
                    <ChevronUp className="h-4 w-4 -rotate-90 text-primary" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-600 text-white shadow-[0_0_20px_rgba(var(--primary),0.4)] transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={isOpen ? "بستن مشاور" : "باز کردن مشاور هوشمند"}
      >
        <Sparkles className="h-6 w-6" aria-hidden="true" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
      </button>
    </div>
  );
}
