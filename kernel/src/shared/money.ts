/**
 * Money primitives for LICENSELAND.
 *
 * Hard rules (see docs/adr/ADR-0002-money-integer.md):
 * - All amounts are integers in the currency's minor unit.
 * - Float arithmetic on money is forbidden.
 * - Percentages are expressed in basis points (bps): 2_500 bps = 25.00%.
 */

export type CurrencyCode = "IRT" | "USDT"

export type Money = {
	readonly amountMinor: number
	readonly currency: CurrencyCode
}

export class MoneyError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "MoneyError"
	}
}

export const BPS_DENOMINATOR = 10_000

export function isSafeMoneyInteger(value: unknown): boolean {
	return typeof value === "number" && Number.isSafeInteger(value)
}

export function assertSafeInteger(value: number, label: string): number {
	if (!isSafeMoneyInteger(value)) {
		throw new MoneyError(`${label} must be a safe integer, received ${String(value)}`)
	}
	return value
}

export function money(amountMinor: number, currency: CurrencyCode): Money {
	assertSafeInteger(amountMinor, "amountMinor")
	return { amountMinor, currency }
}

export function assertSameCurrency(a: Money, b: Money): void {
	if (a.currency !== b.currency) {
		throw new MoneyError(`currency mismatch: ${a.currency} != ${b.currency}`)
	}
}

export function addMoney(a: Money, b: Money): Money {
	assertSameCurrency(a, b)
	return money(a.amountMinor + b.amountMinor, a.currency)
}

export function subMoney(a: Money, b: Money): Money {
	assertSameCurrency(a, b)
	return money(a.amountMinor - b.amountMinor, a.currency)
}

/**
 * Integer mul-div with half-up rounding, computed in BigInt so no float error
 * can leak into a price. Throws when the result leaves the safe integer range.
 */
export function mulDivHalfUp(value: number, numerator: number, denominator: number): number {
	assertSafeInteger(value, "value")
	assertSafeInteger(numerator, "numerator")
	assertSafeInteger(denominator, "denominator")
	if (denominator === 0) {
		throw new MoneyError("denominator must not be zero")
	}
	const product = BigInt(value) * BigInt(numerator)
	const divisor = BigInt(denominator)
	const isNegative = product < 0n !== divisor < 0n
	const absProduct = product < 0n ? -product : product
	const absDivisor = divisor < 0n ? -divisor : divisor
	const quotient = absProduct / absDivisor
	const remainder = absProduct % absDivisor
	const magnitude = remainder * 2n >= absDivisor ? quotient + 1n : quotient
	const signed = isNegative ? -magnitude : magnitude
	if (signed > BigInt(Number.MAX_SAFE_INTEGER) || signed < BigInt(Number.MIN_SAFE_INTEGER)) {
		throw new MoneyError("money result exceeds safe integer range")
	}
	return Number(signed)
}

/** Applies a basis-point rate to an integer minor amount. */
export function applyBps(amountMinor: number, bps: number): number {
	return mulDivHalfUp(amountMinor, bps, BPS_DENOMINATOR)
}

/** Margin in bps relative to the sell price (gross margin), 0 when price is 0. */
export function marginBps(costMinor: number, sellMinor: number): number {
	if (sellMinor === 0) {
		return 0
	}
	return mulDivHalfUp(sellMinor - costMinor, BPS_DENOMINATOR, sellMinor)
}
