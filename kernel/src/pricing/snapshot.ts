import { createHash } from "node:crypto"
import type { PriceQuote } from "./types.ts"

export type PriceSnapshot = {
	readonly orderItemId: string
	readonly productId: string
	readonly quantity: number
	readonly unitGrossMinor: number
	readonly unitNetMinor: number
	readonly unitTaxMinor: number
	readonly unitCostMinor: number
	readonly totalGrossMinor: number
	readonly ruleVersion: string
	readonly engineVersion: string
	readonly fxRateIrtMinorPerUsd: number
	readonly fxSource: string
	readonly fxCapturedAtIso: string
	readonly capturedAtIso: string
	/** Integrity digest: any later mutation of the snapshot is detectable. */
	readonly digest: string
}

export class SnapshotError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "SnapshotError"
	}
}

function digestOf(fields: Omit<PriceSnapshot, "digest">): string {
	const canonical = JSON.stringify(fields, Object.keys(fields).sort())
	return createHash("sha256").update(canonical).digest("hex")
}

/**
 * Freezes the price at order time. Supplier price or FX moves afterwards must
 * never change an open order (directive Phase 3.2).
 */
export function createPriceSnapshot(args: {
	orderItemId: string
	quote: PriceQuote
	quantity: number
}): PriceSnapshot {
	if (args.quote.status !== "ok") {
		throw new SnapshotError(`cannot snapshot a blocked quote: ${args.quote.reason}`)
	}
	if (!Number.isSafeInteger(args.quantity) || args.quantity < 1) {
		throw new SnapshotError("quantity must be a positive integer")
	}
	const fields = {
		orderItemId: args.orderItemId,
		productId: args.quote.productId,
		quantity: args.quantity,
		unitGrossMinor: args.quote.grossMinor,
		unitNetMinor: args.quote.netMinor,
		unitTaxMinor: args.quote.taxMinor,
		unitCostMinor: args.quote.costMinor,
		totalGrossMinor: args.quote.grossMinor * args.quantity,
		ruleVersion: args.quote.ruleVersion,
		engineVersion: args.quote.engineVersion,
		fxRateIrtMinorPerUsd: args.quote.fx.irtMinorPerUsd,
		fxSource: args.quote.fx.source,
		fxCapturedAtIso: args.quote.fx.capturedAtIso,
		capturedAtIso: args.quote.computedAtIso,
	}
	return { ...fields, digest: digestOf(fields) }
}

export function verifySnapshot(snapshot: PriceSnapshot): boolean {
	const { digest, ...fields } = snapshot
	return digestOf(fields) === digest
}
