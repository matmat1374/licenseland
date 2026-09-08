"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const brands = [
  { name: "OpenAI", color: "#10a37f", tag: "هوش مصنوعی", href: "/shop?cat=ai&search=openai",
    svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M22.28 11.45c-.17-1.04-.6-2.01-1.25-2.83-.68-.84-1.55-1.5-2.52-1.91V6.52c0-1.12-.42-2.19-1.17-3.02C16.59 2.68 15.52 2.2 14.4 2.2H9.6c-1.12 0-2.19.48-2.94 1.3-.75.83-1.17 1.9-1.17 3.02v.19c-.97.41-1.84 1.07-2.52 1.91-.65.82-1.08 1.79-1.25 2.83-.17 1.06-.05 2.14.33 3.14.37.99.98 1.86 1.76 2.52.79.66 1.74 1.11 2.76 1.28.17 1.04.6 2.01 1.25 2.83.68.84 1.55 1.5 2.52 1.91v.19c0 1.12.42 2.19 1.17 3.02.75.82 1.82 1.3 2.94 1.3h4.8c1.12 0 2.19-.48 2.94-1.3.75-.83 1.17-1.9 1.17-3.02v-.19c.97-.41 1.84-1.07 2.52-1.91.65-.82 1.08-1.79 1.25-2.83.17-1.06.05-2.14-.33-3.14-.37-.99-.98-1.86-1.76-2.52-.79-.66-1.74-1.11-2.76-1.28zm-3.06 6.09c-.44.57-1.03 1-1.71 1.25-.06-.5-.22-.98-.48-1.42l-2.4-4.16v-4.8l2.4 4.16c.38.66.57 1.41.57 2.18v2.79zm-7.62 3.86c-.73 0-1.42-.3-1.93-.81-.51-.51-.81-1.2-.81-1.93v-3.86l3.34 1.93c.33.19.72.29 1.11.29s.78-.1 1.11-.29l1.45-.84v2.75c0 .73-.3 1.42-.81 1.93-.51.51-1.2.81-1.93.81h-1.53zm-6.27-5.11c-.57-.44-1-1.03-1.25-1.71.5.06.98.22 1.42.48l4.16 2.4-2.4 4.16-3.93-5.33zm1.61-7.79c.44-.57 1.03-1 1.71-1.25.06.5.22.98.48 1.42l2.4 4.16v4.8l-2.4-4.16c-.38-.66-.57-1.41-.57-2.18V8.5zm7.62-3.86c.73 0 1.42.3 1.93.81.51.51.81 1.2.81 1.93v3.86l-3.34-1.93c-.66-.38-1.55-.38-2.22 0l-1.45.84V7.4c0-.73.3-1.42.81-1.93.51-.51 1.2-.81 1.93-.81h1.53zm6.27 5.11c.57.44 1 1.03 1.25 1.71-.5-.06-.98-.22-1.42-.48l-4.16-2.4 2.4-4.16 3.93 5.33zm-4.32 4.41l-2.75 1.59-2.75-1.59V11.2l2.75-1.59 2.75 1.59v3.18z"/></svg>
  },
  { name: "Anthropic", color: "#d97706", tag: "هوش مصنوعی", href: "/shop?cat=ai&search=anthropic",
    svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12 2L2 22h4l2-4h8l2 4h4L12 2zm0 4.5l3 6H9l3-6z"/></svg>
  },
  { name: "Google Gemini", color: "#4285f4", tag: "هوش مصنوعی", href: "/shop?cat=ai&search=gemini",
    svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.5 14H8v-2h8.5v2zm0-4H8v-2h8.5v2z"/></svg>
  },
  { name: "Midjourney", color: "#06b6d4", tag: "تولید تصویر", href: "/shop?cat=ai&search=midjourney",
    svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 13.5l-4.5-2.5 4.5-2.5 4.5 2.5-4.5 2.5z"/></svg>
  },
  { name: "Cursor AI", color: "#6366f1", tag: "کدنویسی", href: "/shop?cat=ai&search=cursor",
    svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2.5L17.5 9H13V4.5zM12 18H8v-2h4v2zm4-4H8v-2h8v2z"/></svg>
  },
  { name: "GitHub Copilot", color: "#f3f4f6", tag: "کدنویسی", href: "/shop?cat=ai&search=copilot",
    svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.09.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/></svg>
  },
  { name: "Spotify", color: "#1db954", tag: "استریم موسیقی", href: "/shop?search=spotify",
    svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.6 14.4c-.2.3-.5.4-.8.2-2.2-1.3-4.9-1.6-8.1-.9-.3.1-.7-.1-.8-.4-.1-.3.1-.7.4-.8 3.5-.8 6.5-.4 9 1.1.4.1.4.5.3.8zm1.2-2.7c-.2.4-.7.5-1 .3-2.5-1.5-6.3-2-8.8-1.1-.4.1-.9-.1-1.1-.5-.1-.4.1-.9.5-1.1 3-1 7.2-.4 10.1 1.4.4.3.5.7.3 1zm.1-2.9c-3-1.8-7.9-2-10.7-1.1-.5.1-1-.1-1.2-.6-.2-.5.1-1 .6-1.2 3.3-1 8.8-.7 12.3 1.4.5.3.6.8.4 1.3-.2.4-.7.6-1.4.2z"/></svg>
  },
  { name: "YouTube", color: "#ff0000", tag: "استریم بدون تبلیغ", href: "/shop?search=youtube",
    svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M21.58 6.42a2.68 2.68 0 00-1.89-1.89C17.98 4 12 4 12 4s-5.98 0-7.69.53a2.68 2.68 0 00-1.89 1.89C2 8.13 2 12 2 12s0 3.87.53 5.58a2.68 2.68 0 001.89 1.89C6.02 20 12 20 12 20s5.98 0 7.69-.53a2.68 2.68 0 001.89-1.89C22 15.87 22 12 22 12s0-3.87-.42-5.58zM10 15V9l5.5 3L10 15z"/></svg>
  },
  { name: "Canva", color: "#00c4cc", tag: "طراحی", href: "/shop?search=canva",
    svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M12 6a6 6 0 100 12 6 6 0 000-12zm-3 8a3 3 0 116 0H9z"/></svg>
  },
  { name: "Adobe", color: "#ff0000", tag: "طراحی گرافیک", href: "/shop?search=adobe",
    svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M14.5 3L22 21H17l-1.5-4h-7L7 21H2L9.5 3h5zM12 8.5L9.5 15h5L12 8.5z"/></svg>
  },
  { name: "Netflix", color: "#e50914", tag: "فیلم و سریال", href: "/shop?search=netflix",
    svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M6 3h4l4 10V3h4v18h-4l-4-10v10H6V3z"/></svg>
  },
  { name: "JetBrains", color: "#f97316", tag: "توسعه دهنده", href: "/shop?search=jetbrains",
    svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M22 2h-6l-4 4 4 4h6V2zm-9 9l-4 4 4 4h9v-8h-9zm-6-2L2 13v9h9l4-4-4-4-4 4-3-3 3-6z"/></svg>
  },
  { name: "Notion", color: "#ffffff", tag: "یادداشت و مدیریت", href: "/shop?search=notion",
    svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M8 8v8l8-8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  },
  { name: "Telegram", color: "#26a5e4", tag: "تلگرام استارز", href: "/shop?search=telegram",
    svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M21.9 2.9c-.3-.2-.7-.3-1.1-.1L2.2 10.4c-.6.3-.7 1.1-.1 1.4l5.3 1.7 1.8 5.6c.1.3.4.4.7.4.2 0 .4-.1.5-.2l3.2-3 4.5 3.3c.4.3 1 .1 1.2-.4l4.2-16c.1-.4-.2-.8-.6-.3zM7.9 12.3L17.2 6 9.4 13l-.2 3-1.3-3.7z"/></svg>
  },
  { name: "Xbox", color: "#107c10", tag: "گیم پس", href: "/shop?search=xbox",
    svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4 15.5l-4-3-4 3v-9l4-3 4 3v9z"/></svg>
  },
  { name: "Figma", color: "#f24e1e", tag: "طراحی رابط کاربری", href: "/shop?search=figma",
    svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12 12a3 3 0 103 3 3 3 0 00-3-3zm-6 0a3 3 0 103 3 3 3 0 00-3-3zm0-6a3 3 0 103 3 3 3 0 00-3-3zm6 0a3 3 0 103 3 3 3 0 00-3-3zm0 6a3 3 0 103 3 3 3 0 00-3-3z"/></svg>
  }
];

