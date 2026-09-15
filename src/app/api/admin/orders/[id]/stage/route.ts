import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-guard";
import { setFulfillmentStage, setPaymentStatus, FULFILLMENT_STAGES, PAYMENT_STATUSES } from "@/lib/order-lifecycle";

// POST /api/admin/orders/[id]/stage  { field: "fulfillmentStage" | "status", to, note }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminSession();
  if (denied) return NextResponse.json(denied.body, { status: denied.status });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const field = body.field === "status" ? "status" : "fulfillmentStage";
  const to = String(body.to || "");
  const note = body.note ? String(body.note) : undefined;
  const actor = "admin";

  if (field === "fulfillmentStage") {
    if (!(FULFILLMENT_STAGES as readonly string[]).includes(to)) {
      return NextResponse.json({ ok: false, message: "وضعیت مقدار معتبر نیست" }, { status: 400 });
    }
    const r = await setFulfillmentStage(id, to as any, { actor, note });
    return NextResponse.json(r, { status: r.ok ? 200 : 409 });
  }

  if (!(PAYMENT_STATUSES as readonly string[]).includes(to)) {
    return NextResponse.json({ ok: false, message: "وضعیت پرداخت معتبر نیست" }, { status: 400 });
  }
  const r = await setPaymentStatus(id, to as any, { actor, note });
  return NextResponse.json(r, { status: r.ok ? 200 : 409 });
}
