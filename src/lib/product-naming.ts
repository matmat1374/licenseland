/**
 * Pure naming + dedup helpers for the supplier catalog.
 * -----------------------------------------------------
 * Audit findings:
 *   M1 — the old title normaliser collapsed every variant of a brand to one
 *        label ("Claude Pro") and appended only the duration, dropping the
 *        quota / tier / access type. Two products with different function
 *        therefore ended up with the same title.
 *   M2 — the importer matched existing rows only by `supplier_product_id`, so
 *        a supplier re-listing under a new id created a brand-new product.
 *
 * This module is deliberately dependency-free (no Prisma, no I/O) so the kernel
 * test suite can unit-test it and so both the sync code and scripts can reuse
 * it. See docs/catalog-audit/NAMING_SKU_STANDARD.md for the agreed standard.
 */

export type AccessType = "account" | "seat" | "api" | "giftcard" | "virtual" | "unknown";
export type Warranty = "with" | "none" | "unknown";

export type ProductAttributes = {
  accessType: AccessType;
  quota: string | null;      // human label, e.g. "۱۰۰M توکن" / "۵۰$" / "۲۶۰۰ کردیت"
  quotaCode: string | null;  // SKU fragment, e.g. "100M" / "50USD" / "2600K"
  durationFa: string | null; // "۱ روزه" / "۱ ماهه"
  durationCode: string | null; // "1D" / "1M" / "1Y"
  tier: string | null;       // "Standard" | "VIP" | "Mega"
  warranty: Warranty;
};

const FA = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toFaDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => FA[Number(d)]);
}

export function toEnDigits(input: string): string {
  return String(input).replace(/[۰-۹]/g, (d) => String(FA.indexOf(d)));
}

const BRANDS: Array<{ re: RegExp; fa: string; code: string }> = [
  { re: /claude/i, fa: "کلود", code: "CLAUDE" },
  { re: /chatgpt|openai/i, fa: "چت‌جی‌پی‌تی", code: "CHATGPT" },
  { re: /gemini/i, fa: "جمینای", code: "GEMINI" },
  { re: /midjourney/i, fa: "میدجرنی", code: "MIDJOURNEY" },
  { re: /canva/i, fa: "کانوا", code: "CANVA" },
  { re: /spotify/i, fa: "اسپاتیفای", code: "SPOTIFY" },
  { re: /netflix/i, fa: "نتفلیکس", code: "NETFLIX" },
  { re: /youtube/i, fa: "یوتیوب", code: "YOUTUBE" },
  { re: /adobe/i, fa: "ادوبی", code: "ADOBE" },
  { re: /cursor/i, fa: "کرسر", code: "CURSOR" },
  { re: /windsurf/i, fa: "ویندسرف", code: "WINDSURF" },
  { re: /telegram/i, fa: "تلگرام", code: "TELEGRAM" },
  { re: /whatsapp/i, fa: "واتساپ", code: "WHATSAPP" },
  { re: /gmail/i, fa: "جیمیل", code: "GMAIL" },
  { re: /itunes/i, fa: "آی‌تیونز", code: "ITUNES" },
  { re: /amazon/i, fa: "آمازون", code: "AMAZON" },
  { re: /google play/i, fa: "گوگل پلی", code: "GPLAY" },
  { re: /playstation|psn/i, fa: "پلی‌استیشن", code: "PSN" },
  { re: /razer/i, fa: "ریزر", code: "RAZER" },
];

export function detectBrand(input: string): { fa: string; code: string } | null {
  for (const b of BRANDS) if (b.re.test(input)) return { fa: b.fa, code: b.code };
  return null;
}

const DURATIONS: Array<{ re: RegExp; fa: string; code: string }> = [
  { re: /\b(12|24)\s*months?\b|\b1\s*year\b|\b1[24]\s*m\b/i, fa: "۱ ساله", code: "1Y" },
  { re: /\b6\s*months?\b|\b180\s*d\b|\b6\s*m\b/i, fa: "۶ ماهه", code: "6M" },
  { re: /\b3\s*months?\b|\b90\s*d\b|\b3\s*m\b/i, fa: "۳ ماهه", code: "3M" },
  { re: /\b2\s*months?\b|\b60\s*d\b|\b2\s*m\b/i, fa: "۲ ماهه", code: "2M" },
  { re: /\b1\s*month\b|\b30\s*days?\b|\b30\s*d\b|\b1\s*m\b/i, fa: "۱ ماهه", code: "1M" },
  { re: /\b3\s*days?\b/i, fa: "۳ روزه", code: "3D" },
  { re: /\b7\s*days?\b|\b7\s*d\b/i, fa: "۷ روزه", code: "7D" },
  { re: /\b14\s*days?\b/i, fa: "۱۴ روزه", code: "14D" },
  { re: /\b1\s*day\b|\b24\s*h\b/i, fa: "۱ روزه", code: "1D" },
];

