"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  X,
  Bot,
  Code,
  Palette,
  Film,
  Video,
  Shield,
  Search,
  ExternalLink,
  ChevronLeft,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface AdvisorPreset {
  id: string;
  label: string;
  icon: any;
  desc: string;
  recommendations: {
    title: string;
    subtitle: string;
    tag: string;
    href: string;
    badge: string;
  }[];
}

const ADVISOR_PRESETS: AdvisorPreset[] = [
  {
    id: "dev",
    label: "برنامه‌نویسی و هوش مصنوعی",
    icon: Code,
    desc: "بهترین ابزارهای کدنویسی هوشمند و مدل‌های استدلال:",
    recommendations: [
      {
        title: "اشتراک ادیتور هوشمند Cursor AI Pro",
        subtitle: "محیط توسعه هوشمند با پشتیبانی از Claude 3.7 و GPT-4o",
        tag: "پرفروش دولوپرها",
        href: "/product/3061-api-cursor-pro-400-creditsday-1-month-full-warranty",
        badge: "Cursor Pro",
      },
      {
        title: "کلید اختصاصی API کلود Claude Sonnet",
        subtitle: "دسترسی پرسرعت به هوش مصنوعی Anthropic با توکن اختصاصی",
        tag: "استدلال عمیق",
        href: "/product/2814-api-100m-token-claude-1-day-full-warranty",
        badge: "Claude 3.7",
      },
      {
        title: "اشتراک ChatGPT Plus اختصاصی",
        subtitle: "دسترسی به GPT-4o، تحلیل پیشرفته داده و Voice Mode",
        tag: "تحویل فوری",
        href: "/product/3077-chatgpt-plus-30d-no-warranty",
        badge: "ChatGPT Plus",
      },
    ],
  },
  {
    id: "design",
    label: "طراحی و گرافیک",
    icon: Palette,
    desc: "ابزارهای پریمیوم طراحی و تولید تصویر با هوش مصنوعی:",
    recommendations: [
      {
        title: "اشتراک رسمی کنوا پرو Canva Pro",
        subtitle: "دسترسی نامحدود به میلیون‌ها قالب، فونت و ابزارهای هوش مصنوعی",
        tag: "قانونی ۱ ماهه",
        href: "/product/3071-canva-pro-slot-1-month-full-warranty",
        badge: "Canva Pro",
      },
      {
        title: "پنل ادمین کنوا پرو بیزینس Canva Pro Admin",
        subtitle: "امکان افزودن تا ۱۰۰ عضو با پنل مدیریت اختصاصی",
        tag: "ویژه تیم‌ها",
        href: "/product/3091-canva-pro-admin-3-months-24h-warranty",
        badge: "Canva Admin",
      },
      {
        title: "اشتراک ادوبی اکسپرس Adobe Express",
        subtitle: "ابزار ساخت محتوای بصری و ویدیو شبکه‌های اجتماعی",
        tag: "اورجینال",
        href: "/product/2745-adobe-express-12m",
        badge: "Adobe",
      },
    ],
  },
  {
    id: "video",
    label: "ساخت ویدیو و صداگذاری با AI",
    icon: Video,
    desc: "ابزارهای پیشرفته تولید ویدیو و صداگذاری هوش مصنوعی:",
    recommendations: [
      {
        title: "اشتراک ساخت ویدیو Google VEO هوش مصنوعی",
        subtitle: "تولید ویدیوهای سینمایی ۴K با پرامپت اختصاصی",
        tag: "نسخه Ultra",
        href: "/product/1787-gemini-veo-3-ultra-x20-slot-randome-0-25k-credit-1m-full-warranty",
        badge: "Google VEO",
      },
      {
        title: "اشتراک صداگذاری و گویندگی ElevenLabs",
        subtitle: "واقع‌گرایانه‌ترین تبدیل متن به صدا با کلونینگ صدا",
        tag: "Creator",
        href: "/product/2086-elevenlabs-creator-12m",
        badge: "ElevenLabs",
      },
    ],
  },
  {
    id: "streaming",
    label: "فیلم، سریال و موسیقی",
    icon: Film,
    desc: "سرویس‌های استریم پریمیوم با بالاترین کیفیت:",
    recommendations: [
      {
        title: "اکانت نتفلیکس ۴K پریمیوم Ultra HD",
        subtitle: "پروفایل اختصاصی ۴K با گارانتی کامل و زیرنویس فارسی",
        tag: "اسلات اختصاصی",
        href: "/product/2753-slot-netflix-4k-premium-1-month-full-warranty",
        badge: "Netflix 4K",
      },
      {
        title: "اشتراک یوتیوب پریمیوم YouTube Premium",
        subtitle: "پخش بدون تبلیغ در تمام دستگاه‌ها + یوتیوب موزیک",
        tag: "فعال‌سازی روی ایمیل",
        href: "/shop?search=youtube",
        badge: "YouTube",
      },
      {
        title: "اشتراک اسپاتیفای پریمیوم Spotify",
        subtitle: "موسیقی نامحدود با بالاترین کیفیت صوت Hi-Fi",
        tag: "بدون قطعی",
        href: "/shop?search=spotify",
        badge: "Spotify",
      },
    ],
  },
  {
    id: "learning",
    label: "آموزش زبان و مهارت",
    icon: Sparkles,
    desc: "اشتراک‌های تخصصی یادگیری زبان‌های بین‌المللی و دانشگاهی:",
    recommendations: [
      {
        title: "اشتراک دائمی آموزش زبان ممرایز پرو (Memrise Pro)",
        subtitle: "یادگیری سریع مکالمه و لغات با دوره‌های ویدیویی بومی‌زبانان",
        tag: "دائمی و مادام‌العمر",
        href: "/shop?search=memrise",
        badge: "Memrise Pro",
      },
    ],
  },
];

