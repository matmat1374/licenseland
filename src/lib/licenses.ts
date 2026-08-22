// License key sealing/unsealing around the kernel vault (C5 fix).
//
// Storage format in LicenseKey.key:
//   - sealed:   "SEALED:" + base64(JSON.stringify(SealedLicense))
//   - legacy:   raw plaintext (pre-migration keys; read transparently)
// AAD is the product id, so a sealed blob cannot be replayed onto another product.

import { sealLicense, openLicense, assertMasterKey, type SealedLicense } from "@kernel/security/licenseVault";

const SEALED_PREFIX = "SEALED:";
const KEY_VERSION = Number(process.env.LICENSE_VAULT_KEY_VERSION) || 1;

function getMasterKey(): Buffer {
  const b64 = process.env.LICENSE_VAULT_KEY || "";
  if (!b64) {
    if (process.env.NODE_ENV !== "production") {
      // deterministic dev key so local databases stay readable across restarts
      return assertMasterKey(Buffer.alloc(32, 0x42));
    }
    throw new Error("LICENSE_VAULT_KEY is required in production");
  }
  return assertMasterKey(Buffer.from(b64, "base64"));
}

export function isSealedKey(raw: string): boolean {
  return typeof raw === "string" && raw.startsWith(SEALED_PREFIX);
}

/** Seal a plaintext key for storage. */
export function sealKey(productId: string, plaintext: string): string {
  const sealed = sealLicense({
    plaintext: plaintext.trim(),
    masterKey: getMasterKey(),
    aad: productId,
    keyVersion: KEY_VERSION,
  });
  return SEALED_PREFIX + Buffer.from(JSON.stringify(sealed), "utf-8").toString("base64");
}

/** Open a stored key. Legacy plaintext rows pass through unchanged. */
export function openKey(productId: string, raw: string): string {
  if (!isSealedKey(raw)) return raw;
  const sealed: SealedLicense = JSON.parse(Buffer.from(raw.slice(SEALED_PREFIX.length), "base64").toString("utf-8"));
  return openLicense(sealed, getMasterKey());
}

/** Batch-open, resilient: a corrupted row yields null instead of throwing. */
export function openKeys(productId: string, rows: { id: string; key: string }[]): { id: string; key: string }[] {
  return rows.map((r) => {
    try {
      return { id: r.id, key: openKey(productId, r.key) };
    } catch {
      return { id: r.id, key: "" };
    }
  });
}
