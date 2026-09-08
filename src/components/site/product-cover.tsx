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

import { getBrandIconUrl } from "@/lib/brand-icons";
import { getBrandVector } from "@/lib/brand-assets";
import Image from "next/image";

export function ProductCover({
  title,
  brand,
  seed,
  image,
  className,
  icon,
  size = "md",
  hideLabel,
}: {
  title: string;
  brand?: string | null;
  seed?: string;
  image?: string | null;
  className?: string;
  icon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  hideLabel?: boolean;
}) {
  const brandVector = getBrandVector(brand, title);
  const grad = brandVector.gradient || gradientFor(seed || title);
  const shouldHideLabel = hideLabel || size === "sm";
  const iconSize =
    size === "lg" ? "h-14 w-14" : size === "sm" ? "h-10 w-10" : "h-12 w-12";

  const resolvedImage = image || (brand ? getBrandIconUrl(brand, title) : null);
  const [imgError, setImgError] = React.useState(false);

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
      <div className="absolute -top-8 -right-8 h-28 w-28 rounded-full bg-white/30 blur-2xl" />
      <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-black/40 blur-2xl" />
      
      <div className={cn("relative z-10 flex flex-col items-center justify-center text-center w-full h-full", size === "sm" ? "p-1" : "gap-2 px-3")}>
        {resolvedImage && !imgError ? (
          <div className={cn("relative flex items-center justify-center backdrop-blur-md border border-white/20 transition-transform duration-300 group-hover:scale-110", size === "sm" ? "rounded-xl bg-white/10 dark:bg-white/15 p-1.5 shadow-sm" : "rounded-2xl bg-black/35 p-2 shadow-xl", iconSize)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolvedImage}
              alt={brand || title}
              className="w-full h-full object-contain filter drop-shadow-md"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          </div>
        ) : icon ? (
          <div className={cn("text-white drop-shadow", iconSize)}>{icon}</div>
        ) : (
          <div
            className={cn(
              "relative flex items-center justify-center backdrop-blur-md border border-white/20 transition-transform duration-300 group-hover:scale-110",
              size === "sm" ? "rounded-xl bg-white/10 dark:bg-white/15 p-1.5 shadow-sm" : "rounded-2xl bg-black/40 p-2.5 shadow-xl",
              iconSize
            )}
            style={{
              borderColor: brandVector.accent + "50",
              boxShadow: `0 0 20px ${brandVector.bgGlow}`,
            }}
          >
            {brandVector.icon}
          </div>
        )}
        {!shouldHideLabel && (
          <span className="text-[11px] font-black uppercase tracking-wider text-white drop-shadow line-clamp-1 bg-black/40 px-2.5 py-0.5 rounded-full border border-white/10 mt-1">
            {brand || brandVector.label}
          </span>
        )}
      </div>
    </div>
  );
}
