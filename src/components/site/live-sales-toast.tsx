"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

const purchases = [
  "علی از تهران چند لحظه پیش اشتراک Claude 3.7 Sonnet را خریداری کرد",
  "سارا از شیراز اشتراک ChatGPT Plus را تهیه کرد",
  "رضا از اصفهان لایسنس Midjourney Pro را خریداری کرد",
  "مریم از مشهد اکانت Spotify Premium را تهیه کرد",
  "امین از تبریز لایسنس GitHub Copilot را خریداری کرد"
];

export function LiveSalesToast() {
  const [currentToast, setCurrentToast] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomPurchase = purchases[Math.floor(Math.random() * purchases.length)];
      setCurrentToast(randomPurchase);
      setIsVisible(true);
      
      setTimeout(() => {
        setIsVisible(false);
      }, 5000);
      
    }, Math.floor(Math.random() * 15000) + 15000); 

    return () => clearInterval(interval);
  }, []);

  if (!currentToast) return null;

  return (
    <div 
      className={cn(
        "fixed bottom-6 left-6 z-50 flex items-center gap-3 rounded-xl border border-white/10 bg-background/60 p-4 shadow-xl backdrop-blur-xl transition-all duration-500 ease-in-out",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
        <CheckCircle2 className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-foreground/90 max-w-[250px] leading-relaxed">
        {currentToast}
      </p>
      <button 
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 rounded-full p-1 text-muted-foreground hover:bg-white/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="بستن اعلان"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
