import { createHash, randomBytes, pbkdf2Sync } from "crypto";

const ITERATIONS = 10000;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const verify = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, "sha512").toString("hex");
  // timing-safe compare
  if (verify.length !== hash.length) return false;
  let diff = 0;
  for (let i = 0; i < verify.length; i++) {
    diff |= verify.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  return diff === 0;
}

export function sha1(input: string): string {
  return createHash("sha1").update(input).digest("hex");
}
