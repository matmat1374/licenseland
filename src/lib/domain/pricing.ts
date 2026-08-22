// Domain adapter: bridges kernel computeQuote with Prisma + app config
import { computeQuote, PRICING_ENGINE_VERSION } from "@kernel/pricing/engine";
import { createPriceSnapshot, type PriceSnapshot } from "@kernel/pricing/snapshot";
import type { PriceQuote } from "@kernel/pricing/types";
import { db } from "@/lib/db";

export { PRICING_ENGINE_VERSION, createPriceSnapshot };
export type { PriceSnapshot, PriceQuote };

export async function getProductQuote(args: {
  productId: string;
  supplierCostUsdCents: number;
  fxRateMinor: number;
  markupBps: number;
}): Promise<PriceQuote> {
  const config = {
    expectedCurrency: "IRT" as const,
    global: {
      version: "v1",
      markupBps: args.markupBps,
      addAbsMinor: 0,
      minMarginAbsMinor: 0,
      floorMinor: null,
      capMinor: null,
      taxBps: 0,
      rounding: { mode: "nearest" as const, unitMinor: 1000 },
    },
    categoryRules: {},
    productOverrides: {},
    scheduled: [],
    fxMaxAgeSeconds: 900,
  };
  const input = {
    productId: args.productId,
    supplierCostUsdCents: args.supplierCostUsdCents,
    fx: {
      irtMinorPerUsd: args.fxRateMinor,
      source: "manual",
      capturedAtIso: new Date().toISOString(),
      bufferBps: 0,
    },
    nowIso: new Date().toISOString(),
  };
  return computeQuote(config, input);
}

export async function persistPriceSnapshot(args: {
  orderItemId: string;
  quote: PriceQuote;
  quantity: number;
  fxRateMinor: number;
}): Promise<string> {
  const snapshot = createPriceSnapshot({
    orderItemId: args.orderItemId,
    quote: args.quote,
    quantity: args.quantity,
  });
  if (args.quote.status === "ok") {
    await db.priceSnapshot.create({
      data: {
        orderId: args.orderItemId,
        productId: args.quote.productId,
        costMinor: args.quote.costMinor,
        markupBps: args.quote.marginBps,
        sellMinor: args.quote.grossMinor * args.quantity,
        fxRateMinor: args.fxRateMinor,
        roundingMode: "nearest",
        quoteSteps: JSON.stringify(args.quote.steps),
      },
    });
  }
  return snapshot.digest;
}
