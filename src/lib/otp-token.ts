import { createHmac, timingSafeEqual } from "crypto";

function getSecret(): string {
  if (!process.env.NEXTAUTH_SECRET) {
    throw new Error("NEXTAUTH_SECRET environment variable is not set");
  }
  return process.env.NEXTAUTH_SECRET;
}

export function signOtpLoginToken(phone: string, userId: string): string {
  const SECRET = getSecret();
  const timestamp = Date.now();
  const payload = `${phone}:${userId}:${timestamp}`;
  const hmac = createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${timestamp}:${hmac}`;
}

export function verifyOtpLoginToken(phone: string, userId: string, token: string): boolean {
  const SECRET = getSecret();
  const parts = token.split(":");
  if (parts.length !== 2) return false;
  const [timestampStr, receivedHmac] = parts;
  const timestamp = Number(timestampStr);
  if (isNaN(timestamp) || Date.now() - timestamp > 2 * 60 * 1000 || timestamp > Date.now() + 5000) {
    return false; // Expired or future timestamp
  }
  const payload = `${phone}:${userId}:${timestamp}`;
  const expectedHmac = createHmac("sha256", SECRET).update(payload).digest("hex");
  if (expectedHmac.length !== receivedHmac.length) return false;
  return timingSafeEqual(Buffer.from(expectedHmac), Buffer.from(receivedHmac));
}
