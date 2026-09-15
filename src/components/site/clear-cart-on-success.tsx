"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/store/cart";

/**
 * بعد از پرداخت موفق، سبد خرید ذخیره‌شده باید خالی شود — وگرنه کاربر در خرید
 * بعدی ریسک پرداخت تکراری دارد. اگر کاربر حین انتظار در درگاه، در تب دیگری
 * سبد جدیدی ساخته باشد، همان حفظ می‌شود (snapshot هنگام خروج به درگاه).
 */
export function ClearCartOnSuccess({ enabled }: { enabled: boolean }) {
  const clear = useCart((s) => s.clear);
  const done = useRef(false);

  useEffect(() => {
    if (!enabled || done.current) return;
    done.current = true;

    let restored = false;
    try {
      const raw = sessionStorage.getItem("licenseland-pending-cart");
      sessionStorage.removeItem("licenseland-pending-cart");
      if (raw) {
        const saved = JSON.parse(raw);
        if (
          Array.isArray(saved) &&
          saved.length > 0 &&
          useCart.getState().items.length === 0
        ) {
          useCart.setState({ items: saved });
          restored = true;
        }
      }
    } catch {
      // corrupted snapshot — fall through to plain clear
    }
    if (!restored) clear();
  }, [enabled, clear]);

  return null;
}
