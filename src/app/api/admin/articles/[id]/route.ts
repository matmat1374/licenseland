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
  const article = await db.article.findUnique({ where: { id } });
  if (!article)
    return NextResponse.json({ ok: false, message: "یافت نشد" }, { status: 404 });

  return NextResponse.json({
    ok: true,
    article: {
      ...article,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
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
    const existing = await db.article.findUnique({ where: { id } });
    if (!existing)
      return NextResponse.json({ ok: false, message: "یافت نشد" }, { status: 404 });

    const {
      title,
      slug,
      excerpt,
      content,
      category,
      tags,
      readingMinutes,
      published,
      featured,
      seoTitle,
      seoDescription,
      cover,
    } = body || {};

    if (slug && slug !== existing.slug) {
      const dup = await db.article.findUnique({ where: { slug } });
      if (dup && dup.id !== id) {
        return NextResponse.json(
          { ok: false, message: "این شناسه (slug) قبلاً استفاده شده" },
          { status: 400 }
        );
      }
    }

    const updated = await db.article.update({
      where: { id },
      data: {
        title: title?.trim() ?? existing.title,
        slug: slug?.trim() || existing.slug,
        excerpt: excerpt?.trim() ?? existing.excerpt,
        content: content ?? existing.content,
        category: category ?? existing.category,
        tags: tags !== undefined ? tags || null : existing.tags,
        readingMinutes:
          readingMinutes != null ? Number(readingMinutes) || 5 : existing.readingMinutes,
        published: published !== undefined ? !!published : existing.published,
        featured: featured !== undefined ? !!featured : existing.featured,
        seoTitle: seoTitle !== undefined ? seoTitle || null : existing.seoTitle,
        seoDescription:
          seoDescription !== undefined
            ? seoDescription || null
            : existing.seoDescription,
        cover: cover !== undefined ? cover || null : existing.cover,
      },
    });

    return NextResponse.json({ ok: true, article: updated });
  } catch (e: any) {
    console.error("admin articles PUT error:", e);
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
    await db.article.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}
