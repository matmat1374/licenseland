const fs = require('fs');
let c = fs.readFileSync('src/lib/supplier.ts', 'utf8');

const liveRateCode = `
// Fetch real-time USDT to Toman rate from Iranian crypto exchanges
export async function fetchLiveUsdtRate(): Promise<number | null> {
  const sources = [
    {
      name: "Wallex",
      url: "https://api.wallex.ir/v1/markets",
      parse: (d: any) => {
        const p = Number(d?.result?.symbols?.USDTTMN?.stats?.lastPrice);
        return p > 10000 ? Math.round(p) : null;
      },
    },
    {
      name: "Ramzinex",
      url: "https://publicapi.ramzinex.com/exchange/api/v1.0/exchange/pairs/11",
      parse: (d: any) => {
        const p = Number(d?.data?.sell || d?.data?.last_price) / 10;
        return p > 10000 ? Math.round(p) : null;
      },
    },
    {
      name: "Bitpin",
      url: "https://api.bitpin.ir/v1/mkt/markets/",
      parse: (d: any) => {
        const list = Array.isArray(d?.results) ? d.results : (Array.isArray(d) ? d : []);
        const m = list.find((x: any) => x.code === "USDT_IRT" || x.code === "USDT_TMN");
        if (!m) return null;
        const p = Number(m.price) / (m.code === "USDT_IRT" ? 10 : 1);
        return p > 10000 ? Math.round(p) : null;
      },
    },
    {
      name: "Nobitex",
      url: "https://api.nobitex.ir/v2/orderbook/USDTIRT",
      parse: (d: any) => {
        const p = Number(d?.lastTradePrice) / 10;
        return p > 10000 ? Math.round(p) : null;
      },
    },
  ];

  for (const src of sources) {
    try {
      const res = await fetch(src.url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Liceno/1.0" },
        signal: AbortSignal.timeout(3500),
        cache: "no-store",
      });
      if (!res.ok) continue;
      const data = await res.json();
      const rate = src.parse(data);
      if (rate && rate > 50000 && rate < 1000000) {
        // Cache fetched live rate in DB
        await db.setting.upsert({
          where: { key: "usd_to_toman_rate_auto" },
          create: { key: "usd_to_toman_rate_auto", value: String(rate) },
          update: { value: String(rate) },
        }).catch(() => {});
        return rate;
      }
    } catch {
      // try next source
    }
  }
  return null;
}

// USD to Toman conversion rate (configurable in admin settings, supports Auto & Manual)
export async function getUsdToTomanRate(): Promise<number> {
  const [modeSetting, manualSetting, autoSetting] = await Promise.all([
    db.setting.findUnique({ where: { key: "usd_rate_mode" } }).catch(() => null),
    db.setting.findUnique({ where: { key: "usd_to_toman_rate" } }).catch(() => null),
    db.setting.findUnique({ where: { key: "usd_to_toman_rate_auto" } }).catch(() => null),
  ]);

  const mode = modeSetting?.value || "auto";

  if (mode === "auto") {
    const liveRate = await fetchLiveUsdtRate();
    if (liveRate) return liveRate;
    if (autoSetting?.value) return Number(autoSetting.value);
  }

  return Number(manualSetting?.value) || 205000;
}
`;

const oldRateFn = `// USD to Toman conversion rate (configurable in admin settings, default ~60000)\nexport async function getUsdToTomanRate(): Promise<number> {\n  const s = await db.setting.findUnique({ where: { key: "usd_to_toman_rate" } }).catch(() => null);\n  return Number(s?.value) || 60000;\n}`;

if (c.includes(oldRateFn)) {
  c = c.replace(oldRateFn, liveRateCode);
} else {
  // Replace getUsdToTomanRate with the new version
  c = c.replace(/export async function getUsdToTomanRate\(\)[\s\S]*?return Number\(s\?\.value\) \|\| \d+;\s*\}/, liveRateCode);
}

fs.writeFileSync('src/lib/supplier.ts', c);
console.log('Successfully updated getUsdToTomanRate and added fetchLiveUsdtRate in supplier.ts');
