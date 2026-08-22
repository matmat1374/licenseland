import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

// GET — list licenses, optionally filtered by ?productId=...
export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");

  const where = productId ? { productId } : {};
  const licenses = await db.licenseKey.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { product: { select: { title: true, slug: true } } },
    take: productId ? 1000 : 100,
  });

  const list = licenses.map((l) => ({
    id: l.id,
    productId: l.productId,
    productTitle: l.product.title,
    productSlug: l.product.slug,
    key: l.key,
    note: l.note,
    status: l.status,
    source: l.source,
    orderItemId: l.orderItemId,
    createdAt: l.createdAt.toISOString(),
    soldAt: l.soldAt?.toISOString() || null,
  }));

  return NextResponse.json({ ok: true, licenses: list });
}

// POST — bulk add license keys
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });

  try {
    const body = await req.json();
    const { productId, keys } = body || {};
    if (!productId) {
      return NextResponse.json(
        { ok: false, message: "شناسه محصول الزامی است" },
        { status: 400 }
      );
    }
    if (!Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json(
        { ok: false, message: "هیچ کلیدی ارسال نشده" },
        { status: 400 }
      );
    }

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json(
        { ok: false, message: "محصول یافت نشد" },
        { status: 404 }
      );
    }

    // Filter invalid entries (key required)
    const valid = keys
      .map((k: any) => ({
        key: String(k?.key || k || "").trim(),
        note: k?.note ? String(k.note).trim() : null,
      }))
      .filter((k) => k.key.length > 0);

    if (valid.length === 0) {
      return NextResponse.json(
        { ok: false, message: "هیچ کلید معتبری یافت نشد" },
        { status: 400 }
      );
    }

    await db.licenseKey.createMany({
      data: valid.map((v) => ({
        productId,
        key: v.key,
        note: v.note,
        status: "AVAILABLE",
        source: "manual",
      })),
    });

    // Recount available + update stock
    const availableCount = await db.licenseKey.count({
      where: { productId, status: "AVAILABLE" },
    });
    await db.product.update({
      where: { id: productId },
      data: { stock: availableCount },
    });

    return NextResponse.json({
      ok: true,
      added: valid.length,
      stock: availableCount,
    });
  } catch (e: any) {
    console.error("admin licenses POST error:", e);
    return NextResponse.json(
      { ok: false, message: e?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}
