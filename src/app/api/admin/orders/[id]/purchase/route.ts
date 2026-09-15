import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-guard";
import { setFulfillmentStage, logEvent } from "@/lib/order-lifecycle";
import { fulfillAndDeliverOrder } from "@/lib/order-fulfillment";

/**
 * POST /api/admin/orders/[id]/purchase
 *
 * The one-click "buy this customer's order from the supplier" action.
 *  1. move the delivery stage to PURCHASING and stamp the audit trail
 *  2. call the existing supplier fulfilment (which records a SupplierOrder with
 *     the supplier reference, cost and status, plus SupplierLog entries)
 *  3. on success move to PURCHASED and email the customer; on failure keep the
 *     order in PURCHASING with the supplier error recorded, so it is never
 *     silently lost.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminSession();
  if (denied) return NextResponse.json(denied.body, { status: denied.status });

  const { id } = await params;
  const order = await db.order.findFirst({ where: { OR: [{ id }, { code: id }] }, select: { id: true, code: true, fulfillmentStage: true } });
  if (!order) return NextResponse.json({ ok: false, message: "سفارش یافت نشد" }, { status: 404 });

  const startedAt = new Date();
  await setFulfillmentStage(order.id, "PURCHASING", { actor: "admin", note: "شروع خرید از تأمین‌کننده", sendEmail: false });

  let result: { ok: boolean; message: string };
  try {
    result = await fulfillAndDeliverOrder(order.id);
  } catch (e: any) {
    result = { ok: false, message: String(e?.message || e) };
  }

  if (result.ok) {
    const st = await setFulfillmentStage(order.id, "PURCHASED", { actor: "admin", note: "خرید از تأمین‌کننده با موفقیت انجام شد" });
    // the supplier purchase record carries the id / amount / time / status
    const itemIds = (await db.orderItem.findMany({ where: { orderId: order.id }, select: { id: true } })).map((i) => i.id);
    const so = itemIds.length
      ? await db.supplierOrder.findFirst({ where: { orderItemId: { in: itemIds } }, orderBy: { createdAt: "desc" } })
      : null;
    return NextResponse.json({ ok: true, message: result.message, stage: st.message, emailQueued: Boolean(st.emailId), supplierOrder: so ? { code: so.code, status: so.status, supplierRef: so.supplierRef, costUsd: so.costUsd, at: so.createdAt } : null, elapsedMs: Date.now() - startedAt.getTime() });
  }

  await logEvent({ orderId: order.id, field: "fulfillmentStage", fromValue: "PURCHASING", toValue: "PURCHASING", actor: "admin", note: "خطای خرید: " + result.message });
  return NextResponse.json({ ok: false, message: result.message, stage: "در حال خرید از تأمین‌کننده (نیازمند پیگیری)" }, { status: 502 });
}
