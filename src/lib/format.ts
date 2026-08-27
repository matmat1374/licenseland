// Pricing / formatting helpers

// Convert Persian (۰-۹) and Arabic (٠-٩) digits to ASCII (0-9)
// Essential for Iranian users who type phone numbers & OTP with Persian keyboards
export function normalizePersianDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x06F0 + 48))
    .replace(/[٠-٩]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x0660 + 48));
}

export function calcDiscountPercent(price: number, discountPrice?: number | null): number {
  if (!discountPrice || discountPrice >= price || price === 0) return 0;
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
    // Clamp percent to 0-100 range to prevent negative or >100% discounts
    const pct = Math.max(0, Math.min(100, code.value));
    discount = Math.round((total * pct) / 100);
  } else {
    // Clamp fixed discount to [0, total] — prevents negative discounts from increasing total
    discount = Math.max(0, Math.min(code.value, total));
  }
  return { discount, final: total - discount };
}
