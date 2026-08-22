import assert from "node:assert/strict"
import { test } from "node:test"
import { SupplierContractError } from "../src/supplier/contract.ts"
import { MOCK_PRODUCT_FIXTURES, MockSupplierProvider } from "../src/supplier/mockProvider.ts"
import {
	IrMarketClient,
	SupplierError,
	assertServerSide,
	mapHttpStatusToError,
	parsePurchaseResult,
	parseStatus,
	type FetchLike,
	type IrMarketClientOptions,
} from "../src/supplier/provider.ts"
import { CircuitBreaker, TimeoutError, type Clock } from "../src/supplier/resilience.ts"

// Synthetic value only. It uses the documented vendor prefix so the redaction
// assertions are meaningful; the real key is read from ENV at runtime.
const FAKE_KEY = "anb_fake_key_for_tests_only"

type StubResponse = { status: number; body: string }

function fetchStub(responses: StubResponse[]) {
	const calls: Array<{ url: string; init: { method: string; headers: Record<string, string>; body?: string } }> = []
	const impl: FetchLike = async (url, init) => {
		calls.push({ url, init })
		const next = responses.shift()
		if (next === undefined) {
			throw new Error("unexpected extra supplier call")
		}
		return {
			ok: next.status >= 200 && next.status < 300,
			status: next.status,
			text: async () => next.body,
		}
	}
	return { impl, calls }
}

// Backoff never exceeds 4s, the request timeout is 5s: a sleep of >= 5s is the
// timeout timer and is left hanging so it can never win a race by accident.
function testClock(): Clock {
	return {
		nowMs: () => 1_000_000,
		sleep: (ms) => (ms >= 5_000 ? new Promise<void>(() => {}) : Promise.resolve()),
	}
}

function makeClient(responses: StubResponse[], overrides: Partial<IrMarketClientOptions> = {}) {
	const stub = fetchStub(responses)
	const clock = overrides.clock ?? testClock()
	const logs: Array<{ level: string; message: string; data: unknown }> = []
	const client = new IrMarketClient({
		baseUrl: "https://api.irmarket.store",
		apiKey: FAKE_KEY,
		fetchImpl: stub.impl,
		clock,
		timeoutMs: 5_000,
		attempts: 2,
		log: (event) => logs.push(event),
		breaker: new CircuitBreaker({ failureThreshold: 999, openMs: 1_000, clock }),
		jitter: () => 0.5,
		...overrides,
	})
	return { client, stub, logs }
}

const PRODUCT = { id: 364, name: "Gemini AI Pro 18 Month", price_usd: 9, retail_usd: 12, stock: 5 }

test("a missing API key fails at construction, not at checkout", () => {
	assert.throws(
		() => makeClient([], { apiKey: "" }),
		(error: unknown) => error instanceof SupplierError && error.code === "missing_api_key",
	)
})

test("supplier calls are refused in a browser-like global", () => {
	assert.doesNotThrow(() => assertServerSide({}))
	assert.throws(
		() => assertServerSide({ window: {} }),
		(error: unknown) => error instanceof SupplierError && error.code === "client_side_call",
	)
})

test("listProducts accepts both documented envelope shapes", async () => {
	const bare = makeClient([{ status: 200, body: JSON.stringify([PRODUCT]) }])
	const fromArray = await bare.client.listProducts()
	assert.equal(fromArray.length, 1)
	assert.equal(fromArray[0].priceUsdCents, 900)
	assert.equal(bare.stub.calls[0].url, "https://api.irmarket.store/api/buyer/products")
	assert.equal(bare.stub.calls[0].init.method, "GET")
	assert.equal(bare.stub.calls[0].init.headers["X-API-Key"], FAKE_KEY)
	assert.equal(bare.stub.calls[0].init.body, undefined)

	const wrapped = makeClient([{ status: 200, body: JSON.stringify({ products: [PRODUCT] }) }])
	assert.equal((await wrapped.client.listProducts()).length, 1)
})

test("the API key never reaches a log sink", async () => {
	const { client, logs } = makeClient([{ status: 200, body: JSON.stringify([PRODUCT]) }])
	await client.listProducts()
	assert.equal(logs[0].message, "supplier_call_ok")
	assert.equal(JSON.stringify(logs).includes(FAKE_KEY), false)
})

test("a products payload that is not a list is a contract mismatch", async () => {
	const { client } = makeClient([{ status: 200, body: JSON.stringify({ items: [] }) }])
	await assert.rejects(
		() => client.listProducts(),
		(error: unknown) => error instanceof SupplierError && error.code === "contract_mismatch",
	)
})

