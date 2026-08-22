import { BPS_DENOMINATOR, applyBps, marginBps, mulDivHalfUp } from "../shared/money.ts"
import { roundPrice } from "./rounding.ts"
import type { RoundingConfig } from "./rounding.ts"
import type {
	EffectiveRule,
	PriceQuote,
	PricingConfig,
	PricingInput,
	QuoteStep,
	QuoteWarning,
	RuleSource,
	RuleTraceEntry,
	ScheduledRule,
} from "./types.ts"

export const PRICING_ENGINE_VERSION = "pricing/1.0.0"

const WEEKDAY_CODES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function pick<T>(product: T | undefined, category: T | undefined, fallback: T): { value: T; source: RuleSource } {
	if (product !== undefined) {
		return { value: product, source: "product" }
	}
	if (category !== undefined) {
		return { value: category, source: "category" }
	}
	return { value: fallback, source: "global" }
}

/**
 * Deterministic resolution order: product override wins over category rule,
 * which wins over the global rule. Resolution is per field (see ADR-0003).
 */
export function resolveEffectiveRule(
	config: PricingConfig,
	productId: string,
	categoryId?: string,
): { rule: EffectiveRule; trace: RuleTraceEntry[] } {
	const product = config.productOverrides[productId]
	const category = categoryId === undefined ? undefined : config.categoryRules[categoryId]
	const globalRule = config.global
	const trace: RuleTraceEntry[] = []

	const markup = pick(product?.markupBps, category?.markupBps, globalRule.markupBps)
	const addAbs = pick(product?.addAbsMinor, category?.addAbsMinor, globalRule.addAbsMinor)
	const minMargin = pick(product?.minMarginAbsMinor, category?.minMarginAbsMinor, globalRule.minMarginAbsMinor)
	const floor = pick(product?.floorMinor, category?.floorMinor, globalRule.floorMinor)
	const cap = pick(product?.capMinor, category?.capMinor, globalRule.capMinor)
	const tax = pick(product?.taxBps, category?.taxBps, globalRule.taxBps)
	const rounding = pick(product?.rounding, category?.rounding, globalRule.rounding)

	trace.push({ field: "markupBps", source: markup.source })
	trace.push({ field: "addAbsMinor", source: addAbs.source })
	trace.push({ field: "minMarginAbsMinor", source: minMargin.source })
	trace.push({ field: "floorMinor", source: floor.source })
	trace.push({ field: "capMinor", source: cap.source })
	trace.push({ field: "taxBps", source: tax.source })
	trace.push({ field: "rounding", source: rounding.source })

	return {
		rule: {
			markupBps: markup.value,
			addAbsMinor: addAbs.value,
			minMarginAbsMinor: minMargin.value,
			floorMinor: floor.value,
			capMinor: cap.value,
			taxBps: tax.value,
			rounding: rounding.value,
		},
		trace,
	}
}

function weekdayInZone(epochMs: number, timeZone: string): number {
	const short = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(new Date(epochMs))
	return WEEKDAY_CODES.indexOf(short)
}

function matchesScope(rule: ScheduledRule, productId: string, categoryId?: string): boolean {
	if (rule.productId !== undefined) {
		return rule.productId === productId
	}
	if (rule.categoryId !== undefined) {
		return rule.categoryId === categoryId
	}
	return true
}

/** First matching active campaign wins; order of `scheduled` is the priority. */
export function findActiveScheduledRule(
	scheduled: readonly ScheduledRule[],
	nowIso: string,
	productId: string,
	categoryId?: string,
): ScheduledRule | undefined {
	const nowMs = Date.parse(nowIso)
	for (const rule of scheduled) {
		if (!matchesScope(rule, productId, categoryId)) {
			continue
		}
		if (nowMs < Date.parse(rule.startsAtIso) || nowMs > Date.parse(rule.endsAtIso)) {
			continue
		}
		if (rule.activeWeekdays !== undefined) {
			const weekday = weekdayInZone(nowMs, rule.timeZone ?? "Asia/Tehran")
			if (!rule.activeWeekdays.includes(weekday)) {
				continue
			}
		}
		return rule
	}
	return undefined
}

/** Grosses up a net amount by the tax rate. */
function netToGross(netMinor: number, taxBps: number): number {
	return netMinor + applyBps(netMinor, taxBps)
}

/** Extracts the net amount contained in a tax-inclusive gross amount. */
function grossToNet(grossMinor: number, taxBps: number): number {
	return mulDivHalfUp(grossMinor, BPS_DENOMINATOR, BPS_DENOMINATOR + taxBps)
}

/** Rounds, then guarantees the result never drops below `minimumMinor`. */
export function roundNotBelow(amountMinor: number, config: RoundingConfig, minimumMinor: number): number {
	const rounded = roundPrice(amountMinor, config)
	if (rounded >= minimumMinor) {
		return rounded
	}
	if (config.mode === "none") {
		return minimumMinor
	}
	return roundPrice(minimumMinor, { mode: "up", unitMinor: config.unitMinor })
}

/**
 * Single entry point for every price shown or charged.
 *
 * Chain (directive Phase 3): FX conversion + buffer -> markup -> absolute
 * minimum margin -> floor/cap -> tax -> rounding -> scheduled campaign.
 */
