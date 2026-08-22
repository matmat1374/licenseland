import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/crypto";
import { logger } from "@/lib/logger";

// Normalize an Iranian mobile number to 09xxxxxxxxx
export function normalizePhone(input: string): string {
  let p = input.replace(/[\s\-()]/g, "");
  if (p.startsWith("+98")) p = "0" + p.slice(3);
  else if (p.startsWith("0098")) p = "0" + p.slice(4);
  else if (p.startsWith("98") && p.length === 12) p = "0" + p.slice(2);
  return p;
}

export function isPhone(input: string): boolean {
  return /^(\+?98|0)?9\d{9}$/.test(input.replace(/[\s\-()]/g, ""));
}

// Secret must come from env — NO hardcoded fallback (security: source code is public on GitHub)
const AUTH_SECRET = process.env.NEXTAUTH_SECRET;
if (!AUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET is required. Set it in .env (see .env.example)");
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  // Trust the X-Forwarded-Host header from the gateway.
  ...({ trustHost: true } as any),
  providers: [
    CredentialsProvider({
      name: "ایمیل / موبایل و رمز عبور",
      credentials: {
        identifier: { label: "ایمیل یا موبایل", type: "text" },
        password: { label: "رمز عبور", type: "password" },
      },
      async authorize(credentials) {
        logger.info("auth.authorize called", { identifier: credentials?.identifier?.slice(0, 30) });
        if (!credentials?.identifier || !credentials?.password) {
          logger.warn("auth.authorize: missing credentials");
          return null;
        }
        const raw = credentials.identifier.trim();
        let user: Awaited<ReturnType<typeof db.user.findUnique>> = null;
        try {
          if (isPhone(raw)) {
            user = await db.user.findUnique({ where: { phone: normalizePhone(raw) } });
            logger.info("auth.authorize: phone lookup", { found: !!user });
          } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
            user = await db.user.findUnique({ where: { email: raw.toLowerCase() } });
            logger.info("auth.authorize: email lookup", { found: !!user });
          } else {
            user = await db.user.findUnique({ where: { email: raw.toLowerCase() } });
            logger.info("auth.authorize: fallback email lookup", { found: !!user });
          }
        } catch (e: any) {
          logger.error("auth.authorize: DB error", { message: e?.message });
          return null;
        }
        if (!user) {
          logger.warn("auth.authorize: user not found");
          return null;
        }
        const ok = verifyPassword(credentials.password, user.password);
        logger.info("auth.authorize: password verify", { ok });
        if (!ok) return null;
        logger.info("auth.authorize: success", { id: user.id, role: user.role });
        return {
          id: user.id,
          email: user.email,
          name: user.name || undefined,
          role: user.role,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role || "USER";
        token.id = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  secret: AUTH_SECRET,
};

// Extend types
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      role?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    id?: string;
  }
}
