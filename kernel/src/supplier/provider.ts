import { redact } from "../shared/redact.ts"
import {
	parseSupplierProduct,
	type SupplierOrderStatus,
	type SupplierProduct,
	type SupplierPurchaseResult,
	usdToCents,
} from "./contract.ts"
import { CircuitBreaker, retry, withTimeout, type Clock } from "./resilience.ts"

export class SupplierError extends Error {
	readonly code: string
	readonly httpStatus: number | null
	readonly retryable: boolean
	constructor(code: string, message: string, httpStatus: number | null, retryable: boolean) {
		super(message)
		this.name = "SupplierError"
		this.code = code
		this.httpStatus = httpStatus
		this.retryable = retryable
	}
}

/** Documented HTTP contract -> typed domain errors. */
export function mapHttpStatusToError(status: number, body: string): SupplierError {
	if (status === 401) {
		return new SupplierError("auth_failed", "supplier rejected the API key", 401, false)
	}
	if (status === 402) {
		return new SupplierError("supplier_balance_empty", "supplier wallet balance is insufficient", 402, false)
	}
	if (status === 404) {
		return new SupplierError("not_found", "unknown or unavailable product/order", 404, false)
	}
	if (status === 409) {
		return new SupplierError("out_of_stock", "supplier stock is insufficient", 409, false)
	}
	if (status === 400) {
		return new SupplierError("invalid_request", `supplier validation error: ${body.slice(0, 200)}`, 400, false)
	}
	if (status === 429) {
		return new SupplierError("rate_limited", "supplier rate limit (120 req/min) hit", 429, true)
	}
	if (status >= 500) {
		return new SupplierError("supplier_unavailable", `supplier server error ${status}`, status, true)
	}
	return new SupplierError("unexpected_status", `unexpected supplier status ${status}`, status, false)
}

export type SupplierPurchaseInput = {
	readonly productId: number
	readonly quantity: number
	readonly idempotencyKey: string
	readonly customerEmail?: string
	readonly link?: string
	readonly comments?: string
	readonly extras?: Readonly<Record<string, string>>
}

export type SupplierProvider = {
	listProducts(): Promise<readonly SupplierProduct[]>
	balanceUsdCents(): Promise<number>
	purchase(input: SupplierPurchaseInput): Promise<SupplierPurchaseResult>
	getOrder(orderId: number): Promise<{ status: SupplierOrderStatus; accounts: readonly string[]; refunded: boolean }>
}

export type HttpResponseLike = {
	readonly ok: boolean
	readonly status: number
	text(): Promise<string>
}

export type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body?: string }) => Promise<HttpResponseLike>

export type LogSink = (event: { level: "info" | "warn" | "error"; message: string; data: unknown }) => void

export type IrMarketClientOptions = {
	readonly baseUrl: string
	/** Injected from process.env on the server only. Never reaches the client bundle. */
	readonly apiKey: string
	readonly fetchImpl: FetchLike
	readonly clock: Clock
	readonly timeoutMs: number
	readonly attempts: number
	readonly log: LogSink
	readonly breaker: CircuitBreaker
	readonly jitter?: () => number
}

/** Fails loudly if this module is ever imported into a browser bundle. */
export function assertServerSide(globalObject: Record<string, unknown> = globalThis as unknown as Record<string, unknown>): void {
	if (globalObject.window !== undefined) {
		throw new SupplierError("client_side_call", "supplier calls are server-side only", null, false)
	}
}

export class IrMarketClient implements SupplierProvider {
	private readonly options: IrMarketClientOptions

	constructor(options: IrMarketClientOptions) {
		if (options.apiKey.length === 0) {
			throw new SupplierError("missing_api_key", "SUPPLIER_API_KEY is not configured", null, false)
		}
		this.options = options
	}

