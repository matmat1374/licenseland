import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/health — used by Docker HEALTHCHECK and load balancers.
// Returns 200 if app boots and DB is reachable, 503 otherwise.
export async function GET() {
  let dbStatus: "connected" | "error" = "error";

  try {
    // Lightweight DB ping — `$queryRaw` works across SQLite and PostgreSQL
    // providers without any model-specific knowledge.
    await db.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch (err) {
    console.error("[health] DB ping failed:", err);
    dbStatus = "error";
  }

  const ok = dbStatus === "connected";
  return NextResponse.json(
    {
      ok,
      db: dbStatus,
      timestamp: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 }
  );
}
