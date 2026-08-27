import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const SECRET = process.env.NEXTAUTH_SECRET || "";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApiRoute = pathname.startsWith("/api/");
  const token = await getToken({ req, secret: SECRET });

  if (!token) {
    // API routes get JSON 401, page routes get redirected to login
    if (isApiRoute) {
      return NextResponse.json(
        { ok: false, message: "احراز هویت نشده" },
        { status: 401 }
      );
    }
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = `?callbackUrl=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(loginUrl);
  }

  // Admin role check — covers BOTH /admin/* pages AND /api/admin/* endpoints
  if ((pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) && token.role !== "ADMIN") {
    if (isApiRoute) {
      return NextResponse.json(
        { ok: false, message: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }
    const dashUrl = req.nextUrl.clone();
    dashUrl.pathname = "/dashboard";
    dashUrl.search = "";
    return NextResponse.redirect(dashUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/api/profile/:path*", "/api/admin/:path*"],
};