/**
 * Extract the attributes that actually distinguish one product from another.
 * Months are matched before day-tokens because "24H" is usually the warranty
 * window, not the subscription length (seen on real supplier rows).
 */
export function parseAttributes(input: string): ProductAttributes {
  const s = String(input || "");
  const attrs: ProductAttributes = {
    accessType: "unknown", quota: null, quotaCode: null,
    durationFa: null, durationCode: null, tier: null, warranty: "unknown",
  };

  // access type
  if (/premium\s*seat|\bseat\b|صندلی|سیت/i.test(s)) attrs.accessType = "seat";
  else if (/\bapi\b|token|credit|کردیت/i.test(s)) attrs.accessType = "api";
  else if (/gift\s*card|giftcard/i.test(s)) attrs.accessType = "giftcard";
  else if (/شماره\s*مجازی|virtual/i.test(s)) attrs.accessType = "virtual";
  else if (/\baccount\b|اکانت/i.test(s)) attrs.accessType = "account";

  // quota
  let m = s.match(/(\d+)\s*M\s*(?:credit|token)/i) || s.match(/(\d+)\s*(?:million)?\s*tokens?/i);
  if (m) { attrs.quota = `${toFaDigits(m[1])}M توکن`; attrs.quotaCode = `${m[1]}M`; }
  if (!attrs.quota) {
    m = s.match(/\$\s*(\d+)/i) || s.match(/(\d+)\s*\$/) || s.match(/(\d+)\s*(?:usd|dollars?)/i);
    if (m) { attrs.quota = `${toFaDigits(m[1])}$`; attrs.quotaCode = `${m[1]}USD`; }
  }
  if (!attrs.quota) {
    m = s.match(/(\d+)\s*([kK])?\s*credits?/i);
    if (m) {
      const n = m[1] + (m[2] ? "K" : "");
      attrs.quota = `${toFaDigits(m[1])}${m[2] ? "K" : ""} کردیت`;
      attrs.quotaCode = n.toUpperCase();
    }
  }

  // duration
  for (const d of DURATIONS) {
    if (d.re.test(s)) { attrs.durationFa = d.fa; attrs.durationCode = d.code; break; }
  }
  if (!attrs.durationFa) {
    m = s.match(/(\d+)\s*days?/i);
    if (m) { attrs.durationFa = `${toFaDigits(m[1])} روزه`; attrs.durationCode = `${m[1]}D`; }
  }

  // tier
  if (/\bvip\b/i.test(s)) attrs.tier = "VIP";
  else if (/\bmega\b/i.test(s)) attrs.tier = "Mega";
  else if (/\bstandard\b/i.test(s)) attrs.tier = "Standard";

  // warranty
  if (/no\s*warranty|بدون\s*گارانتی/i.test(s)) attrs.warranty = "none";
  else if (/warranty|گارانتی/i.test(s)) attrs.warranty = "with";

  return attrs;
}

/** Persian access-type label used in titles. */
export function accessLabelFa(a: ProductAttributes): string | null {
  switch (a.accessType) {
    case "api": return "API";
    case "seat": return "سیت اشتراکی";
    case "account": return "اکانت";
    case "giftcard": return "گیفت‌کارت";
    case "virtual": return "شماره مجازی";
    default: return null;
  }
}

/**
 * Compose a title where the access type and quota are always visible, so two
 * products with different function can never share a title.
 * Shape: `[برند] [نوع] [سهمیه] ([مدت]) — [گارانتی]`
 */
