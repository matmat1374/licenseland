import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto"

/**
 * Envelope encryption for delivered license credentials.
 *
 * - Per-record data key (DEK), AES-256-GCM.
 * - DEK wrapped with the master key (KEK) from ENV, AES-256-GCM.
 * - Order id is bound as additional authenticated data, so a ciphertext cannot
 *   be replayed onto another order.
 */
export type SealedLicense = {
	readonly ciphertextB64: string
	readonly ivB64: string
	readonly tagB64: string
	readonly wrappedKeyB64: string
	readonly wrapIvB64: string
	readonly wrapTagB64: string
	readonly aad: string
	readonly algorithm: "aes-256-gcm"
	readonly keyVersion: number
}

export class VaultError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "VaultError"
	}
}

export function assertMasterKey(masterKey: Buffer): Buffer {
	if (masterKey.length !== 32) {
		throw new VaultError("master key must be exactly 32 bytes (256-bit)")
	}
	return masterKey
}

export function sealLicense(args: {
	plaintext: string
	masterKey: Buffer
	aad: string
	keyVersion?: number
}): SealedLicense {
	assertMasterKey(args.masterKey)
	if (args.plaintext.length === 0) {
		throw new VaultError("refusing to seal an empty license payload")
	}
	const dek = randomBytes(32)
	const iv = randomBytes(12)
	const cipher = createCipheriv("aes-256-gcm", dek, iv)
	cipher.setAAD(Buffer.from(args.aad, "utf8"))
	const ciphertext = Buffer.concat([cipher.update(args.plaintext, "utf8"), cipher.final()])
	const tag = cipher.getAuthTag()

	const wrapIv = randomBytes(12)
	const wrapCipher = createCipheriv("aes-256-gcm", args.masterKey, wrapIv)
	wrapCipher.setAAD(Buffer.from(args.aad, "utf8"))
	const wrappedKey = Buffer.concat([wrapCipher.update(dek), wrapCipher.final()])
	const wrapTag = wrapCipher.getAuthTag()

	return {
		ciphertextB64: ciphertext.toString("base64"),
		ivB64: iv.toString("base64"),
		tagB64: tag.toString("base64"),
		wrappedKeyB64: wrappedKey.toString("base64"),
		wrapIvB64: wrapIv.toString("base64"),
		wrapTagB64: wrapTag.toString("base64"),
		aad: args.aad,
		algorithm: "aes-256-gcm",
		keyVersion: args.keyVersion ?? 1,
	}
}

export function openLicense(sealed: SealedLicense, masterKey: Buffer): string {
	assertMasterKey(masterKey)
	const aad = Buffer.from(sealed.aad, "utf8")
	try {
		const unwrap = createDecipheriv("aes-256-gcm", masterKey, Buffer.from(sealed.wrapIvB64, "base64"))
		unwrap.setAAD(aad)
		unwrap.setAuthTag(Buffer.from(sealed.wrapTagB64, "base64"))
		const dek = Buffer.concat([unwrap.update(Buffer.from(sealed.wrappedKeyB64, "base64")), unwrap.final()])

		const decipher = createDecipheriv("aes-256-gcm", dek, Buffer.from(sealed.ivB64, "base64"))
		decipher.setAAD(aad)
		decipher.setAuthTag(Buffer.from(sealed.tagB64, "base64"))
		const plaintext = Buffer.concat([
			decipher.update(Buffer.from(sealed.ciphertextB64, "base64")),
			decipher.final(),
		])
		return plaintext.toString("utf8")
	} catch {
		throw new VaultError("license payload failed authentication (tampered, wrong key, or wrong order)")
	}
}

/** Timing-safe HMAC-SHA256 verification for the supplier `X-Signature` header. */
export function verifyWebhookSignature(args: { secret: string; rawBody: string; signatureHex: string }): boolean {
	const expected = createHmac("sha256", args.secret).update(args.rawBody, "utf8").digest()
	// Buffer.from(..., "hex") never throws: invalid characters are dropped, which
	// the length check below turns into a rejection.
	const received = Buffer.from(args.signatureHex, "hex")
	if (received.length !== expected.length) {
		return false
	}
	return timingSafeEqual(expected, received)
}
