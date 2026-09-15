import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/queries";
import { verifyOrderAccessToken } from "@/lib/order-access";
import { STAGE_FA, STATUS_FA } from "@/lib/order-lifecycle";

// GET /api/order/[id]/status?token=...   (owner session | admin | signed token)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || undefined;

  const user = await getCurrentUser();
  const order = await db.order.findFirst({
    where: { OR: [{ id }, { code: id }] },
    include: { shipment: true, statusEvents: { orderBy: { createdAt: "desc" }, take: 20 } },
  });
  if (!order) return NextResponse.json({ ok: false, message: "not found" }, { status: 404 });

  const isOwner = !!user && order.userId === user.id;
  const isAdmin = (user as any)?.role === "ADMIN";
  if (!isOwner && !isAdmin && !verifyOrderAccessToken(order.id, token)) {
    return NextResponse.json({ ok: false, message: "forbidden" }, { status: 403 });
  }

  const emails = await db.emailLog.findMany({ where: { orderId: order.id }, orderBy: { createdAt: "desc" }, take: 20, select: { event: true, status: true, sentAt: true, createdAt: true } });

  return NextResponse.json({
    ok: true,
    order: {
      code: order.code,
      status: order.status,
      statusFa: STATUS_FA[order.status] || order.status,
      fulfillmentStage: order.fulfillmentStage,
      stageFa: STAGE_FA[order.fulfillmentStage] || order.fulfillmentStage,
      paidAt: order.paidAt,
      shipment: order.shipment ? { carrier: order.shipment.carrier, trackingCode: order.shipment.trackingCode, status: order.shipment.status, shippedAt: order.shipment.shippedAt, deliveredAt: order.shipment.deliveredAt } : null,
      timeline: order.statusEvents.map((e) => ({ field: e.field, from: e.fromValue, to: e.toValue, actor: e.actor, note: e.note, at: e.createdAt })),
    },
    emails,
  });
}
