"use client";

import { useEffect } from "react";
import { trackViewItem } from "@/lib/gtag";

export function ProductViewTracker({
  product,
}: {
  product: { id: string; title: string; price: number; category: string };
}) {
  useEffect(() => {
    trackViewItem(product);
  }, [product.id]);

  return null;
}
