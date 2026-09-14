import { db } from "@/lib/db";

// Single source of truth for loyalty constants & pure math (testable without DB)
export {
  POINTS_VALUE_TOMAN,
  MAX_POINTS_DISCOUNT_PERCENT,
  TIERS,
  determineTier,
  computeEarnedPoints,
  computeMaxRedeemablePoints,
} from "@/lib/loyalty-math";
import { determineTier, computeEarnedPoints } from "@/lib/loyalty-math";

export async function getLoyalty(userId: string) {
  let loyalty = await db.userLoyalty.findUnique({
    where: { userId },
  });

  if (!loyalty) {
    loyalty = await db.userLoyalty.create({
      data: {
        userId,
      },
    });
  }
  return loyalty;
}

export async function earnPoints(userId: string, orderId: string, orderAmount: number) {
  const loyalty = await getLoyalty(userId);

  // C5 fix: use atomic increment instead of read-modify-write. The old code
  // computed newTotalSpent locally and wrote it back, so two concurrent
  // earnings (e.g. verify callback + user refresh) overwrote each other and
  // lost spend — breaking tier calculations.
  const earnedPoints = computeEarnedPoints(orderAmount, loyalty.tier);

  // Recompute the tier from the new cumulative spend atomically-ish: read is
  // only used for the tier decision, spend itself is always incremented.
  const newTotalSpent = loyalty.totalSpent + orderAmount;
  const newTier = determineTier(newTotalSpent);

  if (earnedPoints > 0) {
    await db.userLoyalty.update({
      where: { id: loyalty.id },
      data: {
        totalSpent: { increment: orderAmount },
        tier: newTier,
        totalPoints: { increment: earnedPoints },
        lifetimePoints: { increment: earnedPoints },
      },
    });

    await db.pointEvent.create({
      data: {
        loyaltyId: loyalty.id,
        type: "EARN",
        points: earnedPoints,
        description: `Earned points for order`,
        orderId: orderId,
      },
    });
  } else {
    // Just update spent/tier
    await db.userLoyalty.update({
      where: { id: loyalty.id },
      data: {
        totalSpent: { increment: orderAmount },
        tier: newTier,
      },
    });
  }

  await checkAndAwardBadges(userId);
}

export async function redeemPoints(userId: string, orderId: string, orderTotal: number, pointsToRedeem: number) {
  // C4 fix: atomic conditional decrement — the old read-then-decrement allowed
  // two concurrent checkouts to both pass the balance check and drive
  // totalPoints negative (spending real money as discount).
  if (!Number.isInteger(pointsToRedeem) || pointsToRedeem <= 0) {
    throw new Error("Invalid points amount");
  }

  const discountAmount = pointsToRedeem * POINTS_VALUE_TOMAN;
  const maxDiscount = Math.floor(orderTotal * MAX_POINTS_DISCOUNT_PERCENT);

  if (discountAmount > maxDiscount) {
    throw new Error("Exceeds max allowed discount");
  }

  const claimed = await db.userLoyalty.updateMany({
    where: { userId, totalPoints: { gte: pointsToRedeem } },
    data: { totalPoints: { decrement: pointsToRedeem } },
  });

  if (claimed.count === 0) {
    throw new Error("Insufficient points");
  }

  const loyalty = await getLoyalty(userId);

  await db.pointEvent.create({
    data: {
      loyaltyId: loyalty.id,
      type: "REDEEM",
      points: -pointsToRedeem,
      description: `Redeemed points for order`,
      orderId,
    },
  });

  return discountAmount;
}

export async function addBonusPoints(userId: string, points: number, description: string) {
  const loyalty = await getLoyalty(userId);

  await db.userLoyalty.update({
    where: { id: loyalty.id },
    data: {
      totalPoints: { increment: points },
      lifetimePoints: { increment: points },
    },
  });

  await db.pointEvent.create({
    data: {
      loyaltyId: loyalty.id,
      type: "BONUS",
      points,
      description,
    },
  });

  await checkAndAwardBadges(userId);
}

export async function checkAndAwardBadges(userId: string) {
  const loyalty = await getLoyalty(userId);
  const ordersCount = await db.order.count({
    where: { userId, status: "PAID" },
  });

  const awardBadge = async (badge: string) => {
    try {
      await db.userBadge.create({
        data: { userId, badge },
      });
    } catch (error: any) {
      // Ignore if already awarded (P2002)
      if (error.code !== "P2002") {
        console.error("Error awarding badge:", error);
      }
    }
  };

  if (ordersCount >= 1) await awardBadge("FIRST_BUY");
  if (ordersCount >= 5) await awardBadge("FIVE_ORDERS");
  if (loyalty.totalSpent >= 5_000_000) await awardBadge("HIGH_SPENDER");
  if (loyalty.lifetimePoints >= 1000) await awardBadge("POINT_MASTER");
}
