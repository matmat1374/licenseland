import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
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
