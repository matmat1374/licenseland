import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/queries";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q") || searchParams.get("search") || undefined;
  const category = searchParams.get("cat") || searchParams.get("category") || undefined;
  const sort = (searchParams.get("sort") as any) || "newest";
  const limit = Number(searchParams.get("limit")) || 1000;
  const featured = searchParams.get("featured") === "true";
  const bestseller = searchParams.get("bestseller") === "true";

  const products = await getProducts({
    category,
    search,
    sort,
    limit,
    featured,
    bestseller,
  });

  return NextResponse.json({ products, count: products.length });
}
