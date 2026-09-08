import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fulfillAndDeliverOrder } from "@/lib/order-fulfillment";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const { id } = await params;
  const result = await fulfillAndDeliverOrder(id);

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
