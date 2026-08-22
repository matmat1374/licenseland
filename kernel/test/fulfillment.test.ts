import assert from "node:assert/strict"
import { test } from "node:test"
import { fulfillOrder, type FulfillmentPorts } from "../src/fulfillment/saga.ts"
import type { SupplierPurchaseResult } from "../src/supplier/contract.ts"
import { SupplierError } from "../src/supplier/provider.ts"

type Recorder = {
	ports: FulfillmentPorts
	calls: string[]
}

function result(overrides: Partial<SupplierPurchaseResult> = {}): SupplierPurchaseResult {
	return {
		success: true,
		orderId: 9_001,
		status: "delivered",
		quantity: 1,
		totalUsdCents: 900,
		accounts: ["user:pass"],
		refunded: false,
		...overrides,
	}
}

function ports(purchase: () => Promise<SupplierPurchaseResult>): Recorder {
	const calls: string[] = []
	return {
		calls,
		ports: {
			wallet: {
				spend: async (args) => {
					calls.push(`spend:${args.txId}:${args.amountMinor}`)
				},
				refund: async (args) => {
					calls.push(`refund:${args.txId}:${args.reason}`)
				},
			},
			supplier: {
				purchase: async (args) => {
					calls.push(`purchase:${args.idempotencyKey}`)
					return purchase()
				},
			},
			vault: {
				seal: async (args) => {
					calls.push(`seal:${args.payload}`)
					return `lic_${args.payload}`
				},
			},
			notifier: {
				delivered: async () => {
					calls.push("notify:delivered")
				},
				failed: async (args) => {
					calls.push(`notify:failed:${args.reason}`)
				},
			},
			tickets: {
				open: async (args) => {
					calls.push(`ticket:${args.severity}:${args.reason}`)
				},
			},
			deadLetter: {
				push: async (args) => {
					calls.push(`dlq:${args.reason}`)
				},
			},
			audit: {
				record: async (record) => {
					calls.push(`audit:${record.from}->${record.to}`)
				},
			},
			clock: { nowIso: () => "2026-08-19T10:00:00Z" },
		},
	}
}

const INPUT = { orderId: "o1", state: "paid" as const, amountMinor: 4_160_000, idempotencyKey: "o1" }

test("only a paid order can be provisioned", async () => {
	const recorder = ports(async () => result())
	await assert.rejects(() => fulfillOrder(recorder.ports, { ...INPUT, state: "awaiting_payment" }), /expects a paid order/)
	assert.deepEqual(recorder.calls, [])
})

test("delivered licenses are sealed before the order is closed", async () => {
	const recorder = ports(async () => result({ accounts: ["a:1", "b:2"] }))
	const outcome = await fulfillOrder(recorder.ports, INPUT)
	assert.equal(outcome.kind, "delivered")
	assert.equal(outcome.state, "delivered")
	assert.deepEqual(recorder.calls, [
		"audit:paid->provisioning",
		"spend:spend:o1:4160000",
		"purchase:o1",
		"seal:a:1",
		"seal:b:2",
		"audit:provisioning->delivered",
		"notify:delivered",
	])
})

test("a delivered order with no accounts is never marked delivered", async () => {
	const recorder = ports(async () => result({ accounts: [] }))
	const outcome = await fulfillOrder(recorder.ports, INPUT)
	assert.equal(outcome.kind, "retry_scheduled")
	assert.equal(outcome.state, "provisioning")
	assert.equal(recorder.calls.includes("ticket:high:delivered_without_accounts"), true)
	assert.equal(recorder.calls.includes("dlq:delivered_without_accounts"), true)
})

test("a processing order stays pending for the poller", async () => {
	const recorder = ports(async () => result({ status: "processing", accounts: [] }))
	const outcome = await fulfillOrder(recorder.ports, INPUT)
	assert.equal(outcome.kind, "pending")
	assert.equal(outcome.state, "provisioning")
	assert.equal(recorder.calls.includes("notify:delivered"), false)
})

