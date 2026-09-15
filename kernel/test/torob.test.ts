// Unit tests for the Torob (ترب) integration helpers.
// Guarantees the meta tags / feed stay honest: availability reflects real stock,
// the struck-through price only appears for a real discount, and a guarantee tag
// is never invented for products that have none.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  torobAvailability,
  torobPrices,
  torobGuarantee,
  toAbsoluteUrl,
  resolveTorobImage,
  buildTorobMetaTags,
  buildTorobFeedItem,
  isTorobEligible,
} from "../../src/lib/torob.ts";

const BASE = "https://liceno.ir";

const inStock = {
  id: "cmty16qzo002xpbg4zo4wvw43",
  title: "Claude Pro API — ۱۰۰M توکن (۱ روزه) — با گارانتی",
  slug: "2421-claude-pro-۳-روزه",
  price: 2_969_000,
  isActive: true,
  stock: 99,
  _stock: 50,
  _effectivePrice: 2_969_000,
  image: "/products-3d/claude.jpg",
  shortDesc: "API 100M Token Claude 3 Days - full warranty",
  features: JSON.stringify(["تحویل فوری و آنی پس از پرداخت", "گارانتی ۱۰۰٪ فعال‌سازی و تضمین اصالت"]),
};

test("availability reflects real stock, not a constant", () => {
  assert.equal(torobAvailability(inStock), "instock");
  assert.equal(torobAvailability({ ...inStock, isActive: false }), "outofstock");
  assert.equal(torobAvailability({ ...inStock, _stock: 0, stock: 0 }), "outofstock");
  assert.equal(torobAvailability({ ...inStock, stock: 0, _stock: undefined }), "outofstock");
});

test("old price is emitted only for a real discount", () => {
  assert.deepEqual(torobPrices(inStock), { price: 2_969_000, oldPrice: null });
  const discounted = { ...inStock, price: 3_000_000, discountPrice: 2_500_000, _effectivePrice: 2_500_000 };
  assert.deepEqual(torobPrices(discounted), { price: 2_500_000, oldPrice: 3_000_000 });
  // a "discount" that is not a discount must not fabricate a struck-through price
  const fake = { ...inStock, price: 2_000_000, discountPrice: 2_500_000, _effectivePrice: 2_500_000 };
  assert.equal(torobPrices(fake).oldPrice, null);
});

test("guarantee is never invented and is suppressed for no-warranty products", () => {
  assert.equal(torobGuarantee(inStock), "گارانتی ۱۰۰٪ فعال‌سازی و تضمین اصالت");
  const noWarranty = {
    ...inStock,
    shortDesc: "old CLAUDE FREE account, no warranty",
    features: JSON.stringify(["تحویل فوری"]),
  };
  assert.equal(torobGuarantee(noWarranty), null);
  const silent = { ...inStock, title: "Claude Pro (۱ روزه)", shortDesc: "simple product", features: JSON.stringify(["تحویل فوری"]) };
  assert.equal(torobGuarantee(silent), null);
});

test("relative image paths become absolute URLs", () => {
  assert.equal(toAbsoluteUrl("/products-3d/claude.jpg", BASE), "https://liceno.ir/products-3d/claude.jpg");
  assert.equal(toAbsoluteUrl("https://cdn.example.com/a.jpg", BASE), "https://cdn.example.com/a.jpg");
  assert.equal(toAbsoluteUrl(null, BASE), null);
  assert.equal(toAbsoluteUrl("  ", BASE), null);
});

test("the required Torob meta tags are present and correct", () => {
  const tags = buildTorobMetaTags(inStock, BASE);
  assert.equal(tags.product_id, "cmty16qzo002xpbg4zo4wvw43");
  assert.equal(tags.product_name, inStock.title);
  assert.equal(tags.availability, "instock");
  assert.equal(tags.product_price, "2969000");
  assert.ok(tags.guarantee);
  assert.equal(tags.product_old_price, undefined, "no discount -> no old price tag");
});

test("every product resolves to an image: photo → brand card → site default", () => {
  // 1. a real product photo wins
  assert.equal(resolveTorobImage(inStock, BASE), "https://liceno.ir/products-3d/claude.jpg");
  // 2. no photo, but a known brand -> the brand card
  const claude = { ...inStock, image: null };
  assert.equal(resolveTorobImage(claude, BASE), "https://liceno.ir/products-3d/claude.jpg");
  const gpt = { ...inStock, image: null, title: "ChatGPT Plus (۱ ماهه)", shortDesc: "" };
  assert.equal(resolveTorobImage(gpt, BASE), "https://liceno.ir/products-3d/chatgpt.jpg");
  // 3. unknown brand -> the site default card (never null)
  const other = { ...inStock, image: null, title: "Some Random Service", shortDesc: "" };
  assert.equal(resolveTorobImage(other, BASE), "https://liceno.ir/og-default.png");
  // the feed always carries an image
  assert.ok((buildTorobFeedItem(other, BASE) as any).image_link);
});

test("out-of-stock products are tagged outofstock", () => {
  const tags = buildTorobMetaTags({ ...inStock, isActive: true, stock: 0, _stock: 0 }, BASE);
  assert.equal(tags.availability, "outofstock");
});

test("the JSON feed item mirrors the meta tags", () => {
  const item: any = buildTorobFeedItem(inStock, BASE);
  assert.equal(item.product_id, "cmty16qzo002xpbg4zo4wvw43");
  assert.equal(item.product_name, inStock.title);
  assert.equal(item.page_url, "https://liceno.ir/product/2421-claude-pro-۳-روزه");
  assert.equal(item.price, 2_969_000);
  assert.equal(item.availability, "instock");
  assert.equal(item.image_link, "https://liceno.ir/products-3d/claude.jpg");
  assert.ok(item.guarantee);
  assert.equal(item.old_price, undefined);
});

test("eligibility excludes hidden products", () => {
  assert.equal(isTorobEligible(inStock), true);
  assert.equal(isTorobEligible({ ...inStock, isActive: false }), false);
  assert.equal(isTorobEligible({ ...inStock, title: "" }), false);
});
