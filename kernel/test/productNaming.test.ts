// Unit tests for the catalog naming / dedup helpers.
// Regression guard for the audit findings M1 (title normaliser dropped the
// distinguishing attributes) and M2 (importer matched only by supplier id).
// Pure functions — no database.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parseAttributes,
  buildProductTitle,
  buildSku,
  buildDedupKey,
  detectBrand,
  extractCountry,
  toFaDigits,
} from "../../src/lib/product-naming.ts";

test("toFaDigits converts latin digits to Persian", () => {
  assert.equal(toFaDigits(100), "۱۰۰");
  assert.equal(toFaDigits("2026"), "۲۰۲۶");
});

test("detectBrand resolves brand aliases to one identity", () => {
  assert.equal(detectBrand("Openai — Brazil 🇧🇷 ⭐")?.code, "CHATGPT");
  assert.equal(detectBrand("ChatGPT — Brazil 🇧🇷 ⭐")?.code, "CHATGPT");
  assert.equal(detectBrand("Claude API 50M Tokens")?.code, "CLAUDE");
  assert.equal(detectBrand("some unknown product"), null);
});

test("parseAttributes extracts quota, duration, tier and warranty", () => {
  const a = parseAttributes("API Claude Standard 200M Token 1 Day – full warranty");
  assert.equal(a.accessType, "api");
  assert.equal(a.quota, "۲۰۰M توکن");
  assert.equal(a.quotaCode, "200M");
  assert.equal(a.durationFa, "۱ روزه");
  assert.equal(a.tier, "Standard");
  assert.equal(a.warranty, "with");

  const seat = parseAttributes("Claude Premium Seat 1 Month");
  assert.equal(seat.accessType, "seat");
  assert.equal(seat.durationFa, "۱ ماهه");
  assert.equal(seat.warranty, "unknown");
});

test("parseAttributes prefers months over the 24H warranty window", () => {
  const a = parseAttributes("GenSpark 10k credit 1 month warranty 24H");
  assert.equal(a.durationFa, "۱ ماهه");
  assert.equal(a.quotaCode, "10K");
});

test("parseAttributes handles dollar quota written after the number", () => {
  const a = parseAttributes("Claude API 50$ Token 1 month 30 days warranty");
  assert.equal(a.quota, "۵۰$");
  assert.equal(a.quotaCode, "50USD");
  assert.equal(a.durationFa, "۱ ماهه");
});

test("the five audited Claude links get five distinct, self-explaining titles", () => {
  const cases: Array<[string, string, string, string]> = [
    ["API 100M Token Claude 3 Days - full warranty", "کلود API — ۱۰۰M توکن (۳ روزه) — با گارانتی", "CLAUDE-API-100M-3D", "CLAUDE|API|100M|3D"],
    ["Claude API 50M Tokens 1 day full warranty", "کلود API — ۵۰M توکن (۱ روزه) — با گارانتی", "CLAUDE-API-50M-1D", "CLAUDE|API|50M|1D"],
    ["Claude Premium Seat 1 Month", "کلود سیت اشتراکی (۱ ماهه)", "CLAUDE-SEAT-1M", "CLAUDE|SEAT|NOQ|1M"],
    ["Claude API 50$ Token 1 month 30 days warranty", "کلود API — ۵۰$ (۱ ماهه) — با گارانتی", "CLAUDE-API-50USD-1M", "CLAUDE|API|50USD|1M"],
    ["The old CLAUDE FREE account was created more than 1 month ago, 365-day limit, no warranty", "کلود اکانت (۱ ماهه) — بدون گارانتی", "CLAUDE-ACC-1M-NOWAR", "CLAUDE|ACCOUNT|NOQ|1M"],
  ];
  const titles = new Set<string>();
  for (const [name, title, sku, key] of cases) {
    const brand = detectBrand(name);
    assert.ok(brand, `brand not detected for: ${name}`);
    const attrs = parseAttributes(name);
    assert.equal(buildProductTitle(brand!.fa, attrs), title, `title for: ${name}`);
    assert.equal(buildSku(brand!.code, attrs), sku, `sku for: ${name}`);
    assert.equal(buildDedupKey(name), key, `key for: ${name}`);
    titles.add(title);
  }
  // the whole point of M1: five products, five titles — no collapse to "Claude Pro (۱ ماهه)"
  assert.equal(titles.size, cases.length);
});

test("buildDedupKey collapses re-listed supplier ids to one product", () => {
  // The supplier re-listed the very same offering under ids 2814 / 3265 / 3328.
  // Real rows differ only by dash type, spacing and casing:
  const names = [
    "API Claude Standard 100M Token 1 Day – full warranty",
    "API Claude Standard 100M Token 1 Day - full warranty",
    "API  Claude  Standard 100M Token 1 DAY -  full Warranty",
  ];
  const keys = names.map((n) => buildDedupKey(n));
  assert.equal(new Set(keys).size, 1, `expected one key, got: ${[...new Set(keys)].join(" , ")}`);
  assert.equal(keys[0], "CLAUDE|API|100M|1D|STANDARD");
});

test("buildDedupKey keeps genuinely different products apart", () => {
  const keys = new Set([
    buildDedupKey("API 100M Token Claude 3 Days - full warranty"),
    buildDedupKey("Claude API 50M Tokens 1 day full warranty"),
    buildDedupKey("Claude Premium Seat 1 Month"),
    buildDedupKey("Claude API 50$ Token 1 month 30 days warranty"),
  ]);
  assert.equal(keys.size, 4);
});

test("virtual numbers are keyed by country, never collapsed", () => {
  const af = buildDedupKey("Claude — Afghanistan 🇦🇫 ⭐", { category: "virtual-numbers" });
  const de = buildDedupKey("Claude — Germany 🇩🇪 ⭐", { category: "virtual-numbers" });
  assert.equal(af, "CLAUDE|VNO|AFGHANISTAN");
  assert.equal(de, "CLAUDE|VNO|GERMANY");
  assert.notEqual(af, de);
  // the same country listed twice without the star is the same product
  assert.equal(
    buildDedupKey("Claude — Afghanistan 🇦🇫", { category: "virtual-numbers" }),
    af,
  );
  assert.equal(extractCountry("Claude — Afghanistan 🇦🇫 ⭐"), "AFGHANISTAN");
});

test("two different functions can never share a title", () => {
  const api = buildProductTitle("کلود", parseAttributes("Claude API 50$ Token 1 month 30 days warranty"));
  const seat = buildProductTitle("کلود", parseAttributes("Claude Premium Seat 1 Month"));
  const trial = buildProductTitle("کلود", parseAttributes("old CLAUDE FREE account 1 month no warranty"));
  assert.notEqual(api, seat);
  assert.notEqual(seat, trial);
  assert.notEqual(api, trial);
});
