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
    
    // In production with an SMS provider, you would do:
    // await sendSms(phoneRaw, `کد ورود شما: ${otp}`);
    
    // For now, log it prominently in the console
    console.log("\n========================================");
    console.log(`📱 SMS TO ${phoneRaw}:`);
    console.log(`کد تایید شما: ${otp}`);
    console.log("========================================\n");
    
    // TEMPORARY: Return OTP in message until SMS gateway is connected
    return NextResponse.json({ 
      ok: true, 
      message: `کد تایید: ${otp}`,
      otp: otp 
    });
  } catch (e) {
    console.error("Error generating OTP:", e);
    return NextResponse.json({ ok: false, message: "خطای سرور در ارسال کد" }, { status: 500 });
  }
}