export function buildProductTitle(brandFa: string, a: ProductAttributes): string {
  let t = brandFa;
  const lower = t.toLowerCase();
  const already = (...needles: string[]) => needles.some((n) => lower.includes(n.toLowerCase()));
  const label = accessLabelFa(a);
  // Never repeat a quota the base label already states (e.g. a raw supplier name
  // that still carries "... US $10 Gift Card Code").
  const numPart = a.quotaCode ? a.quotaCode.replace(/[^0-9]/g, "") : "";
  const baseHasQuota = Boolean(numPart)
    && toEnDigits(t).includes(numPart)
    && /token|credit|gift\s*card|\$|usd/i.test(t);

  if (a.accessType === "giftcard") {
    if (!already("gift card", "گیفت")) t += ` گیفت‌کارت`;
    if (a.quota && !t.includes(a.quota) && !baseHasQuota) t += ` ${a.quota}`;
  } else if (a.accessType === "virtual") {
    return t; // virtual numbers are titled by country upstream
  } else if (label) {
    const dup = a.accessType === "api" ? already("api")
      : a.accessType === "seat" ? already("seat", "سیت")
      : a.accessType === "account" ? already("account", "اکانت")
      : false;
    if (!dup) t += ` ${label}`;
    if (a.quota && (a.accessType === "api" || a.accessType === "account") && !t.includes(a.quota) && !baseHasQuota) {
      t += ` — ${a.quota}`;
    }
  }
  if (a.tier && !t.toLowerCase().includes(a.tier.toLowerCase())) t += ` (${a.tier})`;
  if (a.durationFa && !t.includes(a.durationFa)) t += ` (${a.durationFa})`;
  if (a.warranty === "none" && !/بدون\s*گارانتی/i.test(t)) t += " — بدون گارانتی";
  else if (a.warranty === "with" && a.accessType !== "giftcard" && a.accessType !== "virtual" && !/با\s*گارانتی/i.test(t)) {
    t += " — با گارانتی";
  }
  return t.replace(/\s+/g, " ").trim();
}

/** `BRAND-TYPE-QUOTA-DUR-[TIER]-[NOWAR]` */
export function buildSku(brandCode: string, a: ProductAttributes): string {
  const type = a.accessType === "api" ? "API"
    : a.accessType === "seat" ? "SEAT"
    : a.accessType === "giftcard" ? "GC"
    : a.accessType === "virtual" ? "VNO"
    : a.accessType === "account" ? "ACC" : "";
  const parts = [
    brandCode, type, a.quotaCode || "", a.durationCode || "",
    a.tier ? a.tier.toUpperCase().slice(0, 4) : "",
    a.warranty === "none" ? "NOWAR" : "",
  ].filter(Boolean);
  return parts.join("-");
}

/** Country/region token for virtual-number offerings (their real distinguisher). */
export function extractCountry(input: string): string | null {
  let s = String(input || "")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2B00}-\u{2BFF}]/gu, " ")
    .replace(/\b(claude|chatgpt|openai|telegram|whatsapp|google|apple|discord|instagram|facebook|virtual|number|otp|sms|verify)\b/gi, " ")
    .replace(/شماره\s*مجازی|وریفای|دریافت\s*پیامک|فعالسازی|کلود|تلگرام|واتساپ/g, " ")
    .replace(/[^A-Za-z\u0600-\u06FF\s]/g, " ")
    .replace(/\s+/g, " ").trim();
  if (!s) return null;
  return s.toUpperCase().replace(/\s+/g, "_");
}

/**
 * Stable identity key for a supplier offering. Two listings of the same
 * product map to the same key even when the supplier changes the id, the
 * casing, the brand alias ("Openai" vs "ChatGPT") or the noise words
 * ("official", "slot", "full warranty").
 *
 * Virtual numbers are keyed by country — collapsing them would merge ten
 * different countries into one product, which is worse than the bug.
 */
export function buildDedupKey(input: string, opts?: { category?: string }): string {
  const s = String(input || "");
  const brand = detectBrand(s);
  const a = parseAttributes(s);
  const brandKey = brand ? brand.code : s.toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s]/g, " ")
    .replace(/\s+/g, " ").trim().split(" ").slice(0, 2).join("_").toUpperCase();

  const isVirtual = a.accessType === "virtual" || /virtual|otp|شماره\s*مجازی/i.test(opts?.category || "");
  if (isVirtual) {
    return [brandKey, "VNO", extractCountry(s) || "UNK"].join("|");
  }

  return [
    brandKey,
    a.accessType !== "unknown" ? a.accessType.toUpperCase() : "GEN",
    a.quotaCode || "NOQ",
    a.durationCode || "NOD",
    a.tier ? a.tier.toUpperCase() : "",
  ].filter(Boolean).join("|");
}
