import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { importProductsFromSupplier } from "@/lib/supplier";

// POST /api/supplier/import
// Admin triggers a full product import from the supplier's API with markup.
// Body: { apiUrl?, apiKey?, markupPercent? }  (falls back to env vars)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN")
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const apiUrl = body.apiUrl;
  const apiKey = body.apiKey;
  const markup = Number(body.markupPercent) || 200;

  const result = await importProductsFromSupplier(apiUrl, apiKey, markup);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
