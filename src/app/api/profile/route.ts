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
    const name = (body.name || "").trim() || null;
    let email = (body.email || "").toLowerCase().trim();
    const phoneRaw = (body.phone || "").trim();
    const nationalId = (body.nationalId || "").trim() || null;

    if (phoneRaw && !isPhone(phoneRaw))
      return NextResponse.json({ ok: false, message: "شماره موبایل معتبر نیست" }, { status: 400 });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json({ ok: false, message: "ایمیل معتبر نیست" }, { status: 400 });
    if (nationalId && !/^\d{10}$/.test(nationalId))
      return NextResponse.json({ ok: false, message: "کد ملی باید ۱۰ رقم باشد" }, { status: 400 });

    const currentUser = await db.user.findUnique({ where: { id: session.user.id } });
    if (!currentUser) return NextResponse.json({ ok: false, message: "کاربر یافت نشد" }, { status: 404 });

    const phone = phoneRaw ? normalizePhone(phoneRaw) : currentUser.phone;

    // Prisma User.email is String @unique (non-nullable). If user doesn't specify email, keep or set placeholder.
    if (!email) {
      email = currentUser.email?.endsWith("@liceno.ir")
        ? currentUser.email
        : `${phone || currentUser.phone || session.user.id}@liceno.ir`;
    }

    // uniqueness checks (excluding self)
    const [byEmail, byPhone] = await Promise.all([
      email && !email.endsWith("@liceno.ir")
        ? db.user.findFirst({ where: { email, NOT: { id: session.user.id } } })
        : null,
      phone
        ? db.user.findFirst({ where: { phone, NOT: { id: session.user.id } } })
        : null,
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
