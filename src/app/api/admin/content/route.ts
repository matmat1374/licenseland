import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { DEFAULT_CONTENT, CONTENT_FIELDS } from "@/lib/content";

// GET /api/admin/content
// Returns all content keys merged with defaults — admin reads for editing form
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN")
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });

  const rows = await db.siteContent.findMany();
  const map: Record<string, string> = { ...DEFAULT_CONTENT };
  for (const r of rows) {
    if (r.value !== null && r.value !== undefined) map[r.key] = r.value;
  }

  return NextResponse.json({
    ok: true,
    content: map,
    fields: CONTENT_FIELDS,
  });
}

// POST /api/admin/content
// Body: { content: {key: value, ...} } — upserts each key/value
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN")
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });

  try {
    const body = await req.json();
    const content = body?.content;
    if (!content || typeof content !== "object") {
      return NextResponse.json(
        { ok: false, message: "فرمت داده نامعتبر است (content object مورد نیاز است)" },
        { status: 400 }
      );
    }

    const keys = Object.keys(content);
    let updated = 0;
    for (const key of keys) {
      const value = String(content[key] ?? "");
      await db.siteContent.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
      updated++;
    }

    return NextResponse.json({ ok: true, updated, message: `${updated} فیلد ذخیره شد` });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}