export function computeQuote(config: PricingConfig, input: PricingInput): PriceQuote {
	const base = {
		productId: input.productId,
		engineVersion: PRICING_ENGINE_VERSION,
		computedAtIso: input.nowIso,
	} as const

	if (!Number.isSafeInteger(input.supplierCostUsdCents) || input.supplierCostUsdCents < 0) {
		return { status: "blocked", reason: "invalid_cost", ...base }
	}
	if (input.supplierCostUsdCents === 0) {
		return { status: "blocked", reason: "zero_cost", ...base }
	}
	if (config.expectedCurrency !== "IRT") {
		return { status: "blocked", reason: "unexpected_currency", ...base }
	}
	if (!Number.isSafeInteger(input.fx.irtMinorPerUsd) || input.fx.irtMinorPerUsd <= 0) {
		return { status: "blocked", reason: "invalid_fx_rate", ...base }
	}
	const capturedMs = Date.parse(input.fx.capturedAtIso)
	const nowMs = Date.parse(input.nowIso)
	if (Number.isNaN(capturedMs) || Number.isNaN(nowMs)) {
		return { status: "blocked", reason: "invalid_fx_rate", ...base }
	}
	if ((nowMs - capturedMs) / 1000 > config.fxMaxAgeSeconds) {
		return { status: "blocked", reason: "stale_fx_rate", ...base }
	}

	const { rule, trace } = resolveEffectiveRule(config, input.productId, input.categoryId)
	const steps: QuoteStep[] = []
	const warnings: QuoteWarning[] = []

	const costBeforeBufferMinor = mulDivHalfUp(input.supplierCostUsdCents, input.fx.irtMinorPerUsd, 100)
	steps.push({ step: "fx_converted", valueMinor: costBeforeBufferMinor, note: input.fx.source })
	const costMinor = costBeforeBufferMinor + applyBps(costBeforeBufferMinor, input.fx.bufferBps)
	steps.push({ step: "fx_buffer_applied", valueMinor: costMinor })

	let netMinor = costMinor + applyBps(costMinor, rule.markupBps) + rule.addAbsMinor
	steps.push({ step: "markup_applied", valueMinor: netMinor })

	const minNetMinor = costMinor + rule.minMarginAbsMinor
	if (netMinor < minNetMinor) {
		netMinor = minNetMinor
		warnings.push("min_margin_enforced")
		steps.push({ step: "min_margin_enforced", valueMinor: netMinor })
	}

	if (rule.floorMinor !== null && netMinor < rule.floorMinor) {
		netMinor = rule.floorMinor
		warnings.push("floor_clamped")
		steps.push({ step: "floor_clamped", valueMinor: netMinor })
	}

	if (rule.capMinor !== null && netMinor > rule.capMinor) {
		if (rule.capMinor < minNetMinor) {
			return { status: "blocked", reason: "cap_below_min_margin", ...base }
		}
		netMinor = rule.capMinor
		warnings.push("cap_clamped")
		steps.push({ step: "cap_clamped", valueMinor: netMinor })
	}

	let grossMinor = netToGross(netMinor, rule.taxBps)
	steps.push({ step: "tax_applied", valueMinor: grossMinor })

	const minGrossMinor = netToGross(minNetMinor, rule.taxBps)
	const naiveRoundedMinor = roundPrice(grossMinor, rule.rounding)
	if (naiveRoundedMinor < minGrossMinor) {
		grossMinor = roundNotBelow(grossMinor, rule.rounding, minGrossMinor)
		warnings.push("rounding_margin_corrected")
		steps.push({ step: "rounded", valueMinor: grossMinor, note: "margin_corrected" })
	} else if (naiveRoundedMinor !== grossMinor) {
		if (naiveRoundedMinor < grossMinor) {
			warnings.push("rounded_down")
		}
		grossMinor = naiveRoundedMinor
		steps.push({ step: "rounded", valueMinor: grossMinor })
	}

	const campaign = findActiveScheduledRule(config.scheduled, input.nowIso, input.productId, input.categoryId)
	let appliedCampaignId: string | null = null
	if (campaign !== undefined) {
		appliedCampaignId = campaign.id
		const discount = applyBps(grossMinor, campaign.discountBps ?? 0) + (campaign.discountAbsMinor ?? 0)
		const discounted = grossMinor - discount
		if (discounted < minGrossMinor) {
			warnings.push("campaign_clamped")
			grossMinor = roundNotBelow(minGrossMinor, rule.rounding, minGrossMinor)
		} else {
			grossMinor = roundNotBelow(discounted, rule.rounding, minGrossMinor)
		}
		steps.push({ step: "campaign_applied", valueMinor: grossMinor, note: campaign.id })
	}

	const finalNetMinor = grossToNet(grossMinor, rule.taxBps)
	const taxMinor = grossMinor - finalNetMinor
	const marginMinor = finalNetMinor - costMinor

	return {
		status: "ok",
		productId: input.productId,
		currency: "IRT",
		costMinor,
		costBeforeBufferMinor,
		netMinor: finalNetMinor,
		taxMinor,
		grossMinor,
		marginMinor,
		marginBps: marginBps(costMinor, grossMinor),
		appliedCampaignId,
		rule,
		ruleVersion: config.global.version,
		ruleTrace: trace,
		steps,
		warnings,
		fx: input.fx,
		engineVersion: PRICING_ENGINE_VERSION,
		computedAtIso: input.nowIso,
	}
}
