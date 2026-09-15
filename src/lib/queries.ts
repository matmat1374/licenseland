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
  sortOrder?: number;
  isActive: boolean;
  tags: string | null;
  reviews?: any[];
  _effectivePrice: number;
  _discountPercent: number;
  _stock: number;
  /** true → _stock عدد دقیق نیست (تامین‌کننده AUTO)، نمایش «موجود» به‌جای عدد جعلی */
  _stockIsApprox: boolean;
  stock?: number;
}

function decorate(p: any): ProductListItem {
  const eff = effectivePrice(p.price, p.discountPrice);
  const rawStock = p.stock ?? 0;
  const isAvailable = Boolean(p.isActive) && rawStock > 0;
  // If product is out of stock or inactive, _stock MUST be 0
  // نمایش صادقانه: برای AUTO عدد جعلی «۹۹» نشان نده — سقف ۵۰ کافی است چون
  // عدد دقیق انبار تامین‌کننده به کاربر معنا ندارد
  const stock = isAvailable
    ? (p.fulfillmentMode === "AUTO"
        ? Math.min(Math.max(rawStock, 99), 50)
        : rawStock)
    : 0;

  return {
    ...p,
    _effectivePrice: eff,
    _discountPercent: p.discountPrice
      ? Math.round(((p.price - p.discountPrice) / p.price) * 100)
      : 0,
    _stock: stock,
    _stockIsApprox: isAvailable && p.fulfillmentMode === "AUTO",
  };
}

