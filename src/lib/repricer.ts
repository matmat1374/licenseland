import { db } from "./db";
import { computeQuote } from "@kernel/pricing/engine";
import { getUsdToTomanRate } from "./supplier";

export async function runTorobRepricer() {
  try {
    const products = await db.product.findMany({
      where: { isActive: true },
    });

    const activeUsdRate = await getUsdToTomanRate();
    const usdRate = activeUsdRate || 65000;
    
    let repricedCount = 0;
    let failedCount = 0;
    const details: string[] = [];

    for (const p of products) {
      if (!p.specifications) continue;
      
      let specs;
      try {
        specs = JSON.parse(p.specifications);
      } catch (e) {
        continue;
      }

      if (!specs.torob_url || specs.is_price_locked) continue;
      
      const torobUrl = specs.torob_url.toString();
      const undercutPct = Number(specs.torob_undercut) || 5;
      const floorPct = Number(specs.torob_floor) || 15;
      const costUsd = Number(specs.price_usd);
      
      if (!torobUrl || isNaN(costUsd) || costUsd <= 0) continue;

      // Extract PRK (Pricer Key) from URL
      // e.g. https://torob.com/p/1e3e6c1f-acb9-49f0-b440-0c2aa0cfb7f0/name
      const match = torobUrl.match(/\/p\/([a-f0-9\-]+)/);
      if (!match) continue;
      const prk = match[1];

      try {
        const res = await fetch('https://api.torob.com/v4/base-product/details/?prk=' + prk, {
            headers: { 'accept': 'application/json' },
            next: { revalidate: 0 } // no cache
        });
        if (!res.ok) throw new Error('API not ok');
        const data = await res.json();
        
        const minCompetitorPrice = Number(data.price);
        if (!minCompetitorPrice || isNaN(minCompetitorPrice)) continue;

        const targetPriceToman = minCompetitorPrice * (1 - (undercutPct / 100));
        
        // Floor calculation
        const supplierCostUsdCents = Math.round(costUsd * 100);
        const floorMarkupBps = floorPct * 100;
        
        // Use kernel pricing engine for accurate floor
        const quote = computeQuote(
            {
              expectedCurrency: "IRT" as const,
              global: { version: "v1", markupBps: floorMarkupBps, addAbsMinor: 0, minMarginAbsMinor: 0, floorMinor: null, capMinor: null, taxBps: 0, rounding: { mode: "nearest" as const, unitMinor: 1000 } },
              categoryRules: {}, productOverrides: {}, scheduled: [], fxMaxAgeSeconds: 900,
            },
            {
              productId: "repricer",
              supplierCostUsdCents,
              fx: { irtMinorPerUsd: usdRate, source: "manual", capturedAtIso: new Date().toISOString(), bufferBps: 0 },
              nowIso: new Date().toISOString(),
            }
        );
        
        if (quote.status !== "ok") continue;
        const floorPriceToman = quote.grossMinor;
        
        const finalPriceRaw = Math.max(targetPriceToman, floorPriceToman);
        
        // Round to nearest 1000
        const finalPriceToman = Math.round(finalPriceRaw / 1000) * 1000;
        
        if (finalPriceToman !== p.price) {
            await db.product.update({
                where: { id: p.id },
                data: { price: finalPriceToman }
            });
            repricedCount++;
            details.push('ربات قیمت‌شکن: ' + p.title + ' -> ' + finalPriceToman.toLocaleString("fa-IR") + ' تومان (کمترین قیمت ترب: ' + minCompetitorPrice.toLocaleString("fa-IR") + ')');
        }
      } catch (e: any) {
        failedCount++;
        console.error("Torob fetch error:", e?.message);
      }
    }

    return { ok: true, repricedCount, failedCount, details };
  } catch (err: any) {
    console.error("Repricer general error", err);
    return { ok: false, repricedCount: 0, failedCount: 0, details: [] };
  }
}
