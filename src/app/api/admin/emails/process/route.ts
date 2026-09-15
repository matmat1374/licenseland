import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-guard";
import { processEmailQueue, activeProvider } from "@/lib/email-infra";

// POST /api/admin/emails/process  -> drain due queue rows (also runs on the worker timer)
export async function POST(req: Request) {
  const denied = await requireAdminSession();
  if (denied) return NextResponse.json(denied.body, { status: denied.status });
  const body = await req.json().catch(() => ({}));
  const limit = Math.min(Math.max(Number(body.limit) || 20, 1), 100);
  const report = await processEmailQueue(limit);
  return NextResponse.json({ ok: true, provider: activeProvider(), ...report });
}
