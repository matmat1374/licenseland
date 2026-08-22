import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupplierBalance, getSupplierMe, getUsdToTomanRate } from "@/lib/supplier";

// GET /api/supplier/status
// Admin-only — returns combined info: balance, key name, discount_percent, webhook_url, usd_rate
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN")
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });

  const [me, balance, usdRate] = await Promise.all([
    getSupplierMe(),
    getSupplierBalance(),
    getUsdToTomanRate(),
  ]);

  // If /me failed but balance succeeded (or vice-versa) — still return what we have
  return NextResponse.json({
    ok: me.ok || balance.ok,
    connected: me.ok,
    key: me.key,
    name: me.name,
    discount_percent: me.discount_percent,
    webhook_url: me.webhook_url,
    balance_usd: balance.ok ? balance.balance_usd : me.balance_usd,
    usd_rate: usdRate,
    message: !me.ok && !balance.ok ? (me.message || balance.message || "اتصال برقرار نشد") : undefined,
  });
}
