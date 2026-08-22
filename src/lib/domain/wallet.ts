// Domain adapter: double-entry wallet ledger
// Balance is ALWAYS derived from the ledger, never stored.
import { assertBalanced, type LedgerTransaction, type PostingLeg } from "@kernel/wallet/ledger";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export { assertBalanced };
export type { LedgerTransaction, PostingLeg };

export async function getOrCreateWallet(userId: string): Promise<string> {
  let wallet = await db.walletAccount.findUnique({ where: { userId } });
  if (!wallet) {
    wallet = await db.walletAccount.create({ data: { userId, currency: "IRT", direction: "credit" } });
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

export async function chargeWallet(args: { userId: string; amountMinor: number; orderId: string }): Promise<void> {
  const walletId = await getOrCreateWallet(args.userId);
  await postTransaction({
    txId: `charge-${args.orderId}`,
    legs: [{ walletAccountId: walletId, direction: "debit", amountMinor: args.amountMinor }],
    reason: "purchase",
    orderId: args.orderId,
  });
}

export async function refundWallet(args: { userId: string; amountMinor: number; orderId: string; reason: string }): Promise<void> {
  const walletId = await getOrCreateWallet(args.userId);
  await postTransaction({
    txId: `refund-${args.orderId}`,
    legs: [{ walletAccountId: walletId, direction: "credit", amountMinor: args.amountMinor }],
    reason: `refund: ${args.reason}`,
    orderId: args.orderId,
  });
}
