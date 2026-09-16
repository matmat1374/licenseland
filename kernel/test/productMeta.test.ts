// Unit tests for the product-page meta hygiene helpers (SEO-05).
// Guarantees the meta description is never a duplicate of the <title> and never
// empty, while still preferring a genuinely informative supplier shortDesc.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildProductMetaDescription,
  isWeakProductDescription,
  clampMetaDescription,
  cleanMetaText,
  META_DESCRIPTION_MAX,
  MIN_USEFUL_DESCRIPTION,
} from "../../src/lib/product-meta.ts";
import { SITE } from "../../src/lib/constants.ts";

const LONG_DESC =
  "Instant automated delivery of an original licence key with a full warranty and 24/7 Persian support.";

test("cleanMetaText collapses whitespace runs and trims", () => {
  assert.equal(cleanMetaText("  a \n\t b   c  "), "a b c");
  assert.equal(cleanMetaText(null), "");
  assert.equal(cleanMetaText(undefined), "");
});

test("isWeakProductDescription flags empty, short and duplicate values", () => {
  assert.equal(isWeakProductDescription("", "Claude Pro"), true);
  assert.equal(isWeakProductDescription(null, "Claude Pro"), true);
  assert.equal(isWeakProductDescription("Too short", "Claude Pro"), true);
  // exactly the title -> duplicate
  assert.equal(isWeakProductDescription("Claude Pro", "Claude Pro"), true);
  // contains the title -> duplicate
  assert.equal(isWeakProductDescription(`Claude Pro ${LONG_DESC}`, "Claude Pro"), true);
  // long, distinct value -> safe to keep
  assert.equal(isWeakProductDescription(LONG_DESC, "Claude Pro"), false);
});

test("minimum length threshold is what makes a short value weak", () => {
  const exactly = "x".repeat(MIN_USEFUL_DESCRIPTION);
  assert.equal(isWeakProductDescription(exactly, "Some Product"), false);
  assert.equal(isWeakProductDescription("x".repeat(MIN_USEFUL_DESCRIPTION - 1), "Some Product"), true);
});

test("a strong shortDesc is returned unchanged (only cleaned)", () => {
  const out = buildProductMetaDescription({ title: "Claude Pro", shortDesc: `  ${LONG_DESC}  ` });
  assert.equal(out, LONG_DESC);
});

test("a weak/duplicate shortDesc is replaced by a unique title-based description", () => {
  const out = buildProductMetaDescription(
    { title: "100 Telegram Stars", shortDesc: "100 Telegram Stars" },
    { siteDescription: SITE.description }
  );
  assert.ok(out.startsWith("100 Telegram Stars"), "should lead with the product title");
  assert.notEqual(out, "100 Telegram Stars");
  assert.ok(out.length <= META_DESCRIPTION_MAX, "must respect the 160-char ceiling");
  assert.ok(out.length > 40, "must be long enough to be informative");
});

test("two products with different titles never collide", () => {
  const a = buildProductMetaDescription({ title: "Product A", shortDesc: "" }, { siteDescription: SITE.description });
  const b = buildProductMetaDescription({ title: "Product B", shortDesc: "" }, { siteDescription: SITE.description });
  assert.notEqual(a, b);
});

test("clampMetaDescription trims on a word boundary and appends an ellipsis", () => {
  const long = "word ".repeat(80);
  const out = clampMetaDescription(long);
  assert.ok(out.length <= META_DESCRIPTION_MAX);
  assert.ok(out.endsWith("\u2026"));
  assert.ok(!out.includes("  "));
  assert.equal(clampMetaDescription("short value"), "short value");
});

test("no site description / no title still yields a usable string", () => {
  assert.equal(buildProductMetaDescription({ title: "Solo", shortDesc: "" }), "Solo");
  assert.equal(buildProductMetaDescription({ title: "", shortDesc: "" }, { siteDescription: "" }), "");
});
