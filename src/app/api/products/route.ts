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
    where.OR = [
      { title: { contains: search } },
      { shortDesc: { contains: search } },
      { tags: { contains: search } },
      { brand: { contains: search } },
    ];
  }

  let orderBy: any = { createdAt: "desc" };
  if (sort === "price-asc") orderBy = { price: "asc" };
  else if (sort === "price-desc") orderBy = { price: "desc" };
  else if (sort === "popular") orderBy = { salesCount: "desc" };

  const products = await db.product.findMany({ where, orderBy, take: limit });

  const out = products.map((p) => ({
    ...p,
    _effectivePrice: effectivePrice(p.price, p.discountPrice),
    _discountPercent: p.discountPrice
      ? Math.round(((p.price - p.discountPrice) / p.price) * 100)
      : 0,
  }));

  return NextResponse.json({ products: out, count: out.length });
}
