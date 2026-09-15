import { STAGE_FA, STATUS_FA } from "@/lib/order-lifecycle";

type Ev = { field: string; fromValue: string | null; toValue: string; actor: string; note: string | null; createdAt: Date };

/**
 * Read-only status view for the customer: where the order is, and the full
 * history of what happened. Plain, undecorated, fast (Information Architects).
 */
export function OrderTimeline({
  code,
  status,
  stage,
  shipment,
  events,
}: {
  code: string;
  status: string;
  stage: string;
  shipment?: { carrier: string | null; trackingCode: string | null; status: string; shippedAt: Date | null; deliveredAt: Date | null } | null;
  events: Ev[];
}) {
  const label = (e: Ev) =>
    e.field === "status" ? STATUS_FA[e.toValue] || e.toValue
    : e.field === "shipment" ? `ارسال: ${STAGE_FA[e.toValue] || e.toValue}`
    : STAGE_FA[e.toValue] || e.toValue;

  return (
    <section dir="rtl" className="mt-6 rounded border border-zinc-200 bg-white p-5 text-[15px] leading-7">
      <h2 className="mb-3 text-lg font-bold text-zinc-900">وضعیت سفارش</h2>

      <dl className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
        <div className="flex justify-between border-b border-zinc-100 py-1">
          <dt className="text-zinc-500">کد سفارش</dt>
          <dd className="font-medium" style={{ direction: "ltr" }}>{code}</dd>
        </div>
        <div className="flex justify-between border-b border-zinc-100 py-1">
          <dt className="text-zinc-500">وضعیت پرداخت</dt>
          <dd className="font-medium">{STATUS_FA[status] || status}</dd>
        </div>
        <div className="flex justify-between border-b border-zinc-100 py-1">
          <dt className="text-zinc-500">مرحلهٔ تحویل</dt>
          <dd className="font-medium">{STAGE_FA[stage] || stage}</dd>
        </div>
        <div className="flex justify-between border-b border-zinc-100 py-1">
          <dt className="text-zinc-500">کد رهگیری</dt>
          <dd className="font-medium" style={{ direction: "ltr" }}>
            {shipment?.trackingCode ? `${shipment.trackingCode}${shipment.carrier ? ` (${shipment.carrier})` : ""}` : "—"}
          </dd>
        </div>
      </dl>

      {events.length > 0 && (
        <>
          <h3 className="mt-6 mb-2 text-base font-bold text-zinc-900">تاریخچه</h3>
          <ol className="border-s-2 border-zinc-200 ps-4">
            {events.map((e, i) => (
              <li key={i} className="mb-3">
                <div className="font-medium text-zinc-800">{label(e)}</div>
                <div className="text-[13px] text-zinc-500">
                  {new Date(e.createdAt).toLocaleString("fa-IR")}
                  {e.note ? ` — ${e.note}` : ""}
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