test("balance is read from either documented field and converted to cents", async () => {
	const usd = makeClient([{ status: 200, body: JSON.stringify({ balance_usd: "12.34" }) }])
	assert.equal(await usd.client.balanceUsdCents(), 1_234)
	const legacy = makeClient([{ status: 200, body: JSON.stringify({ balance: 5 }) }])
	assert.equal(await legacy.client.balanceUsdCents(), 500)
	const broken = makeClient([{ status: 200, body: JSON.stringify({}) }])
	await assert.rejects(
		() => broken.client.balanceUsdCents(),
		(error: unknown) => error instanceof SupplierError && error.code === "contract_mismatch",
	)
})

test("purchase enforces the documented 1..64 char idempotency key", async () => {
	const { client, stub } = makeClient([])
	for (const key of ["", "k".repeat(65)]) {
		await assert.rejects(
			() => client.purchase({ productId: 364, quantity: 1, idempotencyKey: key }),
			(error: unknown) => error instanceof SupplierError && error.code === "invalid_idempotency_key",
		)
	}
	assert.equal(stub.calls.length, 0)
})

test("a delivered purchase is parsed into integer cents and account payloads", async () => {
	const { client, stub } = makeClient([
		{
			status: 200,
			body: JSON.stringify({
				success: true,
				order_id: 55_501,
				status: "delivered",
				quantity: 2,
				total_usd: "18.00",
				accounts: ["a@b.c:pw1", "d@e.f:pw2"],
				refunded: false,
			}),
		},
	])
	const result = await client.purchase({
		productId: 364,
		quantity: 2,
		idempotencyKey: "order_o1",
		customerEmail: "buyer@example.com",
	})
	assert.equal(result.orderId, 55_501)
	assert.equal(result.status, "delivered")
	assert.equal(result.totalUsdCents, 1_800)
	assert.deepEqual(result.accounts, ["a@b.c:pw1", "d@e.f:pw2"])
	assert.equal(result.refunded, false)
	assert.equal(stub.calls[0].init.method, "POST")
	const body = JSON.parse(stub.calls[0].init.body as string)
	assert.equal(body.idempotency_key, "order_o1")
	assert.equal(body.product_id, 364)
	assert.equal(body.customer_email, "buyer@example.com")
	assert.equal("link" in body, false)
})

test("optional purchase fields fall back to documented defaults", async () => {
	const { client } = makeClient([
		{ status: 200, body: JSON.stringify({ order_id: 1, status: "processing", accounts: "none" }) },
	])
	const result = await client.purchase({ productId: 1, quantity: 1, idempotencyKey: "k", link: "https://x" })
	assert.equal(result.success, false)
	assert.equal(result.quantity, 1)
	assert.equal(result.totalUsdCents, 0)
	assert.deepEqual(result.accounts, [])
	assert.equal(result.refunded, false)
})

test("order polling maps the documented status set", async () => {
	const delivered = makeClient([
		{ status: 200, body: JSON.stringify({ status: "delivered", accounts: ["x:y"], refunded: false }) },
	])
	assert.deepEqual(await delivered.client.getOrder(55_501), {
		status: "delivered",
		accounts: ["x:y"],
		refunded: false,
	})
	assert.equal(delivered.stub.calls[0].url, "https://api.irmarket.store/api/buyer/orders/55501")

	const failed = makeClient([{ status: 200, body: JSON.stringify({ status: "failed", refunded: true }) }])
	assert.deepEqual(await failed.client.getOrder(1), { status: "failed", accounts: [], refunded: true })
})

test("documented HTTP errors map to typed domain errors", () => {
	const cases: Array<[number, string, boolean]> = [
		[401, "auth_failed", false],
		[402, "supplier_balance_empty", false],
		[404, "not_found", false],
		[409, "out_of_stock", false],
		[400, "invalid_request", false],
		[429, "rate_limited", true],
		[500, "supplier_unavailable", true],
		[503, "supplier_unavailable", true],
		[418, "unexpected_status", false],
	]
	for (const [status, code, retryable] of cases) {
		const error = mapHttpStatusToError(status, "body")
		assert.equal(error.code, code, `status ${status}`)
		assert.equal(error.retryable, retryable, `status ${status} retryable`)
		assert.equal(error.httpStatus, status)
	}
})

