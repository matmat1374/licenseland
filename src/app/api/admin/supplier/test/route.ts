import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupplierApiKey, getUsdToTomanRate } from "@/lib/supplier";

export const dynamic = "force-dynamic";

const IRMARKET_BASE_URL =
  process.env.SUPPLIER_API_URL?.replace(/\/api\/buyer\/.*$/, "") ||
  process.env.IRMARKET_BASE_URL ||
  "https://api.irmarket.store";

async function performHealthCheck() {
  const key = await getSupplierApiKey();
  if (!key) {
    return {
      ok: false,
      authenticated: false,
      message: "کلید API تأمین‌کننده (irMarket) در تنظیمات یا متغیرهای محیطی یافت نشد.",
    };
  }

  const startTime = Date.now();
  let pingMs = 0;

  try {
    const res = await fetch(`${IRMARKET_BASE_URL}/api/buyer/me`, {
      headers: { "X-API-Key": key },
      cache: "no-store",
    });
    pingMs = Date.now() - startTime;

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      return {
        ok: false,
        pingMs,
        authenticated: false,
        statusCode: res.status,
        message: data.detail || data.message || `خطای احراز هویت تأمین‌کننده (کد ${res.status})`,
      };
    }

    const usdRate = await getUsdToTomanRate();
    const balanceUsd = Number(data.balance_usd) || 0;
    const isLowBalance = balanceUsd < 50;

    return {
      ok: true,
      pingMs,
      authenticated: true,
      keyName: data.name || "کلید فعال",
      discountPercent: Number(data.discount_percent) || 0,
      balanceUsd,
      isLowBalance,
      webhookUrl: data.webhook_url || "",
      usdRate,
      equivalentToman: Math.round(balanceUsd * usdRate),
      message: isLowBalance
        ? `اتصال برقرار است، اما موجودی حساب کمتر از ۵۰ دلار است ($${balanceUsd.toFixed(2)})`
        : "اتصال به API تأمین‌کننده کاملاً سالم و فعال است.",
    };
  } catch (error: any) {
    pingMs = Date.now() - startTime;
    return {
      ok: false,
      pingMs,
      authenticated: false,
      error: error?.message,
      message: `خطا در برقراری ارتباط با سرور تأمین‌کننده: ${error?.message || "پاسخی دریافت نشد"}`,
    };
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const result = await performHealthCheck();
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const result = await performHealthCheck();
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
