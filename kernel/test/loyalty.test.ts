// Unit tests for the loyalty point math + redemption guards (session fixes
// for review findings C4/C5). These are pure-function tests so they run in the
// kernel suite without a database.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  computeEarnedPoints,
  computeMaxRedeemablePoints,
  determineTier,
  POINTS_VALUE_TOMAN,
  MAX_POINTS_DISCOUNT_PERCENT,
} from "../../src/lib/loyalty-math.ts";

test("determineTier maps spend thresholds to the correct tier", () => {
  assert.equal(determineTier(0), "BRONZE");
  assert.equal(determineTier(499_999), "BRONZE");
  assert.equal(determineTier(500_000), "SILVER");
  assert.equal(determineTier(1_999_999), "SILVER");
  assert.equal(determineTier(2_000_000), "GOLD");
  assert.equal(determineTier(4_999_999), "GOLD");
  assert.equal(determineTier(5_000_000), "DIAMOND");
});

test("computeEarnedPoints: 1 point per 10k Toman, floored, scaled by tier", () => {
  // BRONZE multiplier = 1
  assert.equal(computeEarnedPoints(9_999, "BRONZE"), 0);
  assert.equal(computeEarnedPoints(10_000, "BRONZE"), 1);
  assert.equal(computeEarnedPoints(25_000, "BRONZE"), 2); // floor(2.5) = 2
  // SILVER multiplier = 1.5
  assert.equal(computeEarnedPoints(10_000, "SILVER"), 1);
  assert.equal(computeEarnedPoints(30_000, "SILVER"), 4); // 3 * 1.5 = 4.5 -> 4
  // GOLD multiplier = 2
  assert.equal(computeEarnedPoints(30_000, "GOLD"), 6);
  // DIAMOND multiplier = 3
  assert.equal(computeEarnedPoints(10_000, "DIAMOND"), 3);
  // zero / negative amounts earn nothing
  assert.equal(computeEarnedPoints(0, "DIAMOND"), 0);
  assert.equal(computeEarnedPoints(-5_000, "BRONZE"), 0); // floor(-0.5) = -1 ... guard:
});

test("computeEarnedPoints never returns a positive value for non-positive spend", () => {
  assert.ok(computeEarnedPoints(0, "BRONZE") <= 0);
  assert.ok(computeEarnedPoints(-10_000, "GOLD") <= 0);
});

test("computeMaxRedeemablePoints caps at 30% of order and available balance", () => {
  // order 100k T -> max discount 30k -> 30 points if balance allows
  assert.equal(computeMaxRedeemablePoints(100_000, 100), 30);
  // limited by available points
  assert.equal(computeMaxRedeemablePoints(100_000, 5), 5);
  // tiny order: 30% of 2,000 T = 600 T = 0.6 points worth → floored to 0
  assert.equal(computeMaxRedeemablePoints(2_000, 500), 0);
  // exactly one point worth of 30% discount
  assert.equal(computeMaxRedeemablePoints(10_000 * 10 * POINTS_VALUE_TOMAN, 999), 999);
});

test("redemption cap respects MAX_POINTS_DISCOUNT_PERCENT constant", () => {
  assert.equal(MAX_POINTS_DISCOUNT_PERCENT, 0.3);
  const total = 1_000_000;
  const cap = Math.floor(total * MAX_POINTS_DISCOUNT_PERCENT) / POINTS_VALUE_TOMAN;
  assert.equal(computeMaxRedeemablePoints(total, 10_000), cap);
});
