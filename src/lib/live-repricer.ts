import { db } from "./db";
import { calculateSellPrice, loadPricingTiers } from "./pricing-calculator";

export async function fetchLiveUsdtRate(): Promise<number> {
  const isValid = (rate: number) => rate && !isNaN(rate) && rate >= 100000 && rate <= 500000 && rate !== 95000;

  try {
    const res = await fetch("https://api.tetherland.com/currencies", { cache: "no-store", signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      const price = Number(data?.data?.currencies?.USDT?.price);
      if (isValid(price)) return price;
    }
  } catch (e) {}

  try {
    const res = await fetch("https://api.wallex.ir/v1/markets", { cache: "no-store", signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      const price = Math.round(Number(data?.result?.symbols?.USDTTMN?.stats?.lastPrice));
      if (isValid(price)) return price;
    }
  } catch (e) {}

  try {
    const res = await fetch("https://api.nobitex.ir/market/stats?srcCurrency=usdt&dstCurrency=rls", { cache: "no-store", signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      const price = Math.floor(Number(data?.stats?.["usdt-rls"]?.latest) / 10);
      if (isValid(price)) return price;
    }
  } catch (e) {}

  try {
    const s = await db.setting.findUnique({ where: { key: "usd_to_toman_rate" } });
    if (s && s.value) {
      const val = Number(s.value);
      if (isValid(val)) return val;
    }
  } catch (e) {}

  return 220000;
}

export async function repriceAllProductsWithLiveRate() {
  const liveRate = await fetchLiveUsdtRate();
  
  // Update settings
  await db.setting.upsert({
    where: { key: "usd_to_toman_rate" },
    update: { value: liveRate.toString() },
    create: { key: "usd_to_toman_rate", value: liveRate.toString() }
  });
  await db.setting.upsert({
    where: { key: "usd_to_toman_rate_auto" },
    update: { value: liveRate.toString() },
    create: { key: "usd_to_toman_rate_auto", value: liveRate.toString() }
  });

  const [settings, pricingTiers, products] = await Promise.all([
    db.setting.findMany(),
    loadPricingTiers(),
    db.product.findMany({ where: { isActive: true } }),
  ]);
  const globalMarkupSetting = settings.find(s => s.key === "supplier_markup_percent");
  const globalMarkup = globalMarkupSetting ? Number(globalMarkupSetting.value) : null;

  let updatedCount = 0;

  for (const p of products) {
    if (!p.specifications) continue;
    
    let specs: any;
    try {
      specs = JSON.parse(p.specifications);
    } catch (e) {
      continue;
    }

    if (specs.is_price_locked) continue;
    
    const priceUsd = Number(specs.price_usd || specs.cost_usd);
    if (isNaN(priceUsd) || priceUsd <= 0) continue;

    const customMarkup = (specs.custom_markup !== undefined && specs.custom_markup !== null && specs.custom_markup !== "")
      ? Number(specs.custom_markup)
      : (specs.markup_percent !== undefined && specs.markup_percent !== null && specs.markup_percent !== "")
      ? Number(specs.markup_percent)
      : (globalMarkup !== null && !isNaN(globalMarkup) && globalMarkup > 0 ? globalMarkup : null);

    const { sellPriceToman: finalPrice } = calculateSellPrice(
      priceUsd,
      liveRate,
      customMarkup,
      pricingTiers
    );

    if (finalPrice !== p.price) {
      await db.product.update({
        where: { id: p.id },
        data: { price: finalPrice }
      });
      updatedCount++;
    }
  }

  return {
    updatedCount,
    liveRate,
    time: new Date().toISOString()
  };
}
