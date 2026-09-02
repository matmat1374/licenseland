import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runTorobRepricer } from "@/lib/repricer";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    const result = await runTorobRepricer();
    return NextResponse.json({
      ok: result.ok,
      repricedCount: result.repricedCount,
      failedCount: result.failedCount,
      details: result.details,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e?.message || "خطا در اجرای ربات ترب" }, { status: 500 });
  }
}
