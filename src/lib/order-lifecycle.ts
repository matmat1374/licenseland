/**
 * Order delivery lifecycle.
 * ------------------------
 * Two independent axes:
 *   • `Order.status`            — PAYMENT     (PENDING → PAID / FAILED / CANCELLED)
 *   • `Order.fulfillmentStage`  — DELIVERY    (NONE → PURCHASING → PURCHASED → READY_TO_SHIP → SHIPPED → DELIVERED, or RETURNED)
 *
 * Every change writes an `OrderStatusEvent` (audit trail) and enqueues the
 * matching customer email, so the SOP ("who changed what, when, and did the
 * customer get told?") is answerable with one query.
 */

import { db } from "@/lib/db";
import { emailOrderEvent, type EmailEvent } from "@/lib/email-infra";

export const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "CANCELLED", "PROCESSING", "PENDING_SUPPORT"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const FULFILLMENT_STAGES = ["NONE", "PURCHASING", "PURCHASED", "READY_TO_SHIP", "SHIPPED", "DELIVERED", "RETURNED"] as const;
export type FulfillmentStage = (typeof FULFILLMENT_STAGES)[number];

export const STAGE_FA: Record<string, string> = {
  NONE: "در انتظار شروع",
  PURCHASING: "در حال خرید از تأمین‌کننده",
  PURCHASED: "خریداری‌شده از تأمین‌کننده",
  READY_TO_SHIP: "آماده ارسال",
  SHIPPED: "ارسال‌شده",
  DELIVERED: "تحویل‌شده",
  RETURNED: "مرجوعی",
};

export const STATUS_FA: Record<string, string> = {
  PENDING: "ثبت‌شده (در انتظار پرداخت)",
  PAID: "پرداخت‌شده",
  FAILED: "ناموفق",
  CANCELLED: "لغوشده",
  PROCESSING: "در حال پردازش",
  PENDING_SUPPORT: "در انتظار پشتیبانی",
};

/** Allowed forward transitions. Anything else is rejected (and logged). */
const NEXT: Record<string, string[]> = {
  NONE: ["PURCHASING", "PURCHASED", "READY_TO_SHIP", "RETURNED"],
  PURCHASING: ["PURCHASED", "READY_TO_SHIP", "RETURNED"],
  PURCHASED: ["READY_TO_SHIP", "SHIPPED", "RETURNED"],
  READY_TO_SHIP: ["SHIPPED", "RETURNED"],
  SHIPPED: ["DELIVERED", "RETURNED"],
  DELIVERED: ["RETURNED"],
  RETURNED: [],
};

export function stageIndex(s: string): number {
  return (FULFILLMENT_STAGES as readonly string[]).indexOf(s);
}

export function canTransition(from: string, to: string): boolean {
  if (from === to) return false;
  return (NEXT[from] || []).includes(to);
}

/** Stage change → customer email template. */
const STAGE_EMAIL: Partial<Record<string, EmailEvent>> = {
  PURCHASED: "supplier_purchased",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
};

export async function logEvent(args: {
  orderId: string;
  field: string;
  fromValue?: string | null;
  toValue: string;
  actor?: string;
  note?: string | null;
}) {
  return db.orderStatusEvent.create({
    data: {
      orderId: args.orderId,
      field: args.field,
      fromValue: args.fromValue ?? null,
      toValue: args.toValue,
      actor: args.actor || "system",
      note: args.note ?? null,
    },
  });
}

export async function getOrderLifecycle(orderId: string) {
  const order = await db.order.findFirst({
    where: { OR: [{ id: orderId }, { code: orderId }] },
    include: { shipment: true, statusEvents: { orderBy: { createdAt: "asc" } } },
  });
  return order;
}

/**
 * Move the delivery stage forward, write the audit event and email the customer.
 * Returns a structured result instead of throwing, so the admin UI can show the
 * exact reason a transition was refused.
 */
export async function setFulfillmentStage(
  orderId: string,
  to: FulfillmentStage,
  opts: { actor?: string; note?: string; sendEmail?: boolean } = {},
): Promise<{ ok: boolean; message: string; emailId?: string }> {
  const order = await db.order.findFirst({ where: { OR: [{ id: orderId }, { code: orderId }] } });
  if (!order) return { ok: false, message: "سفارش یافت نشد" };
  const from = order.fulfillmentStage || "NONE";
  if (!canTransition(from, to)) {
    await logEvent({ orderId: order.id, field: "fulfillmentStage", fromValue: from, toValue: to, actor: opts.actor, note: `انتقال نامعتبر: ${opts.note || ""}`.trim() });
    return { ok: false, message: `انتقال از «${STAGE_FA[from] || from}» به «${STAGE_FA[to] || to}» مجاز نیست` };
  }

  await db.order.update({ where: { id: order.id }, data: { fulfillmentStage: to } });
  await logEvent({ orderId: order.id, field: "fulfillmentStage", fromValue: from, toValue: to, actor: opts.actor, note: opts.note });

  let emailId: string | undefined;
  const ev = STAGE_EMAIL[to];
  if (ev && opts.sendEmail !== false) {
    const r = await emailOrderEvent(order.id, ev, { stage: to, note: opts.note ?? null });
    emailId = r.id;
  }
  return { ok: true, message: `وضعیت به «${STAGE_FA[to] || to}» تغییر کرد`, emailId };
}

