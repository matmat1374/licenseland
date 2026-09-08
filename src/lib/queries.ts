import { db } from "@/lib/db";
import { effectivePrice } from "@/lib/format";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ----------------------------- Catalog -----------------------------

export async function getCategories() {
  return db.category.findMany({ orderBy: { sortOrder: "asc" } });
}

export interface ProductListItem {
  id: string;
  title: string;
  slug: string;
  shortDesc: string;
  description?: string;
  features?: string;
  specifications?: string | null;
  price: number;
  discountPrice: number | null;
  category: string;
  brand: string | null;
  image: string | null;
  duration: string | null;
  rating: number;
  reviewCount: number;
  salesCount: number;
  featured: boolean;
  bestseller: boolean;
  isActive: boolean;
  tags: string | null;
  reviews?: any[];
  _effectivePrice: number;
  _discountPercent: number;
  _stock: number;
}

function decorate(p: any): ProductListItem {
  const eff = effectivePrice(p.price, p.discountPrice);
  return {
    ...p,
    _effectivePrice: eff,
    _discountPercent: p.discountPrice
      ? Math.round(((p.price - p.discountPrice) / p.price) * 100)
      : 0,
    _stock: p.stock ?? 0,
  };
}

export async function getProducts(opts?: {
  category?: string;
  search?: string;
  sort?: "newest" | "price-asc" | "price-desc" | "popular" | "discount";
  featured?: boolean;
  bestseller?: boolean;
  limit?: number;
  activeOnly?: boolean;
}): Promise<ProductListItem[]> {
  const {
    category,
    search,
    sort = "newest",
    featured,
    bestseller,
    limit,
    activeOnly = true,
  } = opts || {};

  const where: any = {};
  if (activeOnly) where.isActive = true;
  if (category && category !== "all") where.category = category;
  if (featured) where.featured = true;
  if (bestseller) where.bestseller = true;
  if (search) {
    const s = search.trim();
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

  let list = products.map(decorate);

  if (featured && list.length < 4) {
    const fallbackProducts = await db.product.findMany({
      where: { isActive: true },
      orderBy: { salesCount: "desc" },
      take: limit || 8,
    });
    const seen = new Set(list.map((p) => p.id));
    for (const fb of fallbackProducts) {
      if (!seen.has(fb.id)) {
        list.push(decorate(fb));
        seen.add(fb.id);
      }
    }
  }

  if (sort === "discount") {
    list = list.sort((a, b) => {
      const stockDiff = (b._stock > 0 ? 1 : 0) - (a._stock > 0 ? 1 : 0);
      if (stockDiff !== 0) return stockDiff;
      return b._discountPercent - a._discountPercent;
    });
  }

  return list;
}

export async function getProductBySlug(slug: string) {
  try {
    const raw = (slug || "").trim();
    const decoded = decodeURIComponent(raw).trim();
    const normalized = decoded.replace(/ي/g, "ی").replace(/ك/g, "ک");

    const orConditions: any[] = [
      { slug: decoded },
      { slug: raw },
      { slug: normalized },
      { id: decoded },
    ];

    const match = normalized.match(/^(\d+)/);
    if (match) {
      const prefix = match[1];
      orConditions.push(
        { slug: { startsWith: `${prefix}-` } },
        { slug: { startsWith: prefix } },
        { id: prefix }
      );
    }

    const product = await db.product.findFirst({
      where: {
        OR: orConditions,
      },
      include: {
        reviews: { orderBy: { createdAt: "desc" } },
        categoryRel: true,
      },
    });

    if (!product) return null;
    return decorate(product);
  } catch (err) {
    console.error("getProductBySlug error:", err);
    return null;
  }
}

export async function getRelatedProducts(category: string, excludeSlug: string, limit = 4) {
  const products = await db.product.findMany({
    where: { category, isActive: true, slug: { not: excludeSlug } },
    take: limit + 4,
    orderBy: { salesCount: "desc" },
  });
  return products.slice(0, limit).map(decorate);
}

export async function getBannerProducts(identifiers: string[], fallbackCategory?: string | string[], limit: number = 3): Promise<ProductListItem[]> {
  const idsOrSlugs = identifiers.map(i => i.trim()).filter(Boolean);
  let products: ProductListItem[] = [];
  
  if (idsOrSlugs.length > 0) {
    const fetched = await db.product.findMany({
      where: {
        OR: [
          { id: { in: idsOrSlugs } },
          { slug: { in: idsOrSlugs } }
        ],
        isActive: true,
        stock: { gt: 0 }
      },
      orderBy: [
        { salesCount: "desc" },
        { stock: "desc" }
      ]
    });
    products = fetched.map(decorate);
  }

  if (products.length < limit) {
    const existingIds = products.map(p => p.id);
    const cats = Array.isArray(fallbackCategory) 
      ? fallbackCategory 
      : (fallbackCategory && fallbackCategory !== 'all' ? [fallbackCategory] : []);

    // Expand category aliases (e.g. developer -> software, design)
    const expandedCats: string[] = [];
    for (const c of cats) {
      if (c === "developer") expandedCats.push("software", "design", "ai");
      else expandedCats.push(c);
    }
    
    const fallbackWhere: any = { 
      isActive: true,
      stock: { gt: 0 },
      ...(existingIds.length > 0 ? { id: { notIn: existingIds } } : {}),
      ...(expandedCats.length > 0 ? { category: { in: expandedCats } } : {})
    };
    
    let fallbackProducts = await db.product.findMany({
      where: fallbackWhere,
      orderBy: [
        { salesCount: "desc" },
        { stock: "desc" }
      ],
      take: limit - products.length,
    });
    
    // If still empty or fewer than limit, fallback to any top selling active products
    if (products.length + fallbackProducts.length < limit) {
      const allExisting = [...existingIds, ...fallbackProducts.map(p => p.id)];
      const moreProducts = await db.product.findMany({
        where: {
          isActive: true,
          stock: { gt: 0 },
          ...(allExisting.length > 0 ? { id: { notIn: allExisting } } : {}),
        },
        orderBy: [
          { salesCount: "desc" },
          { stock: "desc" }
        ],
        take: limit - (products.length + fallbackProducts.length),
      });
      fallbackProducts = [...fallbackProducts, ...moreProducts];
    }
    
    products = [...products, ...fallbackProducts.map(decorate)];
  }
  
  return products.slice(0, limit);
}

// ----------------------------- Articles -----------------------------

export async function getArticles(opts?: { limit?: number; featured?: boolean; category?: string }) {
  return db.article.findMany({
    where: {
      published: true,
      ...(opts?.featured ? { featured: true } : {}),
      ...(opts?.category && opts.category !== "all" ? { category: opts.category } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: opts?.limit,
  });
}

export async function getArticleBySlug(slug: string) {
  return db.article.findUnique({ where: { slug } });
}

// ----------------------------- Orders / Users -----------------------------

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return db.user.findUnique({ where: { id: session.user.id } });
}

export async function getUserOrders(userId: string) {
  return db.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: true } } },
  });
}

export async function getOrderById(id: string, email?: string | null, userId?: string | null) {
  return db.order.findFirst({
    where: {
      OR: [{ id }, { code: id }],
      ...(userId ? { userId } : {}),
      ...(email && !userId ? { guestEmail: email } : {}),
    },
    include: {
      items: {
        include: {
          product: true,
          licenses: true,
        },
      },
    },
  });
}

export async function generateOrderCode(): Promise<string> {
  const { randomBytes } = await import("crypto");
  const randomPart = randomBytes(4).toString("hex").toUpperCase();
  // Format: LL-YYYYMMDD-XXXXXXXX
  const datePart = new Date().toISOString().slice(0,10).replace(/-/g,"");
  return `LL-${datePart}-${randomPart}`;
}
