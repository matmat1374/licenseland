import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { category, isActive } = body;

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { ok: false, message: "وضعیت (isActive) نامعتبر است" },
        { status: 400 }
      );
    }

    const whereClause = category ? { category } : {};

    await db.product.updateMany({
      where: whereClause,
      data: { isActive },
    });

    return NextResponse.json({ ok: true, message: "با موفقیت انجام شد" });
  } catch (error: any) {
    console.error("Bulk toggle error:", error);
    return NextResponse.json(
      { ok: false, message: error?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}
