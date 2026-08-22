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

  const products = await db.product.findMany({
    where,
    orderBy,
    take: limit,
  });

  let list = products.map(decorate);

  if (sort === "discount") {
    list = list.sort((a, b) => b._discountPercent - a._discountPercent);
  }

  return list;
}

export async function getProductBySlug(slug: string) {
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      reviews: {
        where: { approved: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      categoryRel: true,
    },
  });
  if (!product) return null;
  return decorate(product);
}

export async function getRelatedProducts(category: string, excludeSlug: string, limit = 4) {
  const products = await db.product.findMany({
    where: { category, isActive: true, slug: { not: excludeSlug } },
    take: limit + 4,
    orderBy: { salesCount: "desc" },
  });
  return products.slice(0, limit).map(decorate);
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
  const count = await db.order.count();
  const num = 100001 + count;
  return `LL-${num}`;
}
