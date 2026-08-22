import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { applyDiscount } from "@/lib/format";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")?.trim();
  const total = Number(searchParams.get("total")) || 0;

  if (!code) return NextResponse.json({ ok: false, message: "کد را وارد کنید" });

  const rec = await db.discountCode.findUnique({ where: { code } });
  if (!rec || !rec.isActive) return NextResponse.json({ ok: false, message: "کد نامعتبر است" });
  if (rec.expiresAt && rec.expiresAt < new Date())
    return NextResponse.json({ ok: false, message: "کد منقضی شده است" });
  if (rec.maxUses > 0 && rec.usedCount >= rec.maxUses)
    return NextResponse.json({ ok: false, message: "سقف استفاده تکمیل شده" });

  const { discount } = applyDiscount(total, { type: rec.type as any, value: rec.value });
  return NextResponse.json({ ok: true, discount, type: rec.type, value: rec.value });
}
