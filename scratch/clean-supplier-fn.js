const fs = require('fs');
let c = fs.readFileSync('src/lib/supplier.ts', 'utf8');

// Find the importProductsFromSupplier function start
const fnStart = c.indexOf('export async function importProductsFromSupplier(');
if (fnStart === -1) throw new Error('Cannot find importProductsFromSupplier');

// Find the next export function after importProductsFromSupplier
const nextFn = c.indexOf('export async function purchaseFromSupplier(', fnStart);
if (nextFn === -1) throw new Error('Cannot find purchaseFromSupplier');

const cleanFn = `export async function importProductsFromSupplier(
  apiUrl?: string,
  apiKey?: string,
  markupPercent: number = 0
): Promise<{
  ok: boolean;
  imported: number;
  updated: number;
  skipped: number;
  message: string;
  details: string[];
}> {
  // SUPPLIER_API_URL may be a bare host ("https://api.irmarket.store") — the
  // products endpoint is host + /api/buyer/products (per the OpenAPI spec).
  const key = apiKey || (await getSupplierApiKey());
  let url = apiUrl || process.env.SUPPLIER_API_URL || "https://api.irmarket.store";
  if (!/\\/api(\\/|$)/.test(url)) url = url.replace(/\\/+$/, "") + "/api/buyer/products";

  const markupSetting = await db.setting.findUnique({ where: { key: 'supplier_markup_percent' } }).catch(() => null);
  const markup = markupPercent > 0 ? markupPercent : (Number(markupSetting?.value) || Number(process.env.SUPPLIER_MARKUP_PERCENT) || 200);
  const usdRate = await getUsdToTomanRate();

  let products: SupplierProduct[] = [];
  try {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(key ? { "X-API-Key": key } : {}),
      },
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, imported: 0, updated: 0, skipped: 0, message: \`خطای API (\${res.status}): \${body.slice(0, 200)}\`, details: [] };
    }
    const data = await res.json();
    if (Array.isArray(data)) products = data;
    else if (Array.isArray(data.products)) products = data.products;
    else if (Array.isArray(data.data)) products = data.data;
    else if (Array.isArray(data.items)) products = data.items;
    else {
      return { ok: false, imported: 0, updated: 0, skipped: 0, message: "ساختار پاسخ API نامعتبر (آرایه محصولات یافت نشد)", details: [] };
    }
  } catch (e: any) {
    return { ok: false, imported: 0, updated: 0, skipped: 0, message: \`ارتباط با API برقرار نشد: \${e?.message || ""}\`, details: [] };
  }

  let imported = 0, updated = 0, skipped = 0;
  const details: string[] = [];

  const allExistingProducts = await db.product.findMany({
    select: { id: true, slug: true, specifications: true, shortDesc: true, image: true, duration: true, price: true, description: true }
  });
  const existingMap = new Map();
  for (const p of allExistingProducts) {
    if (p.specifications) {
      try {
        const sp = JSON.parse(p.specifications);
        if (sp.supplier_product_id) {
          existingMap.set(String(sp.supplier_product_id), p);
        }
      } catch (e) {}
    }
  }

  for (const sp of products) {
    const title = pickTitle(sp);
    const priceUSD = pickPriceUSD(sp);
    if (!title || !priceUSD || priceUSD <= 0) {
      skipped++;
      continue;
    }

    const requiredInputs: string[] = Array.isArray(sp.required_inputs) ? sp.required_inputs : [];
    if (sp.pricing_unit === "per_1000" || sp.requires_link || sp.requires_comments || sp.requires_password || requiredInputs.length > 0) {
      skipped++;
      const why = sp.pricing_unit === "per_1000" ? "سرویس SMM" : sp.requires_link ? "نیازمند لینک" : sp.requires_password ? "نیازمند رمز" : "ورودی خاص";
      details.push(\`رد شد (غیرقابل فروش خودکار): \${title} — \${why}\`);
      continue;
    }

    // Determine tiered markup or custom markup
    let dynamicMarkup = markup;
    if (priceUSD < 1) dynamicMarkup = 200;
    else if (priceUSD < 10) dynamicMarkup = 150;
    else if (priceUSD < 20) dynamicMarkup = 100;
    else if (priceUSD < 50) dynamicMarkup = 80;
    else dynamicMarkup = 50;

    const slugCheck = slugifyFa(sp.id ? \`\${sp.id}-\${title}\` : title);
    const existingProd = existingMap.get(String(sp.id)) || (slugCheck ? allExistingProducts.find(p => p.slug === slugCheck) : null);
    
    let existingSpecs: any = {};
    if (existingProd && existingProd.specifications) {
      try { existingSpecs = JSON.parse(existingProd.specifications); } catch(e){}
    }
    
    if (existingSpecs.custom_markup !== undefined && existingSpecs.custom_markup !== null && !isNaN(Number(existingSpecs.custom_markup))) {
      dynamicMarkup = Number(existingSpecs.custom_markup);
    }

    const supplierCostUsdCents = Math.round(priceUSD * 100);
    const markupBps = dynamicMarkup * 100;

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
        productId: sp.id ? String(sp.id) : (slugCheck || "product"),
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

    if (quote.status !== "ok") {
      skipped++;
      details.push(\`رد شد: \${title} — quote blocked: \${quote.reason}\`);
      continue;
    }

    let sellPriceToman = quote.grossMinor;
    if (existingSpecs.is_price_locked && existingProd?.price) {
      sellPriceToman = existingProd.price;
    }

    const slug = slugCheck || slugifyFa(title);
    if (!slug) { skipped++; continue; }

    const rawFeatures: string[] = Array.isArray(sp.features) ? sp.features : (sp.features ? String(sp.features).split("\\n").filter(Boolean) : []);
    const featuresList: string[] = [];

    if (rawFeatures.length === 0) {
      if (sp.retail_usd && sp.price_usd) featuresList.push(\`قیمت عمومی: \${sp.retail_usd} دلار\`);
      if (sp.discount_percent) featuresList.push(\`تخفیف ویژه: \${sp.discount_percent}٪\`);
      if (sp.duration_days) featuresList.push(\`مدت اعتبار: \${sp.duration_days} روز\`);
    } else {
      featuresList.push(...rawFeatures);
    }

    const _stock = sp.in_stock !== undefined ? sp.in_stock : sp.stock;
    if (typeof _stock === 'number' && _stock > 0) {
      featuresList.push(\`موجودی: \${_stock} عدد\`);
    } else if (_stock === true || _stock === 'true') {
      featuresList.push(\`موجودی: در انبار (تحویل آنی)\`);
    }

    let rawDesc = pickDescription(sp) || \`## \${title}\\n\\nخرید لایسنس و اشتراک اوریجینال با بهترین قیمت و تحویل آنی.\\n\\n### تضمین اصالت و گارانتی\\nاین محصول به صورت رسمی و قانونی ارائه شده و دارای پشتیبانی اختصاصی می‌باشد.\`;
    let finalDesc = rawDesc;
    const hasPersian = /[\\u0600-\\u06FF]/.test(rawDesc);
    if (!hasPersian && existingProd && existingProd.description && /[\\u0600-\\u06FF]/.test(existingProd.description)) {
      finalDesc = existingProd.description;
    }

    const cleanFeatures = featuresList
      .filter(f => !f.includes('$') && !f.toLowerCase().includes('usd'))
      .filter(f => !/false/i.test(f) && !/true عدد/i.test(f) && !/undefined/i.test(f))
      .map(f => f.replace(/موجود: در انبار/g, 'موجودی: تضمین شده'));

    const { slug: catSlug, name: catName } = categorizeProduct(sp);
    const brand = sp.brand ? String(sp.brand) : null;
    const duration = sp.duration ? String(sp.duration) : (sp.duration_days ? \`\${sp.duration_days} روز\` : null);
    const tags = sp.tags ? String(sp.tags) : (sp.requires_email ? "requires_email" : null);

    const existingCat = await db.category.findUnique({ where: { slug: catSlug } }).catch(() => null);
    if (!existingCat) {
      await db.category.create({
        data: { name: catName, slug: catSlug, description: catName, icon: "Package", color: "from-emerald-500 to-teal-600", sortOrder: 99 },
      }).catch(() => {});
    }

    const supplierStockNum = typeof _stock === 'number' ? _stock : (_stock === true ? 999 : 0);
    const specObj = {
      ...existingSpecs,
      supplier_product_id: sp.id,
      price_usd: priceUSD,
      retail_usd: sp.retail_usd || null,
      discount_percent: sp.discount_percent || null,
      duration_days: sp.duration_days || null,
      supplier_stock: supplierStockNum,
      pricing_unit: sp.pricing_unit || "unit",
      requires_email: !!sp.requires_email,
      requires_link: !!sp.requires_link,
      usd_rate_used: usdRate,
      markup_used: dynamicMarkup,
      last_synced: new Date().toISOString(),
      is_price_locked: !!existingSpecs.is_price_locked,
      custom_markup: existingSpecs.custom_markup ?? null,
      torob_url: existingSpecs.torob_url ?? null,
      torob_undercut: existingSpecs.torob_undercut ?? 5,
      torob_floor: existingSpecs.torob_floor ?? 15,
    };

    const finalStock = supplierStockNum > 0 ? supplierStockNum : 999;

    if (existingProd) {
      await db.product.update({
        where: { id: existingProd.id },
        data: {
          title,
          shortDesc: sp.shortDesc ? String(sp.shortDesc) : existingProd.shortDesc,
          description: finalDesc,
          features: JSON.stringify(cleanFeatures),
          price: sellPriceToman,
          duration: duration || existingProd.duration,
          brand,
          tags,
          image: sp.image || sp.imageUrl || sp.images?.[0] || existingProd.image,
          isActive: true,
          specifications: JSON.stringify(specObj),
          fulfillmentMode: "AUTO",
          stock: finalStock,
        },
      });
      updated++;
      details.push(\`به‌روز شد: \${title} — \${sellPriceToman.toLocaleString("fa-IR")} ت (\$\${priceUSD} × \${usdRate.toLocaleString("fa-IR")} × \${((100+dynamicMarkup)/100).toFixed(2)})\`);
    } else {
      await db.product.create({
        data: {
          title,
          slug,
          shortDesc: sp.shortDesc ? String(sp.shortDesc) : title,
          description: finalDesc,
          features: JSON.stringify(cleanFeatures),
          price: sellPriceToman,
          duration,
          category: catSlug,
          brand,
          tags,
          image: sp.image || sp.imageUrl || sp.images?.[0] || null,
          isActive: true,
          stock: finalStock,
          rating: 5,
          reviewCount: 0,
          salesCount: 0,
          specifications: JSON.stringify(specObj),
          fulfillmentMode: "AUTO",
        },
      });
      imported++;
      details.push(\`اضافه شد: \${title} — \${sellPriceToman.toLocaleString("fa-IR")} ت (\$\${priceUSD} × \${usdRate.toLocaleString("fa-IR")} × \${((100+dynamicMarkup)/100).toFixed(2)})\`);
    }
  }

  return {
    ok: true,
    imported,
    updated,
    skipped,
    message: \`\${imported} محصول جدید، \${updated} به‌روز شد، \${skipped} رد شد | نرخ: ۱$ = \${usdRate.toLocaleString("fa-IR")} ت | حاشیه: \${markup}٪\`,
    details: details.slice(0, 50),
  };
}

`;

c = c.substring(0, fnStart) + cleanFn + c.substring(nextFn);
fs.writeFileSync('src/lib/supplier.ts', c);
console.log('Successfully wrote pristine importProductsFromSupplier!');
