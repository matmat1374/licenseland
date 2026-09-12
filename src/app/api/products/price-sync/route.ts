import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUsdToTomanRate } from "@/lib/supplier";
import { calculateSellPrice, loadPricingTiers } from "@/lib/pricing-calculator";

export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json();
    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ ok: false, message: "Invalid payload" }, { status: 400 });
    }

    const [products, liveUsdRate, pricingTiers] = await Promise.all([
      db.product.findMany({
        where: { id: { in: ids }, isActive: true },
      }),
      getUsdToTomanRate(),
      loadPricingTiers(),
    ]);

    const prices: Record<string, { price: number; discountPrice: number | null }> = {};

    for (const p of products) {
      let finalPrice = p.price;
      let finalDiscountPrice = p.discountPrice;

      if (p.specifications) {
        try {
          const specs = JSON.parse(p.specifications);
          const priceUSD = Number(specs.price_usd || specs.cost_usd);
          if (liveUsdRate && !isNaN(priceUSD) && priceUSD > 0) {
            if (specs.is_price_locked) {
              finalPrice = p.price;
            } else {
              const customMarkup = specs.custom_markup ?? specs.markup_percent ?? null;
              const { sellPriceToman } = calculateSellPrice(
                priceUSD,
                liveUsdRate,
                customMarkup,
                pricingTiers
              );
              finalPrice = sellPriceToman;
            }
          }
        } catch (e) {
          // ignore parse errors
        }
      }

      prices[p.id] = { price: finalPrice, discountPrice: finalDiscountPrice };
    }

    return NextResponse.json({ ok: true, prices });
  } catch (error) {
    console.error("Price sync error:", error);
    return NextResponse.json({ ok: false, message: "Internal server error" }, { status: 500 });
  }
}