/** Payment status change (kept separate from the delivery axis). */
export async function setPaymentStatus(
  orderId: string,
  to: PaymentStatus,
  opts: { actor?: string; note?: string; sendEmail?: boolean } = {},
): Promise<{ ok: boolean; message: string; emailId?: string }> {
  const order = await db.order.findFirst({ where: { OR: [{ id: orderId }, { code: orderId }] } });
  if (!order) return { ok: false, message: "سفارش یافت نشد" };
  const from = order.status;
  if (from === to) return { ok: false, message: "وضعیت پرداخت تغییری نکرد" };

  await db.order.update({ where: { id: order.id }, data: { status: to, ...(to === "PAID" && !order.paidAt ? { paidAt: new Date() } : {}) } });
  await logEvent({ orderId: order.id, field: "status", fromValue: from, toValue: to, actor: opts.actor, note: opts.note });

  let emailId: string | undefined;
  if (to === "PAID" && opts.sendEmail !== false) {
    const r = await emailOrderEvent(order.id, "payment_confirmed", { note: opts.note ?? null });
    emailId = r.id;
  }
  return { ok: true, message: `وضعیت پرداخت به «${STATUS_FA[to] || to}» تغییر کرد`, emailId };
}

/**
 * Record the physical handover: carrier + tracking code. Moving to SHIPPED is
 * implied, and the customer is emailed the tracking code.
 */
export async function recordShipment(
  orderId: string,
  args: { carrier?: string; trackingCode?: string; note?: string; actor?: string; status?: "SHIPPED" | "READY_TO_SHIP" },
): Promise<{ ok: boolean; message: string; emailId?: string }> {
  const order = await db.order.findFirst({ where: { OR: [{ id: orderId }, { code: orderId }] } });
  if (!order) return { ok: false, message: "سفارش یافت نشد" };
  const target = args.status || "SHIPPED";

  const shipment = await db.shipment.upsert({
    where: { orderId: order.id },
    create: {
      orderId: order.id,
      carrier: args.carrier || null,
      trackingCode: args.trackingCode || null,
      status: target,
      note: args.note || null,
      shippedAt: target === "SHIPPED" ? new Date() : null,
    },
    update: {
      carrier: args.carrier || null,
      trackingCode: args.trackingCode || null,
      status: target,
      note: args.note || null,
      ...(target === "SHIPPED" ? { shippedAt: new Date() } : {}),
    },
  });
  await logEvent({ orderId: order.id, field: "shipment", fromValue: null, toValue: target, actor: args.actor, note: `حامل: ${args.carrier || "—"} | کد رهگیری: ${args.trackingCode || "—"}` });

  let emailId: string | undefined;
  const st = await setFulfillmentStage(order.id, target, { actor: args.actor, note: args.note });
  if (st.ok) emailId = st.emailId;
  return { ok: true, message: st.ok ? `ارسال ثبت شد (${args.trackingCode || "بدون کد رهگیری"})` : st.message, emailId };
}

/** Mark the order delivered (closes the loop and emails the customer). */
export async function markDelivered(orderId: string, opts: { actor?: string; note?: string } = {}) {
  const order = await db.order.findFirst({ where: { OR: [{ id: orderId }, { code: orderId }] } });
  if (!order) return { ok: false, message: "سفارش یافت نشد" };
  await db.shipment.upsert({
    where: { orderId: order.id },
    create: { orderId: order.id, status: "DELIVERED", deliveredAt: new Date() },
    update: { status: "DELIVERED", deliveredAt: new Date() },
  });
  await logEvent({ orderId: order.id, field: "shipment", fromValue: null, toValue: "DELIVERED", actor: opts.actor, note: opts.note });
  return setFulfillmentStage(order.id, "DELIVERED", opts);
}

/** Who did what, in order — drives the customer timeline and the SOP audit. */
export async function orderTimeline(orderId: string) {
  const order = await db.order.findFirst({ where: { OR: [{ id: orderId }, { code: orderId }] }, select: { id: true } });
  if (!order) return [];
  return db.orderStatusEvent.findMany({ where: { orderId: order.id }, orderBy: { createdAt: "asc" } });
}