test("a supplier-side failure refunds the wallet", async () => {
	const refunded = ports(async () => result({ status: "failed", accounts: [], refunded: true }))
	const outcome = await fulfillOrder(refunded.ports, INPUT)
	assert.equal(outcome.kind, "refunded")
	assert.equal(outcome.state, "refunded")
	assert.equal(refunded.calls.includes("refund:refund:o1:supplier_failed"), true)
	assert.equal(refunded.calls.some((call) => call.startsWith("dlq:")), false)

	const notRefunded = ports(async () => result({ status: "failed", accounts: [], refunded: false }))
	await fulfillOrder(notRefunded.ports, INPUT)
	assert.equal(notRefunded.calls.includes("dlq:supplier_did_not_refund"), true)

	const cancelled = ports(async () => result({ status: "cancelled", accounts: [], refunded: true }))
	const cancelledOutcome = await fulfillOrder(cancelled.ports, INPUT)
	assert.equal(cancelledOutcome.kind, "refunded")
	assert.equal(cancelled.calls.includes("notify:failed:supplier_cancelled"), true)
})

test("out of stock refunds with a low severity ticket", async () => {
	const recorder = ports(async () => {
		throw new SupplierError("out_of_stock", "no stock", 409, false)
	})
	const outcome = await fulfillOrder(recorder.ports, INPUT)
	assert.equal(outcome.kind, "refunded")
	assert.deepEqual(recorder.calls, [
		"audit:paid->provisioning",
		"spend:spend:o1:4160000",
		"purchase:o1",
		"audit:provisioning->out_of_stock",
		"refund:refund:o1:out_of_stock",
		"audit:out_of_stock->refunded",
		"notify:failed:out_of_stock",
		"ticket:low:out_of_stock",
	])
})

test("a terminal supplier error refunds, tickets and dead-letters", async () => {
	const recorder = ports(async () => {
		throw new SupplierError("auth_failed", "bad key", 401, false)
	})
	const outcome = await fulfillOrder(recorder.ports, INPUT)
	assert.equal(outcome.kind, "refunded")
	assert.equal(recorder.calls.includes("refund:refund:o1:auth_failed"), true)
	assert.equal(recorder.calls.includes("ticket:high:auth_failed"), true)
	assert.equal(recorder.calls.includes("dlq:auth_failed"), true)
})

test("retryable and transport failures are retried, never refunded blindly", async () => {
	const retryable = ports(async () => {
		throw new SupplierError("rate_limited", "429", 429, true)
	})
	const retryableOutcome = await fulfillOrder(retryable.ports, INPUT)
	assert.equal(retryableOutcome.kind, "retry_scheduled")
	assert.equal(retryableOutcome.state, "provisioning")
	assert.equal(retryable.calls.some((call) => call.startsWith("refund:")), false)
	assert.equal(retryable.calls.includes("dlq:rate_limited"), true)

	const transport = ports(async () => {
		throw new Error("socket hang up")
	})
	const transportOutcome = await fulfillOrder(transport.ports, INPUT)
	assert.equal(transportOutcome.kind, "retry_scheduled")
	assert.equal(transport.calls.includes("dlq:transport_error"), true)
	assert.equal(transport.calls.some((call) => call.startsWith("refund:")), false)
})

test("the supplier idempotency key is stable across retries of the same order", async () => {
	let attempts = 0
	const recorder = ports(async () => {
		attempts += 1
		if (attempts === 1) {
			throw new SupplierError("supplier_unavailable", "503", 503, true)
		}
		return result()
	})
	await fulfillOrder(recorder.ports, INPUT)
	await fulfillOrder(recorder.ports, INPUT)
	assert.deepEqual(
		recorder.calls.filter((call) => call.startsWith("purchase:")),
		["purchase:o1", "purchase:o1"],
	)
	assert.deepEqual(
		recorder.calls.filter((call) => call.startsWith("spend:")),
		["spend:spend:o1:4160000", "spend:spend:o1:4160000"],
	)
})
