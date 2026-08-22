import { createHmac, timingSafeEqual } from "crypto";

/**
 * Signed access tokens for guest order pages.
 *
 * Guests have no session, so /order/[id] authorization uses an HMAC-SHA256
 * token bound to the order id (C1 fix). Issued server-side at payment
 * verification; cannot be forged without NEXTAUTH_SECRET.
 */

const SECRET = process.env.NEXTAUTH_SECRET || "";

function hmac(orderId: string): Buffer {
  if (!SECRET) throw new Error("NEXTAUTH_SECRET is required for order access tokens");
  return createHmac("sha256", SECRET).update(`order-access:${orderId}`).digest();
}

export function signOrderAccessToken(orderId: string): string {
  return hmac(orderId).toString("base64url");
}

export function verifyOrderAccessToken(orderId: string, token: string | undefined | null): boolean {
  if (!token || !SECRET) return false;
  const expected = hmac(orderId);
  const received = Buffer.from(token, "base64url");
  if (received.length !== expected.length) return false;
  return timingSafeEqual(expected, received);
}
