import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  // dev-only diagnostics endpoint (H5 fix): 404 in production, admin-only otherwise
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });
  }
  const headers = Object.fromEntries(req.headers.entries());
  return NextResponse.json({
    url: req.url,
    host: headers["host"],
    xForwardedHost: headers["x-forwarded-host"],
    xForwardedProto: headers["x-forwarded-proto"],
    xRealIp: headers["x-real-ip"],
    cookiePresent: !!headers["cookie"],
    cookieLength: headers["cookie"]?.length || 0,
    cookieNames: headers["cookie"]?.split(";").map(c => c.trim().split("=")[0]) || [],
    hasSession: !!session,
    sessionUser: session?.user || null,
  });
}
