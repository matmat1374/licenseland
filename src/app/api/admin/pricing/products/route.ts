import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUsdToTomanRate } from "@/lib/supplier";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") || "all"; // 'all' | 'torob_only' | 'no_torob'
  const search = searchParams.get("search") || "";

  const products = await db.product.findMany({
    where: {
      isActive: true,
      ...(search
        ? {
            OR: [
              { title: { contains: search } },
              { slug: { contains: search } },
              { brand: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      price: true,
      discountPrice: true,
      category: true,
      brand: true,
      image: true,
      specifications: true,
      updatedAt: true,
    },
  });

  const activeUsdRate = await getUsdToTomanRate();

  const formatted = products
    .map((p) => {
      let specs: any = {};
      try {
        specs = typeof p.specifications === "string" ? JSON.parse(p.specifications) : p.specifications || {};
      } catch {}

      const costUsd = Number(specs.price_usd) || null;
      const supplierCostToman = costUsd ? Math.round(costUsd * activeUsdRate) : null;
      const hasTorob = Boolean(specs.torob_url);

      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        currentPrice: p.price,
        discountPrice: p.discountPrice,
        category: p.category,
        brand: p.brand,
        costUsd,
        activeUsdRate,
        supplierCostToman,
        isPriceLocked: Boolean(specs.is_price_locked),
        customMarkup: specs.custom_markup != null ? Number(specs.custom_markup) : null,
        torobUrl: specs.torob_url || null,
        torobUndercut: specs.torob_undercut != null ? Number(specs.torob_undercut) : 5,
        torobFloor: specs.torob_floor != null ? Number(specs.torob_floor) : 15,
        lastTorobPrice: specs.last_torob_price != null ? Number(specs.last_torob_price) : null,
        lastTorobSync: specs.last_torob_sync || null,
        hasTorob,
      };
    })
    .filter((p) => {
      if (filter === "torob_only") return p.hasTorob;
      if (filter === "no_torob") return !p.hasTorob;
      return true;
    });

  return NextResponse.json({
    ok: true,
    products: formatted,
    count: formatted.length,
    activeUsdRate,
  });
}

// Update single product's Torob or pricing configuration
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, torobUrl, torobUndercut, torobFloor, customMarkup, isPriceLocked, price } = body;

    if (!id) return NextResponse.json({ ok: false, message: "شناسه محصول الزامی است" }, { status: 400 });

    const prod = await db.product.findUnique({ where: { id } });
    if (!prod) return NextResponse.json({ ok: false, message: "محصول یافت نشد" }, { status: 404 });

    let specs: any = {};
    try {
      specs = typeof prod.specifications === "string" ? JSON.parse(prod.specifications) : prod.specifications || {};
    } catch {}

    if (torobUrl !== undefined) specs.torob_url = torobUrl ? torobUrl.trim() : null;
    if (torobUndercut !== undefined) specs.torob_undercut = Number(torobUndercut);
    if (torobFloor !== undefined) specs.torob_floor = Number(torobFloor);
    if (customMarkup !== undefined) {
      if (customMarkup !== "" && customMarkup !== null) specs.custom_markup = Number(customMarkup);
      else delete specs.custom_markup;
    }
    if (isPriceLocked !== undefined) specs.is_price_locked = Boolean(isPriceLocked);

    const updateData: any = {
      specifications: JSON.stringify(specs),
    };

    if (price !== undefined && Number(price) > 0) {
      updateData.price = Number(price);
    }

    const updated = await db.product.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ ok: true, product: updated });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e?.message || "خطا در بروزرسانی" }, { status: 500 });
  }
}