export function buildSearchCondition(search?: string) {
  if (!search) return null;
  const s = search.trim();
  if (!s) return null;

  const normalized = s.replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/[\u200B-\u200D\uFEFF]/g, " ");
  const englishDigits = normalized
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
  const persianDigits = englishDigits.replace(/[0-9]/g, (d) =>
    String.fromCharCode(d.charCodeAt(0) + 1728)
  );
  const terms = new Set<string>([s, normalized, englishDigits, persianDigits]);
  const lower = normalized.toLowerCase();
  const lowerEn = englishDigits.toLowerCase();

  // Keyword synonym dictionary (bidirectional)
  const synonymGroups = [
    ["gemini", "جمینی", "جمنای"],
    ["chatgpt", "gpt", "چت جی پی تی", "چت‌جی‌پی‌تی", "openai"],
    ["claude", "کلود", "کلاود", "anthropic"],
    ["midjourney", "میدجرنی", "میدجورنی"],
    ["spotify", "اسپاتیفای"],
    ["netflix", "نتفلیکس"],
    ["youtube", "یوتیوب"],
    ["canva", "کنوا", "کانوا"],
    ["telegram", "تلگرام"],
    ["cursor", "کورسور"],
    ["windsurf", "ویندسرف"],
    ["adobe", "ادوبی"],
    ["discord", "دیسکورد"],
    ["copilot", "کوپایلت", "کوپایلوت"],
    ["perplexity", "پرپلکسیتی"],
  ];

  for (const group of synonymGroups) {
    if (group.some((term) => {
      const tl = term.toLowerCase();
      return lower.includes(tl) || tl.includes(lower) || lowerEn.includes(tl) || tl.includes(lowerEn);
    })) {
      for (const term of group) {
        terms.add(term);
      }
    }
  }

  const orList: any[] = [];
  for (const term of terms) {
    orList.push(
      { title: { contains: term } },
      { slug: { contains: term } },
      { shortDesc: { contains: term } },
      { brand: { contains: term } },
      { tags: { contains: term } },
      { specifications: { contains: term } }
    );
  }

  return orList.length > 0 ? { OR: orList } : null;
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

  // Resolve category aliases (e.g. api-credits -> dev-tools, software -> productivity)
  let catSlug = category;
  if (catSlug === "api-credits") catSlug = "dev-tools";
  if (catSlug === "software") catSlug = "productivity";
  if (catSlug && catSlug !== "all") where.category = catSlug;

  if (featured) where.featured = true;
  if (bestseller) where.bestseller = true;
  const searchCondition = buildSearchCondition(search);

  const baseConditions: any[] = [];
  if (searchCondition) baseConditions.push(searchCondition);

  if (!where.category) {
    // Hide virtual numbers in general catalog to keep catalog clean like irmarket unless explicitly searched
    const isSearchingVirtualNumbers = search && /شماره|مجازی|otp|virtual/i.test(search);
    if (!isSearchingVirtualNumbers) {
      baseConditions.push({ category: { not: "virtual-numbers" } });
    }
  }

  delete where.OR;

  let orderBy: any = [{ sortOrder: "asc" }, { bestseller: "desc" }, { salesCount: "desc" }, { createdAt: "desc" }];
  if (sort === "price-asc") orderBy = [{ price: "asc" }, { sortOrder: "asc" }];
  else if (sort === "price-desc") orderBy = [{ price: "desc" }, { sortOrder: "asc" }];
  else if (sort === "popular") orderBy = [{ sortOrder: "asc" }, { salesCount: "desc" }, { bestseller: "desc" }];
  else if (sort === "newest") orderBy = [{ sortOrder: "asc" }, { createdAt: "desc" }];

  const inStockProducts = await db.product.findMany({
    where: {
      ...where,
      AND: [
        ...baseConditions,
        { stock: { gt: 0 } },
      ],
    },
    orderBy,
    take: limit,
  });

  const remainingLimit = limit ? limit - inStockProducts.length : undefined;

  const outOfStockProducts = (remainingLimit === undefined || remainingLimit > 0) ? await db.product.findMany({
    where: {
      ...where,
      AND: [
        ...baseConditions,
        {
          stock: { lte: 0 },
        },
      ],
    },
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
      const isAInStock = Boolean(a.isActive) && (a.stock ?? 0) > 0 && (a._stock ?? 0) > 0;
      const isBInStock = Boolean(b.isActive) && (b.stock ?? 0) > 0 && (b._stock ?? 0) > 0;
      if (isAInStock && !isBInStock) return -1;
      if (!isAInStock && isBInStock) return 1;
      return b._discountPercent - a._discountPercent;
    });
  } else if (sort === "price-asc" || sort === "price-desc") {
    // fix P1: مرتب‌سازی روی قیمت مؤثر (بعد از تخفیف) — قبلاً price خام بود و
    // محصولات تخفیف‌دار جای غلط می‌گرفتند
    list = list.sort((a, b) => {
      const isAInStock = Boolean(a.isActive) && (a.stock ?? 0) > 0 && (a._stock ?? 0) > 0;
      const isBInStock = Boolean(b.isActive) && (b.stock ?? 0) > 0 && (b._stock ?? 0) > 0;
      if (isAInStock && !isBInStock) return -1;
      if (!isAInStock && isBInStock) return 1;
      return sort === "price-asc"
        ? a._effectivePrice - b._effectivePrice
        : b._effectivePrice - a._effectivePrice;
    });
  } else {
    list.sort((a, b) => {
      const isAInStock = Boolean(a.isActive) && (a.stock ?? 0) > 0 && (a._stock ?? 0) > 0;
      const isBInStock = Boolean(b.isActive) && (b.stock ?? 0) > 0 && (b._stock ?? 0) > 0;
      if (isAInStock && !isBInStock) return -1;
      if (!isAInStock && isBInStock) return 1;
      return 0; // maintain existing order within the same stock group
    });
  }

  return list;
}

