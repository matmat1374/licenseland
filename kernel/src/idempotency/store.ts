export type IdempotencyState = "in_flight" | "completed"

export type IdempotencyRecord = {
	readonly key: string
	readonly fingerprint: string
	readonly state: IdempotencyState
	readonly value: unknown
	readonly createdAtIso: string
}

export class IdempotencyConflictError extends Error {
	constructor(key: string) {
		super(`idempotency key ${key} was reused with a different payload`)
		this.name = "IdempotencyConflictError"
	}
}

export class IdempotencyInFlightError extends Error {
	constructor(key: string) {
		super(`idempotency key ${key} is already in flight`)
		this.name = "IdempotencyInFlightError"
	}
}

export type IdempotencyStore = {
	get(key: string): IdempotencyRecord | undefined
	put(record: IdempotencyRecord): void
	delete(key: string): void
}

export class InMemoryIdempotencyStore implements IdempotencyStore {
	private readonly records = new Map<string, IdempotencyRecord>()

	get(key: string): IdempotencyRecord | undefined {
		return this.records.get(key)
	}

	put(record: IdempotencyRecord): void {
		this.records.set(record.key, record)
	}

	delete(key: string): void {
		this.records.delete(key)
	}
}

/**
 * Runs `operation` at most once per (key, fingerprint).
 *
 * - Same key + same payload, already completed -> the stored result is replayed.
 * - Same key + different payload -> IdempotencyConflictError (HTTP 409).
 * - Same key while still running -> IdempotencyInFlightError (HTTP 409).
 * - Failure releases the key so the client can retry safely.
 *
 * In production the store must be a unique index on (key) inside the same SQL
 * transaction as the business write.
 */
export async function runOnce<T>(args: {
	store: IdempotencyStore
	key: string
	fingerprint: string
	nowIso: string
	operation: () => Promise<T>
}): Promise<{ value: T; replayed: boolean }> {
	const existing = args.store.get(args.key)
	if (existing !== undefined) {
		if (existing.fingerprint !== args.fingerprint) {
			throw new IdempotencyConflictError(args.key)
		}
		if (existing.state === "in_flight") {
			throw new IdempotencyInFlightError(args.key)
		}
		return { value: existing.value as T, replayed: true }
	}
	args.store.put({
		key: args.key,
		fingerprint: args.fingerprint,
		state: "in_flight",
		value: undefined,
		createdAtIso: args.nowIso,
	})
	try {
		const value = await args.operation()
		args.store.put({
			key: args.key,
			fingerprint: args.fingerprint,
			state: "completed",
			value,
			createdAtIso: args.nowIso,
		})
		return { value, replayed: false }
	} catch (error) {
		args.store.delete(args.key)
		throw error
	}
}
