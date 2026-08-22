export type OrderState =
	| "created"
	| "awaiting_payment"
	| "paid"
	| "provisioning"
	| "delivered"
	| "out_of_stock"
	| "supplier_failed"
	| "refunded"
	| "cancelled"

export type OrderEvent =
	| "payment_requested"
	| "payment_verified"
	| "provisioning_started"
	| "license_delivered"
	| "stock_missing"
	| "supplier_error"
	| "refund_completed"
	| "cancelled"

export type Transition = {
	readonly from: OrderState
	readonly event: OrderEvent
	readonly to: OrderState
}

/** Single source of truth for order lifecycle. No transition exists outside this table. */
export const TRANSITIONS: readonly Transition[] = [
	{ from: "created", event: "payment_requested", to: "awaiting_payment" },
	{ from: "created", event: "cancelled", to: "cancelled" },
	{ from: "awaiting_payment", event: "payment_verified", to: "paid" },
	{ from: "awaiting_payment", event: "cancelled", to: "cancelled" },
	{ from: "paid", event: "provisioning_started", to: "provisioning" },
	{ from: "provisioning", event: "license_delivered", to: "delivered" },
	{ from: "provisioning", event: "stock_missing", to: "out_of_stock" },
	{ from: "provisioning", event: "supplier_error", to: "supplier_failed" },
	{ from: "out_of_stock", event: "refund_completed", to: "refunded" },
	{ from: "supplier_failed", event: "refund_completed", to: "refunded" },
]

export const TERMINAL_STATES: readonly OrderState[] = ["delivered", "refunded", "cancelled"]

export class OrderTransitionError extends Error {
	readonly from: OrderState
	readonly event: OrderEvent
	constructor(from: OrderState, event: OrderEvent) {
		super(`illegal transition: ${from} --${event}-->`)
		this.name = "OrderTransitionError"
		this.from = from
		this.event = event
	}
}

export function nextState(from: OrderState, event: OrderEvent): OrderState | undefined {
	const match = TRANSITIONS.find((t) => t.from === from && t.event === event)
	return match === undefined ? undefined : match.to
}

export function isTerminal(state: OrderState): boolean {
	return TERMINAL_STATES.includes(state)
}

export type AuditRecord = {
	readonly orderId: string
	readonly from: OrderState
	readonly to: OrderState
	readonly event: OrderEvent
	readonly atIso: string
	readonly actor: string
}

/**
 * Applies one transition and returns the audit record that must be persisted in
 * the same database transaction as the state change.
 */
export function applyTransition(args: {
	orderId: string
	from: OrderState
	event: OrderEvent
	atIso: string
	actor: string
}): { to: OrderState; audit: AuditRecord } {
	const to = nextState(args.from, args.event)
	if (to === undefined) {
		throw new OrderTransitionError(args.from, args.event)
	}
	return {
		to,
		audit: {
			orderId: args.orderId,
			from: args.from,
			to,
			event: args.event,
			atIso: args.atIso,
			actor: args.actor,
		},
	}
}
