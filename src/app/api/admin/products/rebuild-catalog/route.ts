import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { rebuildSupplierCatalog } from "@/lib/supplier";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز (نیاز به دسترسی مدیر)" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const cleanFirst = Boolean(body?.cleanFirst);
    const markupPercent = typeof body?.markupPercent === "number" ? body.markupPercent : null;
    const apiUrl = body?.apiUrl || undefined;
    const apiKey = body?.apiKey || undefined;

    const result = await rebuildSupplierCatalog({
      cleanFirst,
      markupPercent,
      apiUrl,
      apiKey,
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (e: any) {
    console.error("[rebuild-catalog] error:", e);
    return NextResponse.json(
      {
        ok: false,
        message: e?.message || "خطای پیش‌بینی نشده در بازسازی کاتالوگ",
        details: [e?.stack || ""],
      },
      { status: 500 }
    );
  }
}
