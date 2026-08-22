/**
 * irMarket Buyer API contract.
 *
 * Source of truth: https://api.irmarket.store/openapi.json (fetched 2026-08-19).
 * Verification status: DOCS-ONLY. No live response has been observed yet, so
 * every field below is marked with its verification level and the runtime
 * parser rejects payloads that do not match. Run `npm run supplier:probe`
 * against the real key to promote fields to OBSERVED
 * (see docs/SUPPLIER_CONTRACT.md).
 */

export type PricingUnit = "unit" | "per_1000"

/** Documented fields of GET /api/buyer/products items. */
export type SupplierProductRaw = {
	id: number
	name: string
	price_usd: number | string
	retail_usd?: number | string
	discount_percent?: number
	savings_usd?: number | string
	effective_discount_percent?: number
	stock?: number | null
	pricing_unit?: PricingUnit
	price_per_1000_usd?: number | string
	min_qty?: number
	max_qty?: number
	requires_email?: boolean
	requires_link?: boolean
	requires_comments?: boolean
	required_inputs?: string[]
}

export type SupplierProduct = {
	readonly id: number
	readonly name: string
	/** Integer cents, converted without float arithmetic. */
	readonly priceUsdCents: number
	readonly retailUsdCents: number | null
	readonly pricingUnit: PricingUnit
	readonly pricePer1000UsdCents: number | null
	readonly stock: number | null
	readonly minQty: number
	readonly maxQty: number | null
	readonly requiresEmail: boolean
	readonly requiresLink: boolean
	readonly requiresComments: boolean
	readonly requiredInputs: readonly string[]
}

export type SupplierOrderStatus = "delivered" | "processing" | "failed" | "cancelled"

export type SupplierPurchaseResult = {
	readonly success: boolean
	readonly orderId: number
	readonly status: SupplierOrderStatus
	readonly quantity: number
	readonly totalUsdCents: number
	readonly accounts: readonly string[]
	readonly refunded: boolean
}

export class SupplierContractError extends Error {
	readonly field: string
	constructor(field: string, message: string) {
		super(message)
		this.name = "SupplierContractError"
		this.field = field
	}
}

/**
 * Converts a USD amount to integer cents using string math, so 9.99 can never
 * become 998 through float representation error.
 */
export function usdToCents(input: unknown, field = "price_usd"): number {
	if (typeof input !== "number" && typeof input !== "string") {
		throw new SupplierContractError(field, `${field} is missing or not a number: ${String(input)}`)
	}
	const text = typeof input === "number" ? input.toString() : input.trim()
	if (!/^-?\d+(\.\d+)?$/.test(text)) {
		throw new SupplierContractError(field, `${field} is not a decimal number: ${text}`)
	}
	const negative = text.startsWith("-")
	const unsigned = negative ? text.slice(1) : text
	const [whole, fraction = ""] = unsigned.split(".")
	const cents = `${fraction}00`.slice(0, 2)
	const value = Number(whole) * 100 + Number(cents)
	if (!Number.isSafeInteger(value)) {
		throw new SupplierContractError(field, `${field} is out of safe range: ${text}`)
	}
	return negative ? -value : value
}

function requireString(raw: Record<string, unknown>, field: string): string {
	const value = raw[field]
	if (typeof value !== "string" || value.length === 0) {
		throw new SupplierContractError(field, `missing string field ${field}`)
	}
	return value
}

function requireInteger(raw: Record<string, unknown>, field: string): number {
	const value = raw[field]
	if (typeof value !== "number" || !Number.isSafeInteger(value)) {
		throw new SupplierContractError(field, `missing integer field ${field}`)
	}
	return value
}