export function BrandMarquee() {
  return (
    <section className="relative w-full overflow-hidden bg-background py-16">
      {/* Title */}
      <div className="container mx-auto mb-10 text-center px-4">
        <h2 className="text-2xl font-bold md:text-3xl">لایسنس اورجینال برترین برندهای دنیا</h2>
        <p className="mt-2 text-muted-foreground">با تضمین بهترین قیمت و تحویل آنی</p>
      </div>

      {/* Marquee Wrapper */}
      <div className="relative flex w-full flex-col gap-6 overflow-hidden">
        {/* Top Fade */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-[15%] bg-gradient-to-r from-background to-transparent"></div>
        
        {/* Bottom Fade */}
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-[15%] bg-gradient-to-l from-background to-transparent"></div>
        
        {/* First Marquee Row */}
        <div className="flex w-max animate-marquee-fast hover:[animation-play-state:paused]">
          {[...brands, ...brands].map((brand, i) => (
            <BrandCard key={`${brand.name}-1-${i}`} brand={brand} />
          ))}
        </div>

        {/* Second Marquee Row (Reverse) */}
        <div className="flex w-max animate-marquee-fast-reverse hover:[animation-play-state:paused]">
          {[...brands, ...brands].reverse().map((brand, i) => (
            <BrandCard key={`${brand.name}-2-${i}`} brand={brand} />
          ))}
        </div>
      </div>
    </section>
  );
}

function BrandCard({ brand }: { brand: typeof brands[0] }) {
  return (
    <Link
      href={brand.href}
      className={cn(
        "group relative mx-3 flex h-24 w-64 items-center justify-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition-all duration-300 hover:-translate-y-1 hover:bg-white/10 dark:bg-black/20 dark:hover:bg-black/40",
        "backdrop-blur-md"
      )}
    >
      {/* Glow Effect */}
      <div
        className="absolute inset-0 -z-10 rounded-2xl opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-20"
        style={{ backgroundColor: brand.color }}
      ></div>

      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-background/50 text-foreground transition-colors group-hover:text-white"
        style={{ color: brand.color }}
      >
        {brand.svg}
      </div>

      <div className="flex flex-col">
        <span className="text-base font-bold text-foreground">{brand.name}</span>
        <span className="text-xs text-muted-foreground">{brand.tag}</span>
      </div>
    </Link>
  );
}
