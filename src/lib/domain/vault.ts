// Domain adapter: AES-256-GCM license encryption
import { sealLicense, openLicense, assertMasterKey, type SealedLicense } from "../../../kernel/dist/security/licenseVault.js";

const MASTER_KEY_B64 = process.env.LICENSE_VAULT_KEY || "";
const KEY_VERSION = Number(process.env.LICENSE_VAULT_KEY_VERSION) || 1;

function getMasterKey(): Buffer {
  if (!MASTER_KEY_B64) {
    if (process.env.NODE_ENV !== "production") {
      return Buffer.alloc(32, 0x42);
    }
    throw new Error("LICENSE_VAULT_KEY is required in production");
  }
  const key = Buffer.from(MASTER_KEY_B64, "base64");
  return assertMasterKey(key);
}

export async function seal(args: { orderId: string; payload: string }): Promise<SealedLicense> {
  return sealLicense({
    plaintext: args.payload,
    masterKey: getMasterKey(),
    aad: args.orderId,
    keyVersion: KEY_VERSION,
  });
}

export async function open(args: { orderId: string; sealed: SealedLicense }): Promise<string> {
  return openLicense(args.sealed, getMasterKey());
}

export { sealLicense, openLicense };
export type { SealedLicense };