/** Strict parser: unknown shapes are rejected instead of silently defaulted. */
export function parseSupplierProduct(input: unknown): SupplierProduct {
	if (typeof input !== "object" || input === null) {
		throw new SupplierContractError("product", "product must be an object")
	}
	const raw = input as Record<string, unknown>
	const id = requireInteger(raw, "id")
	const name = requireString(raw, "name")
	const priceUsdCents = usdToCents(raw.price_usd as number | string, "price_usd")
	if (priceUsdCents < 0) {
		throw new SupplierContractError("price_usd", "price_usd must not be negative")
	}
	const pricingUnitRaw = raw.pricing_unit
	let pricingUnit: PricingUnit = "unit"
	if (pricingUnitRaw !== undefined) {
		if (pricingUnitRaw !== "unit" && pricingUnitRaw !== "per_1000") {
			throw new SupplierContractError("pricing_unit", `unsupported pricing_unit ${String(pricingUnitRaw)}`)
		}
		pricingUnit = pricingUnitRaw
	}
	let pricePer1000UsdCents: number | null = null
	if (pricingUnit === "per_1000") {
		if (raw.price_per_1000_usd === undefined) {
			throw new SupplierContractError("price_per_1000_usd", "per_1000 product without price_per_1000_usd")
		}
		pricePer1000UsdCents = usdToCents(raw.price_per_1000_usd as number | string, "price_per_1000_usd")
	}
	return {
		id,
		name,
		priceUsdCents,
		retailUsdCents: raw.retail_usd === undefined ? null : usdToCents(raw.retail_usd as number | string, "retail_usd"),
		pricingUnit,
		pricePer1000UsdCents,
		stock: typeof raw.stock === "number" ? raw.stock : null,
		minQty: typeof raw.min_qty === "number" ? raw.min_qty : 1,
		maxQty: typeof raw.max_qty === "number" ? raw.max_qty : null,
		requiresEmail: raw.requires_email === true,
		requiresLink: raw.requires_link === true,
		requiresComments: raw.requires_comments === true,
		requiredInputs: Array.isArray(raw.required_inputs) ? (raw.required_inputs as string[]) : [],
	}
}

export type PurchaseInputs = {
	readonly quantity: number
	readonly customerEmail?: string
	readonly link?: string
	readonly comments?: string
	readonly extras?: Readonly<Record<string, string>>
}

/**
 * Pre-flight validation that mirrors the documented HTTP 400 cases, so the shop
 * fails fast in checkout instead of burning a supplier call.
 */
export function validatePurchaseInputs(product: SupplierProduct, inputs: PurchaseInputs): string[] {
	const problems: string[] = []
	if (!Number.isSafeInteger(inputs.quantity) || inputs.quantity < 1) {
		problems.push("quantity_invalid")
	}
	if (inputs.quantity < product.minQty) {
		problems.push("quantity_below_min")
	}
	if (product.maxQty !== null && inputs.quantity > product.maxQty) {
		problems.push("quantity_above_max")
	}
	if (product.requiresEmail && (inputs.customerEmail === undefined || inputs.customerEmail.length === 0)) {
		problems.push("customer_email_required")
	}
	if (product.requiresLink && (inputs.link === undefined || inputs.link.length === 0)) {
		problems.push("link_required")
	}
	if (product.requiresComments && (inputs.comments === undefined || inputs.comments.length === 0)) {
		problems.push("comments_required")
	}
	for (const key of product.requiredInputs) {
		const provided = inputs.extras?.[key]
		if (provided === undefined || provided.length === 0) {
			problems.push(`extra_required:${key}`)
		}
	}
	return problems
}

/**
 * Supplier cost for a quantity, in integer USD cents.
 * SMM services are quoted per 1000 units but ordered in raw units.
 */
export function supplierCostUsdCents(product: SupplierProduct, quantity: number): number {
	if (!Number.isSafeInteger(quantity) || quantity < 1) {
		throw new SupplierContractError("quantity", "quantity must be a positive integer")
	}
	if (product.pricingUnit === "unit") {
		return product.priceUsdCents * quantity
	}
	const per1000 = product.pricePer1000UsdCents
	if (per1000 === null) {
		throw new SupplierContractError("price_per_1000_usd", "missing per_1000 price")
	}
	// Ceil so a partial thousand is never sold below cost.
	return Math.ceil((per1000 * quantity) / 1000)
}
