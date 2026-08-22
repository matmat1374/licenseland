import { applyTransition, type AuditRecord, type OrderState } from "../orders/stateMachine.ts"
import type { SupplierPurchaseResult } from "../supplier/contract.ts"
import { SupplierError } from "../supplier/provider.ts"

export type FulfillmentOutcome =
	| { readonly kind: "delivered"; readonly state: OrderState; readonly sealedLicenseIds: readonly string[] }
	| { readonly kind: "pending"; readonly state: OrderState; readonly supplierOrderId: number }
	| { readonly kind: "refunded"; readonly state: OrderState; readonly reason: string }
	| { readonly kind: "retry_scheduled"; readonly state: OrderState; readonly reason: string }

export type FulfillmentPorts = {
	wallet: {
		spend(args: { txId: string; amountMinor: number; orderId: string }): Promise<void>
		refund(args: { txId: string; amountMinor: number; orderId: string; reason: string }): Promise<void>
	}
	supplier: {
		purchase(args: { idempotencyKey: string; orderId: string }): Promise<SupplierPurchaseResult>
	}
	vault: { seal(args: { orderId: string; payload: string }): Promise<string> }
	notifier: {
		delivered(args: { orderId: string }): Promise<void>
		failed(args: { orderId: string; reason: string }): Promise<void>
	}
	tickets: { open(args: { orderId: string; reason: string; severity: "low" | "high" }): Promise<void> }
	deadLetter: { push(args: { orderId: string; reason: string; payload: unknown }): Promise<void> }
	audit: { record(record: AuditRecord): Promise<void> }
	clock: { nowIso(): string }
}

export type FulfillmentInput = {
	readonly orderId: string
	readonly state: OrderState
	readonly amountMinor: number
	/** Stable per order: reused on every retry so the supplier never double-charges. */
	readonly idempotencyKey: string
}

async function transition(
	ports: FulfillmentPorts,
	orderId: string,
	from: OrderState,
	event: Parameters<typeof applyTransition>[0]["event"],
): Promise<OrderState> {
	const result = applyTransition({ orderId, from, event, atIso: ports.clock.nowIso(), actor: "fulfillment_worker" })
	await ports.audit.record(result.audit)
	return result.to
}

/**
 * Provisioning saga with explicit compensation.
 *
 * Guarantees:
 * - The supplier is called with a stable idempotency key, so a timeout retry
 *   returns the original order instead of buying twice.
 * - Any terminal supplier failure refunds the user's wallet, notifies the user,
 *   opens an admin ticket and keeps the payload in a dead-letter queue.
 * - Transport failures do NOT refund: they are retried, because the supplier may
 *   still have charged us and delivered.
 */
export async function fulfillOrder(ports: FulfillmentPorts, input: FulfillmentInput): Promise<FulfillmentOutcome> {
	let state = input.state
	if (state !== "paid") {
		throw new Error(`fulfillOrder expects a paid order, received ${state}`)
	}
	state = await transition(ports, input.orderId, state, "provisioning_started")
	await ports.wallet.spend({ txId: `spend:${input.orderId}`, amountMinor: input.amountMinor, orderId: input.orderId })

	let result: SupplierPurchaseResult
	try {
		result = await ports.supplier.purchase({ idempotencyKey: input.idempotencyKey, orderId: input.orderId })
	} catch (error) {
		const supplierError = error instanceof SupplierError ? error : null
		const reason = supplierError === null ? "transport_error" : supplierError.code
		if (supplierError !== null && supplierError.code === "out_of_stock") {
			state = await transition(ports, input.orderId, state, "stock_missing")
			await ports.wallet.refund({
				txId: `refund:${input.orderId}`,
				amountMinor: input.amountMinor,
				orderId: input.orderId,
				reason,
			})
			state = await transition(ports, input.orderId, state, "refund_completed")
			await ports.notifier.failed({ orderId: input.orderId, reason })
			await ports.tickets.open({ orderId: input.orderId, reason, severity: "low" })
			return { kind: "refunded", state, reason }
		}
		if (supplierError !== null && !supplierError.retryable) {
			state = await transition(ports, input.orderId, state, "supplier_error")
			await ports.wallet.refund({
				txId: `refund:${input.orderId}`,
				amountMinor: input.amountMinor,
				orderId: input.orderId,
				reason,
			})
			state = await transition(ports, input.orderId, state, "refund_completed")
			await ports.notifier.failed({ orderId: input.orderId, reason })
			await ports.tickets.open({ orderId: input.orderId, reason, severity: "high" })
			await ports.deadLetter.push({ orderId: input.orderId, reason, payload: { idempotencyKey: input.idempotencyKey } })
			return { kind: "refunded", state, reason }
		}
		await ports.deadLetter.push({ orderId: input.orderId, reason, payload: { idempotencyKey: input.idempotencyKey } })
		await ports.tickets.open({ orderId: input.orderId, reason, severity: "high" })
		return { kind: "retry_scheduled", state, reason }
	}

	if (result.status === "processing") {
		return { kind: "pending", state, supplierOrderId: result.orderId }
	}

	if (result.status === "delivered") {
		if (result.accounts.length === 0) {
			await ports.tickets.open({ orderId: input.orderId, reason: "delivered_without_accounts", severity: "high" })
			await ports.deadLetter.push({
				orderId: input.orderId,
				reason: "delivered_without_accounts",
				payload: { supplierOrderId: result.orderId },
			})
			return { kind: "retry_scheduled", state, reason: "delivered_without_accounts" }
		}
		const sealedLicenseIds: string[] = []
		for (const account of result.accounts) {
			sealedLicenseIds.push(await ports.vault.seal({ orderId: input.orderId, payload: account }))
		}
		state = await transition(ports, input.orderId, state, "license_delivered")
		await ports.notifier.delivered({ orderId: input.orderId })
		return { kind: "delivered", state, sealedLicenseIds }
	}

	const reason = result.status === "cancelled" ? "supplier_cancelled" : "supplier_failed"
	state = await transition(ports, input.orderId, state, "supplier_error")
	await ports.wallet.refund({
		txId: `refund:${input.orderId}`,
		amountMinor: input.amountMinor,
		orderId: input.orderId,
		reason,
	})
	state = await transition(ports, input.orderId, state, "refund_completed")
	await ports.notifier.failed({ orderId: input.orderId, reason })
	await ports.tickets.open({ orderId: input.orderId, reason, severity: "high" })
	if (!result.refunded) {
		await ports.deadLetter.push({
			orderId: input.orderId,
			reason: "supplier_did_not_refund",
			payload: { supplierOrderId: result.orderId },
		})
	}
	return { kind: "refunded", state, reason }
}
