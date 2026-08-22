import assert from "node:assert/strict"
import { test } from "node:test"
import { MoneyError } from "../src/shared/money.ts"
import {
	InMemoryLedger,
	LedgerError,
	assertBalanced,
	refundToWallet,
	spendFromWallet,
	topUpWallet,
	type LedgerTransaction,
} from "../src/wallet/ledger.ts"

function ledgerWithAccounts() {
	const ledger = new InMemoryLedger()
	ledger.openAccount({ id: "wallet:u1", kind: "liability", currency: "IRT" })
	ledger.openAccount({ id: "cash:zarinpal", kind: "asset", currency: "IRT" })
	ledger.openAccount({ id: "revenue:sales", kind: "revenue", currency: "IRT" })
	return ledger
}

const BASE = {
	walletAccountId: "wallet:u1",
	cashAccountId: "cash:zarinpal",
	revenueAccountId: "revenue:sales",
	currency: "IRT" as const,
	refType: "payment",
	refId: "pay_1",
	createdAtIso: "2026-08-19T10:00:00Z",
}

test("accounts are unique and must exist before posting", () => {
	const ledger = ledgerWithAccounts()
	assert.throws(() => ledger.openAccount({ id: "wallet:u1", kind: "liability", currency: "IRT" }), LedgerError)
	assert.throws(() => ledger.getAccount("wallet:unknown"), LedgerError)
})

test("a transaction must balance and use positive amounts", () => {
	const single: LedgerTransaction = {
		txId: "t1",
		currency: "IRT",
		reason: "test",
		refType: "x",
		refId: "1",
		createdAtIso: BASE.createdAtIso,
		legs: [{ accountId: "wallet:u1", direction: "debit", amountMinor: 100 }],
	}
	assert.throws(() => assertBalanced(single), LedgerError)
	assert.throws(
		() => assertBalanced({ ...single, legs: [...single.legs, { accountId: "cash:zarinpal", direction: "credit", amountMinor: 90 }] }),
		LedgerError,
	)
	assert.throws(
		() =>
			assertBalanced({
				...single,
				legs: [
					{ accountId: "wallet:u1", direction: "debit", amountMinor: 0 },
					{ accountId: "cash:zarinpal", direction: "credit", amountMinor: 0 },
				],
			}),
		LedgerError,
	)
	assert.throws(
		() =>
			assertBalanced({
				...single,
				legs: [
					{ accountId: "wallet:u1", direction: "debit", amountMinor: 10.5 },
					{ accountId: "cash:zarinpal", direction: "credit", amountMinor: 10.5 },
				],
			}),
		MoneyError,
	)
})

test("legs must match the transaction currency", () => {
	const ledger = ledgerWithAccounts()
	ledger.openAccount({ id: "wallet:usdt", kind: "liability", currency: "USDT" })
	assert.throws(
		() =>
			ledger.post({
				txId: "t-mixed",
				currency: "IRT",
				reason: "test",
				refType: "x",
				refId: "1",
				createdAtIso: BASE.createdAtIso,
				legs: [
					{ accountId: "wallet:usdt", direction: "debit", amountMinor: 100 },
					{ accountId: "cash:zarinpal", direction: "credit", amountMinor: 100 },
				],
			}),
		MoneyError,
	)
})

test("balances are derived from the ledger for both account directions", () => {
	const ledger = ledgerWithAccounts()
	topUpWallet(ledger, { ...BASE, txId: "topup_1", amountMinor: 5_000_000 })
	assert.equal(ledger.balanceMinor("wallet:u1"), 5_000_000)
	assert.equal(ledger.balanceMinor("cash:zarinpal"), 5_000_000)
	assert.equal(ledger.balanceMinor("revenue:sales"), 0)
	assert.equal(ledger.listTransactions().length, 1)
})

test("topping up twice with the same txId is a no-op replay", () => {
	const ledger = ledgerWithAccounts()
	const first = topUpWallet(ledger, { ...BASE, txId: "topup_1", amountMinor: 1_000_000 })
	const second = topUpWallet(ledger, { ...BASE, txId: "topup_1", amountMinor: 1_000_000 })
	assert.equal(first.replayed, false)
	assert.equal(second.replayed, true)
	assert.equal(ledger.balanceMinor("wallet:u1"), 1_000_000)
})

test("spending is limited by the derived balance", () => {
	const ledger = ledgerWithAccounts()
	topUpWallet(ledger, { ...BASE, txId: "topup_1", amountMinor: 4_160_000 })
	assert.throws(
		() => spendFromWallet(ledger, { ...BASE, txId: "spend_1", amountMinor: 5_000_000 }),
		(error: unknown) => error instanceof LedgerError && error.code === "insufficient_funds",
	)
	assert.throws(
		() => spendFromWallet(ledger, { ...BASE, txId: "spend_1", amountMinor: 0 }),
		(error: unknown) => error instanceof LedgerError && error.code === "invalid_amount",
	)
	const spend = spendFromWallet(ledger, { ...BASE, txId: "spend_1", amountMinor: 4_160_000 })
	assert.equal(spend.replayed, false)
	assert.equal(ledger.balanceMinor("wallet:u1"), 0)
	assert.equal(ledger.balanceMinor("revenue:sales"), 4_160_000)
	// Replaying the same spend must not double charge, even at zero balance.
	const replay = spendFromWallet(ledger, { ...BASE, txId: "spend_1", amountMinor: 4_160_000 })
	assert.equal(replay.replayed, true)
	assert.equal(ledger.balanceMinor("wallet:u1"), 0)
})

test("a supplier failure refunds the wallet and reverses revenue", () => {
	const ledger = ledgerWithAccounts()
	topUpWallet(ledger, { ...BASE, txId: "topup_1", amountMinor: 4_160_000 })
	spendFromWallet(ledger, { ...BASE, txId: "spend_1", amountMinor: 4_160_000 })
	refundToWallet(ledger, { ...BASE, txId: "refund_1", amountMinor: 4_160_000 })
	assert.equal(ledger.balanceMinor("wallet:u1"), 4_160_000)
	assert.equal(ledger.balanceMinor("revenue:sales"), 0)
})
