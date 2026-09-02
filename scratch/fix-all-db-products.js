const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Comprehensive DB Cleanup ---');
  const usdRateSetting = await prisma.setting.findUnique({ where: { key: 'usd_to_toman_rate' } }).catch(() => null);
  const activeUsdRate = Number(usdRateSetting?.value) || 200000;

  const products = await prisma.product.findMany();
  console.log(`Found ${products.length} products to process.`);

  let updatedCount = 0;

  for (const p of products) {
    let modified = false;

    // 1. Clean features
    let features = [];
    try {
      if (p.features) {
        const parsed = JSON.parse(p.features);
        if (Array.isArray(parsed)) features = parsed;
        else if (typeof parsed === 'string') features = parsed.split('\n');
      }
    } catch {
      if (typeof p.features === 'string') features = p.features.split('\n');
    }

    const cleanFeatures = features
      .map(f => String(f).trim())
      .filter(f => Boolean(f))
      .filter(f => !/false/i.test(f))
      .filter(f => !/undefined/i.test(f))
      .filter(f => !/true\s*عدد/i.test(f))
      .filter(f => !/موجود:\s*false/i.test(f))
      .filter(f => !f.includes('$') && !f.toLowerCase().includes('usd'))
      .map(f => {
        return f
          .replace(/موجود:\s*true/g, 'موجودی: تضمین شده')
          .replace(/موجود:\s*در انبار/g, 'موجودی: تضمین شده')
          .replace(/true\s*روز/g, 'مدت‌دار')
          .trim();
      })
      .filter(f => f.length > 1);

    // If cleanFeatures is empty or was stripped, give good default features
    if (cleanFeatures.length === 0) {
      cleanFeatures.push('تحویل آنی و خودکار پس از پرداخت');
      cleanFeatures.push('ضمانت اصالت و گارانتی تعویض');
      cleanFeatures.push('پشتیبانی ۲۴ ساعته اختصاصی');
    }

    const newFeaturesJson = JSON.stringify(cleanFeatures);
    if (newFeaturesJson !== p.features) {
      modified = true;
    }

    // 2. Clean specifications
    let specs = {};
    try {
      if (p.specifications) {
        specs = JSON.parse(p.specifications);
        if (typeof specs === 'string') {
          // Double stringified fix!
          specs = JSON.parse(specs);
        }
      }
    } catch (e) {
      specs = {};
    }

    const priceUsd = Number(specs.price_usd) || (p.price > 0 ? Number((p.price / (activeUsdRate * 2.5)).toFixed(2)) : 1.0);
    
    // Tiered markup logic
    let dynamicMarkup = 150;
    if (priceUsd < 1) dynamicMarkup = 200;
    else if (priceUsd < 10) dynamicMarkup = 150;
    else if (priceUsd < 20) dynamicMarkup = 100;
    else if (priceUsd < 50) dynamicMarkup = 80;
    else dynamicMarkup = 50;

    if (specs.custom_markup !== undefined && specs.custom_markup !== null && !isNaN(Number(specs.custom_markup))) {
      dynamicMarkup = Number(specs.custom_markup);
    }

    const cleanedSpecs = {
      supplier_product_id: specs.supplier_product_id || null,
      price_usd: priceUsd,
      retail_usd: specs.retail_usd || null,
      discount_percent: specs.discount_percent || null,
      duration_days: specs.duration_days || null,
      supplier_stock: specs.supplier_stock !== undefined ? specs.supplier_stock : 999,
      pricing_unit: specs.pricing_unit || "unit",
      requires_email: !!specs.requires_email,
      requires_link: !!specs.requires_link,
      usd_rate_used: specs.usd_rate_used || activeUsdRate,
      markup_used: specs.markup_used || dynamicMarkup,
      last_synced: specs.last_synced || new Date().toISOString(),
      is_price_locked: !!specs.is_price_locked,
      custom_markup: specs.custom_markup ?? null,
      torob_url: specs.torob_url ?? null,
      torob_undercut: specs.torob_undercut ?? 5,
      torob_floor: specs.torob_floor ?? 15,
    };

    const newSpecsJson = JSON.stringify(cleanedSpecs);
    if (newSpecsJson !== p.specifications) {
      modified = true;
    }

    // 3. Stock fix for auto products
    let newStock = p.stock;
    if (p.stock === 0 && p.isActive) {
      newStock = 999;
      modified = true;
    }

    if (modified) {
      await prisma.product.update({
        where: { id: p.id },
        data: {
          features: newFeaturesJson,
          specifications: newSpecsJson,
          stock: newStock,
        },
      });
      updatedCount++;
    }
  }

  console.log(`Cleaned and updated ${updatedCount} products.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
