import type { PriceQuote } from "./types.ts"

export class PricingPolicyError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "PricingPolicyError"
	}
}

export type MarginStatus = "ok" | "below_target" | "negative"

export type MarginAssessment = {
	readonly productId: string
	readonly marginMinor: number
	readonly marginBps: number
	readonly targetMarginBps: number
	readonly status: MarginStatus
}

/**
 * Powers the admin dry-run margin warning: every rule change is scored against
 * the target margin before it is saved, so a rule can never silently ship a
 * loss-making catalog.
 */
export function assessMargin(quote: PriceQuote, targetMarginBps: number): MarginAssessment {
	if (quote.status !== "ok") {
		throw new PricingPolicyError(`cannot assess a blocked quote: ${quote.reason}`)
	}
	let status: MarginStatus = "ok"
	if (quote.marginMinor < 0) {
		status = "negative"
	} else if (quote.marginBps < targetMarginBps) {
		status = "below_target"
	}
	return {
		productId: quote.productId,
		marginMinor: quote.marginMinor,
		marginBps: quote.marginBps,
		targetMarginBps,
		status,
	}
}

/** Catalog-wide dry run summary used by the bulk rule editor. */
export function summarizeAssessments(assessments: readonly MarginAssessment[]) {
	let negative = 0
	let belowTarget = 0
	for (const assessment of assessments) {
		if (assessment.status === "negative") {
			negative += 1
			continue
		}
		if (assessment.status === "below_target") {
			belowTarget += 1
		}
	}
	return { total: assessments.length, negative, belowTarget, ok: assessments.length - negative - belowTarget }
}
