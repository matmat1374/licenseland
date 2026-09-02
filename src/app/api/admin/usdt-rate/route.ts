import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUsdToTomanRate, fetchLiveUsdtRate } from '@/lib/supplier';
import { db } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') return NextResponse.json({ ok: false, message: 'دسترسی غیرمجاز' }, { status: 403 });

  const [modeSetting, manualSetting, autoSetting] = await Promise.all([
    db.setting.findUnique({ where: { key: 'usd_rate_mode' } }).catch(() => null),
    db.setting.findUnique({ where: { key: 'usd_to_toman_rate' } }).catch(() => null),
    db.setting.findUnique({ where: { key: 'usd_to_toman_rate_auto' } }).catch(() => null),
  ]);

  const mode = modeSetting?.value || 'auto';
  let currentRate = Number(manualSetting?.value) || 205000;
  let autoRate = Number(autoSetting?.value) || null;

  if (mode === 'auto') {
    const live = await fetchLiveUsdtRate();
    if (live) {
      currentRate = live;
      autoRate = live;
    } else if (autoRate) {
      currentRate = autoRate;
    }
  }

  return NextResponse.json({
    ok: true,
    rate: currentRate,
    mode,
    autoRate,
    manualRate: Number(manualSetting?.value) || 205000,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') return NextResponse.json({ ok: false, message: 'دسترسی غیرمجاز' }, { status: 403 });

  try {
    const body = await req.json();
    const { mode, manualRate } = body || {};

    if (mode === 'manual' || mode === 'auto') {
      await db.setting.upsert({
        where: { key: 'usd_rate_mode' },
        create: { key: 'usd_rate_mode', value: mode },
        update: { value: mode },
      });
    }

    if (manualRate && Number(manualRate) > 1000) {
      await db.setting.upsert({
        where: { key: 'usd_to_toman_rate' },
        create: { key: 'usd_to_toman_rate', value: String(Math.round(Number(manualRate))) },
        update: { value: String(Math.round(Number(manualRate))) },
      });
    }

    const newRate = await getUsdToTomanRate();
    return NextResponse.json({ ok: true, rate: newRate, mode });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e?.message || 'خطا در ثبت تنظیمات' }, { status: 500 });
  }
}
