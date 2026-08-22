import assert from "node:assert/strict"
import { test } from "node:test"
import {
	PRICING_ENGINE_VERSION,
	computeQuote,
	findActiveScheduledRule,
	resolveEffectiveRule,
	roundNotBelow,
} from "../src/pricing/engine.ts"
import { assessMargin, PricingPolicyError, summarizeAssessments } from "../src/pricing/policy.ts"
import { createPriceSnapshot, SnapshotError, verifySnapshot } from "../src/pricing/snapshot.ts"
import type {
	FxQuote,
	GlobalPricingRule,
	PriceQuote,
	PricingConfig,
	PricingInput,
	ScheduledRule,
} from "../src/pricing/types.ts"

const GLOBAL: GlobalPricingRule = {
	version: "rules/2026-08-19",
	markupBps: 3_000,
	addAbsMinor: 0,
	minMarginAbsMinor: 0,
	floorMinor: null,
	capMinor: null,
	taxBps: 0,
	rounding: { mode: "none", unitMinor: 1_000 },
}

const FX: FxQuote = {
	irtMinorPerUsd: 1_000_000,
	source: "manual:admin",
	capturedAtIso: "2026-08-19T10:00:00Z",
	bufferBps: 0,
}

function config(overrides: Partial<PricingConfig> = {}): PricingConfig {
	return {
		expectedCurrency: "IRT",
		global: GLOBAL,
		categoryRules: {},
		productOverrides: {},
		scheduled: [],
		fxMaxAgeSeconds: 3_600,
		...overrides,
	}
}

function input(overrides: Partial<PricingInput> = {}): PricingInput {
	return {
		productId: "p1",
		supplierCostUsdCents: 320,
		fx: FX,
		nowIso: "2026-08-19T10:05:00Z",
		...overrides,
	}
}

function ok(quote: PriceQuote) {
	assert.equal(quote.status, "ok")
	if (quote.status !== "ok") {
		throw new Error("unreachable")
	}
	return quote
}

function blockedReason(quote: PriceQuote) {
	assert.equal(quote.status, "blocked")
	if (quote.status !== "blocked") {
		throw new Error("unreachable")
	}
	return quote.reason
}

// --- table-driven guard rails (directive Phase 3.4) -------------------------

test("blocked inputs are rejected with an explicit reason", () => {
	const cases: Array<{ name: string; quote: PriceQuote; reason: string }> = [
		{
			name: "non-numeric cost",
			quote: computeQuote(config(), input({ supplierCostUsdCents: Number.NaN })),
			reason: "invalid_cost",
		},
		{
			name: "fractional cost",
			quote: computeQuote(config(), input({ supplierCostUsdCents: 320.5 })),
			reason: "invalid_cost",
		},
		{
			name: "negative cost",
			quote: computeQuote(config(), input({ supplierCostUsdCents: -1 })),
			reason: "invalid_cost",
		},
		{ name: "zero cost", quote: computeQuote(config(), input({ supplierCostUsdCents: 0 })), reason: "zero_cost" },
		{
			name: "unexpected currency",
			quote: computeQuote(config({ expectedCurrency: "USDT" }), input()),
			reason: "unexpected_currency",
		},
		{
			name: "zero fx rate",
			quote: computeQuote(config(), input({ fx: { ...FX, irtMinorPerUsd: 0 } })),
			reason: "invalid_fx_rate",
		},
		{
			name: "fractional fx rate",
			quote: computeQuote(config(), input({ fx: { ...FX, irtMinorPerUsd: 1_000.5 } })),
			reason: "invalid_fx_rate",
		},
		{
			name: "unparsable fx timestamp",
			quote: computeQuote(config(), input({ fx: { ...FX, capturedAtIso: "yesterday" } })),
			reason: "invalid_fx_rate",
		},
		{
			name: "unparsable now",
			quote: computeQuote(config(), input({ nowIso: "soon" })),
			reason: "invalid_fx_rate",
		},
		{
			name: "stale fx quote",
			quote: computeQuote(config({ fxMaxAgeSeconds: 60 }), input()),
			reason: "stale_fx_rate",
		},
	]
	for (const testCase of cases) {
		assert.equal(blockedReason(testCase.quote), testCase.reason, testCase.name)
	}
})

