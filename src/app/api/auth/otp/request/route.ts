import { NextRequest, NextResponse } from "next/server";
import { normalizePersianDigits } from "@/lib/format";
import { OTP_CACHE } from "@/lib/otp-cache";

// Simple rate limiter per IP/Phone for requests
const rateLimit = new Map<string, number>();

export async function POST(req: NextRequest) {
  try {
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
    const now = Date.now();
    
    // IP Rate limit (1 request per minute)
    if (rateLimit.has(ip) && now - rateLimit.get(ip)! < 60000) {
      return NextResponse.json({ ok: false, message: "لطفاً ۱ دقیقه صبر کنید" }, { status: 429 });
    }
    
    const body = await req.json().catch(() => ({}));
    const phoneRaw = normalizePersianDigits((body.phone || "").trim());
    
    if (!phoneRaw || !/^09\d{9}$/.test(phoneRaw.replace(/\s/g, ""))) {
      return NextResponse.json({ ok: false, message: "شماره موبایل نامعتبر است" }, { status: 400 });
    }
    
    // Phone Rate limit
    if (rateLimit.has(phoneRaw) && now - rateLimit.get(phoneRaw)! < 60000) {
      return NextResponse.json({ ok: false, message: "لطفاً ۱ دقیقه صبر کنید" }, { status: 429 });
    }
    
    rateLimit.set(ip, now);
    rateLimit.set(phoneRaw, now);
    
    // Generate 6 digit random OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store in cache for 3 minutes
    OTP_CACHE.set(phoneRaw, { code: otp, expires: now + 3 * 60 * 1000 });
    
    const { sendOtpSms } = await import("@/lib/sms");
    const smsSent = await sendOtpSms(phoneRaw, otp);
    
    // Log prominently in the console (server-side only — the OTP must NEVER
    // be returned in the HTTP response: anyone could then log in as ANY phone
    // number, including the admin account) (review C1 fix)
    console.log("\n========================================");
    console.log(`📱 SMS TO ${phoneRaw} (delivered: ${smsSent}):`);
    console.log(`کد تایید شما: ${otp}`);
    console.log("========================================\n");
    
    // UX honesty fix: if the SMS gateway did not accept the message, the user
    // must NOT be told a code was sent — they would wait forever for an SMS
    // that never arrives and conclude the site is broken.
    if (!smsSent) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          {
            ok: false,
            message:
              "ارسال پیامک موقتاً ممکن نشد. لطفاً چند لحظه دیگر تلاش کنید یا از پشتیبانی تلگرام کمک بگیرید.",
          },
          { status: 503 }
        );
      }
      // Dev fallback: no SMS gateway configured locally — the code is in the
      // server console, so keep the flow usable for development.
      return NextResponse.json({
        ok: true,
        message: "حالت توسعه: درگاه پیامک تنظیم نشده — کد در کنسول سرور نمایش داده شده است",
      });
    }
    
    return NextResponse.json({ 
      ok: true, 
      message: `کد تایید ارسال شد`
    });
  } catch (e) {
    console.error("Error generating OTP:", e);
    return NextResponse.json({ ok: false, message: "خطای سرور در ارسال کد" }, { status: 500 });
  }
}
