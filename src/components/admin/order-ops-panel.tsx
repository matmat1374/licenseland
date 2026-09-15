"use client";

import { useState } from "react";

/**
 * The single place an operator needs: buy the customer's order from the supplier,
 * record the shipment, mark it delivered. Every action writes an audit event and
 * queues the matching customer email.
 */
export function OrderOpsPanel({ orderId, stage }: { orderId: string; stage: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string>("");
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");

  async function call(key: string, url: string, body?: Record<string, unknown>) {
    setBusy(key); setMsg("");
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) });
      const j = await res.json().catch(() => ({}));
      setMsg((j.ok ? "✅ " : "⚠️ ") + (j.message || JSON.stringify(j)));
      if (j.ok) setTimeout(() => window.location.reload(), 1200);
    } catch (e) {
      setMsg("⚠️ " + ((e as Error)?.message || "خطا در ارتباط"));
    } finally {
      setBusy(null);
    }
  }

  const btn = "rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 disabled:opacity-50";

  return (
    <section dir="rtl" className="mt-6 rounded border-2 border-zinc-300 bg-zinc-50 p-5 text-[15px] leading-7">
      <h2 className="mb-1 text-lg font-bold text-zinc-900">عملیات ادمین</h2>
      <p className="mb-4 text-[13px] text-zinc-500">مرحلهٔ فعلی: <strong>{stage}</strong></p>

      <div className="flex flex-wrap gap-2">
        <button className={btn} disabled={!!busy} onClick={() => call("purchase", `/api/admin/orders/${orderId}/purchase`)}>
          {busy === "purchase" ? "در حال خرید…" : "۱. خرید از تأمین‌کننده"}
        </button>
        <button className={btn} disabled={!!busy} onClick={() => call("ready", `/api/admin/orders/${orderId}/stage`, { field: "fulfillmentStage", to: "READY_TO_DELIVER" })}>
          آماده تحویل
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-2">
        <label className="text-[13px] text-zinc-600">
          روش تحویل
          <input className="mt-1 block w-40 rounded border border-zinc-300 px-2 py-1.5 text-sm" value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="خودکار یا دستی" />
        </label>
        <label className="text-[13px] text-zinc-600">
          مرجع/لایسنس
          <input className="mt-1 block w-48 rounded border border-zinc-300 px-2 py-1.5 text-sm" style={{ direction: "ltr" }} value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="TRK-123456" />
        </label>
        <button className={btn} disabled={!!busy} onClick={() => call("ship", `/api/admin/orders/${orderId}/shipment`, { carrier, trackingCode: tracking })}>
          {busy === "ship" ? "در حال ثبت…" : "۲. تحویل به مشتری"}
        </button>
        <button className={btn} disabled={!!busy} onClick={() => call("deliver", `/api/admin/orders/${orderId}/deliver`)}>
          {busy === "deliver" ? "…" : "تحویل خودکار"}
        </button>
      </div>

      {msg && <p className="mt-4 rounded bg-white p-3 text-[13px] text-zinc-700">{msg}</p>}
    </section>
  );
}
