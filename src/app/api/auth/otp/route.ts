import { NextRequest, NextResponse } from "next/server";

// Inline normalizePhone to avoid importing auth.ts (which pulls in all of NextAuth)
function normalizePhone(input: string): string {
  let p = input.replace(/[\s\-()]/g, "");
  if (p.startsWith("+98")) p = "0" + p.slice(3);
  else if (p.startsWith("0098")) p = "0" + p.slice(4);
  else if (p.startsWith("98") && p.length === 12) p = "0" + p.slice(2);
  return p;
}

// Inline hashPassword to avoid importing crypto.ts (which uses node:crypto)
import { randomBytes, pbkdf2Sync } from "crypto";
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

// Lazy-load Prisma only when needed (already loaded by other routes)
async function getDb() {
  const { db } = await import("@/lib/db");
  return db;
}

const TEST_OTP = "123456";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phoneRaw = (body.phone || "").trim();
    const otp = (body.otp || "").trim();

    if (!phoneRaw || !otp)
      return NextResponse.json({ ok: false, message: "شماره و کد را وارد کنید" }, { status: 400 });
    if (!/^09\d{9}$/.test(phoneRaw.replace(/\s/g, "")))
      return NextResponse.json({ ok: false, message: "شماره موبایل نامعتبر" }, { status: 400 });
    if (otp !== TEST_OTP)
      return NextResponse.json({ ok: false, message: "کد اشتباه است (کد تستی: ۱۲۳۴۵۶)" }, { status: 400 });

    const phone = normalizePhone(phoneRaw);
    const db = await getDb();

    // Find or create user
    let user = await db.user.findUnique({ where: { phone } });
    if (!user) {
      user = await db.user.create({
        data: {
          name: `کاربر ${phone.slice(-4)}`,
          email: `${phone}@licenseland.ir`,
          phone,
          password: hashPassword(TEST_OTP),
          role: "USER",
        },
      });
    } else {
      // Update password to TEST_OTP for OTP login
      await db.user.update({
        where: { id: user.id },
        data: { password: hashPassword(TEST_OTP) },
      });
    }

    return NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
    });
  } catch (e: any) {
    console.error("OTP error:", e);
    return NextResponse.json({ ok: false, message: "خطای سرور" }, { status: 500 });
  }
}
