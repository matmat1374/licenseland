// Domain adapter: double-entry wallet ledger
// Balance is ALWAYS derived from the ledger, never stored.
import { assertBalanced, type LedgerTransaction, type PostingLeg } from "@kernel/wallet/ledger";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export { assertBalanced };
export type { LedgerTransaction, PostingLeg };

export async function getOrCreateWallet(userId: string | null): Promise<string> {
  const safeUserId = userId || "guest_wallet";
  let wallet = await db.walletAccount.findUnique({ where: { userId: safeUserId } });
  if (!wallet) {
    wallet = await db.walletAccount.create({ data: { userId: safeUserId, currency: "IRT", direction: "credit" } });
  }
  return wallet.id;
}

export async function getDerivedBalance(walletAccountId: string): Promise<number> {
  const entries = await db.walletLedger.findMany({ where: { walletAccountId } });
  let balance = 0;
  for (const e of entries) {
    if (e.direction === "credit") balance += e.amountMinor;
    else balance -= e.amountMinor;
  }
  return balance;
}

export async function postTransaction(args: {
  txId: string;
  legs: { walletAccountId: string; direction: "debit" | "credit"; amountMinor: number }[];
  reason: string;
  orderId?: string;
}): Promise<void> {
  const existing = await db.walletLedger.findFirst({ where: { txId: args.txId } });
  if (existing) {
    logger.info("wallet.replay", { txId: args.txId });
    return;
  }
  
  // Enforce double-entry accounting invariants
  assertBalanced({
    txId: args.txId,
    currency: "IRT",
    reason: args.reason,
    refType: "order",
    refId: args.orderId || "",
    createdAtIso: new Date().toISOString(),
    legs: args.legs.map(l => ({ accountId: l.walletAccountId, direction: l.direction, amountMinor: l.amountMinor }))
  });

  const debits = args.legs.filter((l) => l.direction === "debit");
  if (debits.length > 0) {
    for (const d of debits) {
      const balance = await getDerivedBalance(d.walletAccountId);
      if (balance < d.amountMinor) {
        throw new Error(`Insufficient balance: have ${balance}, need ${d.amountMinor}`);
      }
    }
  }
  await db.$transaction(async (tx) => {
    for (const leg of args.legs) {
      await tx.walletLedger.create({
        data: {
          walletAccountId: leg.walletAccountId,
          txId: args.txId,
          direction: leg.direction,
          amountMinor: leg.amountMinor,
          currency: "IRT",
          reason: args.reason,
          orderId: args.orderId || null,
        },
      });
    }
  });
  logger.info("wallet.posted", { txId: args.txId, legs: args.legs.length });
}

export async function topUpWallet(args: { userId: string | null; amountMinor: number; txId: string; reason: string }): Promise<void> {
  const walletId = await getOrCreateWallet(args.userId);
  const cashAccountId = await getOrCreateWallet("gateway_cash"); // The Zarinpal/Bank asset account

  await postTransaction({
    txId: args.txId,
    legs: [
      { walletAccountId: cashAccountId, direction: "debit", amountMinor: args.amountMinor },
      { walletAccountId: walletId, direction: "credit", amountMinor: args.amountMinor }
    ],
    reason: args.reason,
  });
}

export async function chargeWallet(args: { userId: string | null; amountMinor: number; orderId: string }): Promise<void> {
  const walletId = await getOrCreateWallet(args.userId);
  const sysRevenueId = await getOrCreateWallet("system_revenue");
  
  await postTransaction({
    txId: `charge-${args.orderId}`,
    legs: [
      { walletAccountId: walletId, direction: "debit", amountMinor: args.amountMinor },
      { walletAccountId: sysRevenueId, direction: "credit", amountMinor: args.amountMinor }
    ],
    reason: "purchase",
    orderId: args.orderId,
  });
}

export async function refundWallet(args: { userId: string | null; amountMinor: number; orderId: string; reason: string }): Promise<void> {
  const walletId = await getOrCreateWallet(args.userId);
  const sysRevenueId = await getOrCreateWallet("system_revenue");
  
  await postTransaction({
    txId: `refund-${args.orderId}`,
    legs: [
      { walletAccountId: sysRevenueId, direction: "debit", amountMinor: args.amountMinor },
      { walletAccountId: walletId, direction: "credit", amountMinor: args.amountMinor }
    ],
    reason: `refund: ${args.reason}`,
    orderId: args.orderId,
  });
}
