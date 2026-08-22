import { MoneyError, assertSafeInteger } from "../shared/money.ts"

export type RoundingMode = "none" | "up" | "nearest" | "psychological"

export type RoundingConfig = {
	readonly mode: RoundingMode
	/** Rounding step in minor units, e.g. 1_000 for 1,000 IRT steps. */
	readonly unitMinor: number
	/** Subtracted from the ceiled value to produce 9-endings. Must be < unitMinor. */
	readonly psychologicalEndingMinor?: number
}

function ceilToUnit(amountMinor: number, unitMinor: number): number {
	const remainder = amountMinor % unitMinor
	return remainder === 0 ? amountMinor : amountMinor + (unitMinor - remainder)
}

/**
 * Deterministic price rounding. Never rounds below the input amount except in
 * `nearest` mode, which is the only mode allowed to give margin away and is
 * therefore re-checked against the margin floor by the pricing engine.
 */
export function roundPrice(amountMinor: number, config: RoundingConfig): number {
	assertSafeInteger(amountMinor, "amountMinor")
	if (amountMinor < 0) {
		throw new MoneyError("cannot round a negative price")
	}
	if (config.mode === "none") {
		return amountMinor
	}
	if (!Number.isSafeInteger(config.unitMinor) || config.unitMinor < 1) {
		throw new MoneyError(`rounding unitMinor must be a positive integer, received ${String(config.unitMinor)}`)
	}
	if (config.mode === "up") {
		return ceilToUnit(amountMinor, config.unitMinor)
	}
	if (config.mode === "nearest") {
		const remainder = amountMinor % config.unitMinor
		return remainder * 2 >= config.unitMinor
			? amountMinor + (config.unitMinor - remainder)
			: amountMinor - remainder
	}
	const ending = config.psychologicalEndingMinor ?? 0
	if (ending < 0 || ending >= config.unitMinor) {
		throw new MoneyError("psychologicalEndingMinor must satisfy 0 <= ending < unitMinor")
	}
	const ceiled = ceilToUnit(amountMinor, config.unitMinor)
	const candidate = ceiled - ending
	return candidate >= amountMinor ? candidate : ceiled + config.unitMinor - ending
}
