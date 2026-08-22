"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Deterministic gradient covers for products/categories (no external images needed)
const GRADIENTS = [
  "from-emerald-500 via-teal-500 to-cyan-600",
  "from-amber-500 via-orange-500 to-rose-500",
  "from-rose-500 via-pink-500 to-fuchsia-600",
  "from-cyan-500 via-sky-500 to-blue-500",
  "from-violet-500 via-purple-500 to-indigo-600",
  "from-lime-500 via-emerald-500 to-teal-600",
  "from-fuchsia-500 via-rose-500 to-orange-500",
  "from-teal-500 via-emerald-500 to-green-600",
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
}

export function gradientFor(seed: string): string {
  return GRADIENTS[hashString(seed) % GRADIENTS.length];
}

export function ProductCover({
  title,
  brand,
  seed,
  className,
  icon,
  size = "md",
}: {
  title: string;
  brand?: string | null;
  seed?: string;
  className?: string;
  icon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const grad = gradientFor(seed || title);
  const initials = (brand || title).slice(0, 2);
  const iconSize =
    size === "lg" ? "h-12 w-12" : size === "sm" ? "h-7 w-7" : "h-10 w-10";
  const textSize =
    size === "lg" ? "text-3xl" : size === "sm" ? "text-base" : "text-xl";

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-gradient-to-br",
        grad,
        className
      )}
    >
      {/* decorative grid */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      {/* glow */}
      <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-white/20 blur-2xl" />
      <div className="absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-black/20 blur-2xl" />
      <div className="relative z-10 flex flex-col items-center gap-2 px-3 text-center">
        {icon ? (
          <div className={cn("text-white drop-shadow", iconSize)}>{icon}</div>
        ) : (
          <div
            className={cn(
              "font-black text-white drop-shadow-lg tracking-tight",
              textSize
            )}
          >
            {initials}
          </div>
        )}
        <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 line-clamp-1">
          {brand || "LICENSE"}
        </span>
      </div>
    </div>
  );
}
