// Pricing / formatting helpers

export function calcDiscountPercent(price: number, discountPrice?: number | null): number {
  if (!discountPrice || discountPrice >= price) return 0;
  return Math.round(((price - discountPrice) / price) * 100);
}

export function effectivePrice(price: number, discountPrice?: number | null): number {
  if (!discountPrice || discountPrice >= price) return price;
  return discountPrice;
}

export function toToman(n: number): string {
  return n.toLocaleString("fa-IR");
}

export function toTomanWithUnit(n: number): string {
  return `${toToman(n)} تومان`;
}

// Apply a discount code and return the discount amount + final total
export function applyDiscount(
  total: number,
  code: { type: "PERCENT" | "FIXED"; value: number }
): { discount: number; final: number } {
  let discount = 0;
  if (code.type === "PERCENT") {
    discount = Math.round((total * code.value) / 100);
  } else {
    discount = Math.min(code.value, total);
  }
  return { discount, final: total - discount };
}
