import assert from "node:assert/strict"
import { test } from "node:test"
import {
	CircuitBreaker,
	CircuitOpenError,
	TimeoutError,
	backoffDelayMs,
	retry,
	systemClock,
	withTimeout,
	type Clock,
	type RetryOptions,
} from "../src/supplier/resilience.ts"

function mutableClock(startMs = 1_000_000) {
	let now = startMs
	const slept: number[] = []
	const clock: Clock = {
		nowMs: () => now,
		sleep: async (ms) => {
			slept.push(ms)
			now += ms
		},
	}
	return {
		clock,
		slept,
		advance: (ms: number) => {
			now += ms
		},
	}
}

function retryOptions(overrides: Partial<RetryOptions> = {}): RetryOptions {
	return {
		attempts: 3,
		baseDelayMs: 250,
		maxDelayMs: 4_000,
		jitter: () => 1,
		isRetryable: () => true,
		clock: mutableClock().clock,
		...overrides,
	}
}

test("backoff grows exponentially and is capped", () => {
	const options = retryOptions({ jitter: () => 1 })
	assert.equal(backoffDelayMs(1, options), 250)
	assert.equal(backoffDelayMs(2, options), 500)
	assert.equal(backoffDelayMs(3, options), 1_000)
	assert.equal(backoffDelayMs(9, options), 4_000)
	assert.equal(backoffDelayMs(1, retryOptions({ jitter: () => 0 })), 125)
})

test("non-retryable errors are not retried", async () => {
	let calls = 0
	await assert.rejects(
		() =>
			retry(
				async () => {
					calls += 1
					throw new Error("fatal")
				},
				retryOptions({ isRetryable: () => false }),
			),
		/fatal/,
	)
	assert.equal(calls, 1)
})

test("a retryable error succeeds on the next attempt and reports the delay", async () => {
	const timing = mutableClock()
	const retries: Array<{ attempt: number; delayMs: number }> = []
	let calls = 0
	const value = await retry(
		async () => {
			calls += 1
			if (calls === 1) {
				throw new Error("503")
			}
			return "ok"
		},
		retryOptions({
			clock: timing.clock,
			onRetry: (attempt, delayMs) => retries.push({ attempt, delayMs }),
		}),
	)
	assert.equal(value, "ok")
	assert.equal(calls, 2)
	assert.deepEqual(retries, [{ attempt: 1, delayMs: 250 }])
	assert.deepEqual(timing.slept, [250])
})

test("attempts are bounded", async () => {
	let calls = 0
	await assert.rejects(
		() =>
			retry(
				async () => {
					calls += 1
					throw new Error("always down")
				},
				retryOptions({ attempts: 2 }),
			),
		/always down/,
	)
	assert.equal(calls, 2)
})

test("the breaker opens, half-opens after the cooldown and closes on success", async () => {
	const timing = mutableClock()
	const breaker = new CircuitBreaker({ failureThreshold: 2, openMs: 1_000, clock: timing.clock })
	const fail = async () => {
		throw new Error("supplier down")
	}
	assert.equal(breaker.state(), "closed")
	await assert.rejects(() => breaker.execute(fail), /supplier down/)
	assert.equal(breaker.state(), "closed")
	await assert.rejects(() => breaker.execute(fail), /supplier down/)
	assert.equal(breaker.state(), "open")
	await assert.rejects(() => breaker.execute(async () => "never runs"), CircuitOpenError)

	timing.advance(1_000)
	assert.equal(breaker.state(), "half_open")
	// A failed probe re-opens the circuit immediately.
	await assert.rejects(() => breaker.execute(fail), /supplier down/)
	assert.equal(breaker.state(), "open")

	timing.advance(1_000)
	assert.equal(await breaker.execute(async () => "recovered"), "recovered")
	assert.equal(breaker.state(), "closed")
})

test("withTimeout fails fast and passes fast results through", async () => {
	const instant: Clock = { nowMs: () => 0, sleep: async () => {} }
	await assert.rejects(() => withTimeout(() => new Promise<string>(() => {}), 5_000, instant), TimeoutError)

	const never: Clock = { nowMs: () => 0, sleep: () => new Promise<void>(() => {}) }
	assert.equal(await withTimeout(async () => "fast", 5_000, never), "fast")
})

test("the system clock is wired to real time", async () => {
	const before = systemClock.nowMs()
	await systemClock.sleep(1)
	assert.equal(systemClock.nowMs() >= before, true)
})
