export type Clock = {
	nowMs(): number
	sleep(ms: number): Promise<void>
}

export class TimeoutError extends Error {
	constructor(ms: number) {
		super(`operation timed out after ${ms}ms`)
		this.name = "TimeoutError"
	}
}

export class CircuitOpenError extends Error {
	constructor(retryAfterMs: number) {
		super(`circuit is open, retry in ${retryAfterMs}ms`)
		this.name = "CircuitOpenError"
	}
}

export type RetryOptions = {
	readonly attempts: number
	readonly baseDelayMs: number
	readonly maxDelayMs: number
	/** Injected for deterministic tests. Must return 0..1. */
	readonly jitter: () => number
	readonly isRetryable: (error: unknown) => boolean
	readonly clock: Clock
	readonly onRetry?: (attempt: number, delayMs: number) => void
}

export function backoffDelayMs(attempt: number, options: RetryOptions): number {
	const exponential = Math.min(options.baseDelayMs * 2 ** (attempt - 1), options.maxDelayMs)
	return Math.round(exponential * (0.5 + options.jitter() / 2))
}

/** Exponential backoff with full jitter. Non-retryable errors bubble instantly. */
export async function retry<T>(operation: () => Promise<T>, options: RetryOptions): Promise<T> {
	for (let attempt = 1; ; attempt += 1) {
		try {
			return await operation()
		} catch (error) {
			if (!options.isRetryable(error) || attempt >= options.attempts) {
				throw error
			}
			const delay = backoffDelayMs(attempt, options)
			options.onRetry?.(attempt, delay)
			await options.clock.sleep(delay)
		}
	}
}

export type CircuitBreakerOptions = {
	readonly failureThreshold: number
	readonly openMs: number
	readonly clock: Clock
}

export type CircuitState = "closed" | "open" | "half_open"

/**
 * Minimal circuit breaker. Protects the shop from hammering a failing supplier
 * and turns a slow outage into a fast, explicit failure.
 */
export class CircuitBreaker {
	private failures = 0
	private openedAtMs: number | null = null
	private halfOpen = false
	private readonly options: CircuitBreakerOptions

	constructor(options: CircuitBreakerOptions) {
		this.options = options
	}

	state(): CircuitState {
		if (this.openedAtMs === null) {
			return "closed"
		}
		if (this.options.clock.nowMs() - this.openedAtMs >= this.options.openMs) {
			return "half_open"
		}
		return "open"
	}

	async execute<T>(operation: () => Promise<T>): Promise<T> {
		const state = this.state()
		if (state === "open") {
			const elapsed = this.options.clock.nowMs() - (this.openedAtMs as number)
			throw new CircuitOpenError(this.options.openMs - elapsed)
		}
		if (state === "half_open") {
			this.halfOpen = true
		}
		try {
			const result = await operation()
			this.failures = 0
			this.openedAtMs = null
			this.halfOpen = false
			return result
		} catch (error) {
			this.failures += 1
			if (this.halfOpen || this.failures >= this.options.failureThreshold) {
				this.openedAtMs = this.options.clock.nowMs()
				this.halfOpen = false
			}
			throw error
		}
	}
}

/** Wraps a promise with a hard timeout using the injected clock. */
export async function withTimeout<T>(operation: () => Promise<T>, ms: number, clock: Clock): Promise<T> {
	const timeout: Promise<never> = clock.sleep(ms).then(() => {
		throw new TimeoutError(ms)
	})
	return await Promise.race([operation(), timeout])
}

export const systemClock: Clock = {
	nowMs: () => Date.now(),
	sleep: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),
}
