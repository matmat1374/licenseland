import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { effectivePrice } from "@/lib/format";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || undefined;
  const category = searchParams.get("cat") || undefined;
  const sort = (searchParams.get("sort") as any) || "newest";
  const limit = Number(searchParams.get("limit")) || 1000;
  const featured = searchParams.get("featured") === "true";
  const bestseller = searchParams.get("bestseller") === "true";

  const where: any = { isActive: true };
  if (category && category !== "all") where.category = category;
  if (featured) where.featured = true;
  if (bestseller) where.bestseller = true;
  if (search) {
    const s = search.trim();
    // Normalize Persian characters (ي -> ی, ك -> ک)
    const normalized = s.replace(/ي/g, "ی").replace(/ك/g, "ک");
    
    where.OR = [
      { title: { contains: s } },
      { title: { contains: normalized } },
      { slug: { contains: s } },
      { slug: { contains: normalized } },
      { shortDesc: { contains: s } },
      { shortDesc: { contains: normalized } },
      { tags: { contains: s } },
      { brand: { contains: s } },
    ];
  }

  let orderBy: any = { createdAt: "desc" };
  if (sort === "price-asc") orderBy = { price: "asc" };
  else if (sort === "price-desc") orderBy = { price: "desc" };
  else if (sort === "popular") orderBy = { salesCount: "desc" };

  const inStockProducts = await db.product.findMany({
    where: { ...where, stock: { gt: 0 } },
    orderBy,
    take: limit,
  });

  const remainingLimit = limit ? limit - inStockProducts.length : undefined;

  const outOfStockProducts = (remainingLimit === undefined || remainingLimit > 0) ? await db.product.findMany({
    where: { ...where, stock: { lte: 0 } },
    orderBy,
    take: remainingLimit,
  }) : [];

  const products = [...inStockProducts, ...outOfStockProducts];

  const out = products.map((p) => ({
    ...p,
    _effectivePrice: effectivePrice(p.price, p.discountPrice),
    _discountPercent: p.discountPrice
      ? Math.round(((p.price - p.discountPrice) / p.price) * 100)
      : 0,
  }));

  return NextResponse.json({ products: out, count: out.length });
}
