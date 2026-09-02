import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUsdToTomanRate, fetchLiveUsdtRate } from "@/lib/supplier";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });
  }

  // 1. Fetch live rates from all 4 exchanges
  const exchangePromises = [
    {
      name: "والکس (Wallex)",
      url: "https://api.wallex.ir/v1/markets",
      parse: (d: any) => Math.round(Number(d?.result?.symbols?.USDTTMN?.stats?.lastPrice)),
    },
    {
      name: "رمزینکس (Ramzinex)",
      url: "https://publicapi.ramzinex.com/exchange/api/v1.0/exchange/pairs/11",
      parse: (d: any) => Math.round(Number(d?.data?.sell || d?.data?.last_price) / 10),
    },
    {
      name: "بیت‌پین (Bitpin)",
      url: "https://api.bitpin.ir/v1/mkt/markets/",
      parse: (d: any) => {
        const list = Array.isArray(d?.results) ? d.results : (Array.isArray(d) ? d : []);
        const m = list.find((x: any) => x.code === "USDT_IRT" || x.code === "USDT_TMN");
        if (!m) return null;
        return Math.round(Number(m.price) / (m.code === "USDT_IRT" ? 10 : 1));
      },
    },
    {
      name: "نوبیتکس (Nobitex)",
      url: "https://api.nobitex.ir/v2/orderbook/USDTIRT",
      parse: (d: any) => Math.round(Number(d?.lastTradePrice) / 10),
    },
  ].map(async (ex) => {
    const start = Date.now();
    try {
      const res = await fetch(ex.url, {
        headers: { "User-Agent": "Mozilla/5.0 Liceno/1.0" },
        signal: AbortSignal.timeout(4000),
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const rate = ex.parse(data);
      const ping = Date.now() - start;
      if (rate && rate > 50000 && rate < 1000000) {
        return { name: ex.name, rate, status: "ONLINE" as const, ping, error: null };
      }
      throw new Error("داده نامعتبر");
    } catch (e: any) {
      return { name: ex.name, rate: null, status: "OFFLINE" as const, ping: Date.now() - start, error: e?.message || "خطا" };
    }
  });

  const [exchanges, modeSetting, manualSetting, autoSetting, totalCount, torobCount] = await Promise.all([
    Promise.all(exchangePromises),
    db.setting.findUnique({ where: { key: "usd_rate_mode" } }).catch(() => null),
    db.setting.findUnique({ where: { key: "usd_to_toman_rate" } }).catch(() => null),
    db.setting.findUnique({ where: { key: "usd_to_toman_rate_auto" } }).catch(() => null),
    db.product.count({ where: { isActive: true } }),
    db.product.count({ where: { isActive: true, specifications: { contains: "torob_url" } } }),
  ]);

  const activeRate = await getUsdToTomanRate();
  const mode = modeSetting?.value || "auto";

  return NextResponse.json({
    ok: true,
    activeRate,
    mode,
    manualRate: Number(manualSetting?.value) || 205000,
    autoRate: Number(autoSetting?.value) || activeRate,
    exchanges,
    stats: {
      totalProducts: totalCount,
      torobConnectedProducts: torobCount,
    },
    timestamp: new Date().toISOString(),
  });
}
