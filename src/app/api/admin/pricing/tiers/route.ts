import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  DEFAULT_PRICING_TIERS,
  loadPricingTiers,
  savePricingTiers,
  PricingTier,
} from "@/lib/pricing-calculator";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/pricing/tiers
 * Returns current pricing tiers and system defaults
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    const tiers = await loadPricingTiers();
    return NextResponse.json({
      ok: true,
      tiers,
      defaultTiers: DEFAULT_PRICING_TIERS,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error?.message || "خطا در دریافت پلکان‌های قیمت‌گذاری" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/pricing/tiers
 * Validates and saves pricing tiers
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const rawTiers = body.tiers;

    if (!Array.isArray(rawTiers) || rawTiers.length === 0) {
      return NextResponse.json(
        { ok: false, message: "حداقل یک پله قیمت‌گذاری باید مشخص شود" },
        { status: 400 }
      );
    }

    const validatedTiers: PricingTier[] = [];
    for (const t of rawTiers) {
      const maxUsd = t.maxUsd === null || t.maxUsd === undefined || t.maxUsd === ""
        ? null
        : Number(t.maxUsd);

      const markupPercent = Number(t.markupPercent);

      if (isNaN(markupPercent) || markupPercent < 0) {
        return NextResponse.json(
          { ok: false, message: "درصد سود باید یک عدد مثبت باشد" },
          { status: 400 }
        );
      }

      validatedTiers.push({
        maxUsd: maxUsd !== null && !isNaN(maxUsd) && maxUsd > 0 ? maxUsd : null,
        markupPercent,
      });
    }

    // Sort ascending by maxUsd, placing null at the end
    validatedTiers.sort((a, b) => {
      const aVal = a.maxUsd === null ? Number.POSITIVE_INFINITY : a.maxUsd;
      const bVal = b.maxUsd === null ? Number.POSITIVE_INFINITY : b.maxUsd;
      return aVal - bVal;
    });

    await savePricingTiers(validatedTiers);

    return NextResponse.json({
      ok: true,
      message: "پلکان‌های قیمت‌گذاری با موفقیت ذخیره شدند",
      tiers: validatedTiers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error?.message || "خطا در ذخیره پلکان‌های قیمت‌گذاری" },
      { status: 500 }
    );
  }
}
