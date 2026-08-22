import type { CurrencyCode } from "../shared/money.ts"
import type { RoundingConfig } from "./rounding.ts"

export type RuleSource = "global" | "category" | "product"

/** Partial rule used by category and product scopes. Undefined field = inherit. */
export type PricingRuleFields = {
	readonly markupBps?: number
	readonly addAbsMinor?: number
	readonly minMarginAbsMinor?: number
	readonly floorMinor?: number | null
	readonly capMinor?: number | null
	readonly taxBps?: number
	readonly rounding?: RoundingConfig
}

export type EffectiveRule = {
	readonly markupBps: number
	readonly addAbsMinor: number
	readonly minMarginAbsMinor: number
	readonly floorMinor: number | null
	readonly capMinor: number | null
	readonly taxBps: number
	readonly rounding: RoundingConfig
}

export type GlobalPricingRule = EffectiveRule & { readonly version: string }

export type ScheduledRule = {
	readonly id: string
	readonly startsAtIso: string
	readonly endsAtIso: string
	readonly discountBps?: number
	readonly discountAbsMinor?: number
	/** Undefined product and category = campaign applies to the whole catalog. */
	readonly productId?: string
	readonly categoryId?: string
	/** 0 = Sunday ... 6 = Saturday, evaluated in `timeZone`. */
	readonly activeWeekdays?: readonly number[]
	readonly timeZone?: string
}

/**
 * Supplier prices are quoted in USD (see docs/SUPPLIER_CONTRACT.md), the shop
 * sells in IRT, so every quote carries the FX rate that produced it.
 */
export type FxQuote = {
	/** IRT minor units per 1 USD. Integer only. */
	readonly irtMinorPerUsd: number
	readonly source: string
	readonly capturedAtIso: string
	/** Volatility buffer added to supplier cost before markup. */
	readonly bufferBps: number
}

export type PricingConfig = {
	readonly expectedCurrency: CurrencyCode
	readonly global: GlobalPricingRule
	readonly categoryRules: Readonly<Record<string, PricingRuleFields>>
	readonly productOverrides: Readonly<Record<string, PricingRuleFields>>
	readonly scheduled: readonly ScheduledRule[]
	/** Maximum accepted age of an FX quote, in seconds. */
	readonly fxMaxAgeSeconds: number
}

export type PricingInput = {
	readonly productId: string
	readonly categoryId?: string
	/** Supplier `price_usd` converted to integer cents. */
	readonly supplierCostUsdCents: number
	readonly fx: FxQuote
	readonly nowIso: string
}

export type RuleTraceEntry = {
	readonly field: keyof EffectiveRule
	readonly source: RuleSource
}

export type QuoteStep = {
	readonly step: string
	readonly valueMinor: number
	readonly note?: string
}

export type QuoteWarning =
	| "min_margin_enforced"
	| "floor_clamped"
	| "cap_clamped"
	| "rounded_down"
	| "rounding_margin_corrected"
	| "campaign_clamped"

export type BlockedReason =
	| "invalid_cost"
	| "zero_cost"
	| "invalid_fx_rate"
	| "stale_fx_rate"
	| "unexpected_currency"
	| "cap_below_min_margin"

export type PriceQuote =
	| {
			readonly status: "blocked"
			readonly reason: BlockedReason
			readonly productId: string
			readonly engineVersion: string
			readonly computedAtIso: string
	  }
	| {
			readonly status: "ok"
			readonly productId: string
			readonly currency: CurrencyCode
			/** Supplier cost in IRT minor units, including the FX buffer. */
			readonly costMinor: number
			readonly costBeforeBufferMinor: number
			readonly netMinor: number
			readonly taxMinor: number
			readonly grossMinor: number
			readonly marginMinor: number
			readonly marginBps: number
			readonly appliedCampaignId: string | null
			readonly rule: EffectiveRule
			readonly ruleVersion: string
			readonly ruleTrace: readonly RuleTraceEntry[]
			readonly steps: readonly QuoteStep[]
			readonly warnings: readonly QuoteWarning[]
			readonly fx: FxQuote
			readonly engineVersion: string
			readonly computedAtIso: string
	  }
