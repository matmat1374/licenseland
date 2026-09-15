/**
 * Email infrastructure — provider abstraction, Persian templates, durable queue
 * with retry/backoff, and a delivery log.
 *
 * Design notes
 * ------------
 * • One table (`EmailLog`) is both the queue and the audit trail, so "was the
 *   customer emailed about this order?" is a single query.
 * • Providers: SMTP (nodemailer), Postmark, SendGrid, Mailgun over HTTP.
 *   When nothing is configured the message is rendered, stored and marked
 *   SKIPPED — never SENT. Claiming delivery we did not perform would be a lie.
 * • Retry: exponential backoff 1m → 5m → 15m → 1h → 6h, then FAILED (dead letter).
 *   Failed rows stay in the log and surface in the admin ops query.
 */

import { db } from "@/lib/db";
import { SITE } from "@/lib/constants";

export type EmailEvent =
  | "order_created"
  | "payment_confirmed"
  | "supplier_purchased"
  | "shipped"
  | "delivered"
  | "followup";

export const EMAIL_EVENTS: EmailEvent[] = [
  "order_created",
  "payment_confirmed",
  "supplier_purchased",
  "shipped",
  "delivered",
  "followup",
];

export const EVENT_LABELS_FA: Record<EmailEvent, string> = {
  order_created: "ثبت سفارش",
  payment_confirmed: "تأیید پرداخت",
  supplier_purchased: "خرید از تأمین‌کننده",
  shipped: "ارسال سفارش",
  delivered: "تحویل سفارش",
  followup: "پیگیری پس از فروش",
};

// ---------------------------------------------------------------- providers

type Provider = "smtp" | "postmark" | "sendgrid" | "mailgun" | "none";

export function activeProvider(): Provider {
  const p = (process.env.EMAIL_PROVIDER || "").toLowerCase();
  if (p === "smtp" && process.env.SMTP_HOST) return "smtp";
  if (p === "postmark" && process.env.POSTMARK_TOKEN) return "postmark";
  if (p === "sendgrid" && process.env.SENDGRID_API_KEY) return "sendgrid";
  if (p === "mailgun" && process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) return "mailgun";
  // sensible fallbacks so a half-configured deployment still works
  if (process.env.SMTP_HOST) return "smtp";
  if (process.env.POSTMARK_TOKEN) return "postmark";
  if (process.env.SENDGRID_API_KEY) return "sendgrid";
  return "none";
}

export function emailFrom(): string {
  return process.env.EMAIL_FROM || `لیسنو <no-reply@liceno.ir>`;
}

async function sendViaSmtp(msg: { to: string; subject: string; html: string; text: string }) {
  const nodemailer = await import("nodemailer");
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  const info = await transport.sendMail({ from: emailFrom(), to: msg.to, subject: msg.subject, html: msg.html, text: msg.text });
  return { id: info.messageId as string };
}

async function sendViaPostmark(msg: { to: string; subject: string; html: string; text: string }) {
  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", "X-Postmark-Server-Token": process.env.POSTMARK_TOKEN! },
    body: JSON.stringify({ From: emailFrom(), To: msg.to, Subject: msg.subject, HtmlBody: msg.html, TextBody: msg.text, MessageStream: process.env.POSTMARK_STREAM || "outbound" }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`postmark ${res.status}: ${JSON.stringify(j).slice(0, 200)}`);
  return { id: String(j.MessageID || "") };
}

async function sendViaSendgrid(msg: { to: string; subject: string; html: string; text: string }) {
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.SENDGRID_API_KEY}` },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: msg.to }] }],
      from: { email: (emailFrom().match(/<([^>]+)>/)?.[1] || emailFrom()) },
      subject: msg.subject,
      content: [{ type: "text/html", value: msg.html }, { type: "text/plain", value: msg.text }],
    }),
  });
  if (!res.ok) throw new Error(`sendgrid ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return { id: res.headers.get("x-message-id") || "" };
}

