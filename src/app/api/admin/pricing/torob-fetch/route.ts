import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUsdToTomanRate } from "@/lib/supplier";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { productId, torobUrl } = body;

    let targetUrl = torobUrl;
    let costUsd = 0;
    let currentPrice = 0;
    let undercutPct = body.undercutPct !== undefined ? Number(body.undercutPct) : 5;
    let floorPct = body.floorPct !== undefined ? Number(body.floorPct) : 15;

    if (productId) {
      const prod = await db.product.findUnique({ where: { id: productId } });
      if (!prod) return NextResponse.json({ ok: false, message: "محصول یافت نشد" }, { status: 404 });
      currentPrice = prod.price;
      try {
        const specs = typeof prod.specifications === "string" ? JSON.parse(prod.specifications) : prod.specifications || {};
        targetUrl = targetUrl || specs.torob_url;
        costUsd = Number(specs.price_usd) || 0;
        if (body.undercutPct === undefined && specs.torob_undercut !== undefined) undercutPct = Number(specs.torob_undercut);
        floorPct = Number(specs.torob_floor) || 15;
      } catch {}
    }

    if (!targetUrl) {
      return NextResponse.json({ ok: false, message: "لینک ترب وارد نشده است" }, { status: 400 });
    }

    // Extract PRK / UUID from Torob URL
    const match = targetUrl.match(/(?:p|special-product)\/([a-zA-Z0-9\-]+)/i) || targetUrl.match(/prk=([a-zA-Z0-9\-]+)/i);
    let prk = "";
    if (match) {
      prk = match[1];
    } else {
      if (targetUrl.includes("http") || targetUrl.includes("www") || targetUrl.includes(".") || targetUrl.includes("/")) {
        return NextResponse.json({ ok: false, message: "لطفاً لینک صفحه محصول در سایت ترب (مانند https://torob.com/p/...) را وارد فرمایید" }, { status: 400 });
      }
      prk = targetUrl.trim();
    }

    const headers = {
      Accept: "application/json, text/plain, */*",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Referer: "https://torob.com/",
    };

    let data: any = {};
    let firstResult: any = null;
    let fetchSuccess = false;
    let cheapestShop = "نامشخص";
    let sellersCount = 0;
    let topSellers: any[] = [];
    let minCompetitorPrice = 0;
    let maxCompetitorPrice = 0;
    let actualPrk = prk;

    // Layer 1: Try base-product/details/?prk=...
    const torobRes = await fetch(`https://api.torob.com/v4/base-product/details/?prk=${prk}`, {
      headers,
      cache: "no-store",
    });

    if (torobRes.ok) {
      data = await torobRes.json();
      if (data && (data.price || data.min_price)) {
        fetchSuccess = true;
      }
    }

    // Layer 2: If Layer 1 fails or returns 404, fallback to search API
    if (!fetchSuccess) {
      const query = prk; // prk might actually be a search query or title
      const searchRes = await fetch(`https://api.torob.com/v4/base-product/search/?query=${encodeURIComponent(query)}`, {
        headers,
        cache: "no-store",
      });

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData?.results?.length > 0) {
          firstResult = searchData.results[0];
          actualPrk = firstResult?.random_key || prk;
          fetchSuccess = true;
        }
      }
    }

    if (!fetchSuccess) {
      return NextResponse.json({ ok: false, message: "استعلام از ترب ناموفق بود یا کالایی یافت نشد" }, { status: 400 });
    }

    if (fetchSuccess) {
      const sellersRes = await fetch(`https://api.torob.com/v4/base-product/sellers/?prk=${actualPrk}`, {
        headers,
        cache: "no-store",
      });
      if (sellersRes.ok) {
        const sellersData = await sellersRes.json();
        const sellersList = sellersData.results || sellersData.sellers || [];
        sellersCount = sellersList.length;
        if (sellersCount > 0) {
          cheapestShop = sellersList[0]?.shop_name || "نامشخص";
        }
        minCompetitorPrice = Number(data.min_price || data.price || sellersList[0]?.price || firstResult?.price);
        maxCompetitorPrice = Number(data.max_price || minCompetitorPrice);
        topSellers = sellersList.slice(0, 4).map((s: any) => ({
          shopName: s.shop_name,
          price: s.price,
          priceText: s.price_text,
          shopUrl: s.page_url,
        }));
      }
    }

    if (!minCompetitorPrice) {
      minCompetitorPrice = Number(data.min_price || data.price || firstResult?.price);
      maxCompetitorPrice = Number(data.max_price || minCompetitorPrice);
    }

    const productName = data.name1 || data.name2 || data.name_fa || (data.slug_name ? data.slug_name.replace(/-/g, " ") : "") || firstResult?.name1 || "محصول ترب";

    if (!minCompetitorPrice || isNaN(minCompetitorPrice)) {
      return NextResponse.json({ ok: false, message: "قیمت فعالی برای این کالا در ترب یافت نشد" }, { status: 400 });
    }

    const usdRate = await getUsdToTomanRate();
    const supplierCostToman = Math.round(costUsd * usdRate);

    // Target undercut price (e.g. 5% cheaper than competitor)
    const targetPriceRaw = minCompetitorPrice * (1 - undercutPct / 100);

    // Safety Floor (Supplier cost + Floor profit margin)
    const floorPriceToman = supplierCostToman > 0 ? Math.round(supplierCostToman * (1 + floorPct / 100)) : 0;
    
    // Allow caller to pass a custom floor price
    const overrideFloor = body.floorPrice !== undefined ? Number(body.floorPrice) : floorPriceToman;

    // Guaranteed Price
    const recommendedPriceRaw = Math.max(targetPriceRaw, overrideFloor);
    const recommendedPrice = Math.round(recommendedPriceRaw / 1000) * 1000;

    const diffWithCurrent = recommendedPrice - currentPrice;
    const diffWithTorob = minCompetitorPrice - recommendedPrice;

    // If productId exists, save the last fetched price in specifications
    if (productId) {
      try {
        const p = await db.product.findUnique({ where: { id: productId } });
        if (p) {
          const specs = JSON.parse(p.specifications || "{}");
          specs.last_torob_price = minCompetitorPrice;
          specs.last_torob_sync = new Date().toISOString();
          await db.product.update({
            where: { id: productId },
            data: { specifications: JSON.stringify(specs) },
          });
        }
      } catch {}
    }

    const imageUrl = data.image_url || firstResult?.image_url || "";
    const slugName = data.slug_name || firstResult?.slug_name || "";

    const formatter = new Intl.NumberFormat('fa-IR');
    const formula = `قیمت ارزانترین رقیب در ترب (${cheapestShop}): ${formatter.format(minCompetitorPrice)} ت ➔ کسر ${undercutPct}٪ تخفیف قیمتشکنی ➔ قیمت پیشنهادی: ${formatter.format(recommendedPrice)} ت`;

    return NextResponse.json({
      ok: true,
      productName,
      productImageUrl: imageUrl,
      torobPrk: actualPrk,
      torobDirectUrl: `https://torob.com/p/${actualPrk}${slugName ? '/' + slugName : ''}`,
      torobMinPrice: minCompetitorPrice,
      minCompetitorPrice,
      maxCompetitorPrice,
      topSellers,
      cheapestShop,
      sellersCount,
      undercutPct,
      recommendedPrice,
      floorPrice: overrideFloor,
      formula,
      // Keep old fields
      currentPrice,
      supplierCostToman,
      costUsd,
      usdRate,
      floorPct,
      floorPriceToman,
      diffWithCurrent,
      diffWithTorob,
      isFloorHit: overrideFloor > targetPriceRaw,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e?.message || "خطای ناشناخته در استعلام ترب" }, { status: 500 });
  }
}
