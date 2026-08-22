import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requestLicenseFromSupplier } from "@/lib/supplier";

// POST /api/supplier/request
// Admin manually requests license keys from the supplier for a product.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN")
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });

  const body = await req.json();
  const { productId, quantity, note } = body;
  if (!productId) return NextResponse.json({ ok: false, message: "productId الزامی است" }, { status: 400 });
  const qty = Number(quantity) || 1;
  if (qty < 1 || qty > 100) return NextResponse.json({ ok: false, message: "تعداد باید بین ۱ تا ۱۰۰ باشد" }, { status: 400 });

  const result = await requestLicenseFromSupplier(productId, qty, session.user.id, note);
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
