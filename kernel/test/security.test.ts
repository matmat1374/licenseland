import assert from "node:assert/strict"
import { createHmac, randomBytes } from "node:crypto"
import { test } from "node:test"
import {
	VaultError,
	assertMasterKey,
	openLicense,
	sealLicense,
	verifyWebhookSignature,
} from "../src/security/licenseVault.ts"
import { maskSecret, redact } from "../src/shared/redact.ts"

const MASTER_KEY = Buffer.alloc(32, 7)
const OTHER_KEY = Buffer.alloc(32, 9)

test("the master key must be 256-bit", () => {
	assert.equal(assertMasterKey(MASTER_KEY).length, 32)
	assert.throws(() => assertMasterKey(Buffer.alloc(16, 1)), VaultError)
	assert.throws(() => sealLicense({ plaintext: "x", masterKey: Buffer.alloc(31), aad: "order:1" }), VaultError)
	assert.throws(
		() => openLicense(sealLicense({ plaintext: "x", masterKey: MASTER_KEY, aad: "order:1" }), Buffer.alloc(8)),
		VaultError,
	)
})

test("a sealed license round-trips and records the key version", () => {
	const sealed = sealLicense({ plaintext: "user@example.com:Passw0rd", masterKey: MASTER_KEY, aad: "order:o1" })
	assert.equal(sealed.algorithm, "aes-256-gcm")
	assert.equal(sealed.keyVersion, 1)
	assert.equal(sealed.aad, "order:o1")
	assert.equal(sealed.ciphertextB64.includes("Passw0rd"), false)
	assert.equal(openLicense(sealed, MASTER_KEY), "user@example.com:Passw0rd")

	const rotated = sealLicense({ plaintext: "k", masterKey: MASTER_KEY, aad: "order:o1", keyVersion: 4 })
	assert.equal(rotated.keyVersion, 4)
	assert.equal(openLicense(rotated, MASTER_KEY), "k")

	// Two seals of the same payload must not produce the same ciphertext.
	const again = sealLicense({ plaintext: "k", masterKey: MASTER_KEY, aad: "order:o1" })
	assert.notEqual(again.ciphertextB64 + again.ivB64, rotated.ciphertextB64 + rotated.ivB64)
})

test("empty payloads are refused", () => {
	assert.throws(() => sealLicense({ plaintext: "", masterKey: MASTER_KEY, aad: "order:o1" }), VaultError)
})

test("tampering, key swapping and order swapping all fail authentication", () => {
	const sealed = sealLicense({ plaintext: "secret-license", masterKey: MASTER_KEY, aad: "order:o1" })
	assert.throws(() => openLicense(sealed, OTHER_KEY), VaultError)
	assert.throws(() => openLicense({ ...sealed, aad: "order:o2" }, MASTER_KEY), VaultError)
	const tamperedCiphertext = Buffer.from(sealed.ciphertextB64, "base64")
	tamperedCiphertext[0] ^= 0xff
	assert.throws(
		() => openLicense({ ...sealed, ciphertextB64: tamperedCiphertext.toString("base64") }, MASTER_KEY),
		VaultError,
	)
	const tamperedKey = Buffer.from(sealed.wrappedKeyB64, "base64")
	tamperedKey[0] ^= 0xff
	assert.throws(() => openLicense({ ...sealed, wrappedKeyB64: tamperedKey.toString("base64") }, MASTER_KEY), VaultError)
})

test("webhook signatures are verified, not trusted", () => {
	const secret = randomBytes(24).toString("hex")
	const body = JSON.stringify({ event: "order.updated", order_id: 9_001, status: "delivered" })
	const valid = createHmac("sha256", secret).update(body, "utf8").digest("hex")
	assert.equal(verifyWebhookSignature({ secret, rawBody: body, signatureHex: valid }), true)
	// Same length, wrong bytes.
	const wrong = createHmac("sha256", secret).update(`${body} `, "utf8").digest("hex")
	assert.equal(verifyWebhookSignature({ secret, rawBody: body, signatureHex: wrong }), false)
	// Wrong secret (rotated at the supplier without updating ENV).
	const otherSecret = createHmac("sha256", "rotated").update(body, "utf8").digest("hex")
	assert.equal(verifyWebhookSignature({ secret, rawBody: body, signatureHex: otherSecret }), false)
	// Malformed / truncated / empty header.
	assert.equal(verifyWebhookSignature({ secret, rawBody: body, signatureHex: "zzzz" }), false)
	assert.equal(verifyWebhookSignature({ secret, rawBody: body, signatureHex: valid.slice(0, 10) }), false)
	assert.equal(verifyWebhookSignature({ secret, rawBody: body, signatureHex: "" }), false)
})

test("maskSecret keeps short values fully hidden", () => {
	assert.equal(maskSecret("short"), "***")
	assert.equal(maskSecret("anb_abcdefghijkl"), "anb_***kl")
})

test("redact removes supplier keys and sensitive fields from log payloads", () => {
	const payload = {
		url: "https://api.irmarket.store/api/buyer/products?key=anb_abcdefghijkl",
		headers: { "X-API-Key": "anb_abcdefghijkl", Accept: "application/json" },
		authorization: 12_345,
		nested: [{ password: "hunter2hunter2" }, { note: "token in text: anb_zzzzzzzzzzzz" }],
		status: 200,
		nothing: null,
	}
	const redacted = redact(payload) as Record<string, unknown>
	const serialized = JSON.stringify(redacted)
	assert.equal(serialized.includes("anb_abcdefghijkl"), false)
	assert.equal(serialized.includes("anb_zzzzzzzzzzzz"), false)
	assert.equal(serialized.includes("hunter2hunter2"), false)
	assert.equal((redacted.headers as Record<string, unknown>)["X-API-Key"], "anb_***kl")
	assert.equal((redacted.headers as Record<string, unknown>).Accept, "application/json")
	assert.equal(redacted.authorization, "***")
	assert.equal(redacted.status, 200)
	assert.equal(redacted.nothing, null)
	assert.equal(redact(42), 42)
})
