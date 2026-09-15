import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLoyalty, TIERS } from "@/lib/loyalty";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const loyalty = await getLoyalty(session.user.id);
    const badges = await db.userBadge.findMany({
      where: { userId: session.user.id },
      orderBy: { awardedAt: "desc" },
    });
    const events = await db.pointEvent.findMany({
      where: { loyaltyId: loyalty.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      ok: true,
      loyalty,
      badges,
      events,
      tiers: TIERS,
    });
  } catch (error) {
    console.error("Profile Loyalty API Error", error);
    return NextResponse.json({ ok: false, message: "Internal server error" }, { status: 500 });
  }
}
