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

// ---------------------------------------------------------------------------
// C2 fix: the fixed test OTP was an authentication bypass — anyone could log
// in as ANY user (including the admin phone). Now:
//   - dev keeps the 123456 test code for local iteration
//   - production requires explicit ALLOW_TEST_OTP=true (owner opt-in for a
//     staging server), otherwise phone login is disabled
//   - brute-force rate limit per phone AND per IP, in both environments
// ---------------------------------------------------------------------------
const TEST_OTP = "123456";
const isTestOtpAllowed =
  process.env.NODE_ENV !== "production" || process.env.ALLOW_TEST_OTP === "true";

const PHONE_WINDOW_MS = 10 * 60 * 1000;
const PHONE_MAX_ATTEMPTS = 5;
const IP_WINDOW_MS = 10 * 60 * 1000;
const IP_MAX_ATTEMPTS = 15;

type Bucket = { count: number; resetAt: number };
const phoneBuckets = new Map<string, Bucket>();
const ipBuckets = new Map<string, Bucket>();

function rateLimit(map: Map<string, Bucket>, key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const b = map.get(key);
  if (!b || b.resetAt < now) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    // opportunistic cleanup
    if (map.size > 5000) for (const [k, v] of map) if (v.resetAt < now) map.delete(k);
    return true;
  }
  if (b.count >= max) return false;
  b.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";

    if (!rateLimit(ipBuckets, ip, IP_MAX_ATTEMPTS, IP_WINDOW_MS)) {
      return NextResponse.json({ ok: false, message: "تلاش‌های زیاد — بعداً دوباره امتحان کنید" }, { status: 429 });
    }

    if (!isTestOtpAllowed) {
      return NextResponse.json(
        { ok: false, message: "ورود با کد یکبار مصرف فعلاً فعال نیست" },
        { status: 503 }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, message: "درخواست نامعتبر" }, { status: 400 });
    }
    const phoneRaw = (body.phone || "").trim();
    const otp = (body.otp || "").trim();

    if (!phoneRaw || !otp)
      return NextResponse.json({ ok: false, message: "شماره و کد را وارد کنید" }, { status: 400 });
    if (!/^09\d{9}$/.test(phoneRaw.replace(/\s/g, "")))
      return NextResponse.json({ ok: false, message: "شماره موبایل نامعتبر" }, { status: 400 });

    if (!rateLimit(phoneBuckets, phoneRaw, PHONE_MAX_ATTEMPTS, PHONE_WINDOW_MS)) {
      return NextResponse.json({ ok: false, message: "تلاش‌های زیاد برای این شماره — ۱۰ دقیقه صبر کنید" }, { status: 429 });
    }

    // generic error — never reveal the test code
    if (otp !== TEST_OTP)
      return NextResponse.json({ ok: false, message: "کد وارد شده صحیح نیست" }, { status: 400 });

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
