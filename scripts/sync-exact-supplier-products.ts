import { db } from "../src/lib/db";
import { computeQuote } from "@kernel/pricing/engine";
import { SupplierProduct } from "../src/lib/supplier";

// Run with: npx tsx scripts/sync-exact-supplier-products.ts

async function getSupplierApiKey(): Promise<string> {
  const s = await db.setting.findUnique({ where: { key: "supplier_api_key" } }).catch(() => null);
  return s?.value || process.env.SUPPLIER_API_KEY || "";
}

async function getUsdToTomanRate(): Promise<number> {
  const s = await db.setting.findUnique({ where: { key: "usd_to_toman_rate" } }).catch(() => null);
  return Number(s?.value) || 60000;
}

function pickPriceUSD(p: SupplierProduct): number | null {
  const v: any = p.price_usd ?? p.retail_usd ?? p.price ?? p.basePrice ?? p.cost;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^\d.]/g, ""));
    if (!isNaN(n) && n > 0) return n;
  }
  return null;
}

async function main() {
  console.log("Starting sync with exact supplier products...");

  const apiKey = await getSupplierApiKey();
  if (!apiKey) {
    console.error("No supplier API key found.");
    process.exit(1);
  }

  const usdRate = await getUsdToTomanRate();
  const markupPercent = Number(process.env.SUPPLIER_MARKUP_PERCENT) || 200;
  
  const url = "https://api.irmarket.store/api/buyer/products";
  
  console.log("Fetching products from supplier...");
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Failed to fetch from supplier: ${res.status} ${text}`);
    process.exit(1);
  }

  const data = await res.json();
  let supplierProducts: SupplierProduct[] = [];
  if (Array.isArray(data)) supplierProducts = data;
  else if (Array.isArray(data.products)) supplierProducts = data.products;
  else if (Array.isArray(data.data)) supplierProducts = data.data;
  else if (Array.isArray(data.items)) supplierProducts = data.items;
  else {
    console.error("Invalid response format");
    process.exit(1);
  }

  console.log(`Fetched ${supplierProducts.length} products from supplier.`);

  const ourProducts = await db.product.findMany();
  console.log(`Found ${ourProducts.length} products in our DB.`);

  let updated = 0;

  for (const product of ourProducts) {
    let supplierId: number | string | null = null;
    
    // Try to get from specifications
    try {
      const specs = JSON.parse(product.specifications || "{}");
      if (specs.supplier_product_id) {
        supplierId = String(specs.supplier_product_id);
      }
    } catch (e) {}

    // Fallback: try to get from slug if starts with number
    if (!supplierId) {
      const parts = product.slug.split("-");
      if (parts.length > 0 && !isNaN(Number(parts[0]))) {
        supplierId = parts[0];
      }
    }

    if (!supplierId) {
      continue;
    }

    const sp = supplierProducts.find(p => String(p.id) === String(supplierId));
    if (!sp) {
      continue;
    }

    const newTitle = (sp.name || sp.title || product.title).toString().trim();
    const stock = typeof sp.in_stock === "number" ? sp.in_stock : (typeof sp.stock === "number" ? sp.stock : 0);

    let shortDesc = product.shortDesc;
    if (newTitle.includes("شماره")) {
      shortDesc = "شماره اختصاصی جهت دریافت پیامک فعالسازی و ثبتنام";
    }

    const priceUSD = pickPriceUSD(sp);
    let sellPriceToman = product.price;

    if (priceUSD && priceUSD > 0) {
      const supplierCostUsdCents = Math.round(priceUSD * 100);
      const markupBps = markupPercent * 100;
      const quote = computeQuote(
        {
          expectedCurrency: "IRT" as const,
          global: {
            version: "v1",
            markupBps,
            addAbsMinor: 0,
            minMarginAbsMinor: 0,
            floorMinor: null,
            capMinor: null,
            taxBps: 0,
            rounding: { mode: "nearest" as const, unitMinor: 1000 },
          },
          categoryRules: {},
          productOverrides: {},
          scheduled: [],
          fxMaxAgeSeconds: 900,
        },
        {
          productId: String(sp.id || product.id),
          supplierCostUsdCents,
          fx: {
            irtMinorPerUsd: usdRate,
            source: "manual",
            capturedAtIso: new Date().toISOString(),
            bufferBps: 0,
          },
          nowIso: new Date().toISOString(),
        }
      );

      if (quote.status === "ok") {
        sellPriceToman = quote.grossMinor;
      }
    }

    await db.product.update({
      where: { id: product.id },
      data: {
        title: newTitle,
        shortDesc: shortDesc,
        stock: stock,
        price: sellPriceToman,
        lastSyncedAt: new Date(),
      }
    });

    updated++;
    console.log(`Updated product: ${newTitle} (Stock: ${stock}, Price: ${sellPriceToman})`);
  }

  console.log(`Successfully updated ${updated} products.`);
  process.exit(0);
}

main().catch(e => {
  console.error("Error during sync:", e);
  process.exit(1);
});
