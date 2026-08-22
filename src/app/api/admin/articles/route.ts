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

// GET — list all articles
export async function GET() {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });

  const articles = await db.article.findMany({
    orderBy: { createdAt: "desc" },
  });

  const list = articles.map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    excerpt: a.excerpt,
    category: a.category,
    tags: a.tags,
    readingMinutes: a.readingMinutes,
    published: a.published,
    featured: a.featured,
    seoTitle: a.seoTitle,
    seoDescription: a.seoDescription,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  return NextResponse.json({ ok: true, articles: list });
}

// POST — create article
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });

  try {
    const body = await req.json();
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

    if (!title || !excerpt || !content) {
      return NextResponse.json(
        { ok: false, message: "عنوان، خلاصه و محتوا الزامی است" },
        { status: 400 }
      );
    }

    const finalSlug = (slug && slug.trim()) || slugifyFa(title);

    const exists = await db.article.findUnique({ where: { slug: finalSlug } });
    if (exists) {
      return NextResponse.json(
        { ok: false, message: "این شناسه (slug) قبلاً استفاده شده" },
        { status: 400 }
      );
    }

    const article = await db.article.create({
      data: {
        title: title.trim(),
        slug: finalSlug,
        excerpt: excerpt.trim(),
        content,
        category: category || "عمومی",
        tags: tags || null,
        readingMinutes: Number(readingMinutes) || 5,
        published: published !== false,
        featured: !!featured,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        cover: cover || null,
      },
    });

    return NextResponse.json({ ok: true, article });
  } catch (e: any) {
    console.error("admin articles POST error:", e);
    return NextResponse.json(
      { ok: false, message: e?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}
