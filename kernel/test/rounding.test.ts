import assert from "node:assert/strict"
import { test } from "node:test"
import { MoneyError } from "../src/shared/money.ts"
import { roundPrice } from "../src/pricing/rounding.ts"

test("mode none returns the amount untouched", () => {
	assert.equal(roundPrice(4_160_123, { mode: "none", unitMinor: 0 }), 4_160_123)
})

test("negative and non-integer amounts are rejected", () => {
	assert.throws(() => roundPrice(-1, { mode: "up", unitMinor: 1_000 }), MoneyError)
	assert.throws(() => roundPrice(1.5, { mode: "up", unitMinor: 1_000 }), MoneyError)
})

test("a non-positive unit is rejected for every active mode", () => {
	assert.throws(() => roundPrice(1_000, { mode: "up", unitMinor: 0 }), MoneyError)
	assert.throws(() => roundPrice(1_000, { mode: "nearest", unitMinor: -5 }), MoneyError)
	assert.throws(() => roundPrice(1_000, { mode: "psychological", unitMinor: 1.5 }), MoneyError)
})

test("up mode ceils to the unit and keeps exact multiples", () => {
	assert.equal(roundPrice(4_160_000, { mode: "up", unitMinor: 100_000 }), 4_200_000)
	assert.equal(roundPrice(4_200_000, { mode: "up", unitMinor: 100_000 }), 4_200_000)
})

test("nearest mode rounds at the exact boundary upwards", () => {
	assert.equal(roundPrice(4_140_000, { mode: "nearest", unitMinor: 100_000 }), 4_100_000)
	assert.equal(roundPrice(4_150_000, { mode: "nearest", unitMinor: 100_000 }), 4_200_000)
	assert.equal(roundPrice(4_160_000, { mode: "nearest", unitMinor: 100_000 }), 4_200_000)
})

test("psychological mode never lands below the input", () => {
	assert.equal(roundPrice(4_160_000, { mode: "psychological", unitMinor: 100_000, psychologicalEndingMinor: 1_000 }), 4_199_000)
	// Exact multiple: ceiled - ending would drop below the input, so it steps up one unit.
	assert.equal(roundPrice(4_200_000, { mode: "psychological", unitMinor: 100_000, psychologicalEndingMinor: 1_000 }), 4_299_000)
	// Missing ending behaves like plain ceiling.
	assert.equal(roundPrice(4_160_000, { mode: "psychological", unitMinor: 100_000 }), 4_200_000)
})

test("psychological ending must be inside the unit", () => {
	assert.throws(
		() => roundPrice(1_000, { mode: "psychological", unitMinor: 1_000, psychologicalEndingMinor: 1_000 }),
		MoneyError,
	)
	assert.throws(
		() => roundPrice(1_000, { mode: "psychological", unitMinor: 1_000, psychologicalEndingMinor: -1 }),
		MoneyError,
	)
})