test("happy path: 320 cents at 1,000,000 IRT/USD with 30% markup", () => {
	const quote = ok(computeQuote(config(), input()))
	assert.equal(quote.costBeforeBufferMinor, 3_200_000)
	assert.equal(quote.costMinor, 3_200_000)
	assert.equal(quote.netMinor, 4_160_000)
	assert.equal(quote.taxMinor, 0)
	assert.equal(quote.grossMinor, 4_160_000)
	assert.equal(quote.marginMinor, 960_000)
	assert.equal(quote.marginBps, 2_308)
	assert.equal(quote.appliedCampaignId, null)
	assert.equal(quote.engineVersion, PRICING_ENGINE_VERSION)
	assert.equal(quote.ruleVersion, "rules/2026-08-19")
	assert.deepEqual(quote.warnings, [])
	assert.equal(quote.ruleTrace.every((entry) => entry.source === "global"), true)
})

test("fx buffer protects the margin against rate moves", () => {
	const quote = ok(computeQuote(config(), input({ fx: { ...FX, bufferBps: 500 } })))
	assert.equal(quote.costBeforeBufferMinor, 3_200_000)
	assert.equal(quote.costMinor, 3_360_000)
	assert.equal(quote.grossMinor, 4_368_000)
})

test("rule precedence: product override beats category beats global", () => {
	const categoryRule = {
		markupBps: 4_000,
		addAbsMinor: 50_000,
		minMarginAbsMinor: 10_000,
		floorMinor: null,
		capMinor: null,
		taxBps: 0,
		rounding: { mode: "none" as const, unitMinor: 1_000 },
	}
	const withCategory = ok(
		computeQuote(config({ categoryRules: { cat1: categoryRule } }), input({ categoryId: "cat1" })),
	)
	assert.equal(withCategory.grossMinor, 3_200_000 + 1_280_000 + 50_000)
	assert.equal(withCategory.ruleTrace.every((entry) => entry.source === "category"), true)

	const productRule = { ...categoryRule, markupBps: 6_000, addAbsMinor: 0 }
	const withProduct = ok(
		computeQuote(
			config({ categoryRules: { cat1: categoryRule }, productOverrides: { p1: productRule } }),
			input({ categoryId: "cat1" }),
		),
	)
	assert.equal(withProduct.grossMinor, 3_200_000 + 1_920_000)
	assert.equal(withProduct.ruleTrace.every((entry) => entry.source === "product"), true)
})

test("partial rules inherit field by field", () => {
	const resolved = resolveEffectiveRule(
		config({ categoryRules: { cat1: { taxBps: 900 } }, productOverrides: { p1: { markupBps: 1_000 } } }),
		"p1",
		"cat1",
	)
	assert.equal(resolved.rule.markupBps, 1_000)
	assert.equal(resolved.rule.taxBps, 900)
	assert.equal(resolved.rule.addAbsMinor, 0)
	const bySource = new Map(resolved.trace.map((entry) => [entry.field, entry.source]))
	assert.equal(bySource.get("markupBps"), "product")
	assert.equal(bySource.get("taxBps"), "category")
	assert.equal(bySource.get("floorMinor"), "global")
})

test("an unknown category falls back to the global rule", () => {
	const resolved = resolveEffectiveRule(config({ categoryRules: { cat1: { markupBps: 9_999 } } }), "p1", "other")
	assert.equal(resolved.rule.markupBps, 3_000)
})

test("zero markup still respects the absolute margin floor", () => {
	const quote = ok(
		computeQuote(
			config({ global: { ...GLOBAL, markupBps: 0, minMarginAbsMinor: 500_000 } }),
			input(),
		),
	)
	assert.equal(quote.grossMinor, 3_700_000)
	assert.deepEqual(quote.warnings, ["min_margin_enforced"])
})

test("floor and cap clamp the price and are reported", () => {
	const floored = ok(computeQuote(config({ global: { ...GLOBAL, floorMinor: 10_000_000 } }), input()))
	assert.equal(floored.grossMinor, 10_000_000)
	assert.deepEqual(floored.warnings, ["floor_clamped"])

	const capped = ok(computeQuote(config({ global: { ...GLOBAL, capMinor: 4_000_000 } }), input()))
	assert.equal(capped.grossMinor, 4_000_000)
	assert.deepEqual(capped.warnings, ["cap_clamped"])
})

