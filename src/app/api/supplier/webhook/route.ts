import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSupplierConfig, receiveSupplierKeys, logSupplier } from "@/lib/supplier";
import { verifyWebhookSignature } from "@kernel/security/licenseVault";
import { sealKey } from "@/lib/licenses";
import { sendOrderFulfillmentEmail } from "@/lib/email";
import { refundWallet } from "@/lib/domain/wallet";

// POST /api/supplier/webhook — accepts TWO payload shapes:
//
// 1) irMarket order webhook (per https://api.irmarket.store/buyer/docs):
//    body = OrderResponse { order_id, status: delivered|failed, accounts, refunded, ... }
//    auth = HMAC-SHA256 of the RAW body in X-Signature (hex), secret stored at
//    registration time (Setting: supplier_irmarket_webhook_secret)
//
// 2) legacy manual/telegram push:
//    body = { supplierOrderId?, productId, keys: [{ key, note }] }
//    auth = X-Supplier-Key header must match supplier_webhook_secret
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature") || req.headers.get("X-Signature") || "";

  // 1. irMarket HMAC-SHA256 signature validation
  const [irmSecretRow, legacySecretRow] = await Promise.all([
    db.setting.findUnique({ where: { key: "supplier_irmarket_webhook_secret" } }).catch(() => null),
    db.setting.findUnique({ where: { key: "supplier_webhook_secret" } }).catch(() => null),
  ]);

  const candidateSecrets = [
    irmSecretRow?.value,
    legacySecretRow?.value,
    process.env.SUPPLIER_WEBHOOK_SECRET,
    process.env.IRMARKET_WEBHOOK_SECRET,
  ].filter(Boolean) as string[];

  if (signature) {
    let isSignatureValid = false;
    for (const sec of candidateSecrets) {
      if (verifyWebhookSignature({ secret: sec, rawBody, signatureHex: signature })) {
        isSignatureValid = true;
        break;
      }
    }

    // Record audit webhook log
    await db.webhook.create({
      data: {
        source: "irmarket",
        eventType: "order.webhook",
        signatureValid: isSignatureValid,
        rawBody: rawBody.slice(0, 5000),
        processedAt: isSignatureValid ? new Date() : null,
      },
    }).catch(() => {});

    if (!isSignatureValid) {
      await logSupplier(null, "webhook_in_error", "ERROR", { signature: signature.slice(0, 16) + "..." }, "امضای وب‌هوک irMarket (X-Signature) نامعتبر است");
      return NextResponse.json({ ok: false, message: "امضای وب‌هوک نامعتبر است" }, { status: 401 });
    }

    return handleIrmarketWebhook(rawBody);
  }

  // 2. Fallback: legacy shared-secret auth via X-Supplier-Key
  const cfg = await getSupplierConfig();
  const suppliedKey = req.headers.get("x-supplier-key") || req.headers.get("X-Supplier-Key") || "";
  if (!cfg.webhookSecret && candidateSecrets.length === 0) {
    await logSupplier(null, "webhook_in_error", "ERROR", {}, "وب‌هوک فراخوانی شد اما هیچ رمز احراز هویتی تنظیم نشده");
    return NextResponse.json({ ok: false, message: "رمز وب‌هوک تنظیم نشده است" }, { status: 500 });
  }

  const validKey = cfg.webhookSecret || candidateSecrets[0];
  if (!suppliedKey || suppliedKey !== validKey) {
    await logSupplier(null, "webhook_in_error", "ERROR", { supplied: suppliedKey.slice(0, 8) + "..." }, "رمز وب‌هوک نامعتبر");
    return NextResponse.json({ ok: false, message: "رمز وب‌هوک نامعتبر" }, { status: 401 });
  }

  // 3. Legacy manual/telegram payload
  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, message: "بدنه JSON نامعتبر" }, { status: 400 });
  }

  // If payload contains order_id, route to irMarket handler even under shared-secret
  if (body.order_id && body.status) {
    return handleIrmarketWebhook(rawBody);
  }

  const { supplierOrderId, productId, keys } = body;
  if (!productId) return NextResponse.json({ ok: false, message: "productId الزامی است" }, { status: 400 });
  if (!Array.isArray(keys) || keys.length === 0)
    return NextResponse.json({ ok: false, message: "keys باید آرایه‌ای غیرخالی باشد" }, { status: 400 });

  const result = await receiveSupplierKeys(supplierOrderId || null, productId, keys, body);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

