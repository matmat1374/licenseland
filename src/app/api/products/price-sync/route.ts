import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUsdToTomanRate } from "@/lib/supplier";

export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json();
    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ ok: false, message: "Invalid payload" }, { status: 400 });
    }

    const [products, liveUsdRate] = await Promise.all([
      db.product.findMany({
        where: { id: { in: ids }, isActive: true },
      }),
      getUsdToTomanRate(),
    ]);

    const prices: Record<string, { price: number; discountPrice: number | null }> = {};

    for (const p of products) {
      let finalPrice = p.price;
      let finalDiscountPrice = p.discountPrice;

      if (p.specifications) {
        try {
          const specs = JSON.parse(p.specifications);
          if (liveUsdRate && (specs.price_usd || specs.cost_usd)) {
            let markup = specs.custom_markup ?? specs.markup_used;
            if (markup === undefined || markup === null || isNaN(Number(markup))) {
              const priceUSD = Number(specs.price_usd || specs.cost_usd);
              if (priceUSD < 1) markup = 200;
              else if (priceUSD < 10) markup = 150;
              else if (priceUSD < 20) markup = 100;
              else if (priceUSD < 50) markup = 80;
              else markup = 50;
            } else {
              markup = Number(markup);
            }
            
            if (specs.is_price_locked) {
              finalPrice = p.price;
            } else {
              finalPrice = Math.ceil((Number(specs.price_usd || specs.cost_usd) * liveUsdRate * (1 + markup / 100)) / 1000) * 1000;
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