test("a 5xx is retried and then succeeds", async () => {
	const { client, stub, logs } = makeClient([
		{ status: 503, body: "upstream down" },
		{ status: 200, body: JSON.stringify([PRODUCT]) },
	])
	assert.equal((await client.listProducts()).length, 1)
	assert.equal(stub.calls.length, 2)
	assert.deepEqual(
		logs.map((entry) => entry.level),
		["error", "info"],
	)
})

test("an auth failure is never retried", async () => {
	const { client, stub } = makeClient([{ status: 401, body: "invalid key" }])
	await assert.rejects(
		() => client.listProducts(),
		(error: unknown) => error instanceof SupplierError && error.code === "auth_failed",
	)
	assert.equal(stub.calls.length, 1)
})

test("retries are bounded by the attempt budget", async () => {
	const { client, stub } = makeClient([
		{ status: 429, body: "slow down" },
		{ status: 429, body: "slow down" },
	])
	await assert.rejects(
		() => client.listProducts(),
		(error: unknown) => error instanceof SupplierError && error.code === "rate_limited",
	)
	assert.equal(stub.calls.length, 2)
})

test("the default jitter source is used when none is injected", async () => {
	const { client, stub } = makeClient(
		[
			{ status: 500, body: "boom" },
			{ status: 200, body: JSON.stringify({ balance_usd: 1 }) },
		],
		{ jitter: undefined },
	)
	assert.equal(await client.balanceUsdCents(), 100)
	assert.equal(stub.calls.length, 2)
})

test("a hanging supplier call times out instead of blocking checkout", async () => {
	const instantClock: Clock = { nowMs: () => 0, sleep: async () => {} }
	const { client } = makeClient([], {
		clock: instantClock,
		attempts: 1,
		fetchImpl: () => new Promise(() => {}),
	})
	await assert.rejects(() => client.listProducts(), TimeoutError)
})

test("purchase parsing rejects payloads without an order id or with unknown status", () => {
	assert.throws(
		() => parsePurchaseResult({ status: "delivered" }),
		(error: unknown) => error instanceof SupplierError && error.code === "contract_mismatch",
	)
	assert.throws(() => parsePurchaseResult({ order_id: 1.5, status: "delivered" }), SupplierError)
	assert.throws(() => parseStatus("queued"), SupplierError)
	assert.throws(() => parseStatus(undefined), SupplierError)
	assert.equal(parseStatus("cancelled"), "cancelled")
	assert.throws(() => parsePurchaseResult({ order_id: 1, status: "delivered", total_usd: "abc" }), SupplierContractError)
})

test("the mock provider is deterministic, idempotent and production-safe", async () => {
	assert.throws(
		() => new MockSupplierProvider({ nodeEnv: "production" }),
		(error: unknown) => error instanceof SupplierError && error.code === "mock_in_production",
	)
	const provider = new MockSupplierProvider({ nodeEnv: "test" })
	assert.equal((await provider.listProducts()).length, MOCK_PRODUCT_FIXTURES.length)
	assert.equal(await provider.balanceUsdCents(), 12_500)

	const first = await provider.purchase({ productId: 101, quantity: 1, idempotencyKey: "order_1" })
	const replay = await provider.purchase({ productId: 101, quantity: 1, idempotencyKey: "order_1" })
	assert.deepEqual(first, replay)
	assert.equal(first.status, "delivered")
	assert.deepEqual(await provider.getOrder(first.orderId), {
		status: "delivered",
		accounts: first.accounts,
		refunded: false,
	})
	await assert.rejects(
		() => provider.getOrder(1),
		(error: unknown) => error instanceof SupplierError && error.code === "not_found",
	)

	const scripted = new MockSupplierProvider({
		nodeEnv: "test",
		script: new Map([
			[101, { status: "failed", refunded: true }],
			[202, { throwError: new SupplierError("out_of_stock", "none left", 409, false) }],
		]),
	})
	const failed = await scripted.purchase({ productId: 101, quantity: 1, idempotencyKey: "order_2" })
	assert.equal(failed.status, "failed")
	assert.equal(failed.refunded, true)
	assert.deepEqual(failed.accounts, [])
	await assert.rejects(
		() => scripted.purchase({ productId: 202, quantity: 1_000, idempotencyKey: "order_3" }),
		(error: unknown) => error instanceof SupplierError && error.code === "out_of_stock",
	)
	assert.equal(scripted.calls.length, 2)
	const defaultEnv = new MockSupplierProvider()
	assert.equal((await defaultEnv.listProducts()).length, 2)
})