export async function getProductBySlug(slug: string) {
  try {
    const raw = (slug || "").trim();
    const decoded = decodeURIComponent(raw).trim();
    const normalized = decoded.replace(/ي/g, "ی").replace(/ك/g, "ک");
    const englishDigits = normalized
      .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
      .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

    const orConditions: any[] = [
      { slug: decoded },
      { slug: raw },
      { slug: normalized },
      { id: decoded },
      { slug: englishDigits },
      { id: englishDigits },
    ];

    const match = englishDigits.match(/^(\d+)/);
    if (match) {
      const prefix = match[1];
      // فقط «{id}-{متن}» — بدون fallback بدون خط تیره، چون prefix مشترک
      // (مثلاً 221 و 2216) می‌توانست محصول اشتباهی را برگرداند
      orConditions.push(
        { slug: { startsWith: `${prefix}-` } },
        { id: prefix },
        { specifications: { contains: `"supplier_product_id":${prefix}` } },
        { specifications: { contains: `"supplier_product_id": ${prefix}` } }
      );
    }

    const product = await db.product.findFirst({
      where: {
        OR: orConditions,
      },
      include: {
        reviews: {
          where: { approved: true },
          orderBy: { createdAt: "desc" },
        },
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
  const mapped = products.slice(0, limit).map(decorate);
  mapped.sort((a, b) => {
    const isAInStock = Boolean(a.isActive) && (a.stock ?? 0) > 0 && (a._stock ?? 0) > 0;
    const isBInStock = Boolean(b.isActive) && (b.stock ?? 0) > 0 && (b._stock ?? 0) > 0;
    if (isAInStock && !isBInStock) return -1;
    if (!isAInStock && isBInStock) return 1;
    return 0;
  });
  return mapped;
}

export async function getBannerProducts(identifiers: string[], fallbackCategory?: string | string[], limit: number = 3, maxPrice?: number): Promise<ProductListItem[]> {
  const idsOrSlugs = identifiers.map(i => i.trim()).filter(Boolean);
  let products: ProductListItem[] = [];
  
  if (idsOrSlugs.length > 0) {
    const fetched = await db.product.findMany({
      where: {
        isActive: true,
        AND: [
          {
            OR: [
              { id: { in: idsOrSlugs } },
              { slug: { in: idsOrSlugs } },
            ],
          },
          { stock: { gt: 0 } },
          ...(maxPrice !== undefined ? [{ price: { lte: maxPrice } }] : []),
        ],
      },
      orderBy: [
        { sortOrder: "asc" },
        { salesCount: "desc" },
      ]
    });
    products = fetched.map(decorate);
    if (idsOrSlugs.length > 0) {
      products.sort((a, b) => {
        const idxA = idsOrSlugs.findIndex(id => id === a.id || id === a.slug);
        const idxB = idsOrSlugs.findIndex(id => id === b.id || id === b.slug);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        return 0;
      });
    }
  }

  if (products.length < limit) {
    const existingIds = products.map(p => p.id);
    const cats = Array.isArray(fallbackCategory) 
      ? fallbackCategory 
      : (fallbackCategory && fallbackCategory !== 'all' ? [fallbackCategory] : []);

    // Expand category aliases (e.g. developer -> dev-tools, design, ai)
    const expandedCats: string[] = [];
    for (const c of cats) {
      if (c === "developer") expandedCats.push("dev-tools", "design", "ai");
      else if (c === "software") expandedCats.push("productivity");
      else if (c === "api-credits") expandedCats.push("dev-tools");
      else expandedCats.push(c);
    }
    
    const fallbackWhere: any = { 
      isActive: true,
      stock: { gt: 0 },
      ...(existingIds.length > 0 ? { id: { notIn: existingIds } } : {}),
      ...(expandedCats.length > 0 ? { category: { in: expandedCats } } : {}),
      ...(maxPrice !== undefined ? { price: { lte: maxPrice } } : {})
    };
    
    let fallbackProducts = await db.product.findMany({
      where: fallbackWhere,
      orderBy: [
        { sortOrder: "asc" },
        { salesCount: "desc" },
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
          ...(maxPrice !== undefined ? { price: { lte: maxPrice } } : {})
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
  
  products = products.slice(0, limit);
  products.sort((a, b) => {
    const isAInStock = Boolean(a.isActive) && (a.stock ?? 0) > 0 && (a._stock ?? 0) > 0;
    const isBInStock = Boolean(b.isActive) && (b.stock ?? 0) > 0 && (b._stock ?? 0) > 0;
    if (isAInStock && !isBInStock) return -1;
    if (!isAInStock && isBInStock) return 1;
    return 0;
  });
  
  if (maxPrice !== undefined) {
    products = products.filter(p => (p.discountPrice ?? p.price) <= maxPrice);
  }
  
  return products;
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
