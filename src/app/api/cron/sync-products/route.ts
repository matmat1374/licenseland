import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from 'next/server';
import { importProductsFromSupplier } from '@/lib/supplier';
import { runTorobRepricer } from '@/lib/repricer';
import { repriceAllProductsWithLiveRate } from '@/lib/live-repricer';
import { db } from '@/lib/db';

// GET /api/cron/sync-products?secret=YOUR_SECRET
// Called by external cron, or by the admin panel's auto-sync timer
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  const expectedSecret = process.env.CRON_SECRET;
  
  // Allow from localhost without secret (for admin panel polling)
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";
  const isValidSecret = !!secret && !!expectedSecret && secret === expectedSecret;

  if (!isAdmin && !isValidSecret) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const liveRepriceResult = await repriceAllProductsWithLiveRate();
    const result = await importProductsFromSupplier();
    const repricerResult = await runTorobRepricer();
    
    const syncedAt = new Date().toISOString();
    await db.setting.upsert({
      where: { key: 'last_full_sync_at' },
      update: { value: syncedAt },
      create: { key: 'last_full_sync_at', value: syncedAt },
    });

    return NextResponse.json({
      ok: result.ok,
      imported: result.imported,
      updated: result.updated,
      skipped: result.skipped,
      repriced: repricerResult.repricedCount,
      liveRepriced: liveRepriceResult.updatedCount,
      liveRate: liveRepriceResult.liveRate,
      message: result.message + 
        (repricerResult.repricedCount > 0 ? ` (و ${repricerResult.repricedCount} قیمت توسط ربات ترب بروز شد)` : '') +
        (liveRepriceResult.updatedCount > 0 ? ` (و ${liveRepriceResult.updatedCount} قیمت با نرخ زنده ${liveRepriceResult.liveRate} آپدیت شد)` : ''),
      syncedAt,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e?.message || 'Sync failed' }, { status: 500 });
  }
}
