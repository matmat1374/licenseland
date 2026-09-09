"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Sparkles,
  Zap,
  ShieldCheck,
  Clock,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Flame,
  CheckCircle2,
  TrendingDown,
  Gift,
  ExternalLink,
  Pause,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeroSlideItem } from "@/lib/content";
import { toToman, toTomanWithUnit } from "@/lib/format";
import { toFa } from "@/lib/date";
import { ProductCover } from "@/components/site/product-cover";

interface HeroCampaignSliderProps {
  slides: HeroSlideItem[];
  autoplayIntervalMs?: number;
}

// Color theme definitions mapped to slide.badgeColor
const THEMES = {
  emerald: {
    accent: "emerald",
    glowGradient: "from-emerald-500/25 via-teal-500/15 to-transparent",
    ambientLight: "rgba(16, 185, 129, 0.18)",
    badgeBg: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10",
    badgePulse: "bg-emerald-400",
    titleGradient: "from-emerald-400 via-teal-300 to-cyan-400",
    cardBorder: "border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.15)]",
    cardGlow: "rgba(16, 185, 129, 0.2)",
    priceColor: "text-emerald-400",
    priceBg: "bg-emerald-950/40 border-emerald-500/30",
    btnGradient:
      "from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30",
    tagBg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
    progressActive: "bg-emerald-400",
    scarcityBar: "from-emerald-500 to-teal-400",
    iconColor: "text-emerald-400",
  },
  purple: {
    accent: "purple",
    glowGradient: "from-purple-500/25 via-violet-500/15 to-transparent",
    ambientLight: "rgba(168, 85, 247, 0.18)",
    badgeBg: "bg-purple-500/15 text-purple-300 border-purple-500/40 shadow-purple-500/10",
    badgePulse: "bg-purple-400",
    titleGradient: "from-purple-400 via-violet-300 to-indigo-300",
    cardBorder: "border-purple-500/30 shadow-[0_0_40px_rgba(168,85,247,0.15)]",
    cardGlow: "rgba(168, 85, 247, 0.2)",
    priceColor: "text-purple-400",
    priceBg: "bg-purple-950/40 border-purple-500/30",
    btnGradient:
      "from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30",
    tagBg: "bg-purple-500/10 text-purple-300 border-purple-500/25",
    progressActive: "bg-purple-400",
    scarcityBar: "from-purple-500 to-violet-400",
    iconColor: "text-purple-400",
  },
  amber: {
    accent: "amber",
    glowGradient: "from-amber-500/25 via-orange-500/15 to-transparent",
    ambientLight: "rgba(245, 158, 11, 0.18)",
    badgeBg: "bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-amber-500/10",
    badgePulse: "bg-amber-400",
    titleGradient: "from-amber-400 via-orange-300 to-yellow-300",
    cardBorder: "border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.15)]",
    cardGlow: "rgba(245, 158, 11, 0.2)",
    priceColor: "text-amber-400",
    priceBg: "bg-amber-950/40 border-amber-500/30",
    btnGradient:
      "from-amber-500 via-orange-600 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-amber-600/30",
    tagBg: "bg-amber-500/10 text-amber-300 border-amber-500/25",
    progressActive: "bg-amber-400",
    scarcityBar: "from-amber-500 to-orange-400",
    iconColor: "text-amber-400",
  },
  cyan: {
    accent: "cyan",
    glowGradient: "from-cyan-500/25 via-sky-500/15 to-transparent",
    ambientLight: "rgba(6, 182, 212, 0.18)",
    badgeBg: "bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-cyan-500/10",
    badgePulse: "bg-cyan-400",
    titleGradient: "from-cyan-400 via-sky-300 to-teal-300",
    cardBorder: "border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.15)]",
    cardGlow: "rgba(6, 182, 212, 0.2)",
    priceColor: "text-cyan-400",
    priceBg: "bg-cyan-950/40 border-cyan-500/30",
    btnGradient:
      "from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:to-sky-500 text-white shadow-cyan-600/30",
    tagBg: "bg-cyan-500/10 text-cyan-300 border-cyan-500/25",
    progressActive: "bg-cyan-400",
    scarcityBar: "from-cyan-500 to-sky-400",
    iconColor: "text-cyan-400",
  },
  rose: {
    accent: "rose",
    glowGradient: "from-rose-500/25 via-pink-500/15 to-transparent",
    ambientLight: "rgba(244, 63, 94, 0.18)",
    badgeBg: "bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-rose-500/10",
    badgePulse: "bg-rose-400",
    titleGradient: "from-rose-400 via-pink-300 to-fuchsia-300",
    cardBorder: "border-rose-500/30 shadow-[0_0_40px_rgba(244,63,94,0.15)]",
    cardGlow: "rgba(244, 63, 94, 0.2)",
    priceColor: "text-rose-400",
    priceBg: "bg-rose-950/40 border-rose-500/30",
    btnGradient:
      "from-rose-600 via-pink-600 to-red-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-rose-600/30",
    tagBg: "bg-rose-500/10 text-rose-300 border-rose-500/25",
    progressActive: "bg-rose-400",
    scarcityBar: "from-rose-500 to-pink-400",
    iconColor: "text-rose-400",
  },
};

