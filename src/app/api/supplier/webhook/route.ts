import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSupplierConfig, receiveSupplierKeys, logSupplier } from "@/lib/supplier";
import { verifyWebhookSignature } from "@kernel/security/licenseVault";
import { sealKey } from "@/lib/licenses";

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

  // ---------- auth: try irMarket signature first ----------
  const irmSecretRow = await db.setting
    .findUnique({ where: { key: "supplier_irmarket_webhook_secret" } })
    .catch(() => null);
  const irmSecret = irmSecretRow?.value || "";
  const signature = req.headers.get("x-signature") || "";

  if (irmSecret && signature) {
    if (!verifyWebhookSignature({ secret: irmSecret, rawBody, signatureHex: signature })) {
      await logSupplier(null, "webhook_in_error", "ERROR", {}, "امضای وب‌هوک irMarket نامعتبر است");
      return NextResponse.json({ ok: false, message: "invalid signature" }, { status: 401 });
    }
    return handleIrmarketWebhook(rawBody);
  }

  // ---------- legacy shared-secret auth ----------
  const cfg = await getSupplierConfig();
  const suppliedKey = req.headers.get("x-supplier-key") || "";
  if (!cfg.webhookSecret) {
    await logSupplier(null, "webhook_in_error", "ERROR", {}, "وب‌هوک فراخوانی شد اما رمز تنظیم نشده");
    return NextResponse.json({ ok: false, message: "رمز وب‌هوک تنظیم نشده — ابتدا در پنل ادمین تنظیم کنید" }, { status: 500 });
  }
  if (suppliedKey !== cfg.webhookSecret) {
    await logSupplier(null, "webhook_in_error", "ERROR", { supplied: suppliedKey.slice(0, 8) + "..." }, "رمز وب‌هوک نامعتبر");
    return NextResponse.json({ ok: false, message: "رمز وب‌هوک نامعتبر" }, { status: 401 });
  }

  // ---------- legacy payload ----------
  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, message: "بدنه نامعتبر" }, { status: 400 });
  }
  const { supplierOrderId, productId, keys } = body;
  if (!productId) return NextResponse.json({ ok: false, message: "productId الزامی است" }, { status: 400 });
  if (!Array.isArray(keys) || keys.length === 0)
    return NextResponse.json({ ok: false, message: "keys باید آرایه‌ای غیرخالی باشد" }, { status: 400 });

  const result = await receiveSupplierKeys(supplierOrderId || null, productId, keys, body);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

// irMarket OrderResponse → attach delivered accounts to the matching order item
// (matched via OrderItem.supplierOrderId = "irm:{order_id}", stored at purchase time)
async function handleIrmarketWebhook(rawBody: string) {
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, message: "بدنه نامعتبر" }, { status: 400 });
  }

  const orderId = Number(payload.order_id);
  const status = String(payload.status || "");
  const accounts: string[] = Array.isArray(payload.accounts) ? payload.accounts : [];
  if (!orderId || !status) {
    return NextResponse.json({ ok: false, message: "order_id/status الزامی است" }, { status: 400 });
  }

  const items = await db.orderItem.findMany({
    where: { supplierOrderId: `irm:${orderId}` },
    include: { order: true },
  });
  if (items.length === 0) {
    await logSupplier(null, "webhook_in_orphan", "ERROR", { order_id: orderId }, "وب‌هوک irMarket بدون آیتم متناظر");
    return NextResponse.json({ ok: false, message: "سفارش متناظر یافت نشد" }, { status: 404 });
  }

  for (const it of items) {
    if (status === "delivered" && accounts.length > 0) {
      // idempotent: skip if keys already attached
      const existing = await db.licenseKey.count({ where: { orderItemId: it.id } });
      if (existing > 0) continue;
      for (const account of accounts) {
        await db.licenseKey.create({
          data: {
            productId: it.productId,
            key: sealKey(it.productId, account),
            note: `سفارش ${it.order.code} | irMarket #${orderId}`,
            status: "SOLD",
            source: "supplier_api",
            orderItemId: it.id,
            soldAt: new Date(),
          },
        });
      }
      await db.orderItem.update({ where: { id: it.id }, data: { fulfillmentStatus: "FULFILLED" } });
      await logSupplier(String(orderId), "webhook_delivered", "SUCCESS", { count: accounts.length }, `${accounts.length} اکانت از وب‌هوک irMarket تحویل شد`);
    } else if (status === "failed" || status === "cancelled" || payload.refunded === true) {
      await db.orderItem.update({ where: { id: it.id }, data: { fulfillmentStatus: "FAILED" } });
      await logSupplier(
        String(orderId),
        "webhook_failed",
        "ERROR",
        { status, refunded: payload.refunded },
        `سفارش irMarket #${orderId} ناموفق بود — سفارش ${it.order.code} نیازمند جبران/بازگشت وجه است`
      );
    } else if (status === "processing") {
      await db.orderItem.update({ where: { id: it.id }, data: { fulfillmentStatus: "PROCESSING" } });
      await logSupplier(String(orderId), "webhook_processing", "INFO", {}, `سفارش irMarket #${orderId} در حال پردازش`);
    }
  }

  return NextResponse.json({ ok: true });
}

// GET — minimal connectivity probe; leaks no configuration (M8 fix)
export async function GET() {
  return NextResponse.json({ ok: true });
}
