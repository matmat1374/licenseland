import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

function slugifyFa(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

// GET — list all products (with category + counts)
export async function GET() {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });

  const products = await db.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { licenses: true } },
    },
  });

  const list = products.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    shortDesc: p.shortDesc,
    price: p.price,
    discountPrice: p.discountPrice,
    duration: p.duration,
    category: p.category,
    brand: p.brand,
    tags: p.tags,
    image: p.image,
    rating: p.rating,
    reviewCount: p.reviewCount,
    salesCount: p.salesCount,
    stock: p.stock,
    featured: p.featured,
    bestseller: p.bestseller,
    isActive: p.isActive,
    createdAt: p.createdAt.toISOString(),
    licenseCount: p._count.licenses,
  }));

  return NextResponse.json({ ok: true, products: list });
}

// POST — create product
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });

  try {
    const body = await req.json();
    const {
      title,
      slug,
      shortDesc,
      description,
      features,
      specifications,
      price,
      discountPrice,
      duration,
      category,
      brand,
      tags,
      image,
      featured,
      bestseller,
      isActive,
    } = body || {};

    if (!title || !shortDesc || !description || !category || price == null) {
      return NextResponse.json(
        { ok: false, message: "فیلدهای ضروری ناقص است" },
        { status: 400 }
      );
    }

    const finalSlug = (slug && slug.trim()) || slugifyFa(title);

    // ensure unique slug
    const exists = await db.product.findUnique({ where: { slug: finalSlug } });
    if (exists) {
      return NextResponse.json(
        { ok: false, message: "این شناسه (slug) قبلاً استفاده شده" },
        { status: 400 }
      );
    }

    const product = await db.product.create({
      data: {
        title: title.trim(),
        slug: finalSlug,
        shortDesc: shortDesc.trim(),
        description,
        features: JSON.stringify(Array.isArray(features) ? features : []),
        specifications: specifications ? JSON.stringify(specifications) : null,
        price: Number(price),
        discountPrice: discountPrice ? Number(discountPrice) : null,
        duration: duration || null,
        category,
        brand: brand || null,
        tags: tags || null,
        image: image || null,
        featured: !!featured,
        bestseller: !!bestseller,
        isActive: isActive !== false,
      },
    });

    return NextResponse.json({ ok: true, product });
  } catch (e: any) {
    console.error("admin products POST error:", e);
    return NextResponse.json(
      { ok: false, message: e?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}