export function HeroCampaignSlider({
  slides,
  autoplayIntervalMs = 7000,
}: HeroCampaignSliderProps) {
  // Filter active slides only
  const activeSlides = slides && slides.length > 0
    ? slides.filter((s) => s.active !== false)
    : [];

  const effectiveSlides = activeSlides.length > 0 ? activeSlides : slides;
  const count = effectiveSlides.length;

  const [[page, direction], setPage] = useState<[number, number]>([0, 0]);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  // Active slide index wrapped around
  const currentIndex = ((page % count) + count) % count;
  const currentSlide = effectiveSlides[currentIndex] || effectiveSlides[0];

  const themeKey = currentSlide?.badgeColor || "purple";
  const theme = THEMES[themeKey] || THEMES.purple;

  const paginate = useCallback(
    (newDirection: number) => {
      setPage(([prevPage]) => [prevPage + newDirection, newDirection]);
      setProgress(0);
    },
    []
  );

  const goToSlide = useCallback(
    (index: number) => {
      const dir = index > currentIndex ? 1 : -1;
      setPage([index, dir]);
      setProgress(0);
    },
    [currentIndex]
  );

  // Timer & progress bar handling
  useEffect(() => {
    if (count <= 1 || isPaused) return;

    const stepMs = 50;
    const increment = (stepMs / autoplayIntervalMs) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          paginate(1);
          return 0;
        }
        return prev + increment;
      });
    }, stepMs);

    return () => clearInterval(timer);
  }, [count, isPaused, autoplayIntervalMs, paginate]);

  // Touch Swipe detection handlers
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) {
      setIsPaused(false);
      return;
    }
    const diff = touchStartX.current - touchEndX.current;
    // In RTL: swipe left (positive diff) means go to next, swipe right means prev
    if (diff > 50) {
      paginate(1);
    } else if (diff < -50) {
      paginate(-1);
    }
    touchStartX.current = null;
    touchEndX.current = null;
    setIsPaused(false);
  };

  if (!currentSlide) return null;

  const savings = Math.max(0, currentSlide.originalPrice - currentSlide.salePrice);

  return (
    <section
      className="relative w-full overflow-hidden pt-4 pb-8 md:pt-6 md:pb-12"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="کمپین‌های تخفیف ویژه لایسنو"
    >
      {/* Dynamic ambient lights matching current slide theme */}
      <motion.div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl h-[360px] rounded-full blur-[140px] opacity-70 transition-colors duration-1000"
        style={{ backgroundColor: theme.ambientLight }}
      />
      <motion.div
        className="pointer-events-none absolute top-1/3 -right-20 w-[300px] h-[300px] rounded-full blur-[120px] opacity-40 transition-colors duration-1000"
        style={{ backgroundColor: theme.ambientLight }}
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Outer Glassmorphic Card */}
        <div
          className={`relative rounded-3xl overflow-hidden border backdrop-blur-2xl bg-card/65 transition-all duration-700 ${theme.cardBorder}`}
        >
          {/* Subtle Top Glowing Line */}
          <div
            className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r ${theme.glowGradient}`}
          />

          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={page}
              custom={direction}
              initial={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, x: direction > 0 ? 60 : -60, scale: 0.98 }
              }
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, x: direction < 0 ? 60 : -60, scale: 0.98 }
              }
              transition={{
                duration: 0.45,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 p-6 sm:p-8 lg:p-12 items-center"
            >
              {/* ================= RIGHT COLUMN (TEXT & PRICE & CTA) ================= */}
              <div className="lg:col-span-7 flex flex-col justify-center space-y-6 order-2 lg:order-1">
                {/* Badges & Urgency bar */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Main Campaign Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold border backdrop-blur-md shadow-sm transition-all duration-500 ${theme.badgeBg}`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full animate-pulse ${theme.badgePulse}`}
                    />
                    {currentSlide.badge}
                  </span>

                  {/* Urgency / Scarcity notice */}
                  {currentSlide.urgencyText && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm animate-pulse">
                      <Flame className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
                      <span>{currentSlide.urgencyText}</span>
                    </div>
                  )}
                </div>

                {/* Hero Titles */}
                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-[42px] font-black text-foreground tracking-tight leading-tight">
                    {currentSlide.titleLine1}
                  </h2>
                  <div
                    className={`text-xl sm:text-2xl lg:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r ${theme.titleGradient} leading-tight`}
                  >
                    {currentSlide.titleLine2}
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
                  {currentSlide.description}
                </p>

                {/* 3 Key Value Features (Risk Reversal & Proof) */}
                {currentSlide.features && currentSlide.features.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    {currentSlide.features.slice(0, 3).map((feat, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs sm:text-[13px] font-medium backdrop-blur-sm transition-colors ${theme.tagBg}`}
                      >
                        <CheckCircle2 className={`h-4 w-4 shrink-0 ${theme.iconColor}`} />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* ============ PRICE ANCHORING & DISCOUNT CARD ============ */}
                <div
                  className={`p-4 sm:p-5 rounded-2xl border backdrop-blur-md flex flex-wrap items-center justify-between gap-4 transition-all duration-500 ${theme.priceBg}`}
                >
                  {/* Prices side */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>قیمت آزاد:</span>
                      <span className="line-through decoration-rose-500/80 decoration-2 font-bold text-muted-foreground/80">
                        {toTomanWithUnit(currentSlide.originalPrice)}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-xs sm:text-sm font-semibold text-muted-foreground">
                        قیمت لایسنو:
                      </span>
                      <span
                        className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight ${theme.priceColor}`}
                      >
                        {toToman(currentSlide.salePrice)}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-foreground">
                        تومان
                      </span>
                    </div>

                    {savings > 0 && (
                      <div className="text-[11px] sm:text-xs font-semibold text-emerald-400 flex items-center gap-1">
                        <TrendingDown className="h-3.5 w-3.5" />
                        <span>سود شما از این خرید: {toToman(savings)} تومان</span>
                      </div>
                    )}
                  </div>

                  {/* Discount Badge Box */}
                  <div className="flex items-center gap-2 bg-gradient-to-br from-rose-500 to-red-600 text-white px-4 py-2.5 rounded-2xl shadow-lg shadow-rose-500/25 shrink-0 animate-bounce [animation-duration:3s]">
                    <span className="text-2xl sm:text-3xl font-black">
                      ٪{toFa(currentSlide.discountPercent)}
                    </span>
                    <div className="text-right text-[10px] leading-tight font-extrabold uppercase tracking-wider">
                      <div>تخفیف</div>
                      <div>ویژه</div>
                    </div>
                  </div>
                </div>

                {/* Dual CTA Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button
                    asChild
                    size="lg"
                    className={`h-13 px-8 rounded-2xl font-black text-base shadow-xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] bg-gradient-to-r ${theme.btnGradient}`}
                  >
                    <Link href={currentSlide.ctaLink} className="flex items-center gap-2">
                      <Zap className="h-5 w-5 fill-current" />
                      <span>{currentSlide.ctaText}</span>
                      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    </Link>
                  </Button>

                  {currentSlide.secondaryCtaText && (
                    <Button
                      asChild
                      variant="outline"
                      size="lg"
                      className="h-13 px-6 rounded-2xl font-bold text-sm border-white/15 bg-white/5 hover:bg-white/10 backdrop-blur-md transition-all duration-200"
                    >
                      <Link
                        href={currentSlide.secondaryCtaLink || currentSlide.ctaLink}
                        className="flex items-center gap-2"
                      >
                        <span>{currentSlide.secondaryCtaText}</span>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              {/* ================= LEFT COLUMN (3D FLOATING SHOWCASE) ================= */}
              <div className="lg:col-span-5 flex items-center justify-center relative order-1 lg:order-2 py-4 lg:py-0">
                {/* Floating 3D Graphic Card */}
                <motion.div
                  animate={
                    prefersReducedMotion
                      ? {}
                      : {
                          y: [0, -12, 0],
                          rotateZ: [-0.5, 0.5, -0.5],
                        }
                  }
                  transition={{
                    repeat: Infinity,
                    duration: 5,
                    ease: "easeInOut",
                  }}
                  className="relative w-full max-w-[340px] sm:max-w-[380px] aspect-square flex items-center justify-center"
                >
                  {/* Ambient Glow Aura */}
                  <div
                    className="absolute inset-0 rounded-3xl blur-3xl opacity-60 transition-colors duration-700"
                    style={{ backgroundColor: theme.ambientLight }}
                  />

                  {/* Main Branded Showcase Box */}
                  <div className="relative z-10 w-full h-full rounded-3xl overflow-hidden border border-white/15 bg-gradient-to-b from-card/90 via-card/80 to-background/90 shadow-2xl p-6 flex flex-col justify-between backdrop-blur-2xl">
                    {/* Top Guarantee Pills */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary/15 text-primary border border-primary/25 backdrop-blur-md">
                        <Zap className="h-3 w-3 fill-primary" />
                        <span>تحویل آنی ۲۴/۷</span>
                      </div>

                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 backdrop-blur-md">
                        <ShieldCheck className="h-3 w-3" />
                        <span>گارانتی ۱۰۰٪</span>
                      </div>
                    </div>

                    {/* Central Product Art Cover */}
                    <div className="my-auto flex flex-col items-center justify-center text-center space-y-4 py-4">
                      <div className="relative group cursor-pointer transition-transform duration-300 hover:scale-105">
                        <ProductCover
                          title={currentSlide.titleLine1}
                          brand={currentSlide.productSlug || currentSlide.badge}
                          seed={currentSlide.id}
                          image={currentSlide.image}
                          size="lg"
                          hideLabel
                          className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl shadow-2xl border border-white/20"
                        />
                        {/* Shimmer light bar across the icon */}
                        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                          <div className="absolute -inset-full top-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-[shimmer_3s_infinite]" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-extrabold text-base sm:text-lg text-foreground line-clamp-1">
                          {currentSlide.titleLine1}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-1 font-medium">
                          {currentSlide.titleLine2}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Scarcity Mini-Bar */}
                    <div className="space-y-1.5 pt-2 border-t border-white/10">
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3 text-amber-400" />
                          <span>مهلت کمپین تخفیف</span>
                        </span>
                        <span className="text-rose-400 font-bold">ظرفیت محدود</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden relative">
                        <motion.div
                          initial={{ width: "20%" }}
                          animate={{ width: "82%" }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                          className={`h-full rounded-full bg-gradient-to-r ${theme.scarcityBar}`}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* ================= BOTTOM NAVIGATION & PROGRESS BAR ================= */}
          <div className="relative border-t border-white/10 bg-card/40 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
            {/* Slide Index & Pause Indicator */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-foreground">
                <span className="text-primary font-black text-sm">
                  {toFa(currentIndex + 1).padStart(2, "۰")}
                </span>
                <span className="text-muted-foreground/60 mx-1">/</span>
                <span className="text-muted-foreground">
                  {toFa(count).padStart(2, "۰")}
                </span>
              </span>

              {isPaused ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  <Pause className="h-2.5 w-2.5" />
                  <span>متوقف شده</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                  <Play className="h-2.5 w-2.5 text-primary" />
                  <span className="hidden sm:inline">چرخش خودکار</span>
                </span>
              )}
            </div>

            {/* Segmented Interactive Progress Bars */}
            <div className="flex items-center gap-2 flex-1 max-w-md mx-2">
              {effectiveSlides.map((slide, idx) => {
                const isActive = idx === currentIndex;
                const isPassed = idx < currentIndex;

                return (
                  <button
                    key={slide.id || idx}
                    type="button"
                    onClick={() => goToSlide(idx)}
                    className="relative flex-1 h-2 rounded-full overflow-hidden bg-white/10 transition-all hover:h-2.5 group cursor-pointer"
                    title={slide.titleLine1}
                    aria-label={`اسلاید شماره ${toFa(idx + 1)}`}
                  >
                    <div
                      className={`h-full rounded-full transition-all ${
                        isActive
                          ? theme.progressActive
                          : isPassed
                          ? "bg-white/40"
                          : "bg-transparent"
                      }`}
                      style={{
                        width: isActive ? `${progress}%` : isPassed ? "100%" : "0%",
                        transition: isActive ? "width 50ms linear" : "width 300ms ease",
                      }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Prev / Next Arrows */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => paginate(-1)}
                className="h-8 w-8 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/15 border border-white/10 text-foreground transition-all duration-200 active:scale-90 cursor-pointer"
                aria-label="اسلاید قبلی"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => paginate(1)}
                className="h-8 w-8 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/15 border border-white/10 text-foreground transition-all duration-200 active:scale-90 cursor-pointer"
                aria-label="اسلاید بعدی"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
