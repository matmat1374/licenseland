"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  Zap,
  Headphones,
  Smartphone,
  Gamepad2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type CreativeHeroProps = {
  content?: any;
  categories?: any[];
  heroProducts?: any[];
};

export function CreativeHero(_props: CreativeHeroProps = {}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/shop?search=${encodeURIComponent(q)}`);
    } else {
      router.push("/shop");
    }
  }

  // Categories with counts matching irmarket.store/fa
  const categoryPills = [
    { name: "چت‌بات‌های AI", count: "۶۲", href: "/shop?cat=ai" },
    { name: "بازی‌ها", count: "۳۵", href: "/shop?cat=gaming" },
    { name: "طراحی", count: "۵۸", href: "/shop?cat=design" },
    { name: "استریم", count: "۵۲", href: "/shop?cat=streaming" },
    { name: "ابزارهای توسعه", count: "۱۵۲", href: "/shop?cat=dev-tools" },
    { name: "شبکه‌های اجتماعی", count: "۲۸", href: "/shop?cat=social" },
  ];

  // 6 Quick brand icons
  const brandIcons = [
    {
      name: "ChatGPT",
      href: "/shop?search=ChatGPT",
      icon: (
        <svg className="w-5 h-5 text-[#10A37F]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.28 11.45c-.17-1.04-.6-2.01-1.25-2.83-.68-.84-1.55-1.5-2.52-1.91V6.52c0-1.12-.42-2.19-1.17-3.02C16.59 2.68 15.52 2.2 14.4 2.2H9.6c-1.12 0-2.19.48-2.94 1.3-.75.83-1.17 1.9-1.17 3.02v.19c-.97.41-1.84 1.07-2.52 1.91-.65.82-1.08 1.79-1.25 2.83-.17 1.06-.05 2.14.33 3.14.37.99.98 1.86 1.76 2.52.79.66 1.74 1.11 2.76 1.28.17 1.04.6 2.01 1.25 2.83.68.84 1.55 1.5 2.52 1.91v.19c0 1.12.42 2.19 1.17 3.02.75.82 1.82 1.3 2.94 1.3h4.8c1.12 0 2.19-.48 2.94-1.3.75-.83 1.17-1.9 1.17-3.02v-.19c.97-.41 1.84-1.07 2.52-1.91.65-.82 1.08-1.79 1.25-2.83.17-1.06.05-2.14-.33-3.14-.37-.99-.98-1.86-1.76-2.52-.79-.66-1.74-1.11-2.76-1.28zm-3.06 6.09c-.44.57-1.03 1-1.71 1.25-.06-.5-.22-.98-.48-1.42l-2.4-4.16v-4.8l2.4 4.16c.38.66.57 1.41.57 2.18v2.79zm-7.62 3.86c-.73 0-1.42-.3-1.93-.81-.51-.51-.81-1.2-.81-1.93v-3.86l3.34 1.93c.33.19.72.29 1.11.29s.78-.1 1.11-.29l1.45-.84v2.75c0 .73-.3 1.42-.81 1.93-.51.51-1.2.81-1.93.81h-1.53zm-6.27-5.11c-.57-.44-1-1.03-1.25-1.71.5.06.98.22 1.42.48l4.16 2.4-2.4 4.16-3.93-5.33zm1.61-7.79c.44-.57 1.03-1 1.71-1.25.06.5.22.98.48 1.42l2.4 4.16v4.8l-2.4-4.16c-.38-.66-.57-1.41-.57-2.18V8.5zm7.62-3.86c.73 0 1.42.3 1.93.81.51.51.81 1.2.81 1.93v3.86l-3.34-1.93c-.66-.38-1.55-.38-2.22 0l-1.45.84V7.4c0-.73.3-1.42.81-1.93.51-.51 1.2-.81 1.93-.81h1.53zm6.27 5.11c.57.44 1 1.03 1.25 1.71-.5-.06-.98-.22-1.42-.48l-4.16-2.4 2.4-4.16 3.93 5.33zm-4.32 4.41l-2.75 1.59-2.75-1.59V11.2l2.75-1.59 2.75 1.59v3.18z" />
        </svg>
      ),
    },
    {
      name: "Spotify",
      href: "/shop?search=Spotify",
      icon: (
        <svg className="w-5 h-5 text-[#1DB954]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.434-5.308-1.758-8.793-.963-.335.077-.67-.133-.746-.469-.077-.334.132-.67.467-.747 3.808-.87 7.076-.496 9.721 1.118.295.18.388.563.208.854zm1.226-2.723c-.226.367-.706.482-1.072.257-2.687-1.652-6.785-2.131-9.965-1.166-.413.127-.849-.106-.973-.517-.125-.413.108-.849.52-.973 3.632-1.102 8.147-.568 11.233 1.328.366.226.481.707.257 1.071zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71c-.494.15-1.016-.129-1.165-.623-.149-.495.13-1.016.624-1.165 3.532-1.073 9.404-.866 13.115 1.338.445.264.59.838.327 1.282-.264.443-.838.59-1.281.324z" />
        </svg>
      ),
    },
    {
      name: "Netflix",
      href: "/shop?search=Netflix",
      icon: (
        <svg className="w-5 h-5 text-[#E50914]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 2h4.5l5.5 13.5V2H18v20h-4.5L8 8.5V22H4V2z" />
        </svg>
      ),
    },
    {
      name: "PUBG UC",
      href: "/shop?search=PUBG",
      icon: <Gamepad2 className="w-5 h-5 text-amber-500" />,
    },
    {
      name: "Apple",
      href: "/shop?search=Apple",
      icon: (
        <svg className="w-5 h-5 text-foreground" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.98.6-2.62 1.35-.57.65-1.06 1.71-.93 2.73 1 .08 2-.48 2.62-1.23z" />
        </svg>
      ),
    },
    {
      name: "شماره مجازی",
      href: "/shop?cat=virtual-numbers",
      icon: <Smartphone className="w-5 h-5 text-teal-500" />,
    },
  ];

  return (
    <section className="relative overflow-hidden pt-8 pb-12 sm:pt-12 sm:pb-16 bg-gradient-to-b from-primary/5 via-background to-background">
      {/* Background subtle light effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[360px] bg-primary/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10 text-center">
        {/* Top Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {categoryPills.map((pill) => (
            <Link
              key={pill.name}
              href={pill.href}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-card/80 hover:bg-card border border-border/70 hover:border-primary/50 text-foreground/80 hover:text-primary transition-all shadow-xs"
            >
              <span>{pill.name}</span>
              <span className="text-[11px] font-bold text-muted-foreground dir-ltr">
                ({pill.count})
              </span>
            </Link>
          ))}
        </div>

        {/* Big Catchy Heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-tight max-w-4xl mx-auto">
          چت‌جی‌پی‌تی پلاس و جمنای پرو —{" "}
          <span className="bg-gradient-to-l from-purple-600 via-primary to-indigo-600 bg-clip-text text-transparent">
            تحویل آنی
          </span>
        </h1>

        <p className="mt-4 text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          دسترسی فوری به اکانت‌ها و اشتراک‌های قانونی هوش مصنوعی، گیمینگ، استریم و ابزارهای بین‌المللی
        </p>

        {/* Direct Search Input with Purple Button */}
        <div className="mt-8 max-w-2xl mx-auto w-full">
          <form
            onSubmit={handleSearch}
            className="relative flex items-center bg-card rounded-2xl p-1.5 sm:p-2 border border-border/80 shadow-lg shadow-black/5 focus-within:border-purple-500/60 focus-within:ring-4 focus-within:ring-purple-500/10 transition-all"
          >
            <Search className="w-5 h-5 text-muted-foreground mr-3 ml-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی محصول، لایسنس یا اکانت... (مثلاً: جمنای پرو، چت‌جی‌پی‌تی)"
              className="w-full bg-transparent border-none outline-none text-sm sm:text-base text-foreground placeholder:text-muted-foreground py-2.5 px-1"
              dir="rtl"
            />
            <Button
              type="submit"
              className="rounded-xl px-5 sm:px-8 py-2.5 h-11 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm sm:text-base transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-purple-600/25 cursor-pointer shrink-0"
            >
              جستجو
            </Button>
          </form>
        </div>

        {/* 3 Trust Stat Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-3xl mx-auto w-full mt-8 sm:mt-10">
          <div className="flex items-center justify-center gap-3 p-3.5 rounded-2xl bg-card/70 border border-border/60 shadow-xs backdrop-blur-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-right">
              <div className="text-base sm:text-lg font-black text-foreground">۷٬۸۰۰+</div>
              <div className="text-xs text-muted-foreground font-medium">سفارش تحویل‌شده</div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 p-3.5 rounded-2xl bg-card/70 border border-border/60 shadow-xs backdrop-blur-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div className="text-right">
              <div className="text-base sm:text-lg font-black text-foreground">۱ دقیقه</div>
              <div className="text-xs text-muted-foreground font-medium">میانگین تحویل</div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 p-3.5 rounded-2xl bg-card/70 border border-border/60 shadow-xs backdrop-blur-xs">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div className="text-right">
              <div className="text-base sm:text-lg font-black text-foreground">۲۴ ساعته</div>
              <div className="text-xs text-muted-foreground font-medium">پشتیبانی آنلاین</div>
            </div>
          </div>
        </div>

        {/* 6 Quick Brand Icons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 max-w-4xl mx-auto">
          {brandIcons.map((b) => (
            <Link
              key={b.name}
              href={b.href}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card/80 hover:bg-card border border-border/60 hover:border-primary/40 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 group"
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                {b.icon}
              </div>
              <span className="text-xs font-bold text-foreground/90 group-hover:text-primary transition-colors">
                {b.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
