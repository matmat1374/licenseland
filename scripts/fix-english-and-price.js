const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('1. Updating settings...');
  await prisma.setting.upsert({ where: { key: 'supplier_markup_percent' }, update: { value: '20' }, create: { key: 'supplier_markup_percent', value: '20' } });
  await prisma.setting.upsert({ where: { key: 'base_markup_percent' }, update: { value: '20' }, create: { key: 'base_markup_percent', value: '20' } });
  
  // نرخ تتر
  let usdRate = 95000;
  try {
    const res = await fetch('https://api.nobitex.ir/market/stats?srcCurrency=usdt&dstCurrency=rls', { cache: 'no-store' });
    const d = await res.json();
    const rls = Number(d?.stats?.['usdt-rls']?.latest);
    if (rls && rls > 500000 && rls < 1500000) {
      usdRate = Math.floor(rls / 10);
    }
  } catch (e) {
    console.log('Using fallback rate:', usdRate);
  }
  console.log('Active USD Rate:', usdRate);

  await prisma.setting.upsert({ where: { key: 'usd_to_toman_rate' }, update: { value: String(usdRate) }, create: { key: 'usd_to_toman_rate', value: String(usdRate) } });
  await prisma.setting.upsert({ where: { key: 'usd_to_toman_rate_auto' }, update: { value: String(usdRate) }, create: { key: 'usd_to_toman_rate_auto', value: String(usdRate) } });

  console.log('2. Fetching supplier products...');
  const keySetting = await prisma.setting.findUnique({ where: { key: 'supplier_api_key' } });
  const apiKey = keySetting?.value || process.env.SUPPLIER_API_KEY;
  const supRes = await fetch('https://api.irmarket.store/api/buyer/products', {
    headers: { 'X-API-Key': apiKey }
  });
  const supData = await supRes.json();
  const supProducts = supData.products || supData || [];
  console.log('Supplier products fetched:', supProducts.length);

  const supMap = new Map();
  for (const sp of supProducts) {
    if (sp.id) supMap.set(Number(sp.id), sp);
  }

  console.log('3. Updating local products...');
  const products = await prisma.product.findMany();
  let updated = 0;

  for (const p of products) {
    let specs = {};
    try { specs = JSON.parse(p.specifications || '{}'); } catch (e) {}

    let supId = specs.supplier_product_id;
    if (!supId) {
      const m = p.slug.match(/^(\d+)-/);
      if (m) supId = Number(m[1]);
    }

    const supItem = supId ? supMap.get(Number(supId)) : null;

    // 1. زیرعنوان انگلیسی دقیق
    let englishName = supItem?.name || supItem?.title || specs.supplier_name;
    if (!englishName) {
      // اگر از تأمینکننده پیدا نشد، از اسلاگ استخراج کن
      const parts = p.slug.replace(/^\d+-/, '').split('-');
      englishName = parts.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    // 2. محاسبه قیمت با سود 20%
    const priceUsd = Number(supItem?.price_usd ?? specs.price_usd ?? specs.cost_usd);
    let newPrice = p.price;
    if (priceUsd && priceUsd > 0) {
      newPrice = Math.ceil((priceUsd * usdRate * 1.20) / 1000) * 1000;
    }

    specs.supplier_name = englishName;
    specs.markup_percent = 20;
    if (priceUsd) specs.price_usd = priceUsd;

    await prisma.product.update({
      where: { id: p.id },
      data: {
        shortDesc: englishName,
        price: newPrice,
        specifications: JSON.stringify(specs)
      }
    });
    updated++;
  }

  console.log(`Updated ${updated} products successfully!`);

  // تست دو محصول 3656 و 2143
  const p3656 = await prisma.product.findFirst({ where: { slug: { contains: '3656' } } });
  console.log('Product 3656:', { title: p3656?.title, shortDesc: p3656?.shortDesc, price: p3656?.price });

  const p2143 = await prisma.product.findFirst({ where: { slug: { contains: '2143' } } });
  console.log('Product 2143:', { title: p2143?.title, shortDesc: p2143?.shortDesc, price: p2143?.price });
}

main().catch(console.error).finally(() => prisma.$disconnect());
