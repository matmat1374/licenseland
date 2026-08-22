"use client";

import { Share2 } from "lucide-react";

export function ShareButton({ title, url }: { title: string; url: string }) {
  function share() {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title, url }).catch(() => {});
    } else if (typeof navigator !== "undefined") {
      navigator.clipboard?.writeText(url);
    }
  }
  return (
    <button
      onClick={share}
      className="mr-auto flex items-center gap-1.5 text-primary hover:underline"
    >
      <Share2 className="h-4 w-4" /> اشتراک‌گذاری
    </button>
  );
}
