import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

// GET — return all settings as a key/value map
export async function GET() {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });

  const rows = await db.setting.findMany();
  const settings: Record<string, string> = {};
  for (const r of rows) settings[r.key] = r.value;

  return NextResponse.json({ ok: true, settings });
}

// POST — upsert each key/value (body: { settings: {key: value, ...} })
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });

  try {
    const body = await req.json();
    const settings = body?.settings;
    if (!settings || typeof settings !== "object") {
      return NextResponse.json(
        { ok: false, message: "فرمت داده نامعتبر است" },
        { status: 400 }
      );
    }

    const keys = Object.keys(settings);
    for (const key of keys) {
      const value = String(settings[key] ?? "");
      await db.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }

    return NextResponse.json({ ok: true, updated: keys.length });
  } catch (e: any) {
    console.error("admin settings POST error:", e);
    return NextResponse.json(
      { ok: false, message: e?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}
