import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions, normalizePhone, isPhone } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ ok: false, message: "ابتدا وارد شوید" }, { status: 401 });
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, phone: true, avatar: true, nationalId: true, role: true, createdAt: true },
  });
  if (!user) return NextResponse.json({ ok: false, message: "کاربر یافت نشد" }, { status: 404 });
  return NextResponse.json({ ok: true, user });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ ok: false, message: "ابتدا وارد شوید" }, { status: 401 });

  try {
    const body = await req.json();
    const name = (body.name || "").trim();
    const email = (body.email || "").toLowerCase().trim();
    const phoneRaw = (body.phone || "").trim();
    const nationalId = (body.nationalId || "").trim() || null;

    if (!name) return NextResponse.json({ ok: false, message: "نام را وارد کنید" }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json({ ok: false, message: "ایمیل معتبر نیست" }, { status: 400 });
    if (!isPhone(phoneRaw))
      return NextResponse.json({ ok: false, message: "شماره موبایل معتبر نیست" }, { status: 400 });
    if (nationalId && !/^\d{10}$/.test(nationalId))
      return NextResponse.json({ ok: false, message: "کد ملی باید ۱۰ رقم باشد" }, { status: 400 });

    const phone = normalizePhone(phoneRaw);

    // uniqueness checks (excluding self)
    const [byEmail, byPhone] = await Promise.all([
      db.user.findFirst({ where: { email, NOT: { id: session.user.id } } }),
      db.user.findFirst({ where: { phone, NOT: { id: session.user.id } } }),
    ]);
    if (byEmail) return NextResponse.json({ ok: false, message: "این ایمیل متعلق به حساب دیگری است" }, { status: 400 });
    if (byPhone) return NextResponse.json({ ok: false, message: "این موبایل متعلق به حساب دیگری است" }, { status: 400 });

    await db.user.update({
      where: { id: session.user.id },
      data: { name, email, phone, nationalId },
    });

    return NextResponse.json({ ok: true, message: "پروفایل به‌روزرسانی شد" });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: "خطای سرور" }, { status: 500 });
  }
}
