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
    const license = await db.licenseKey.findUnique({ where: { id } });
    if (!license)
      return NextResponse.json({ ok: false, message: "یافت نشد" }, { status: 404 });

    if (license.status === "SOLD") {
      return NextResponse.json(
        { ok: false, message: "کلید فروخته شده قابل حذف نیست" },
        { status: 400 }
      );
    }

    await db.licenseKey.delete({ where: { id } });

    // Recount stock
    if (license.productId) {
      const availableCount = await db.licenseKey.count({
        where: { productId: license.productId, status: "AVAILABLE" },
      });
      await db.product.update({
        where: { id: license.productId },
        data: { stock: availableCount },
      });
    }

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
    if (typeof body.status === "string") data.status = body.status;
    if (typeof body.note === "string") data.note = body.note || null;
    if (typeof body.key === "string") data.key = body.key;

    const updated = await db.licenseKey.update({ where: { id }, data });
    return NextResponse.json({ ok: true, license: updated });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}
