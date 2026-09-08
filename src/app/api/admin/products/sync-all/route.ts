import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { importProductsFromSupplier } from "@/lib/supplier";
import { runTorobRepricer } from "@/lib/repricer";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const runRepricer = body?.repricer !== false;

    // Run sync
    const syncResult = await importProductsFromSupplier();
    
    // Optionally run repricer
    let repricedCount = 0;
    if (runRepricer) {
      const repricerResult = await runTorobRepricer();
      repricedCount = repricerResult.repricedCount || 0;
    }

    // Log sync event to settings table
    await db.setting.upsert({
      where: { key: "last_full_sync_at" },
      update: { value: new Date().toISOString() },
      create: { key: "last_full_sync_at", value: new Date().toISOString() },
    });

    return NextResponse.json({
      ok: true,
      imported: syncResult.imported || 0,
      updated: syncResult.updated || 0,
      skipped: syncResult.skipped || 0,
      repricedCount,
      syncedAt: new Date().toISOString(),
      message: syncResult.message,
    });
  } catch (e: any) {
    console.error("[sync-all] error:", e);
    return NextResponse.json({ ok: false, message: e?.message || "sync failed" }, { status: 500 });
  }
}
