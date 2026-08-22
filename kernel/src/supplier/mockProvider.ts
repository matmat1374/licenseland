import { parseSupplierProduct, type SupplierOrderStatus, type SupplierProduct, type SupplierPurchaseResult } from "./contract.ts"
import { SupplierError, type SupplierProvider, type SupplierPurchaseInput } from "./provider.ts"

/**
 * Deterministic in-memory supplier used by CI and local development.
 * Shapes are copied from the documented contract only; no invented fields.
 * Refuses to run in production so mock data can never reach a real order.
 */
export type MockScript = {
	readonly status?: SupplierOrderStatus
	readonly accounts?: readonly string[]
	readonly refunded?: boolean
	readonly throwError?: SupplierError
}

export const MOCK_PRODUCT_FIXTURES: readonly unknown[] = [
	{
		id: 101,
		name: "Mock License 1 Month",
		price_usd: "3.20",
		retail_usd: "4.00",
		discount_percent: 20,
		stock: 25,
		pricing_unit: "unit",
		requires_email: false,
	},
	{
		id: 202,
		name: "Mock SMM Followers",
		price_usd: "0.90",
		pricing_unit: "per_1000",
		price_per_1000_usd: "0.90",
		min_qty: 100,
		max_qty: 100000,
		requires_link: true,
	},
]

export class MockSupplierProvider implements SupplierProvider {
	private readonly script: Map<number, MockScript>
	private readonly seenIdempotencyKeys = new Map<string, SupplierPurchaseResult>()
	private nextOrderId = 9000
	readonly calls: Array<{ method: string; payload: unknown }> = []

	constructor(args: { script?: Map<number, MockScript>; nodeEnv?: string } = {}) {
		const env = args.nodeEnv ?? process.env.NODE_ENV
		if (env === "production") {
			throw new SupplierError("mock_in_production", "MockSupplierProvider must never run in production", null, false)
		}
		this.script = args.script ?? new Map()
	}

	async listProducts(): Promise<readonly SupplierProduct[]> {
		this.calls.push({ method: "listProducts", payload: null })
		return MOCK_PRODUCT_FIXTURES.map((item) => parseSupplierProduct(item))
	}

	async balanceUsdCents(): Promise<number> {
		this.calls.push({ method: "balanceUsdCents", payload: null })
		return 12_500
	}

	async purchase(input: SupplierPurchaseInput): Promise<SupplierPurchaseResult> {
		this.calls.push({ method: "purchase", payload: input })
		const replay = this.seenIdempotencyKeys.get(input.idempotencyKey)
		if (replay !== undefined) {
			return replay
		}
		const script = this.script.get(input.productId)
		if (script?.throwError !== undefined) {
			throw script.throwError
		}
		const status = script?.status ?? "delivered"
		const result: SupplierPurchaseResult = {
			success: status === "delivered",
			orderId: this.nextOrderId++,
			status,
			quantity: input.quantity,
			totalUsdCents: 320 * input.quantity,
			accounts: script?.accounts ?? (status === "delivered" ? ["mock-user:mock-pass"] : []),
			refunded: script?.refunded ?? false,
		}
		this.seenIdempotencyKeys.set(input.idempotencyKey, result)
		return result
	}

	async getOrder(orderId: number) {
		this.calls.push({ method: "getOrder", payload: orderId })
		for (const result of this.seenIdempotencyKeys.values()) {
			if (result.orderId === orderId) {
				return { status: result.status, accounts: result.accounts, refunded: result.refunded }
			}
		}
		throw new SupplierError("not_found", `unknown mock order ${orderId}`, 404, false)
	}
}
