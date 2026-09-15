import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-guard";
import { markDelivered } from "@/lib/order-lifecycle";

// POST /api/admin/orders/[id]/deliver  { note? }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminSession();
  if (denied) return NextResponse.json(denied.body, { status: denied.status });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const r = await markDelivered(id, { actor: "admin", note: body.note ? String(body.note) : undefined });
  return NextResponse.json(r, { status: r.ok ? 200 : 409 });
}
