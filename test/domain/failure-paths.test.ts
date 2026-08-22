// Failure-path tests for the domain kernel integration.
import assert from "node:assert/strict";
import { test } from "node:test";
import { computeQuote } from "../../kernel/src/pricing/engine.ts";
import { applyTransition, type OrderState } from "../../kernel/src/orders/stateMachine.ts";
import { assertBalanced, type LedgerTransaction } from "../../kernel/src/wallet/ledger.ts";
import { runOnce, InMemoryIdempotencyStore, IdempotencyConflictError } from "../../kernel/src/idempotency/store.ts";

// ─────────────────────────────────────────────────────────────
// TEST 1: Duplicate callback (idempotency)
// ─────────────────────────────────────────────────────────────
test("duplicate callback: same idempotency key returns original result, never double-charges", async () => {
  const store = new InMemoryIdempotencyStore();
  let callCount = 0;
  const operation = () => { callCount++; return Promise.resolve({ charged: 50000, orderId: "ord-1" }); };
  const nowIso = new Date().toISOString();

  // First call
  const result1 = await runOnce({ store, key: "cb-123", fingerprint: "body-hash", nowIso, operation });

  // Second call with same key + fingerprint → replay
  const result2 = await runOnce({ store, key: "cb-123", fingerprint: "body-hash", nowIso, operation });

  assert.strictEqual(callCount, 1, "fn should only execute once");
  assert.strictEqual(result1.replayed, false, "first call is not a replay");
  assert.strictEqual(result2.replayed, true, "second call is a replay");
  assert.deepStrictEqual(result1.value, result2.value, "duplicate returns original result");
});

// ─────────────────────────────────────────────────────────────
// TEST 2: Out of stock — order transitions to out_of_stock
// ─────────────────────────────────────────────────────────────
test("out of stock: order transitions paid → provisioning → out_of_stock → refunded", () => {
  let state: OrderState = "paid";

  const r1 = applyTransition({ orderId: "o1", from: state, event: "provisioning_started", atIso: new Date().toISOString(), actor: "worker" });
  state = r1.to;
  assert.strictEqual(state, "provisioning");

  const r2 = applyTransition({ orderId: "o1", from: state, event: "stock_missing", atIso: new Date().toISOString(), actor: "worker" });
  state = r2.to;
  assert.strictEqual(state, "out_of_stock");

  const r3 = applyTransition({ orderId: "o1", from: state, event: "refund_completed", atIso: new Date().toISOString(), actor: "system" });
  state = r3.to;
  assert.strictEqual(state, "refunded");
  assert.ok(r3.audit, "audit record should exist");
  assert.strictEqual(r3.audit.event, "refund_completed");
});

// ─────────────────────────────────────────────────────────────
// TEST 3: Supplier error — order transitions to supplier_failed
// ─────────────────────────────────────────────────────────────
test("supplier error: order transitions provisioning → supplier_failed → refunded", () => {
  let state: OrderState = "provisioning";

  const r1 = applyTransition({ orderId: "o2", from: state, event: "supplier_error", atIso: new Date().toISOString(), actor: "supplier_client" });
  state = r1.to;
  assert.strictEqual(state, "supplier_failed");

  const r2 = applyTransition({ orderId: "o2", from: state, event: "refund_completed", atIso: new Date().toISOString(), actor: "system" });
  state = r2.to;
  assert.strictEqual(state, "refunded");

  // Terminal state — illegal transition throws
  assert.throws(
    () => applyTransition({ orderId: "o2", from: state, event: "provisioning_started", atIso: new Date().toISOString(), actor: "worker" }),
    /illegal transition/i,
    "refunded is terminal — illegal transition must throw"
  );
});

// ─────────────────────────────────────────────────────────────
// TEST 4: Failed payment — order stays in awaiting_payment, never reaches paid
// ─────────────────────────────────────────────────────────────
test("failed payment: order stays in awaiting_payment, payment_verified rejected", () => {
  let state: OrderState = "created";
  const r1 = applyTransition({ orderId: "o3", from: state, event: "payment_requested", atIso: new Date().toISOString(), actor: "checkout" });
  state = r1.to;
  assert.strictEqual(state, "awaiting_payment");

  // Payment fails — cancel instead of verifying
  const r2 = applyTransition({ orderId: "o3", from: state, event: "cancelled", atIso: new Date().toISOString(), actor: "payment_gateway" });
  state = r2.to;
  assert.strictEqual(state, "cancelled");

  // payment_verified NOT allowed from cancelled — illegal transition throws
  assert.throws(
    () => applyTransition({ orderId: "o3", from: state, event: "payment_verified", atIso: new Date().toISOString(), actor: "gateway" }),
    /illegal transition/i,
    "cancelled is terminal — payment_verified must throw"
  );
});

// ─────────────────────────────────────────────────────────────
// TEST 5: Wallet — unbalanced transaction rejected
// ─────────────────────────────────────────────────────────────
test("wallet: unbalanced transaction is rejected (prevents money creation)", () => {
  const unbalanced: LedgerTransaction = {
    txId: "tx-bad",
    currency: "IRT",
    reason: "test",
    refType: "test",
    refId: "r1",
    createdAtIso: new Date().toISOString(),
    legs: [
      { accountId: "a1", direction: "debit", amountMinor: 100 },
      { accountId: "a2", direction: "credit", amountMinor: 50 },
    ],
  };
  assert.throws(() => assertBalanced(unbalanced), /debit|credit|balance/i);
});

// ─────────────────────────────────────────────────────────────
// TEST 6: Price computation — returns integer minor units
// ─────────────────────────────────────────────────────────────
test("pricing: computeQuote returns integer minor units, never float", () => {
  const quote = computeQuote(
    {
      expectedCurrency: "IRT",
      global: {
        version: "v1",
        markupBps: 20000,
        addAbsMinor: 0,
        minMarginAbsMinor: 0,
        floorMinor: null,
        capMinor: null,
        taxBps: 0,
        rounding: { mode: "nearest", unitMinor: 1000 },
      },
      categoryRules: {},
      productOverrides: {},
      scheduled: [],
      fxMaxAgeSeconds: 900,
    },
    {
      productId: "p1",
      supplierCostUsdCents: 900, // $9.00
      fx: {
        irtMinorPerUsd: 60000,
        source: "manual",
        capturedAtIso: new Date().toISOString(),
        bufferBps: 0,
      },
      nowIso: new Date().toISOString(),
    }
  );

  assert.strictEqual(quote.status, "ok");
  if (quote.status === "ok") {
    assert.ok(Number.isInteger(quote.grossMinor), "price must be integer");
    assert.ok(quote.grossMinor > 0, "price must be positive");
    assert.ok(quote.steps.length > 0, "audit steps must exist");
  }
});

// ─────────────────────────────────────────────────────────────
// TEST 7: Idempotency conflict — same key, different payload
// ─────────────────────────────────────────────────────────────
test("idempotency: same key with different fingerprint throws conflict", async () => {
  const store = new InMemoryIdempotencyStore();
  const nowIso = new Date().toISOString();

  await runOnce({ store, key: "k1", fingerprint: "hash-A", nowIso, operation: () => Promise.resolve(1) });

  await assert.rejects(
    () => runOnce({ store, key: "k1", fingerprint: "hash-B", nowIso, operation: () => Promise.resolve(2) }),
    (err: any) => err instanceof IdempotencyConflictError,
    "different fingerprint must throw IdempotencyConflictError"
  );
});
