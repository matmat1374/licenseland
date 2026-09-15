import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setPaymentStatus, setFulfillmentStage, recordDelivery } from "@/lib/order-lifecycle";
import { emailOrderEvent, processEmailQueue, activeProvider, EMAIL_EVENTS } from "@/lib/email-infra";

/**
 * DEV ONLY — end-to-end rehearsal of the purchase→delivery SOP against the real
 * code paths and the real database. Refuses to run in production.
 *
 * POST /api/dev/e2e
 */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, message: "disabled in production" }, { status: 403 });
  }

  const steps: any[] = [];
  const rec = (step: string, detail: any) => steps.push({ step, at: new Date().toISOString(), ...detail });

  // pick a real product so the order references a live listing
  const product = await db.product.findFirst({ where: { isActive: true }, select: { id: true, title: true, slug: true, price: true } });
  if (!product) return NextResponse.json({ ok: false, message: "no active product" }, { status: 400 });

  const code = `E2E-${Date.now().toString().slice(-6)}`;
  const order = await db.order.create({
    data: {
      code,
      guestEmail: process.env.E2E_EMAIL || "rehearsal@example.com",
      guestName: "مشتری آزمایشی",
      guestPhone: "09120000000",
      status: "PENDING",
      total: product.price,
      items: { create: [{ productId: product.id, productTitle: product.title, productSlug: product.slug, price: product.price, quantity: 1, duration: null }] },
    },
    include: { items: true },
  });
  rec("۱. ثبت سفارش", { code: order.code, id: order.id, status: order.status, stage: order.fulfillmentStage, total: order.total });

  // ── email event #1: order_created
  const e1 = await emailOrderEvent(order.id, "order_created");
  rec("ایمیل ثبت سفارش", { queued: e1.ok, id: e1.id });

  // ── payment confirmed
  const pay = await setPaymentStatus(order.id, "PAID", { actor: "admin", note: "پرداخت آزمایشی" });
  rec("۲. تأیید پرداخت", pay);

  // ── admin buys from the supplier
  const buyStart = await setFulfillmentStage(order.id, "PURCHASING", { actor: "admin", note: "شروع خرید", sendEmail: false });
  rec("۳. شروع خرید از تأمین‌کننده", buyStart);

  // (supplier credentials are out of scope, so we rehearse the success branch the
  //  purchase route takes after the supplier confirms; the supplier order record
  //  itself is created by fulfillAndDeliverOrder() in production)
  const bought = await setFulfillmentStage(order.id, "PURCHASED", { actor: "admin", note: "تأمین‌کننده تحویل داد (شبیه‌سازی)" });
  rec("۴. خریداری‌شده از تأمین‌کننده", bought);

  // ── ready → shipped with tracking
  const ready = await setFulfillmentStage(order.id, "READY_TO_DELIVER", { actor: "admin", note: "آماده بسته‌بندی" });
  rec("۵. آماده تحویل", ready);

  const deliveredRec = await recordDelivery(order.id, { method: "AUTO", reference: "LIC-E2E-7788", actor: "admin", note: "لایسنس از API تأمین‌کننده" });
  rec("۶. تحویل دیجیتال به مشتری", deliveredRec);

  // ── delivered
    // ── follow-up email (post-sale)
  const e7 = await emailOrderEvent(order.id, "followup", { note: "نظر شما برای ما ارزشمند است." });
  rec("ایمیل پیگیری پس از فروش", { queued: e7.ok });

  // ── drain the queue
  const drained = await processEmailQueue(50);
  rec("۸. پردازش صف ایمیل", { provider: activeProvider(), ...drained });

  // ── evidence: everything that landed in the database
  const finalOrder = await db.order.findUnique({
    where: { id: order.id },
    include: { shipment: true, statusEvents: { orderBy: { createdAt: "asc" } }, emails: { orderBy: { createdAt: "asc" } }, items: true },
  });

  const invalid = await setFulfillmentStage(order.id, "PURCHASING", { actor: "admin", note: "تلاش برای عقب‌گرد" });

  return NextResponse.json({
    ok: true,
    order: {
      code: finalOrder!.code,
      status: finalOrder!.status,
      fulfillmentStage: finalOrder!.fulfillmentStage,
      shipment: finalOrder!.shipment,
      statusEvents: finalOrder!.statusEvents.map((e) => ({ field: e.field, from: e.fromValue, to: e.toValue, actor: e.actor, note: e.note, at: e.createdAt })),
      emails: finalOrder!.emails.map((e) => ({ event: e.event, to: e.to, status: e.status, attempts: e.attempts, provider: e.provider, error: e.error, at: e.createdAt })),
      itemFulfillment: finalOrder!.items.map((i) => ({ title: i.productTitle, fulfillmentStatus: i.fulfillmentStatus })),
    },
    guardCheck: { attemptedBackwardTransition: "PURCHASING", result: invalid },
    emailEventsDefined: EMAIL_EVENTS,
    steps,
  });
}
