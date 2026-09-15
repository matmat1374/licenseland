import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SITE } from "@/lib/constants";
import { buildTorobFeedItem, isTorobEligible } from "@/lib/torob";

// Torob refreshes price/stock from this feed every 6–12h, so it must never be
// cached. Availability and prices come from src/lib/torob.ts — the same helpers
// that render the <meta> tags on the product page, so the two can't drift.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const products = await db.product.findMany({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        discountPrice: true,
        isActive: true,
        stock: true,
        fulfillmentMode: true,
        image: true,
        shortDesc: true,
        features: true,
      },
    });

    const items = products
      .filter((p) => isTorobEligible(p as never))
      .map((p) => buildTorobFeedItem(p as never, SITE.url));

    // Default keeps the legacy bare-array shape. ?format=object returns the
    // envelope { products, count } if the Torob panel expects one.
    const url = new URL(request.url);
    if (url.searchParams.get("format") === "object") {
      return NextResponse.json({ products: items, count: items.length });
    }
    return NextResponse.json(items);
  } catch (error) {
    console.error("Torob feed error:", error);
    return NextResponse.json({ error: "Error generating feed" }, { status: 500 });
  }
}
