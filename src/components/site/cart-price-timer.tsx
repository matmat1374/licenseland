"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/store/cart";
import { AlertCircle, Clock } from "lucide-react";

export function CartPriceTimer() {
  const { priceLockedAt, refreshPrices, items } = useCart() as any;
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!priceLockedAt || items.length === 0) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const elapsed = Date.now() - priceLockedAt;
      const remaining = Math.max(0, 10 * 60 * 1000 - elapsed);
      return remaining;
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(timer);
        refreshPrices();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [priceLockedAt, items.length, refreshPrices]);

  if (timeLeft === null || items.length === 0) return null;

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  if (timeLeft <= 2 * 60 * 1000) {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm mb-4">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span className="font-medium">⚠️ {formattedTime} تا به‌روزرسانی خودکار قیمت بر اساس نرخ تتر</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-sm mb-4">
      <Clock className="w-5 h-5 shrink-0" />
      <span className="font-medium">⏱️ قیمت‌ها به مدت ۱۰ دقیقه برای شما رزرو شده‌اند ({formattedTime})</span>
    </div>
  );
}
