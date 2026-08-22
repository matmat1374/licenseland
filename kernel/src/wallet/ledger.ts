import { MoneyError, assertSafeInteger } from "../shared/money.ts"
import type { CurrencyCode } from "../shared/money.ts"

export type AccountKind = "liability" | "asset" | "revenue" | "expense"

export type Account = {
	readonly id: string
	readonly kind: AccountKind
	readonly currency: CurrencyCode
}

export type PostingLeg = {
	readonly accountId: string
	readonly direction: "debit" | "credit"
	readonly amountMinor: number
}

export type LedgerTransaction = {
	/** Business idempotency key: same key never posts twice. */
	readonly txId: string
	readonly currency: CurrencyCode
	readonly reason: string
	readonly refType: string
	readonly refId: string
	readonly createdAtIso: string
	readonly legs: readonly PostingLeg[]
}

export class LedgerError extends Error {
	readonly code: string
	constructor(code: string, message: string) {
		super(message)
		this.name = "LedgerError"
		this.code = code
	}
}

/** A transaction must have >= 2 legs, positive amounts, and balance exactly. */
export function assertBalanced(tx: LedgerTransaction): void {
	if (tx.legs.length < 2) {
		throw new LedgerError("unbalanced", "a double-entry transaction needs at least two legs")
	}
	let debits = 0
	let credits = 0
	for (const leg of tx.legs) {
		assertSafeInteger(leg.amountMinor, "leg.amountMinor")
		if (leg.amountMinor <= 0) {
			throw new LedgerError("invalid_amount", "leg amounts must be positive; use direction to express sign")
		}
		if (leg.direction === "debit") {
			debits += leg.amountMinor
		} else {
			credits += leg.amountMinor
		}
	}
	if (debits !== credits) {
		throw new LedgerError("unbalanced", `debits ${debits} != credits ${credits}`)
	}
}

/**
 * Reference in-memory implementation of the wallet ledger contract. The
 * production adapter must keep the same invariants inside one SQL transaction
 * with `SELECT ... FOR UPDATE` on the wallet account row.
 */
export class InMemoryLedger {
	private readonly accounts = new Map<string, Account>()
	private readonly transactions = new Map<string, LedgerTransaction>()

	openAccount(account: Account): Account {
		if (this.accounts.has(account.id)) {
			throw new LedgerError("account_exists", `account ${account.id} already exists`)
		}
		this.accounts.set(account.id, account)
		return account
	}

	getAccount(accountId: string): Account {
		const account = this.accounts.get(accountId)
		if (account === undefined) {
			throw new LedgerError("unknown_account", `unknown account ${accountId}`)
		}
		return account
	}

	/** Idempotent: replaying the same txId returns the stored transaction. */
	post(tx: LedgerTransaction): { transaction: LedgerTransaction; replayed: boolean } {
		const existing = this.transactions.get(tx.txId)
		if (existing !== undefined) {
			return { transaction: existing, replayed: true }
		}
		assertBalanced(tx)
		for (const leg of tx.legs) {
			const account = this.getAccount(leg.accountId)
			if (account.currency !== tx.currency) {
				throw new MoneyError(`currency mismatch on ${leg.accountId}: ${account.currency} != ${tx.currency}`)
			}
		}
		this.transactions.set(tx.txId, tx)
		return { transaction: tx, replayed: false }
	}

	/**
	 * Balance is always derived from the ledger, never stored in a mutable field.
	 * Liability and revenue accounts increase on credit; asset and expense
	 * accounts increase on debit.
	 */
	balanceMinor(accountId: string): number {
		const account = this.getAccount(accountId)
		let debits = 0
		let credits = 0
		for (const tx of this.transactions.values()) {
			for (const leg of tx.legs) {
				if (leg.accountId !== accountId) {
					continue
				}
				if (leg.direction === "debit") {
					debits += leg.amountMinor
				} else {
					credits += leg.amountMinor
				}
			}
		}
		if (account.kind === "liability" || account.kind === "revenue") {
			return credits - debits
		}
		return debits - credits
	}

	listTransactions(): readonly LedgerTransaction[] {
		return [...this.transactions.values()]
	}
}

export type WalletTopUpInput = {
	readonly txId: string
	readonly walletAccountId: string
	readonly cashAccountId: string
	readonly amountMinor: number
	readonly currency: CurrencyCode
	readonly refType: string
	readonly refId: string
	readonly createdAtIso: string
}

/** Cash in: debit the gateway/cash asset, credit the user wallet liability. */
export function topUpWallet(ledger: InMemoryLedger, input: WalletTopUpInput) {
	return ledger.post({
		txId: input.txId,
		currency: input.currency,
		reason: "wallet_topup",
		refType: input.refType,
		refId: input.refId,
		createdAtIso: input.createdAtIso,
		legs: [
			{ accountId: input.cashAccountId, direction: "debit", amountMinor: input.amountMinor },
			{ accountId: input.walletAccountId, direction: "credit", amountMinor: input.amountMinor },
		],
	})
}

export type WalletSpendInput = WalletTopUpInput & { readonly revenueAccountId: string }

/**
 * Spend from wallet: debit the wallet liability, credit revenue. Rejects when
 * the derived balance is insufficient, so no overdraft is representable.
 */
export function spendFromWallet(ledger: InMemoryLedger, input: WalletSpendInput) {
	if (input.amountMinor <= 0) {
		throw new LedgerError("invalid_amount", "spend amount must be positive")
	}
	const existing = ledger.listTransactions().find((tx) => tx.txId === input.txId)
	if (existing === undefined && ledger.balanceMinor(input.walletAccountId) < input.amountMinor) {
		throw new LedgerError("insufficient_funds", "wallet balance is lower than the requested amount")
	}
	return ledger.post({
		txId: input.txId,
		currency: input.currency,
		reason: "wallet_spend",
		refType: input.refType,
		refId: input.refId,
		createdAtIso: input.createdAtIso,
		legs: [
			{ accountId: input.walletAccountId, direction: "debit", amountMinor: input.amountMinor },
			{ accountId: input.revenueAccountId, direction: "credit", amountMinor: input.amountMinor },
		],
	})
}

/** Compensation entry used when the supplier fails after we charged the user. */
export function refundToWallet(ledger: InMemoryLedger, input: WalletSpendInput) {
	return ledger.post({
		txId: input.txId,
		currency: input.currency,
		reason: "wallet_refund",
		refType: input.refType,
		refId: input.refId,
		createdAtIso: input.createdAtIso,
		legs: [
			{ accountId: input.revenueAccountId, direction: "debit", amountMinor: input.amountMinor },
			{ accountId: input.walletAccountId, direction: "credit", amountMinor: input.amountMinor },
		],
	})
}