async function sendViaMailgun(msg: { to: string; subject: string; html: string; text: string }) {
  const form = new URLSearchParams();
  form.set("from", emailFrom());
  form.set("to", msg.to);
  form.set("subject", msg.subject);
  form.set("html", msg.html);
  form.set("text", msg.text);
  const res = await fetch(`https://api.mailgun.net/v3/${process.env.MAILGUN_DOMAIN}/messages`, {
    method: "POST",
    headers: { Authorization: "Basic " + Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString("base64") },
    body: form,
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`mailgun ${res.status}: ${JSON.stringify(j).slice(0, 200)}`);
  return { id: String(j.id || "") };
}

// ---------------------------------------------------------------- templates

const shell = (title: string, body: string) => `<!DOCTYPE html>
<html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title></head>
<body style="margin:0;background:#f6f6f4;font-family:Tahoma,Arial,sans-serif;color:#16233a">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px">
    <div style="border-bottom:3px solid #17324d;padding-bottom:12px;margin-bottom:20px">
      <strong style="font-size:18px">لیسنو</strong>
      <span style="color:#6b7280;font-size:13px"> · ${SITE.url.replace(/^https?:\/\//, "")}</span>
    </div>
    <h1 style="font-size:20px;margin:0 0 14px">${title}</h1>
    ${body}
    <p style="margin-top:28px;color:#6b7280;font-size:12px;border-top:1px solid #e5e5e2;padding-top:12px">
      این ایمیل به‌صورت خودکار از طرف فروشگاه لیسنو ارسال شده است. در صورت نیاز به پشتیبانی از طریق پنل کاربری تیکت بزنید.
    </p>
  </div>
</body></html>`;

export type EmailVars = {
  orderCode: string;
  customerName?: string | null;
  orderUrl: string;
  total?: number | null;
  items?: string[] | null;
  trackingCode?: string | null;
  carrier?: string | null;
  stage?: string | null;
  note?: string | null;
};

export function renderTemplate(event: EmailEvent, v: EmailVars): { subject: string; html: string; text: string } {
  const hi = v.customerName ? `${v.customerName} عزیز،` : "کاربر گرامی،";
  const list = (v.items || []).map((i) => `<li>${i}</li>`).join("");
  const itemsBlock = list ? `<ul style="padding-inline-start:18px;color:#374151">${list}</ul>` : "";
  const orderLine = `<p style="font-size:14px;color:#374151">کد سفارش: <strong style="direction:ltr;display:inline-block">${v.orderCode}</strong></p>`;
  const btn = `<p style="margin:22px 0"><a href="${v.orderUrl}" style="background:#17324d;color:#fff;text-decoration:none;padding:10px 18px;border-radius:4px;font-size:14px">مشاهدهٔ سفارش</a></p>`;
  const plain = (t: string) => t.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  switch (event) {
    case "order_created": {
      const subject = `سفارش ${v.orderCode} ثبت شد`;
      const html = shell(subject, `<p>${hi}</p><p>سفارش شما ثبت شد و در انتظار پرداخت است.</p>${orderLine}${itemsBlock}${btn}`);
      return { subject, html, text: plain(html) };
    }
    case "payment_confirmed": {
      const subject = `پرداخت سفارش ${v.orderCode} تأیید شد`;
      const html = shell(subject, `<p>${hi}</p><p>پرداخت شما با موفقیت تأیید شد. سفارش برای آماده‌سازی به تیم ما ارسال شد.</p>${orderLine}${itemsBlock}${btn}`);
      return { subject, html, text: plain(html) };
    }
    case "supplier_purchased": {
      const subject = `سفارش ${v.orderCode} در حال آماده‌سازی است`;
      const html = shell(subject, `<p>${hi}</p><p>محصول سفارش شما تأمین شد و در حال آماده‌سازی برای تحویل است.</p>${orderLine}${btn}`);
      return { subject, html, text: plain(html) };
    }
    case "shipped": {
      const subject = `سفارش ${v.orderCode} ارسال شد`;
      const track = v.trackingCode
        ? `<p>کد رهگیری: <strong style="direction:ltr;display:inline-block">${v.trackingCode}</strong>${v.carrier ? ` (${v.carrier})` : ""}</p>`
        : "";
      const html = shell(subject, `<p>${hi}</p><p>سفارش شما ارسال شد.</p>${track}${orderLine}${btn}`);
      return { subject, html, text: plain(html) };
    }
    case "delivered": {
      const subject = `سفارش ${v.orderCode} تحویل شد`;
      const html = shell(subject, `<p>${hi}</p><p>سفارش شما تحویل داده شد. امیدواریم راضی باشید.</p>${orderLine}${btn}`);
      return { subject, html, text: plain(html) };
    }
    case "followup": {
      const subject = `پیگیری سفارش ${v.orderCode}`;
      const note = v.note ? `<p style="background:#f3f4f6;padding:10px 12px;border-radius:4px">${v.note}</p>` : "";
      const html = shell(subject, `<p>${hi}</p><p>در خصوص سفارش شما یک پیگیری داریم.</p>${note}${orderLine}${btn}`);
      return { subject, html, text: plain(html) };
    }
  }
}

// ---------------------------------------------------------------- queue

const BACKOFF_MINUTES = [1, 5, 15, 60, 360]; // 1m, 5m, 15m, 1h, 6h
export const MAX_EMAIL_ATTEMPTS = BACKOFF_MINUTES.length;

/** Push an event into the queue. Never throws — a failed enqueue must not break the order flow. */
export async function enqueueEmail(args: {
  orderId?: string | null;
  to: string;
  event: EmailEvent;
  vars: EmailVars;
}): Promise<{ ok: boolean; id?: string; message?: string }> {
  try {
    const tpl = renderTemplate(args.event, args.vars);
    const row = await db.emailLog.create({
      data: {
        orderId: args.orderId ?? null,
        to: args.to,
        template: args.event,
        event: args.event,
        status: "QUEUED",
        nextAttemptAt: new Date(),
        payload: JSON.stringify({ subject: tpl.subject, html: tpl.html, text: tpl.text, vars: args.vars }),
      },
    });
    return { ok: true, id: row.id };
  } catch (e: any) {
    console.error("[email] enqueue failed:", e?.message);
    return { ok: false, message: e?.message };
  }
}

/**
 * Drain due queue rows. Returns a small report so operators (and tests) can see
 * exactly what happened: sent / failed / still queued.
 */
export async function processEmailQueue(limit = 10): Promise<{ sent: number; failed: number; skipped: number }> {
  const now = new Date();
  const due = await db.emailLog.findMany({
    where: { status: "QUEUED", OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }] },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  const provider = activeProvider();
  let sent = 0, failed = 0, skipped = 0;

  for (const row of due) {
    let payload: any = {};
    try { payload = JSON.parse(row.payload || "{}"); } catch { /* keep empty */ }
    const msg = { to: row.to, subject: payload.subject || row.template, html: payload.html || "", text: payload.text || "" };

    if (provider === "none") {
      // Honest dry mode: the message is rendered and stored for inspection, but
      // we never mark it SENT because nothing was delivered.
      await db.emailLog.update({
        where: { id: row.id },
        data: { status: "SKIPPED", error: "no email provider configured (set EMAIL_PROVIDER + credentials)", attempts: row.attempts + 1, provider: "none" },
      });
      skipped++;
      continue;
    }

    try {
      const res =
        provider === "smtp" ? await sendViaSmtp(msg)
        : provider === "postmark" ? await sendViaPostmark(msg)
        : provider === "sendgrid" ? await sendViaSendgrid(msg)
        : await sendViaMailgun(msg);
      await db.emailLog.update({
        where: { id: row.id },
        data: { status: "SENT", attempts: row.attempts + 1, sentAt: new Date(), provider, providerId: res.id || null, error: null },
      });
      sent++;
    } catch (e: any) {
      const attempts = row.attempts + 1;
      const dead = attempts >= MAX_EMAIL_ATTEMPTS;
      await db.emailLog.update({
        where: { id: row.id },
        data: {
          status: dead ? "FAILED" : "QUEUED",
          attempts,
          provider,
          error: String(e?.message || e).slice(0, 500),
          nextAttemptAt: dead ? null : new Date(Date.now() + BACKOFF_MINUTES[attempts] * 60_000),
        },
      });
      failed++;
    }
  }
  return { sent, failed, skipped };
}

/** Convenience: enqueue every template for one order so the wiring is testable. */
export async function emailOrderEvent(orderId: string, event: EmailEvent, extra?: Partial<EmailVars>) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true, user: { select: { email: true, name: true, phone: true } }, shipment: true },
  });
  if (!order) return { ok: false, message: "order not found" };
  const to = order.user?.email || order.guestEmail;
  if (!to) return { ok: false, message: "no recipient on the order" };
  return enqueueEmail({
    orderId: order.id,
    to,
    event,
    vars: {
      orderCode: order.code,
      customerName: order.user?.name || order.guestName,
      orderUrl: `${SITE.url}/order/${order.code}`,
      total: order.total,
      items: order.items.map((i) => `${i.productTitle} × ${i.quantity}`),
      trackingCode: order.shipment?.trackingCode,
      carrier: order.shipment?.carrier,
      ...extra,
    },
  });
}
