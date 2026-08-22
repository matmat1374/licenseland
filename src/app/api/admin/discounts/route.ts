import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

// GET — list all discount codes
export async function GET() {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });

  const codes = await db.discountCode.findMany({
    orderBy: { createdAt: "desc" },
  });

  const list = codes.map((c) => ({
    id: c.id,
    code: c.code,
    type: c.type,
    value: c.value,
    maxUses: c.maxUses,
    usedCount: c.usedCount,
    expiresAt: c.expiresAt?.toISOString() || null,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
  }));

  return NextResponse.json({ ok: true, discounts: list });
}

// POST — create discount code
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });

  try {
    const body = await req.json();
    const { code, type, value, maxUses, expiresAt, isActive } = body || {};

    if (!code || !type || value == null) {
      return NextResponse.json(
        { ok: false, message: "کد، نوع و مقدار الزامی است" },
        { status: 400 }
      );
    }

    if (!["PERCENT", "FIXED"].includes(type)) {
      return NextResponse.json(
        { ok: false, message: "نوع کد نامعتبر است" },
        { status: 400 }
      );
    }

    const finalCode = String(code).trim().toUpperCase();
    const exists = await db.discountCode.findUnique({ where: { code: finalCode } });
    if (exists) {
      return NextResponse.json(
        { ok: false, message: "این کد قبلاً ثبت شده" },
        { status: 400 }
      );
    }

    const created = await db.discountCode.create({
      data: {
        code: finalCode,
        type,
        value: Number(value),
        maxUses: Number(maxUses) || 0,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: isActive !== false,
      },
    });

    return NextResponse.json({ ok: true, discount: created });
  } catch (e: any) {
    console.error("admin discounts POST error:", e);
    return NextResponse.json(
      { ok: false, message: e?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}
