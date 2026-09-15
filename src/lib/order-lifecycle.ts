/**
 * Order delivery lifecycle — digital goods (licences, accounts, subscriptions).
 * ---------------------------------------------------------------------------
 * There is NO physical shipping in this business, so the lifecycle stops at
 * "delivered to the customer", not "shipped". Two axes stay independent:
 *   • `Order.status`           — PAYMENT  (PENDING → PAID / FAILED / CANCELLED)
 *   • `Order.fulfillmentStage` — DELIVERY (NONE → PURCHASING → PURCHASED → READY_TO_DELIVER → DELIVERED)
 *
 * The `Shipment` table is reused as the **delivery record** for digital goods:
 *   carrier      → delivery method ("AUTO" = licence issued by the supplier API,
 *                  "MANUAL" = admin delivered the account/credentials by hand)
 *   trackingCode → short reference shown to the customer (e.g. licence reference)
 *   note         → what the admin handed over
 *
 * Every change writes an `OrderStatusEvent` and queues the matching customer email.
 */

import { db } from "@/lib/db";
import { emailOrderEvent, type EmailEvent } from "@/lib/email-infra";

export const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "CANCELLED", "PROCESSING", "PENDING_SUPPORT"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const FULFILLMENT_STAGES = ["NONE", "PURCHASING", "PURCHASED", "READY_TO_DELIVER", "DELIVERED", "RETURNED"] as const;
export type FulfillmentStage = (typeof FULFILLMENT_STAGES)[number];

export const DELIVERY_METHODS = ["AUTO", "MANUAL"] as const;
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

export const STAGE_FA: Record<string, string> = {
  NONE: "در انتظار شروع",
  PURCHASING: "در حال خرید از تأمین‌کننده",
  PURCHASED: "خریداری‌شده از تأمین‌کننده",
  READY_TO_DELIVER: "آماده تحویل به مشتری",
  DELIVERED: "تحویل‌شده به مشتری",
  RETURNED: "مرجوعی",
};

export const METHOD_FA: Record<string, string> = {
  AUTO: "خودکار (تحویل لایسنس از API)",
  MANUAL: "دستی (ارسال اطلاعات توسط پشتیبانی)",
};

export const STATUS_FA: Record<string, string> = {
  PENDING: "ثبت‌شده (در انتظار پرداخت)",
  PAID: "پرداخت‌شده",
  FAILED: "ناموفق",
  CANCELLED: "لغوشده",
  PROCESSING: "در حال پردازش",
  PENDING_SUPPORT: "در انتظار پشتیبانی",
};

/** Allowed forward transitions. Anything else is refused (and logged). */
const NEXT: Record<string, string[]> = {
  NONE: ["PURCHASING", "PURCHASED", "READY_TO_DELIVER", "RETURNED"],
  PURCHASING: ["PURCHASED", "READY_TO_DELIVER", "RETURNED"],
  PURCHASED: ["READY_TO_DELIVER", "DELIVERED", "RETURNED"],
  READY_TO_DELIVER: ["DELIVERED", "RETURNED"],
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
  return db.order.findFirst({
    where: { OR: [{ id: orderId }, { code: orderId }] },
    include: { shipment: true, statusEvents: { orderBy: { createdAt: "asc" } } },
  });
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
 * Record the DIGITAL handover: how the licence/account reached the customer.
 * There is no carrier and no tracking code in this business — `method` says
 * whether the supplier API issued it automatically or support handed it over.
 */
export async function recordDelivery(
  orderId: string,
  args: { method?: DeliveryMethod; reference?: string; note?: string; actor?: string } = {},
): Promise<{ ok: boolean; message: string; emailId?: string }> {
  const order = await db.order.findFirst({ where: { OR: [{ id: orderId }, { code: orderId }] } });
  if (!order) return { ok: false, message: "سفارش یافت نشد" };

  const issued = await db.licenseKey.count({ where: { orderItem: { orderId: order.id } } }).catch(() => 0);
  const method: DeliveryMethod = args.method || (issued > 0 ? "AUTO" : "MANUAL");

  await db.shipment.upsert({
    where: { orderId: order.id },
    create: {
      orderId: order.id,
      carrier: method,                                   // delivery method
      trackingCode: args.reference || (issued > 0 ? `${issued} لایسنس` : null),
      note: args.note || null,
      status: "DELIVERED",
      deliveredAt: new Date(),
    },
    update: {
      carrier: method,
      trackingCode: args.reference || (issued > 0 ? `${issued} لایسنس` : null),
      note: args.note || null,
      status: "DELIVERED",
      deliveredAt: new Date(),
    },
  });
  await logEvent({
    orderId: order.id,
    field: "delivery",
    fromValue: null,
    toValue: "DELIVERED",
    actor: args.actor,
    note: `${METHOD_FA[method]}${args.note ? ` — ${args.note}` : ""}`,
  });

  const st = await setFulfillmentStage(order.id, "DELIVERED", { actor: args.actor, note: args.note });
  return { ok: st.ok, message: st.ok ? `تحویل ثبت شد (${METHOD_FA[method]})` : st.message, emailId: st.emailId };
}

/** Mark the order delivered when the licence/account is already with the customer. */
export async function markDelivered(orderId: string, opts: { actor?: string; note?: string } = {}) {
  return recordDelivery(orderId, { actor: opts.actor, note: opts.note });
}

/** Who did what, in order — drives the customer timeline and the SOP audit. */
export async function orderTimeline(orderId: string) {
  const order = await db.order.findFirst({ where: { OR: [{ id: orderId }, { code: orderId }] }, select: { id: true } });
  if (!order) return [];
  return db.orderStatusEvent.findMany({ where: { orderId: order.id }, orderBy: { createdAt: "asc" } });
}
