const SENSITIVE_KEY_PATTERN = /(api[-_]?key|authorization|x-api-key|token|secret|password|cookie|set-cookie)/i
const SUPPLIER_KEY_PATTERN = /anb_[A-Za-z0-9]{4,}/g

/** Masks a secret, keeping only enough characters to correlate logs. */
export function maskSecret(value: string): string {
	if (value.length <= 8) {
		return "***"
	}
	return `${value.slice(0, 4)}***${value.slice(-2)}`
}

/**
 * Redacts secrets before anything reaches a log sink, an error report or an
 * HTTP response. Every supplier call must pass its metadata through this.
 */
export function redact(input: unknown): unknown {
	if (typeof input === "string") {
		return input.replace(SUPPLIER_KEY_PATTERN, (match) => maskSecret(match))
	}
	if (Array.isArray(input)) {
		return input.map((item) => redact(item))
	}
	if (typeof input === "object" && input !== null) {
		const output: Record<string, unknown> = {}
		for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
			if (SENSITIVE_KEY_PATTERN.test(key)) {
				output[key] = typeof value === "string" ? maskSecret(value) : "***"
				continue
			}
			output[key] = redact(value)
		}
		return output
	}
	return input
}
