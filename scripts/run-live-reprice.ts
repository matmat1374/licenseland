const { PrismaClient } = require('@prisma/client');
const { fetchLiveUsdtRate } = require('../src/lib/live-repricer');

const db = new PrismaClient();

async function run() {
  console.log("Fetching live rate...");
  let liveRate = 65000;
  try {
    const res = await fetch("https://api.nobitex.ir/market/stats?srcCurrency=usdt&dstCurrency=rls", { cache: "no-store" });
    const data = await res.json();
    liveRate = Math.floor(Number(data?.stats?.["usdt-rls"]?.latest) / 10);
    console.log("Live rate:", liveRate);
  } catch (e) {
    console.log("Failed Nobitex fetch", e);
  }

  // Update settings
  await db.setting.upsert({ where: { key: "usd_to_toman_rate" }, update: { value: liveRate.toString() }, create: { key: "usd_to_toman_rate", value: liveRate.toString() } });
  await db.setting.upsert({ where: { key: "usd_to_toman_rate_auto" }, update: { value: liveRate.toString() }, create: { key: "usd_to_toman_rate_auto", value: liveRate.toString() } });

  const settings = await db.setting.findMany();
  const globalMarkupSetting = settings.find((s: any) => s.key === "supplier_markup_percent");
  const globalMarkup = globalMarkupSetting ? Number(globalMarkupSetting.value) : null;

  const products = await db.product.findMany({ where: { isActive: true } });
  let updatedCount = 0;

  for (const p of products) {
    if (!p.specifications) continue;
    let specs: any;
    try { specs = JSON.parse(p.specifications); } catch (e) { continue; }

    if (specs.is_price_locked) continue;
    
    const priceUsd = Number(specs.price_usd || specs.cost_usd);
    if (isNaN(priceUsd) || priceUsd <= 0) continue;

    let markup = 0;
    if (specs.custom_markup !== undefined && specs.custom_markup !== null && specs.custom_markup !== "") {
      markup = Number(specs.custom_markup);
    } else if (globalMarkup !== null && !isNaN(globalMarkup)) {
      markup = globalMarkup;
    } else {
      if (priceUsd < 10) markup = 50;
      else if (priceUsd <= 20) markup = 30;
      else markup = 20;
    }

    const finalPrice = Math.ceil((priceUsd * liveRate * (1 + markup / 100)) / 1000) * 1000;

    if (finalPrice !== p.price) {
      await db.product.update({ where: { id: p.id }, data: { price: finalPrice } });
      updatedCount++;
    }
  }
  
  console.log(`Updated ${updatedCount} products with live rate ${liveRate}`);

  const chatGpt = await db.product.findFirst({
    where: { title: { contains: "ChatGPT Plus" } }
  });

  if (chatGpt) {
    console.log(`ChatGPT Plus new price: ${chatGpt.price} تومان`);
  } else {
    // 3656
    const p3656 = await db.product.findUnique({ where: { id: "3656" } });
    if (p3656) {
      console.log(`Product 3656 new price: ${p3656.price} تومان`);
    } else {
        const prod = await db.product.findFirst();
        console.log(`Any Product price: ${prod?.price}`);
    }
  }

  await db.$disconnect();
}

run();