test("a cap below the margin floor blocks the sale instead of selling at a loss", () => {
	const quote = computeQuote(
		config({ global: { ...GLOBAL, capMinor: 3_000_000, minMarginAbsMinor: 400_000 } }),
		input(),
	)
	assert.equal(blockedReason(quote), "cap_below_min_margin")
})

test("tax is added on top and recovered exactly from the gross price", () => {
	const quote = ok(computeQuote(config({ global: { ...GLOBAL, taxBps: 900 } }), input()))
	assert.equal(quote.grossMinor, 4_534_400)
	assert.equal(quote.netMinor, 4_160_000)
	assert.equal(quote.taxMinor, 374_400)
})

test("rounding boundaries behave per mode", () => {
	const up = ok(
		computeQuote(config({ global: { ...GLOBAL, rounding: { mode: "up", unitMinor: 100_000 } } }), input()),
	)
	assert.equal(up.grossMinor, 4_200_000)
	assert.deepEqual(up.warnings, [])

	const nearestDown = ok(
		computeQuote(config({ global: { ...GLOBAL, rounding: { mode: "nearest", unitMinor: 1_000_000 } } }), input()),
	)
	assert.equal(nearestDown.grossMinor, 4_000_000)
	assert.deepEqual(nearestDown.warnings, ["rounded_down"])

	const corrected = ok(
		computeQuote(
			config({
				global: { ...GLOBAL, minMarginAbsMinor: 900_000, rounding: { mode: "nearest", unitMinor: 1_000_000 } },
			}),
			input(),
		),
	)
	assert.equal(corrected.grossMinor, 5_000_000)
	assert.deepEqual(corrected.warnings, ["rounding_margin_corrected"])

	const psychological = ok(
		computeQuote(
			config({
				global: {
					...GLOBAL,
					rounding: { mode: "psychological", unitMinor: 100_000, psychologicalEndingMinor: 1_000 },
				},
			}),
			input(),
		),
	)
	assert.equal(psychological.grossMinor, 4_199_000)
})

test("roundNotBelow never returns less than the minimum", () => {
	assert.equal(roundNotBelow(4_160_000, { mode: "up", unitMinor: 100_000 }, 0), 4_200_000)
	assert.equal(roundNotBelow(4_160_000, { mode: "nearest", unitMinor: 1_000_000 }, 4_100_000), 5_000_000)
	assert.equal(roundNotBelow(4_000_000, { mode: "none", unitMinor: 0 }, 4_100_000), 4_100_000)
})

test("scheduled campaigns apply last and never break the margin floor", () => {
	const window = { startsAtIso: "2026-08-19T00:00:00Z", endsAtIso: "2026-08-20T00:00:00Z" }
	const percent = ok(
		computeQuote(config({ scheduled: [{ id: "c1", ...window, discountBps: 1_000 }] }), input()),
	)
	assert.equal(percent.grossMinor, 3_744_000)
	assert.equal(percent.appliedCampaignId, "c1")

	const absolute = ok(
		computeQuote(config({ scheduled: [{ id: "c2", ...window, discountAbsMinor: 160_000 }] }), input()),
	)
	assert.equal(absolute.grossMinor, 4_000_000)

	const clamped = ok(
		computeQuote(config({ scheduled: [{ id: "c3", ...window, discountBps: 9_000 }] }), input()),
	)
	assert.equal(clamped.grossMinor, 3_200_000)
	assert.deepEqual(clamped.warnings, ["campaign_clamped"])
})

test("campaign scope and schedule filters", () => {
	const window = { startsAtIso: "2026-08-19T00:00:00Z", endsAtIso: "2026-08-20T00:00:00Z" }
	const now = "2026-08-19T10:05:00Z"
	const rules: ScheduledRule[] = [
		{ id: "other-product", ...window, productId: "p2", discountBps: 500 },
		{ id: "other-category", ...window, categoryId: "catX", discountBps: 500 },
		{ id: "expired", startsAtIso: "2026-07-01T00:00:00Z", endsAtIso: "2026-07-02T00:00:00Z", discountBps: 500 },
		{ id: "future", startsAtIso: "2026-09-01T00:00:00Z", endsAtIso: "2026-09-02T00:00:00Z", discountBps: 500 },
		{ id: "wrong-weekday", ...window, activeWeekdays: [1, 2], discountBps: 500 },
		{ id: "matching", ...window, activeWeekdays: [3], discountBps: 500 },
	]
	assert.equal(findActiveScheduledRule(rules, now, "p1", "cat1")?.id, "matching")
	assert.equal(findActiveScheduledRule(rules, now, "p2", "cat1")?.id, "other-product")
	assert.equal(findActiveScheduledRule(rules, now, "p3", "catX")?.id, "other-category")
	assert.equal(findActiveScheduledRule([rules[4]], now, "p1", "cat1"), undefined)
	assert.equal(findActiveScheduledRule([], now, "p1"), undefined)
})

