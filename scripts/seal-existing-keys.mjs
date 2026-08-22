// One-time migration: seal existing plaintext license keys with the vault.
// Safe to re-run — sealed rows (SEALED: prefix) are skipped.
// Requires LICENSE_VAULT_KEY in .env (generate with: node scripts/ensure-env.mjs).
import { readFileSync } from "fs";
import { PrismaClient } from "@prisma/client";
import { createCipheriv, randomBytes } from "crypto";

// minimal inline vault (same envelope as kernel/src/security/licenseVault.ts)
// to avoid TS import issues in a plain .mjs script
function assertMasterKey(buf) {
  if (buf.length !== 32) throw new Error("LICENSE_VAULT_KEY must decode to 32 bytes");
  return buf;
}
function seal(plaintext, masterKey, aad) {
  const dek = randomBytes(32);
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", dek, iv);
  c.setAAD(Buffer.from(aad, "utf8"));
  const ct = Buffer.concat([c.update(plaintext, "utf8"), c.final()]);
  const wiv = randomBytes(12);
  const w = createCipheriv("aes-256-gcm", masterKey, wiv);
  w.setAAD(Buffer.from(aad, "utf8"));
  const wk = Buffer.concat([w.update(dek), w.final()]);
  return "SEALED:" + Buffer.from(JSON.stringify({
    ciphertextB64: ct.toString("base64"),
    ivB64: iv.toString("base64"),
    tagB64: c.getAuthTag().toString("base64"),
    wrappedKeyB64: wk.toString("base64"),
    wrapIvB64: wiv.toString("base64"),
    wrapTagB64: w.getAuthTag().toString("base64"),
    aad,
    algorithm: "aes-256-gcm",
    keyVersion: 1,
  }), "utf8").toString("base64");
}

const env = readFileSync(".env", "utf-8");
const keyB64 = env.match(/^LICENSE_VAULT_KEY=(.+)$/m)?.[1]?.trim();
if (!keyB64) { console.error("LICENSE_VAULT_KEY missing in .env"); process.exit(1); }
const masterKey = assertMasterKey(Buffer.from(keyB64, "base64"));

const db = new PrismaClient();
const rows = await db.licenseKey.findMany({ select: { id: true, productId: true, key: true } });
let sealed = 0, skipped = 0;
for (const r of rows) {
  if (r.key.startsWith("SEALED:")) { skipped++; continue; }
  if (!r.key.trim()) { skipped++; continue; }
  await db.licenseKey.update({ where: { id: r.id }, data: { key: seal(r.key.trim(), masterKey, r.productId) } });
  sealed++;
}
console.log(`seal-existing-keys: ${sealed} sealed, ${skipped} already sealed/empty of ${rows.length} total`);
await db.$disconnect();