export function AiAdvisor() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    const all = ADVISOR_PRESETS.flatMap((p) => p.recommendations);
    return all.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.subtitle.toLowerCase().includes(q) ||
        r.badge.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  if (!mounted) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 md:left-6 z-40 flex flex-col items-start">
      <div
        className={cn(
          "mb-4 overflow-hidden rounded-3xl border border-primary/30 bg-background/95 p-0 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-all duration-300 ease-out",
          isOpen
            ? "w-[340px] sm:w-[380px] opacity-100 translate-y-0"
            : "w-0 opacity-0 translate-y-10 pointer-events-none"
        )}
        role="dialog"
        aria-label="مشاور هوشمند لایسنو"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/25 via-primary/10 to-transparent p-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-foreground">مشاور هوشمند لایسنو</h3>
              <p className="text-[10px] text-muted-foreground font-medium">پیشنهاد هوشمند لایسنس بدون نیاز به اینترنت</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            aria-label="بستن"
            className="h-8 w-8 rounded-full hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search inside advisor */}
        <div className="p-4 flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="جستجوی سریع ابزار (مثلاً کلود، ویدیو، کنوا)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pr-9 pl-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {searchQuery.trim() ? (
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
              <span className="text-[11px] font-bold text-primary">نتایج مرتبط:</span>
              {searchResults.length > 0 ? (
                searchResults.map((r, idx) => (
                  <Link
                    key={idx}
                    href={r.href}
                    onClick={() => setIsOpen(false)}
                    className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/5 p-3 transition-all hover:bg-primary/10 hover:border-primary/40 hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{r.title}</span>
                      <Badge variant="secondary" className="text-[9px] bg-primary/15 text-primary border-0 font-bold">
                        {r.badge}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-muted-foreground line-clamp-1">{r.subtitle}</span>
                  </Link>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  محصولی یافت نشد. به فروشگاه مراجعه کنید:
                  <Link
                    href={`/shop?search=${encodeURIComponent(searchQuery)}`}
                    onClick={() => setIsOpen(false)}
                    className="mt-2 block font-bold text-primary hover:underline"
                  >
                    جستجو در تمام محصولات فروشگاه ➔
                  </Link>
                </div>
              )}
            </div>
          ) : !selectedCategory ? (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-foreground">زمینه فعالیت یا نیاز خود را انتخاب کنید:</span>
              <div className="grid grid-cols-1 gap-1.5">
                {ADVISOR_PRESETS.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-bold text-foreground transition-all hover:bg-primary/10 hover:border-primary/30"
                  >
                    <div className="flex items-center gap-2">
                      <cat.icon className="h-4 w-4 text-primary" />
                      <span>{cat.label}</span>
                    </div>
                    <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                >
                  ➔ بازگشت به دسته‌ها
                </button>
                <span className="text-[11px] text-muted-foreground font-medium">پیشنهادهای برگزیده</span>
              </div>

              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                {ADVISOR_PRESETS.find((c) => c.id === selectedCategory)?.recommendations.map((r, idx) => (
                  <Link
                    key={idx}
                    href={r.href}
                    onClick={() => setIsOpen(false)}
                    className="group flex flex-col gap-1.5 rounded-2xl border border-white/10 bg-white/5 p-3 transition-all hover:bg-primary/10 hover:border-primary/40 hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                        {r.title}
                      </span>
                      <Badge className="text-[9px] bg-primary/20 text-primary border-0 font-bold">
                        {r.badge}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {r.subtitle}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-[10px]">
                      <span className="font-bold text-amber-500 flex items-center gap-1">
                        <Zap className="h-3 w-3" /> {r.tag}
                      </span>
                      <span className="font-bold text-primary flex items-center gap-0.5">
                        مشاهده و خرید <ChevronLeft className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer link to full shop */}
        <div className="border-t border-white/10 bg-card/40 p-3 text-center">
          <Link
            href="/shop"
            onClick={() => setIsOpen(false)}
            className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
          >
            مشاهده تمام ۷۰۰+ محصول در فروشگاه <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-600 text-white shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-transform hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-expanded={isOpen}
        aria-label={isOpen ? "بستن مشاور" : "باز کردن مشاور هوشمند"}
      >
        <Sparkles className="h-6 w-6 text-white drop-shadow" />
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-300"></span>
        </span>
      </button>
    </div>
  );
}
