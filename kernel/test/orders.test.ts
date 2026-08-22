import assert from "node:assert/strict"
import { test } from "node:test"
import {
	OrderTransitionError,
	TRANSITIONS,
	applyTransition,
	isTerminal,
	nextState,
} from "../src/orders/stateMachine.ts"
import {
	IdempotencyConflictError,
	IdempotencyInFlightError,
	InMemoryIdempotencyStore,
	runOnce,
} from "../src/idempotency/store.ts"

test("the documented happy path is reachable end to end", () => {
	let state = nextState("created", "payment_requested")
	assert.equal(state, "awaiting_payment")
	state = nextState("awaiting_payment", "payment_verified")
	assert.equal(state, "paid")
	state = nextState("paid", "provisioning_started")
	assert.equal(state, "provisioning")
	state = nextState("provisioning", "license_delivered")
	assert.equal(state, "delivered")
})

test("failure paths lead to refunded, terminal states are closed", () => {
	assert.equal(nextState("provisioning", "stock_missing"), "out_of_stock")
	assert.equal(nextState("out_of_stock", "refund_completed"), "refunded")
	assert.equal(nextState("provisioning", "supplier_error"), "supplier_failed")
	assert.equal(nextState("supplier_failed", "refund_completed"), "refunded")
	assert.equal(nextState("delivered", "refund_completed"), undefined)
	assert.equal(isTerminal("delivered"), true)
	assert.equal(isTerminal("refunded"), true)
	assert.equal(isTerminal("cancelled"), true)
	assert.equal(isTerminal("provisioning"), false)
})

test("illegal transitions throw instead of silently corrupting state", () => {
	assert.throws(
		() => applyTransition({ orderId: "o1", from: "created", event: "license_delivered", atIso: "x", actor: "test" }),
		OrderTransitionError,
	)
})

test("every transition emits an audit record", () => {
	const result = applyTransition({
		orderId: "o1",
		from: "paid",
		event: "provisioning_started",
		atIso: "2026-08-19T10:00:00Z",
		actor: "worker",
	})
	assert.equal(result.to, "provisioning")
	assert.deepEqual(result.audit, {
		orderId: "o1",
		from: "paid",
		to: "provisioning",
		event: "provisioning_started",
		atIso: "2026-08-19T10:00:00Z",
		actor: "worker",
	})
})

test("no transition escapes a terminal state", () => {
	for (const transition of TRANSITIONS) {
		assert.equal(isTerminal(transition.from), false, `${transition.from} must not be a source state`)
	}
})

test("runOnce executes once and replays the stored result", async () => {
	const store = new InMemoryIdempotencyStore()
	let calls = 0
	const operation = async () => {
		calls += 1
		return { orderId: "o1" }
	}
	const first = await runOnce({ store, key: "k1", fingerprint: "fp", nowIso: "t", operation })
	const second = await runOnce({ store, key: "k1", fingerprint: "fp", nowIso: "t", operation })
	assert.equal(calls, 1)
	assert.equal(first.replayed, false)
	assert.equal(second.replayed, true)
	assert.deepEqual(second.value, { orderId: "o1" })
})

test("reusing a key with a different payload is a conflict", async () => {
	const store = new InMemoryIdempotencyStore()
	await runOnce({ store, key: "k1", fingerprint: "fp-a", nowIso: "t", operation: async () => 1 })
	await assert.rejects(
		() => runOnce({ store, key: "k1", fingerprint: "fp-b", nowIso: "t", operation: async () => 2 }),
		IdempotencyConflictError,
	)
})

test("a concurrent duplicate request is rejected while in flight", async () => {
	const store = new InMemoryIdempotencyStore()
	let release: () => void = () => {}
	const gate = new Promise<void>((resolve) => {
		release = resolve
	})
	const slow = runOnce({
		store,
		key: "k1",
		fingerprint: "fp",
		nowIso: "t",
		operation: async () => {
			await gate
			return "done"
		},
	})
	await assert.rejects(
		() => runOnce({ store, key: "k1", fingerprint: "fp", nowIso: "t", operation: async () => "other" }),
		IdempotencyInFlightError,
	)
	release()
	assert.equal((await slow).value, "done")
})

test("a failed operation releases the key so the client can retry", async () => {
	const store = new InMemoryIdempotencyStore()
	await assert.rejects(
		() =>
			runOnce({
				store,
				key: "k1",
				fingerprint: "fp",
				nowIso: "t",
				operation: async () => {
					throw new Error("gateway down")
				},
			}),
		/gateway down/,
	)
	assert.equal(store.get("k1"), undefined)
	const retry = await runOnce({ store, key: "k1", fingerprint: "fp", nowIso: "t", operation: async () => "ok" })
	assert.equal(retry.value, "ok")
	store.delete("k1")
	assert.equal(store.get("k1"), undefined)
})
