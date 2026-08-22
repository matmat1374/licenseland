import assert from "node:assert/strict"
import { test } from "node:test"
import {
	BPS_DENOMINATOR,
	MoneyError,
	addMoney,
	applyBps,
	assertSafeInteger,
	assertSameCurrency,
	isSafeMoneyInteger,
	marginBps,
	money,
	mulDivHalfUp,
	subMoney,
} from "../src/shared/money.ts"

test("bps denominator is 10_000", () => {
	assert.equal(BPS_DENOMINATOR, 10_000)
})

test("isSafeMoneyInteger accepts only safe integers", () => {
	assert.equal(isSafeMoneyInteger(10), true)
	assert.equal(isSafeMoneyInteger(10.5), false)
	assert.equal(isSafeMoneyInteger("10"), false)
	assert.equal(isSafeMoneyInteger(Number.NaN), false)
})

test("assertSafeInteger returns the value or throws MoneyError", () => {
	assert.equal(assertSafeInteger(7, "x"), 7)
	assert.throws(() => assertSafeInteger(7.1, "x"), MoneyError)
})

test("money constructor validates the amount", () => {
	assert.deepEqual(money(1_000, "IRT"), { amountMinor: 1_000, currency: "IRT" })
	assert.throws(() => money(0.5, "IRT"), MoneyError)
})

test("currency mixing is rejected", () => {
	const irt = money(1_000, "IRT")
	const usdt = money(1_000, "USDT")
	assert.throws(() => assertSameCurrency(irt, usdt), MoneyError)
	assert.doesNotThrow(() => assertSameCurrency(irt, money(5, "IRT")))
	assert.throws(() => addMoney(irt, usdt), MoneyError)
})

test("add and sub keep integer semantics", () => {
	assert.equal(addMoney(money(1_500, "IRT"), money(2_500, "IRT")).amountMinor, 4_000)
	assert.equal(subMoney(money(2_500, "IRT"), money(500, "IRT")).amountMinor, 2_000)
})

test("mulDivHalfUp rounds half up in both signs", () => {
	assert.equal(mulDivHalfUp(10, 1, 4), 3)
	assert.equal(mulDivHalfUp(10, 1, 2), 5)
	assert.equal(mulDivHalfUp(5, 1, 2), 3)
	assert.equal(mulDivHalfUp(-5, 3, 2), -8)
	assert.equal(mulDivHalfUp(5, 3, -2), -8)
	assert.equal(mulDivHalfUp(0, 3, 7), 0)
})

test("mulDivHalfUp guards divide-by-zero, non-integers and overflow", () => {
	assert.throws(() => mulDivHalfUp(10, 1, 0), MoneyError)
	assert.throws(() => mulDivHalfUp(10.5, 1, 2), MoneyError)
	assert.throws(() => mulDivHalfUp(10, 1.5, 2), MoneyError)
	assert.throws(() => mulDivHalfUp(10, 1, 2.5), MoneyError)
	assert.throws(() => mulDivHalfUp(Number.MAX_SAFE_INTEGER, 1_000, 1), MoneyError)
	assert.throws(() => mulDivHalfUp(-Number.MAX_SAFE_INTEGER, 1_000, 1), MoneyError)
})

test("applyBps computes percentage in basis points", () => {
	assert.equal(applyBps(3_200_000, 3_000), 960_000)
	assert.equal(applyBps(3_200_000, 0), 0)
	assert.equal(applyBps(1, 5_000), 1)
})

test("marginBps is relative to the sell price and safe at zero", () => {
	assert.equal(marginBps(3_200_000, 4_160_000), 2_308)
	assert.equal(marginBps(1_000, 0), 0)
	assert.equal(marginBps(2_000, 1_000), -10_000)
})
