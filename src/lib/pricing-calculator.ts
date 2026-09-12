/**
 * Central Pricing Calculator Module
 * Single Source of Truth for pricing across the entire application.
 */

export interface PricingTier {
  maxUsd: number | null; // Upper bound in USD (< maxUsd). null or Infinity means no upper bound.
  markupPercent: number; // Markup percentage (e.g., 100 = 100%)
}

/**
 * Default tiered markup rules:
 * - Under $2: 100%
 * - Under $5: 80%
 * - Under $8: 60%
 * - Under $10: 60%
 * - Under $20: 50%
 * - Under $60: 40%
 * - Under $70: 30%
 * - Under $100: 25%
 * - Under $200: 20%
 * - Under $500: 15%
 * - $500 and above: 10%
 */
export const DEFAULT_PRICING_TIERS: PricingTier[] = [
  { maxUsd: 2, markupPercent: 100 },
  { maxUsd: 5, markupPercent: 80 },
  { maxUsd: 8, markupPercent: 60 },
  { maxUsd: 10, markupPercent: 60 },
  { maxUsd: 20, markupPercent: 50 },
  { maxUsd: 60, markupPercent: 40 },
  { maxUsd: 70, markupPercent: 30 },
  { maxUsd: 100, markupPercent: 25 },
  { maxUsd: 200, markupPercent: 20 },
  { maxUsd: 500, markupPercent: 15 },
  { maxUsd: null, markupPercent: 10 },
];

/**
 * Get the markup percentage for a given cost in USD based on pricing tiers.
 */
export function getTierMarkup(costUsd: number, customTiers?: PricingTier[]): number {
  const tiers = customTiers && customTiers.length > 0 ? customTiers : DEFAULT_PRICING_TIERS;

  // Sort ascending by maxUsd, placing null / Infinity at the end
  const sorted = [...tiers].sort((a, b) => {
    const aVal = a.maxUsd === null || a.maxUsd === undefined || isNaN(a.maxUsd) ? Number.POSITIVE_INFINITY : a.maxUsd;
    const bVal = b.maxUsd === null || b.maxUsd === undefined || isNaN(b.maxUsd) ? Number.POSITIVE_INFINITY : b.maxUsd;
    return aVal - bVal;
  });

  for (const tier of sorted) {
    const max = tier.maxUsd === null || tier.maxUsd === undefined || isNaN(tier.maxUsd)
      ? Number.POSITIVE_INFINITY
      : tier.maxUsd;

    if (costUsd < max) {
      return tier.markupPercent;
    }
  }

  return sorted[sorted.length - 1]?.markupPercent ?? 10;
}

export interface CalculatedPrice {
  sellPriceToman: number;
  markupPercent: number;
  costToman: number;
}

/**
 * Calculate the selling price in Toman rounded UP to the nearest 1000 Toman.
 * Math.ceil(toman / 1000) * 1000
 *
 * @param costUsd Cost of product in USD
 * @param usdtRate Live USDT to Toman conversion rate
 * @param customMarkupPercent Optional custom markup override (percent). If null/undefined/NaN, tier markup is used.
 * @param customTiers Optional custom tiers. Defaults to DEFAULT_PRICING_TIERS.
 */
export function calculateSellPrice(
  costUsd: number,
  usdtRate: number,
  customMarkupPercent?: number | null,
  customTiers?: PricingTier[]
): CalculatedPrice {
  const safeCostUsd = Number(costUsd) || 0;
  const safeUsdtRate = Number(usdtRate) || 0;

  let effectiveMarkup: number;
  if (
    customMarkupPercent !== null &&
    customMarkupPercent !== undefined &&
    typeof customMarkupPercent === "number" &&
    !isNaN(customMarkupPercent) &&
    customMarkupPercent >= 0
  ) {
    effectiveMarkup = customMarkupPercent;
  } else if (
    typeof customMarkupPercent === "string" &&
    (customMarkupPercent as string).trim() !== "" &&
    !isNaN(Number(customMarkupPercent)) &&
    Number(customMarkupPercent) >= 0
  ) {
    effectiveMarkup = Number(customMarkupPercent);
  } else {
    effectiveMarkup = getTierMarkup(safeCostUsd, customTiers);
  }

  const costToman = Math.round(safeCostUsd * safeUsdtRate);

  if (safeCostUsd <= 0 || safeUsdtRate <= 0) {
    return {
      sellPriceToman: 0,
      markupPercent: effectiveMarkup,
      costToman,
    };
  }

  const rawSellPrice = safeCostUsd * safeUsdtRate * (1 + effectiveMarkup / 100);
  const sellPriceToman = Math.ceil(rawSellPrice / 1000) * 1000;

  return {
    sellPriceToman,
    markupPercent: effectiveMarkup,
    costToman,
  };
}

/**
 * Loads pricing tiers from Setting table with key 'pricing_tiers'.
 * Falls back to DEFAULT_PRICING_TIERS if not set or invalid.
 */
export async function loadPricingTiers(): Promise<PricingTier[]> {
  try {
    const { db } = await import("@/lib/db");
    const setting = await db.setting.findUnique({
      where: { key: "pricing_tiers" },
    });

    if (setting && setting.value) {
      const parsed = JSON.parse(setting.value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Error loading pricing_tiers from DB:", error);
  }

  return DEFAULT_PRICING_TIERS;
}

/**
 * Saves pricing tiers to the Setting table with key 'pricing_tiers'.
 */
export async function savePricingTiers(tiers: PricingTier[]): Promise<void> {
  const { db } = await import("@/lib/db");
  await db.setting.upsert({
    where: { key: "pricing_tiers" },
    create: {
      key: "pricing_tiers",
      value: JSON.stringify(tiers),
    },
    update: {
      value: JSON.stringify(tiers),
    },
  });
}