// irMarket OrderResponse -> deliver accounts idempotently without duplicates
async function handleIrmarketWebhook(rawBody: string) {
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, message: "بدنه نامعتبر" }, { status: 400 });
  }

  const orderId = Number(payload.order_id);
  const status = String(payload.status || "").toLowerCase();
  const accounts: string[] = Array.isArray(payload.accounts) ? payload.accounts : [];
  if (!orderId || !status) {
    return NextResponse.json({ ok: false, message: "order_id و status الزامی هستند" }, { status: 400 });
  }

  // Match items by supplierOrderId ("irm:{order_id}") or via SupplierOrder record
  let items = await db.orderItem.findMany({
    where: { supplierOrderId: `irm:${orderId}` },
    include: { order: true },
  });

  let matchingSupplierOrder: any = null;

  if (items.length === 0) {
    matchingSupplierOrder = await db.supplierOrder.findFirst({
      where: { supplierRef: String(orderId) },
    });
    if (matchingSupplierOrder?.orderItemId) {
      items = await db.orderItem.findMany({
        where: { id: matchingSupplierOrder.orderItemId },
        include: { order: true },
      });
    }
    if (items.length === 0 && matchingSupplierOrder) {
      items = await db.orderItem.findMany({
        where: { supplierOrderId: matchingSupplierOrder.id },
        include: { order: true },
      });
    }
  } else {
    matchingSupplierOrder = await db.supplierOrder.findFirst({
      where: { supplierRef: String(orderId) },
    });
  }

  if (items.length === 0) {
    await logSupplier(null, "webhook_in_orphan", "ERROR", { order_id: orderId, payload }, "وب‌هوک irMarket دریافت شد اما آیتم سفارشی یافت نشد");
    return NextResponse.json({ ok: false, message: "سفارش متناظر یافت نشد" }, { status: 404 });
  }

  for (const it of items) {
    if (status === "delivered" && accounts.length > 0) {
      // Prevent duplicate key generation: count already delivered keys
      const existingKeys = await db.licenseKey.findMany({
        where: { orderItemId: it.id },
        select: { key: true },
      });

      const existingSet = new Set(existingKeys.map((k) => k.key));
      let deliveredCount = 0;

      for (const account of accounts) {
        const sealed = sealKey(it.productId, account);
        if (existingSet.has(sealed)) {
          continue; // Skip exact duplicate
        }

        await db.licenseKey.create({
          data: {
            productId: it.productId,
            key: sealed,
            note: `سفارش ${it.order.code} | irMarket #${orderId}`,
            status: "SOLD",
            source: "supplier_api",
            orderItemId: it.id,
            supplierOrderId: matchingSupplierOrder?.id || null,
            soldAt: new Date(),
          },
        });
        existingSet.add(sealed);
        deliveredCount++;
      }

      await db.orderItem.update({
        where: { id: it.id },
        data: { fulfillmentStatus: "FULFILLED" },
      });

      if (matchingSupplierOrder) {
        await db.supplierOrder.update({
          where: { id: matchingSupplierOrder.id },
          data: { status: "FULFILLED", fulfilledAt: new Date() },
        }).catch(() => {});
      }

      await logSupplier(
        matchingSupplierOrder?.id || String(orderId),
        "webhook_delivered",
        "SUCCESS",
        { totalAccounts: accounts.length, newDelivered: deliveredCount },
        `${deliveredCount} اکانت جدید از طریق وب‌هوک irMarket تحویل شد`
      );

      sendOrderFulfillmentEmail(it.orderId).catch((err) => {
        console.error("[email] Error sending fulfillment email from webhook:", err);
      });
    } else if (status === "failed" || status === "cancelled" || payload.refunded === true) {
      await db.orderItem.update({
        where: { id: it.id },
        data: { fulfillmentStatus: "FAILED" },
      });
      if (matchingSupplierOrder) {
        await db.supplierOrder.update({
          where: { id: matchingSupplierOrder.id },
          data: { status: "FAILED" },
        }).catch(() => {});
      }

      // H6 fix: automatic compensation — refund the paid amount to the
      // customer's wallet ledger + a REFUND PointEvent + an urgent ticket.
      // Previously the money just hung in limbo awaiting manual work.
      try {
        const itemAmount = it.price * it.quantity;
        if (itemAmount > 0) {
          await refundWallet({
            userId: it.order.userId || null,
            amountMinor: itemAmount,
            orderId: it.orderId,
            reason: `supplier failure: irMarket order #${orderId}`,
          });
        }
      } catch (e) {
        console.error("[webhook] wallet refund failed:", e);
      }

      if (it.order.userId) {
        try {
          const { getLoyalty } = await import("@/lib/loyalty");
          const loyalty = await getLoyalty(it.order.userId);
          const earnedForItem = await db.pointEvent.findFirst({
            where: { orderId: it.orderId, type: "EARN" },
          });
          const clawback = earnedForItem ? Math.min(earnedForItem.points, loyalty.totalPoints) : 0;
          if (clawback > 0) {
            await db.userLoyalty.update({
              where: { id: loyalty.id },
              data: {
                totalPoints: { decrement: clawback },
                lifetimePoints: { decrement: clawback },
                totalSpent: { decrement: Math.min(it.price * it.quantity, loyalty.totalSpent) },
              },
            });
            await db.pointEvent.create({
              data: {
                loyaltyId: loyalty.id,
                type: "REFUND",
                points: -clawback,
                description: `بازگشت امتیاز به دلیل شکست تامین‌کننده — سفارش ${it.order.code}`,
                orderId: it.orderId,
              },
            });
          }
        } catch (e) {
          console.error("[webhook] points clawback failed:", e);
        }
      }

      await db.ticket.create({
        data: {
          orderId: it.orderId,
          userId: it.order.userId || null,
          subject: `[جبران خودکار] شکست تامین‌کننده در سفارش ${it.order.code}`,
          body: `سفارش irMarket #${orderId} ناموفق بود (status: ${status}). مبلغ ${(it.price * it.quantity).toLocaleString("fa-IR")} تومان به کیف پول مشتری برگشت داده شد و امتیازهای کسبی سفارش کسر شد. لطفاً مشتری را مطلع کنید.`,
          status: "open",
          priority: "high",
        },
      }).catch(() => {});

      await logSupplier(
        matchingSupplierOrder?.id || String(orderId),
        "webhook_failed",
        "ERROR",
        { status, refunded: payload.refunded, autoRefunded: true },
        `سفارش irMarket #${orderId} ناموفق بود — مبلغ به کیف پول برگشت و امتیاز کسر شد`
      );
    } else if (status === "processing") {
      await db.orderItem.update({
        where: { id: it.id },
        data: { fulfillmentStatus: "PROCESSING_BY_SUPPLIER" },
      });
      await logSupplier(
        matchingSupplierOrder?.id || String(orderId),
        "webhook_processing",
        "INFO",
        {},
        `سفارش irMarket #${orderId} در حال پردازش نزد تامین‌کننده`
      );
    }
  }

  return NextResponse.json({ ok: true, message: "وب‌هوک با موفقیت پردازش شد" });
}

// GET — minimal connectivity probe; leaks no configuration (M8 fix)
export async function GET() {
  return NextResponse.json({ ok: true });
}
