import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/crypto";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ ok: false, message: "ابتدا وارد شوید" }, { status: 401 });

  try {
    const body = await req.json();
    const current = body.currentPassword || "";
    const next = body.newPassword || "";

    if (!current || !next)
      return NextResponse.json({ ok: false, message: "رمز فعلی و رمز جدید را وارد کنید" }, { status: 400 });
    if (next.length < 6)
      return NextResponse.json({ ok: false, message: "رمز جدید حداقل ۶ کاراکتر" }, { status: 400 });
    if (current === next)
      return NextResponse.json({ ok: false, message: "رمز جدید باید با رمز فعلی متفاوت باشد" }, { status: 400 });

    const user = await db.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ ok: false, message: "کاربر یافت نشد" }, { status: 404 });

    if (!verifyPassword(current, user.password))
      return NextResponse.json({ ok: false, message: "رمز عبور فعلی اشتباه است" }, { status: 400 });

    await db.user.update({
      where: { id: session.user.id },
      data: { password: await hashPassword(next) },
    });

    return NextResponse.json({ ok: true, message: "رمز عبور تغییر کرد" });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: "خطای سرور" }, { status: 500 });
  }
}
