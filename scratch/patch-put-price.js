const fs = require('fs');
let c = fs.readFileSync('src/app/api/admin/products/[id]/route.ts', 'utf8');

if (!c.includes('computeQuote')) {
  c = c.replace('import { db } from "@/lib/db";', 'import { db } from "@/lib/db";\nimport { computeQuote } from "@kernel/pricing/engine";\nimport { getUsdToTomanRate } from "@/lib/supplier";');
}

const injection = `
    let finalPrice = price != null ? Number(price) : existing.price;
    if (specifications) {
      try {
        const sp = typeof specifications === "string" ? JSON.parse(specifications) : specifications;
        if (sp.price_usd && sp.custom_markup && !sp.is_price_locked) {
          const usdRate = await getUsdToTomanRate();
          const markupBps = Number(sp.custom_markup) * 100;
          const quote = computeQuote(
            { expectedCurrency: "IRT", global: { version: "v1", markupBps, addAbsMinor: 0, minMarginAbsMinor: 0, floorMinor: null, capMinor: null, taxBps: 0, rounding: { mode: "nearest", unitMinor: 1000 } }, categoryRules: {}, productOverrides: {}, scheduled: [], fxMaxAgeSeconds: 900 },
            { productId: id, supplierCostUsdCents: Math.round(Number(sp.price_usd) * 100), fx: { irtMinorPerUsd: usdRate, source: "manual", capturedAtIso: new Date().toISOString(), bufferBps: 0 }, nowIso: new Date().toISOString() }
          );
          if (quote.status === "ok") {
             finalPrice = quote.grossMinor;
          }
        }
      } catch(e) {}
    }
`;

c = c.replace('const updated = await db.product.update({', injection + '\n    const updated = await db.product.update({');
c = c.replace('price: price != null ? Number(price) : existing.price,', 'price: finalPrice,');

fs.writeFileSync('src/app/api/admin/products/[id]/route.ts', c);
console.log('Patched PUT route!');
