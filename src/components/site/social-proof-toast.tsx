"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Sparkles, X } from "lucide-react";
import Link from "next/link";

import { usePathname } from "next/navigation";

interface RecentSale {
  name: string;
  city: string;
  product: string;
  timeAgo: string;
  slug: string;
  icon: string;
}

const RECENT_SALES: RecentSale[] = [
  { name: "علی ر.", city: "تهران", product: "اشتراک اختصاصی ChatGPT Plus", timeAgo: "۲ دقیقه پیش", slug: "chatgpt", icon: "🤖" },
  { name: "سارا م.", city: "شیراز", product: "لایسنس ادیتور هوشمند Cursor AI Pro", timeAgo: "۵ دقیقه پیش", slug: "cursor", icon: "💻" },
  { name: "امیرحسین ک.", city: "مشهد", product: "اشتراک قانونی Claude 3.7 Sonnet", timeAgo: "۸ دقیقه پیش", slug: "claude", icon: "🧠" },
  { name: "مهدی ن.", city: "اصفهان", product: "اکانت پریمیوم Spotify Hi-Fi ۶ ماهه", timeAgo: "۱۱ دقیقه پیش", slug: "spotify", icon: "🎵" },
  { name: "پویا ز.", city: "تبریز", product: "اشتراک قانونی یوتیوب پریمیوم ۱ ساله", timeAgo: "۱۵ دقیقه پیش", slug: "youtube", icon: "🎬" },
  { name: "فرزانه ب.", city: "کرج", product: "لایسنس دائمی آموزش زبان Memrise Pro", timeAgo: "۱۹ دقیقه پیش", slug: "memrise", icon: "🌍" },
  { name: "رضا ع.", city: "رشت", product: "اشتراک رسمی Canva Pro ۱ ساله", timeAgo: "۲۳ دقیقه پیش", slug: "canva", icon: "🎨" },
];

export function SocialProofToast() {
  const pathname = usePathname();
  const [currentSale, setCurrentSale] = useState<RecentSale | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  useEffect(() => {
    // Check if already shown in this session
    const alreadyShown = sessionStorage.getItem("liceno_social_proof_shown");
    if (alreadyShown) {
      setDismissed(true);
      return;
    }

    // Pick a random recent sale to show once
    const randomIndex = Math.floor(Math.random() * RECENT_SALES.length);
    const timer = setTimeout(() => {
      setCurrentSale(RECENT_SALES[randomIndex]);
      setIsVisible(true);
      sessionStorage.setItem("liceno_social_proof_shown", "true");

      // Auto-hide after 5 seconds and never show again in this session
      setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    }, 6000);

    return () => clearTimeout(timer);
  }, []);

  if (dismissed || !currentSale) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-40 max-w-[340px] pointer-events-none">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="pointer-events-auto relative flex items-center gap-3 rounded-2xl bg-card/95 border border-primary/25 backdrop-blur-xl p-3 shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/10"
            dir="rtl"
          >
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-lg shadow-inner">
              <span>{currentSale.icon}</span>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-white">
                <CheckCircle2 className="h-2.5 w-2.5" />
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-foreground">
                  {currentSale.name} <span className="font-normal text-muted-foreground">از {currentSale.city}</span>
                </span>
              </div>
              <div className="text-[11px] font-medium text-primary line-clamp-1 mt-0.5">
                {currentSale.product}
              </div>
              <div className="text-[9px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                <span>{currentSale.timeAgo}</span>
                <span>•</span>
                <span className="text-emerald-600 font-semibold">تحویل خودکار آنی</span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsVisible(false);
                setDismissed(true);
                sessionStorage.setItem("liceno_social_proof_dismissed", "1");
              }}
              aria-label="بستن"
              className="p-1 text-muted-foreground hover:text-foreground rounded-lg transition-colors shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
