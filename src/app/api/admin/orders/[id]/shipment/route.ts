import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-guard";
import { recordDelivery } from "@/lib/order-lifecycle";

// POST /api/admin/orders/[id]/shipment  { method: "AUTO"|"MANUAL", reference?, note? }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminSession();
  if (denied) return NextResponse.json(denied.body, { status: denied.status });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const r = await recordDelivery(id, {
    method: body.method === "MANUAL" ? "MANUAL" : "AUTO",
    reference: body.reference ? String(body.reference) : undefined,
    note: body.note ? String(body.note) : undefined,
    actor: "admin",
  });
  return NextResponse.json(r, { status: r.ok ? 200 : 409 });
}
