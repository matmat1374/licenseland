// Pure loyalty math — no DB, no imports. Kept dependency-free so it can be
// unit-tested by the kernel suite (kernel/test/loyalty.test.ts) and reused
// by client code without pulling Prisma.

export const POINTS_VALUE_TOMAN = 1000;
export const MAX_POINTS_DISCOUNT_PERCENT = 0.3; // max 30% of order value

export const TIERS = {
  BRONZE: {
    minSpent: 0,
    pointMultiplier: 1, // 1pt per 10k T
    discountPercent: 0,
  },
  SILVER: {
    minSpent: 500_000,
    pointMultiplier: 1.5,
    discountPercent: 0.02,
  },
  GOLD: {
    minSpent: 2_000_000,
    pointMultiplier: 2,
    discountPercent: 0.05,
  },
  DIAMOND: {
    minSpent: 5_000_000,
    pointMultiplier: 3,
    discountPercent: 0.08,
  },
} as const;

export type TierName = keyof typeof TIERS;

export function determineTier(totalSpent: number): TierName {
  if (totalSpent >= TIERS.DIAMOND.minSpent) return "DIAMOND";
  if (totalSpent >= TIERS.GOLD.minSpent) return "GOLD";
  if (totalSpent >= TIERS.SILVER.minSpent) return "SILVER";
  return "BRONZE";
}

/** Pure point math: 1 pt per 10,000 Toman × tier multiplier, floored. Never negative. */
export function computeEarnedPoints(orderAmount: number, tier: string): number {
  if (!Number.isFinite(orderAmount) || orderAmount <= 0) return 0;
  const cfg = TIERS[(tier as TierName) in TIERS ? (tier as TierName) : "BRONZE"];
  const basePoints = Math.floor(orderAmount / 10000);
  return Math.max(0, Math.floor(basePoints * cfg.pointMultiplier));
}

/** Pure redemption cap: points are worth POINTS_VALUE_TOMAN each, max 30% of order. */
export function computeMaxRedeemablePoints(orderTotal: number, availablePoints: number): number {
  if (!Number.isFinite(orderTotal) || orderTotal <= 0) return 0;
  if (!Number.isFinite(availablePoints) || availablePoints <= 0) return 0;
  const maxDiscount = Math.floor(orderTotal * MAX_POINTS_DISCOUNT_PERCENT);
  return Math.min(Math.floor(availablePoints), Math.floor(maxDiscount / POINTS_VALUE_TOMAN));
}
