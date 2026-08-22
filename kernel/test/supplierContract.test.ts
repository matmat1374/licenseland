import assert from "node:assert/strict"
import { test } from "node:test"
import {
	SupplierContractError,
	parseSupplierProduct,
	supplierCostUsdCents,
	type SupplierProduct,
	usdToCents,
	validatePurchaseInputs,
} from "../src/supplier/contract.ts"

const LICENSE_RAW = {
	id: 364,
	name: "Gemini AI Pro 18 Month",
	retail_usd: 12,
	price_usd: 9,
	discount_percent: 25,
	savings_usd: 3,
	stock: 7,
	requires_email: true,
}

const SMM_RAW = {
	id: 902,
	name: "Instagram Likes",
	price_usd: "0.002",
	pricing_unit: "per_1000",
	price_per_1000_usd: "1.75",
	min_qty: 100,
	max_qty: 100_000,
	requires_link: true,
	required_inputs: ["smm_hashtag"],
}

test("usdToCents uses string math, never floats", () => {
	assert.equal(usdToCents(9), 900)
	assert.equal(usdToCents("9.99"), 999)
	assert.equal(usdToCents("0.1"), 10)
	assert.equal(usdToCents("1.756"), 175)
	assert.equal(usdToCents(" 12 "), 1_200)
	assert.equal(usdToCents("-1.50"), -150)
})

test("usdToCents rejects junk and unsafe magnitudes", () => {
	assert.throws(() => usdToCents("9,99"), SupplierContractError)
	assert.throws(() => usdToCents("free"), SupplierContractError)
	assert.throws(() => usdToCents(""), SupplierContractError)
	assert.throws(() => usdToCents("1e9"), SupplierContractError)
	assert.throws(() => usdToCents("999999999999999999"), SupplierContractError)
	// A missing or wrongly typed field must be a contract error, never a crash.
	assert.throws(() => usdToCents(undefined), SupplierContractError)
	assert.throws(() => usdToCents(null), SupplierContractError)
	assert.throws(() => usdToCents({ amount: 9 }), SupplierContractError)
	assert.throws(() => usdToCents(Number.NaN), SupplierContractError)
})

test("a documented license product parses with defaults", () => {
	const product = parseSupplierProduct(LICENSE_RAW)
	assert.equal(product.priceUsdCents, 900)
	assert.equal(product.retailUsdCents, 1_200)
	assert.equal(product.pricingUnit, "unit")
	assert.equal(product.pricePer1000UsdCents, null)
	assert.equal(product.stock, 7)
	assert.equal(product.minQty, 1)
	assert.equal(product.maxQty, null)
	assert.equal(product.requiresEmail, true)
	assert.equal(product.requiresLink, false)
	assert.equal(product.requiresComments, false)
	assert.deepEqual(product.requiredInputs, [])
})

test("a documented SMM product parses per_1000 pricing and required inputs", () => {
	const product = parseSupplierProduct(SMM_RAW)
	assert.equal(product.pricingUnit, "per_1000")
	assert.equal(product.pricePer1000UsdCents, 175)
	assert.equal(product.minQty, 100)
	assert.equal(product.maxQty, 100_000)
	assert.equal(product.requiresLink, true)
	assert.deepEqual(product.requiredInputs, ["smm_hashtag"])
	assert.equal(product.retailUsdCents, null)
	assert.equal(product.stock, null)
})

test("unknown payload shapes are rejected instead of defaulted", () => {
	const cases: Array<[string, unknown]> = [
		["not an object", 42],
		["null", null],
		["missing id", { name: "x", price_usd: 1 }],
		["fractional id", { id: 1.5, name: "x", price_usd: 1 }],
		["missing name", { id: 1, price_usd: 1 }],
		["empty name", { id: 1, name: "", price_usd: 1 }],
		["missing price", { id: 1, name: "x" }],
		["negative price", { id: 1, name: "x", price_usd: "-1" }],
		["unsupported pricing unit", { id: 1, name: "x", price_usd: 1, pricing_unit: "per_100" }],
		["per_1000 without unit price", { id: 1, name: "x", price_usd: 1, pricing_unit: "per_1000" }],
		["non-array required_inputs", { id: 1, name: "x", price_usd: 1, required_inputs: "smm_hashtag" }],
	]
	for (const [label, payload] of cases) {
		if (label === "non-array required_inputs") {
			// Documented as an array; a scalar degrades to "no required inputs".
			assert.deepEqual(parseSupplierProduct(payload).requiredInputs, [], label)
			continue
		}
		assert.throws(() => parseSupplierProduct(payload), SupplierContractError, label)
	}
})

test("pre-flight validation mirrors the documented HTTP 400 cases", () => {
	const smm = parseSupplierProduct(SMM_RAW)
	assert.deepEqual(validatePurchaseInputs(smm, { quantity: 1_000, link: "https://x", extras: { smm_hashtag: "#a" } }), [])
	assert.deepEqual(validatePurchaseInputs(smm, { quantity: 0 }), [
		"quantity_invalid",
		"quantity_below_min",
		"link_required",
		"extra_required:smm_hashtag",
	])
	assert.deepEqual(validatePurchaseInputs(smm, { quantity: 1.5, link: "l", extras: { smm_hashtag: "#a" } }), [
		"quantity_invalid",
		"quantity_below_min",
	])
	assert.deepEqual(validatePurchaseInputs(smm, { quantity: 200_000, link: "l", extras: { smm_hashtag: "#a" } }), [
		"quantity_above_max",
	])
	assert.deepEqual(validatePurchaseInputs(smm, { quantity: 1_000, link: "", extras: { smm_hashtag: "" } }), [
		"link_required",
		"extra_required:smm_hashtag",
	])

	const license = parseSupplierProduct(LICENSE_RAW)
	assert.deepEqual(validatePurchaseInputs(license, { quantity: 1 }), ["customer_email_required"])
	assert.deepEqual(validatePurchaseInputs(license, { quantity: 1, customerEmail: "a@b.c" }), [])

	const commentsProduct = parseSupplierProduct({ ...SMM_RAW, requires_comments: true })
	assert.deepEqual(
		validatePurchaseInputs(commentsProduct, { quantity: 1_000, link: "l", extras: { smm_hashtag: "#a" } }),
		["comments_required"],
	)
})

test("supplier cost is integer cents for both pricing units", () => {
	const license = parseSupplierProduct(LICENSE_RAW)
	assert.equal(supplierCostUsdCents(license, 3), 2_700)
	const smm = parseSupplierProduct(SMM_RAW)
	assert.equal(supplierCostUsdCents(smm, 1_000), 175)
	// 1500 units of a 1.75 USD/1000 service ceils to 263 cents, never 262.5.
	assert.equal(supplierCostUsdCents(smm, 1_500), 263)
	assert.throws(() => supplierCostUsdCents(license, 0), SupplierContractError)
	assert.throws(() => supplierCostUsdCents(license, 1.5), SupplierContractError)
	const broken: SupplierProduct = { ...smm, pricePer1000UsdCents: null }
	assert.throws(() => supplierCostUsdCents(broken, 1_000), SupplierContractError)
})
