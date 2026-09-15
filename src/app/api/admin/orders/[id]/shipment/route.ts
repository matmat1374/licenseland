import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-guard";
import { recordShipment } from "@/lib/order-lifecycle";

// POST /api/admin/orders/[id]/shipment  { carrier?, trackingCode?, note?, status? }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminSession();
  if (denied) return NextResponse.json(denied.body, { status: denied.status });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const r = await recordShipment(id, {
    carrier: body.carrier ? String(body.carrier) : undefined,
    trackingCode: body.trackingCode ? String(body.trackingCode) : undefined,
    note: body.note ? String(body.note) : undefined,
    actor: "admin",
    status: body.status === "READY_TO_SHIP" ? "READY_TO_SHIP" : "SHIPPED",
  });
  return NextResponse.json(r, { status: r.ok ? 200 : 409 });
}
