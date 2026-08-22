import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/crypto";
import { normalizePhone, isPhone } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = (body.name || "").trim();
    const email = (body.email || "").toLowerCase().trim();
    const phoneRaw = (body.phone || "").trim();
    const password = body.password || "";

    if (!name || !email || !phoneRaw || !password)
      return NextResponse.json({ ok: false, message: "تمام فیلدها را تکمیل کنید" }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json({ ok: false, message: "ایمیل معتبر نیست" }, { status: 400 });
    if (!isPhone(phoneRaw))
      return NextResponse.json({ ok: false, message: "شماره موبایل معتبر نیست (مثال: 09123456789)" }, { status: 400 });
    if (password.length < 6)
      return NextResponse.json({ ok: false, message: "رمز عبور حداقل ۶ کاراکتر" }, { status: 400 });

    const phone = normalizePhone(phoneRaw);

    // check email OR phone uniqueness
    const [byEmail, byPhone] = await Promise.all([
      db.user.findUnique({ where: { email } }).catch(() => null),
      db.user.findUnique({ where: { phone } }).catch(() => null),
    ]);
    if (byEmail)
      return NextResponse.json({ ok: false, message: "این ایمیل قبلاً ثبت شده است" }, { status: 400 });
    if (byPhone)
      return NextResponse.json({ ok: false, message: "این شماره موبایل قبلاً ثبت شده است" }, { status: 400 });

    await db.user.create({
      data: {
        name,
        email,
        phone,
        password: await hashPassword(password),
        role: "USER",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: "خطای سرور" }, { status: 500 });
  }
}
