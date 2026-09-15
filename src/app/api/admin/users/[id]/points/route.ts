import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { addBonusPoints } from "@/lib/loyalty";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const points = Number(body.points);
    const description = body.description ? String(body.description).trim() : "امتیاز تشویقی مدیریت";

    if (isNaN(points) || points <= 0) {
      return NextResponse.json({ ok: false, message: "مقدار امتیاز باید عدد مثبت باشد" }, { status: 400 });
    }

    await addBonusPoints(id, points, description);

    return NextResponse.json({ ok: true, message: "امتیاز با موفقیت افزوده شد" });
  } catch (error) {
    console.error("Admin Add Bonus API Error", error);
    return NextResponse.json({ ok: false, message: "Internal server error" }, { status: 500 });
  }
}