	private async request(path: string, method: string, body?: unknown): Promise<unknown> {
		assertServerSide()
		const url = `${this.options.baseUrl}${path}`
		const run = async (): Promise<unknown> => {
			const response = await withTimeout(
				() =>
					this.options.fetchImpl(url, {
						method,
						headers: {
							"X-API-Key": this.options.apiKey,
							"Content-Type": "application/json",
							Accept: "application/json",
						},
						body: body === undefined ? undefined : JSON.stringify(body),
					}),
				this.options.timeoutMs,
				this.options.clock,
			)
			const text = await response.text()
			if (!response.ok) {
				const error = mapHttpStatusToError(response.status, text)
				this.options.log({
					level: "error",
					message: "supplier_call_failed",
					data: redact({ url, method, status: response.status, code: error.code, body: text.slice(0, 200) }),
				})
				throw error
			}
			this.options.log({ level: "info", message: "supplier_call_ok", data: redact({ url, method, status: response.status }) })
			return JSON.parse(text)
		}
		return this.options.breaker.execute(() =>
			retry(run, {
				attempts: this.options.attempts,
				baseDelayMs: 250,
				maxDelayMs: 4_000,
				jitter: this.options.jitter ?? Math.random,
				isRetryable: (error) => error instanceof SupplierError && error.retryable,
				clock: this.options.clock,
			}),
		)
	}

	async listProducts(): Promise<readonly SupplierProduct[]> {
		const payload = await this.request("/api/buyer/products", "GET")
		const items = Array.isArray(payload) ? payload : (payload as { products?: unknown[] }).products
		if (!Array.isArray(items)) {
			throw new SupplierError("contract_mismatch", "products payload is not an array", null, false)
		}
		return items.map((item) => parseSupplierProduct(item))
	}

	async balanceUsdCents(): Promise<number> {
		const payload = (await this.request("/api/buyer/balance", "GET")) as Record<string, unknown>
		const raw = payload.balance_usd ?? payload.balance
		if (typeof raw !== "number" && typeof raw !== "string") {
			throw new SupplierError("contract_mismatch", "balance payload has no numeric balance", null, false)
		}
		return usdToCents(raw, "balance_usd")
	}

	async purchase(input: SupplierPurchaseInput): Promise<SupplierPurchaseResult> {
		if (input.idempotencyKey.length === 0 || input.idempotencyKey.length > 64) {
			throw new SupplierError("invalid_idempotency_key", "idempotency_key must be 1..64 chars", null, false)
		}
		const payload = (await this.request("/api/buyer/purchase", "POST", {
			product_id: input.productId,
			quantity: input.quantity,
			idempotency_key: input.idempotencyKey,
			customer_email: input.customerEmail,
			link: input.link,
			comments: input.comments,
			extras: input.extras,
		})) as Record<string, unknown>
		return parsePurchaseResult(payload)
	}

	async getOrder(orderId: number) {
		const payload = (await this.request(`/api/buyer/orders/${orderId}`, "GET")) as Record<string, unknown>
		return {
			status: parseStatus(payload.status),
			accounts: Array.isArray(payload.accounts) ? (payload.accounts as string[]) : [],
			refunded: payload.refunded === true,
		}
	}
}

export function parseStatus(value: unknown): SupplierOrderStatus {
	if (value === "delivered" || value === "processing" || value === "failed" || value === "cancelled") {
		return value
	}
	throw new SupplierError("contract_mismatch", `unknown supplier status ${String(value)}`, null, false)
}

export function parsePurchaseResult(payload: Record<string, unknown>): SupplierPurchaseResult {
	const orderId = payload.order_id
	if (typeof orderId !== "number" || !Number.isSafeInteger(orderId)) {
		throw new SupplierError("contract_mismatch", "purchase response has no integer order_id", null, false)
	}
	const quantity = typeof payload.quantity === "number" ? payload.quantity : 1
	return {
		success: payload.success === true,
		orderId,
		status: parseStatus(payload.status),
		quantity,
		totalUsdCents: payload.total_usd === undefined ? 0 : usdToCents(payload.total_usd as number | string, "total_usd"),
		accounts: Array.isArray(payload.accounts) ? (payload.accounts as string[]) : [],
		refunded: payload.refunded === true,
	}
}
