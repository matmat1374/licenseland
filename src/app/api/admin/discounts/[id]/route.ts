import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });

  const { id } = await params;
  try {
    await db.discountCode.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });

  const { id } = await params;
  try {
    const body = await req.json();
    const data: Record<string, any> = {};
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;
    if (typeof body.value === "number") data.value = body.value;
    if (typeof body.maxUses === "number") data.maxUses = body.maxUses;
    if (body.expiresAt !== undefined) {
      data.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    }

    const updated = await db.discountCode.update({ where: { id }, data });
    return NextResponse.json({ ok: true, discount: updated });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}
