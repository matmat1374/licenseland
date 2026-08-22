import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSupplierConfig, receiveSupplierKeys, logSupplier } from "@/lib/supplier";

// POST /api/supplier/webhook
// Supplier pushes license keys here.
// Auth: X-Supplier-Key header must match supplier_webhook_secret.
//
// Body:
// {
//   "supplierOrderId": "cms...",      // optional; if absent an INBOUND order is created
//   "productId": "cms...",
//   "keys": [ { "key": "ABCD-1234", "note": "email: x@y.com" }, ... ]
// }
export async function POST(req: NextRequest) {
  const cfg = await getSupplierConfig();

  // auth
  const suppliedKey = req.headers.get("x-supplier-key") || req.headers.get("X-Supplier-Key") || "";
  if (!cfg.webhookSecret) {
    await logSupplier(null, "webhook_in_error", "ERROR", {}, "وب‌هوک فراخوانی شد اما رمز تنظیم نشده");
    return NextResponse.json({ ok: false, message: "رمز وب‌هوک تنظیم نشده — ابتدا در پنل ادمین تنظیم کنید" }, { status: 500 });
  }
  if (suppliedKey !== cfg.webhookSecret) {
    await logSupplier(null, "webhook_in_error", "ERROR", { supplied: suppliedKey.slice(0, 8) + "..." }, "رمز وب‌هوک نامعتبر");
    return NextResponse.json({ ok: false, message: "رمز وب‌هوک نامعتبر" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
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

// GET — health check for supplier to verify connectivity
export async function GET() {
  const cfg = await getSupplierConfig();
  return NextResponse.json({
    ok: true,
    enabled: cfg.enabled,
    mode: cfg.mode,
    webhookReady: !!cfg.webhookSecret,
    message: cfg.webhookSecret ? "وب‌هوک آماده دریافت" : "رمز وب‌هوک تنظیم نشده",
  });
}