test("weekday windows are evaluated in the configured time zone", () => {
	const rule: ScheduledRule = {
		id: "tehran-thursday",
		startsAtIso: "2026-08-19T00:00:00Z",
		endsAtIso: "2026-08-21T00:00:00Z",
		activeWeekdays: [4],
		timeZone: "Asia/Tehran",
		discountBps: 500,
	}
	// 21:00Z is already Thursday 00:30 in Tehran.
	assert.equal(findActiveScheduledRule([rule], "2026-08-19T21:00:00Z", "p1")?.id, "tehran-thursday")
	assert.equal(findActiveScheduledRule([{ ...rule, timeZone: "UTC" }], "2026-08-19T21:00:00Z", "p1"), undefined)
})

test("a mid-cycle supplier or fx change produces a different quote", () => {
	const before = ok(computeQuote(config(), input()))
	const after = ok(
		computeQuote(
			config(),
			input({
				supplierCostUsdCents: 400,
				fx: { ...FX, irtMinorPerUsd: 1_100_000, capturedAtIso: "2026-08-19T10:04:00Z" },
			}),
		),
	)
	assert.notEqual(before.grossMinor, after.grossMinor)
	assert.equal(after.grossMinor, 5_720_000)
})

// --- snapshot immutability --------------------------------------------------

test("price snapshots are digest-protected and quantity aware", () => {
	const quote = ok(computeQuote(config(), input()))
	const snapshot = createPriceSnapshot({ orderItemId: "oi1", quote, quantity: 3 })
	assert.equal(snapshot.unitGrossMinor, 4_160_000)
	assert.equal(snapshot.totalGrossMinor, 12_480_000)
	assert.equal(snapshot.fxRateIrtMinorPerUsd, 1_000_000)
	assert.equal(verifySnapshot(snapshot), true)
	assert.equal(verifySnapshot({ ...snapshot, unitGrossMinor: 1 }), false)
})

test("snapshots reject blocked quotes and invalid quantities", () => {
	const blocked = computeQuote(config(), input({ supplierCostUsdCents: 0 }))
	assert.throws(() => createPriceSnapshot({ orderItemId: "oi1", quote: blocked, quantity: 1 }), SnapshotError)
	const quote = ok(computeQuote(config(), input()))
	assert.throws(() => createPriceSnapshot({ orderItemId: "oi1", quote, quantity: 0 }), SnapshotError)
	assert.throws(() => createPriceSnapshot({ orderItemId: "oi1", quote, quantity: 1.5 }), SnapshotError)
})

// --- admin dry-run margin policy -------------------------------------------

test("margin policy classifies ok, below target and negative margins", () => {
	const quote = ok(computeQuote(config(), input()))
	assert.equal(assessMargin(quote, 2_000).status, "ok")
	assert.equal(assessMargin(quote, 4_000).status, "below_target")

	const lossMaking: PriceQuote = { ...quote, marginMinor: -1, marginBps: -100 }
	assert.equal(assessMargin(lossMaking, 2_000).status, "negative")

	const blocked = computeQuote(config(), input({ supplierCostUsdCents: 0 }))
	assert.throws(() => assessMargin(blocked, 2_000), PricingPolicyError)
})

test("catalog dry-run summary counts each status", () => {
	const quote = ok(computeQuote(config(), input()))
	const summary = summarizeAssessments([
		assessMargin(quote, 2_000),
		assessMargin(quote, 4_000),
		assessMargin({ ...quote, marginMinor: -5, marginBps: -20 }, 2_000),
	])
	assert.deepEqual(summary, { total: 3, negative: 1, belowTarget: 1, ok: 1 })
})
