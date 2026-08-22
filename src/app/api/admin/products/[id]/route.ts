import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });

  const { id } = await params;
  const product = await db.product.findUnique({
    where: { id },
    include: { _count: { select: { licenses: true } } },
  });
  if (!product)
    return NextResponse.json({ ok: false, message: "یافت نشد" }, { status: 404 });

  return NextResponse.json({
    ok: true,
    product: {
      ...product,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      licenseCount: product._count.licenses,
      _count: undefined,
    },
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });

  const { id } = await params;
  try {
    const body = await req.json();
    const existing = await db.product.findUnique({ where: { id } });
    if (!existing)
      return NextResponse.json({ ok: false, message: "یافت نشد" }, { status: 404 });

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

    // If slug changed, ensure unique
    if (slug && slug !== existing.slug) {
      const dup = await db.product.findUnique({ where: { slug } });
      if (dup && dup.id !== id) {
        return NextResponse.json(
          { ok: false, message: "این شناسه (slug) قبلاً استفاده شده" },
          { status: 400 }
        );
      }
    }

    const updated = await db.product.update({
      where: { id },
      data: {
        title: title?.trim() ?? existing.title,
        slug: slug?.trim() || existing.slug,
        shortDesc: shortDesc?.trim() ?? existing.shortDesc,
        description: description ?? existing.description,
        features:
          features !== undefined
            ? JSON.stringify(Array.isArray(features) ? features : [])
            : existing.features,
        specifications:
          specifications !== undefined
            ? specifications
              ? JSON.stringify(specifications)
              : null
            : existing.specifications,
        price: price != null ? Number(price) : existing.price,
        discountPrice:
          discountPrice != null
            ? discountPrice
              ? Number(discountPrice)
              : null
            : existing.discountPrice,
        duration: duration !== undefined ? duration || null : existing.duration,
        category: category ?? existing.category,
        brand: brand !== undefined ? brand || null : existing.brand,
        tags: tags !== undefined ? tags || null : existing.tags,
        image: image !== undefined ? image || null : existing.image,
        featured: featured !== undefined ? !!featured : existing.featured,
        bestseller: bestseller !== undefined ? !!bestseller : existing.bestseller,
        isActive: isActive !== undefined ? !!isActive : existing.isActive,
      },
    });

    return NextResponse.json({ ok: true, product: updated });
  } catch (e: any) {
    console.error("admin products PUT error:", e);
    return NextResponse.json(
      { ok: false, message: e?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });

  const { id } = await params;
  try {
    const body = await req.json();
    const allowed = ["featured", "bestseller", "isActive"] as const;
    const data: Record<string, boolean> = {};
    for (const k of allowed) {
      if (typeof body[k] === "boolean") data[k] = body[k];
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { ok: false, message: "هیچ فیلدی برای بروزرسانی ارسال نشد" },
        { status: 400 }
      );
    }
    const updated = await db.product.update({ where: { id }, data });
    return NextResponse.json({ ok: true, product: updated });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });

  const { id } = await params;
  try {
    // Check for related order items — prevent delete if used
    const usedItems = await db.orderItem.findFirst({ where: { productId: id } });
    if (usedItems) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "این محصول در سفارش‌ها استفاده شده و قابل حذف نیست. می‌توانید آن را غیرفعال کنید.",
        },
        { status: 400 }
      );
    }
    await db.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}
