/**
 * Catalog audit — registry generator
 * Reads audit-all-products.json, classifies problems, and emits:
 *   1. product-registry.csv  (traceable registry with decisions + proposed titles/SKUs)
 *   2. audit-stats.json      (numbers used in the report)
 *
 * MERGE RULE (important): a product is only ever archived/merged inside its
 * *supplier-identity group* (same normalised supplier name = the same offering
 * re-listed under a new id). Products that merely share a TITLE are never merged
 * — they only get a clearer title. Mixing the two would delete real product
 * lines (e.g. the 10M vs 50M vs 100M Claude token tiers).
 *
 * No DB access, no writes to production.
 */
const fs = require("fs");
const path = require("path");

const SRC = "docs/catalog-audit/data/audit-all-products.json";
const OUT_DIR = "docs/catalog-audit";
const rows = JSON.parse(fs.readFileSync(SRC, "utf8"));
fs.mkdirSync(OUT_DIR, { recursive: true });

// ---------- parsers ----------
function specsOf(r) {
  try { return JSON.parse(r.specifications || "{}"); } catch { return {}; }
}

function parseAttrs(r) {
  const raw = (r.shortDesc || "") + " " + (r.title || "");
  const s = raw + " " + raw.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
  const out = { access: "", quota: "", duration: "", warranty: "", tier: "" };

  if (/premium seat|seat/i.test(s)) out.access = "سیت اشتراکی";
  else if (/api|token|credit/i.test(s)) out.access = "API/توکن";
  else if (/gift card|giftcard|network card|psn card|redeem code/i.test(s)) out.access = "گیفت‌کارت";
  else if (/شماره مجازی|virtual/i.test(s)) out.access = "شماره مجازی";
  else if (/account|اکانت|invite/i.test(s)) out.access = "اکانت";
  else out.access = "نامشخص";

  const mT = s.match(/(\d+)\s*M\s*(credit|token)/i) || s.match(/(\d+)\s*(million)?\s*tokens?/i);
  if (mT) out.quota = mT[1] + "M توکن";
  if (!out.quota) { const mD = s.match(/\$\s*(\d+)/i) || s.match(/(\d+)\s*\$/) || s.match(/(\d+)\s*usd/i); if (mD) out.quota = (mD[1] || mD[2] || mD[3]) + "$"; }
  if (!out.quota) { const mC = s.match(/(\d+)\s*(k)?\s*credits?/i); if (mC) out.quota = mC[1] + (mC[2] ? "K" : "") + " کردیت"; }

  if (/12\s*months?|1\s*year|12\s*m\b|24\s*m\b/i.test(s)) out.duration = "۱ ساله";
  else if (/6\s*months?|180\s*d\b|6\s*m\b/i.test(s)) out.duration = "۶ ماهه";
  else if (/3\s*months?|90\s*d\b|3\s*m\b/i.test(s)) out.duration = "۳ ماهه";
  else if (/2\s*months?|60\s*d\b|2\s*m\b/i.test(s)) out.duration = "۲ ماهه";
  else if (/1\s*month|30\s*days?|30\s*d\b|1\s*m\b/i.test(s)) out.duration = "۱ ماهه";
  else if (/3\s*days?/i.test(s)) out.duration = "۳ روزه";
  else if (/7\s*days?|7\s*d\b/i.test(s)) out.duration = "۷ روزه";
  else if (/14\s*days?/i.test(s)) out.duration = "۱۴ روزه";
  else if (/1\s*day|24\s*h\b/i.test(s)) out.duration = "۱ روزه";
  else if (/(\d+)\s*days?/i.test(s)) { const m = s.match(/(\d+)\s*days?/i); out.duration = toFaDigits(m[1]) + " روزه"; }
  if (!out.duration && r.duration) out.duration = r.duration;

  if (/no warranty|بدون گارانتی/i.test(s)) out.warranty = "بدون گارانتی";
  else if (/warranty|گارانتی/i.test(s)) out.warranty = "با گارانتی";

  if (/\bvip\b/i.test(s)) out.tier = "VIP";
  else if (/\bbusiness\b/i.test(s)) out.tier = "Business";
  else if (/\bteam\b/i.test(s)) out.tier = "Team";
  else if (/\bstandard\b/i.test(s)) out.tier = "Standard";
  else if (/\bmega\b/i.test(s)) out.tier = "Mega";

  return out;
}

function brandOf(r) {
  const s = (r.title || "") + " " + (r.shortDesc || "");
  const known = [["claude", "کلود"], ["chatgpt", "چت‌جی‌پی‌تی"], ["openai", "OpenAI"], ["gemini", "جمینای"],
    ["capcut", "کپ‌کات"], ["genspark", "Genspark"], ["magica", "Magica"], ["codex", "Codex"],
    ["canva", "کانوا"], ["spotify", "اسپاتیفای"], ["netflix", "نتفلیکس"], ["youtube", "یوتیوب"],
    ["midjourney", "میدجرنی"], ["adobe", "ادوبی"], ["telegram", "تلگرام"], ["whatsapp", "واتساپ"],
    ["gmail", "جیمیل"], ["itunes", "آی‌تیونز"], ["amazon", "آمازون"], ["google play", "گوگل پلی"],
    ["playstation", "پلی‌استیشن"], ["razer", "ریزر"], ["mobile legends", "موبایل لجندز"],
    ["free fire", "فری فایر"], ["cursor", "کرسر"], ["windsurf", "ویندسرف"]];
  for (const [re, fa] of known) if (new RegExp(re, "i").test(s)) return fa;
  return (r.brand || "—");
}

const BRAND_SKU = [[/claude/i, "CLAUDE"], [/chatgpt/i, "CHATGPT"], [/openai/i, "OPENAI"], [/gemini/i, "GEMINI"],
  [/capcut/i, "CAPCUT"], [/genspark/i, "GENSPARK"], [/magica/i, "MAGICA"], [/codex/i, "CODEX"], [/canva/i, "CANVA"],
  [/spotify/i, "SPOTIFY"], [/netflix/i, "NETFLIX"], [/youtube/i, "YOUTUBE"], [/midjourney/i, "MIDJOURNEY"],
  [/adobe/i, "ADOBE"], [/telegram/i, "TELEGRAM"], [/whatsapp/i, "WHATSAPP"], [/gmail/i, "GMAIL"], [/itunes/i, "ITUNES"],
  [/amazon/i, "AMAZON"], [/google play/i, "GPLAY"], [/playstation|psn/i, "PSN"], [/razer/i, "RAZER"],
  [/mobile legends/i, "MLBB"], [/free fire/i, "FF"], [/cursor/i, "CURSOR"], [/windsurf/i, "WINDSURF"]];

// Latin brand labels are kept in titles because buyers search for them
// ("Claude Pro", "Cursor Pro") — same convention as src/lib/product-naming.ts.
const BRAND_LABEL = {
  CLAUDE: "Claude Pro", CHATGPT: "ChatGPT", OPENAI: "ChatGPT", GEMINI: "Gemini AI Pro",
  CAPCUT: "CapCut Pro", GENSPARK: "Genspark", MAGICA: "Magica", CODEX: "Codex",
  CANVA: "Canva Pro", SPOTIFY: "Spotify Premium", NETFLIX: "Netflix 4K Ultra HD",
  YOUTUBE: "YouTube Premium", MIDJOURNEY: "Midjourney", ADOBE: "Adobe Creative Cloud Pro",
  TELEGRAM: "Telegram", WHATSAPP: "WhatsApp", GMAIL: "Gmail", ITUNES: "iTunes Gift Card",
  AMAZON: "Amazon Gift Card", GPLAY: "Google Play", PSN: "PlayStation Network",
  RAZER: "Razer Gold", MLBB: "Mobile Legends", FF: "Garena Free Fire",
  CURSOR: "Cursor Pro", WINDSURF: "Windsurf Pro",
};

function skuPart(x) { return (x || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase(); }
function brandSku(r) {
  const s = (r.title || "") + " " + (r.shortDesc || "");
  for (const [re, code] of BRAND_SKU) if (re.test(s)) return code;
  return "ITEM";
}
function brandLabel(r) { const c = brandSku(r); return BRAND_LABEL[c] || brandOf(r); }
function toFaDigits(s) {
  return String(s).replace(/0/g, "۰").replace(/1/g, "۱").replace(/2/g, "۲").replace(/3/g, "۳").replace(/4/g, "۴")
    .replace(/5/g, "۵").replace(/6/g, "۶").replace(/7/g, "۷").replace(/8/g, "۸").replace(/9/g, "۹");
}
function makeSku(r, a) {
  const brand = brandSku(r);
  const type = a.access === "API/توکن" ? "API" : a.access === "سیت اشتراکی" ? "SEAT" : a.access === "گیفت‌کارت" ? "GC"
    : a.access === "شماره مجازی" ? "VNO" : "ACC";
  const quota = skuPart(a.quota.replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/\$/g, "USD")) || "";
  const durNum = a.duration.replace(/[^\u06F0-\u06F9]/g, "");
  const map = { "۱": "1", "۲": "2", "۳": "3", "۶": "6", "۷": "7", "۱۴": "14" };
  const n = map[durNum] || durNum;
  const unit = /روزه/.test(a.duration) ? "D" : "M";
  const dur = a.duration ? n + unit : "";
  return [brand, type, quota, dur, a.tier ? skuPart(a.tier).slice(0, 4) : "", a.warranty === "بدون گارانتی" ? "NOWAR" : ""]
    .filter(Boolean).join("-");
}
function makeTitle(r, a) {
  const brand = brandLabel(r);
  const parts = [brand];
  if (a.access === "گیفت‌کارت") parts.push("گیفت‌کارت" + (a.quota ? ` ${toFaDigits(a.quota)}` : ""));
  else if (a.access === "API/توکن") parts.push("API" + (a.quota ? ` — ${toFaDigits(a.quota)}` : ""));
  else if (a.access === "سیت اشتراکی") parts.push("سیت اشتراکی" + (a.tier ? ` (${a.tier})` : ""));
  else if (a.access === "اکانت") parts.push("اکانت" + (a.tier && a.tier !== "Pro" ? ` (${a.tier})` : ""));
  else if (a.access === "شماره مجازی") parts.push("شماره مجازی");
  let t = parts.join(" ");
  if (a.duration) t += ` (${a.duration})`;
  if (a.warranty === "بدون گارانتی") t += " — بدون گارانتی";
  else if (a.warranty === "با گارانتی" && a.access !== "گیفت‌کارت" && a.access !== "شماره مجازی") t += " — با گارانتی";
  return t.replace(/\s+/g, " ").trim();
}

/** Normalised supplier key — the identity of an offering. */
function normKey(shortDesc) {
  return (shortDesc || "").toLowerCase()
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2B00}-\u{2BFF}]/gu, " ")
    .replace(/\bopenai\b/g, "chatgpt")
    .replace(/\b(official|slot|full warranty|full|no warranty|with warranty|warranty)\b/g, " ")
    .replace(/[^a-z0-9\u0600-\u06FF\s]/g, " ")
    .replace(/\s+/g, " ").trim();
}

// ---------- grouping ----------
const byDesc = new Map();   // dupKey  -> products with that supplier identity
const byTitle = new Map();  // title   -> products sharing a title
for (const r of rows) {
  const d = normKey(r.shortDesc);
  const t = (r.title || "").trim();
  if (d) { if (!byDesc.has(d)) byDesc.set(d, []); byDesc.get(d).push(r); }
  if (t) { if (!byTitle.has(t)) byTitle.set(t, []); byTitle.get(t).push(r); }
}

const dupMembership = new Map(); // productId -> dupKey (only for real duplicate groups)
for (const [key, members] of byDesc) {
  if (members.length > 1) for (const m of members) dupMembership.set(m.id, key);
}

// title families (same title, different function) — RENAME ONLY, never merge
const titleFlags = new Map();
for (const [key, members] of byTitle) {
  const sigs = new Set(members.map((m) => normKey(m.shortDesc)));
  if (members.length > 1 && sigs.size > 1) for (const m of members) titleFlags.set(m.id, { key, size: members.length });
}

// similar-title families (same brand + duration, different access/quota)
const byFamily = new Map();
for (const r of rows) {
  const b = brandOf(r);
  if (b === "—") continue;
  const fam = b + "|" + (parseAttrs(r).duration || "?");
  if (!byFamily.has(fam)) byFamily.set(fam, []);
  byFamily.get(fam).push(r);
}
let familyGroups = 0, familyProducts = 0;
const familyFlags = new Map();
for (const [fam, members] of byFamily) {
  if (members.length < 2) continue;
  const sigs = new Set(members.map((m) => { const a = parseAttrs(m); return a.access + "|" + a.quota; }));
  if (sigs.size < 2) continue;
  familyGroups++; familyProducts += members.length;
  for (const m of members) if (!dupMembership.has(m.id) && !titleFlags.has(m.id)) familyFlags.set(m.id, { key: fam, size: members.length });
}

// ---------- base selection (STRICTLY inside a duplicate group) ----------
function chooseBase(members) {
  const active = members.filter((m) => m.isActive);
  const pool = active.length ? active : members;
  return pool.slice().sort((a, b) => {
    if ((b.salesCount || 0) !== (a.salesCount || 0)) return (b.salesCount || 0) - (a.salesCount || 0);
    const ca = specsOf(a).cost_usd || 1e9, cb = specsOf(b).cost_usd || 1e9;
    if (ca !== cb) return ca - cb;
    return (specsOf(b).supplier_product_id || 0) - (specsOf(a).supplier_product_id || 0);
  })[0];
}
const baseByDupKey = new Map();
for (const [key, members] of byDesc) {
  if (members.length > 1) baseByDupKey.set(key, chooseBase(members));
}

// ---------- build rows ----------
const csvRows = [];
for (const r of rows) {
  const dupKey = dupMembership.get(r.id);
  const tFlag = titleFlags.get(r.id);
  const fFlag = familyFlags.get(r.id);
  if (!dupKey && !tFlag && !fFlag) continue;

  const a = parseAttrs(r);
  const sp = specsOf(r);
  const cat = (r.categoryRel && r.categoryRel.name) || r.category || "";
  const brandOk = brandOf(r) !== "—";
  const isVirtual = /شماره مجازی|OTP/i.test(cat) || a.access === "شماره مجازی";
  const highConf = brandOk && a.access !== "نامشخص" && (a.quota || a.duration) && !isVirtual;

  let decision, base = null, redirect = "", status = "در انتظار تأیید";

  if (dupKey) {
    // TRUE duplicate: merge inside the supplier-identity group only
    base = baseByDupKey.get(dupKey) || null;
    if (base && base.id === r.id) decision = "نگهداشتن (مبنا)";
    else if (base) { decision = "ادغام/آرشیو"; redirect = base.slug; }
    else { decision = "بررسی دستی (بدون مبنا)"; status = "نیازمند بررسی"; }
  } else if (isVirtual) {
    decision = "نگهداشتن (بدون تغییر)"; status = "—";
  } else if (!highConf) {
    decision = "بررسی دستی (عنوان)"; status = "نیازمند بررسی";
  } else if (!r.isActive) {
    decision = "آرشیو (غیرفعال) + تغییر عنوان";
  } else {
    decision = "تغییر عنوان (نگهداشتن)";
  }

  const issue = [
    dupKey ? "true-duplicate" : "",
    tFlag ? "misleading-title" : "",
    fFlag ? "similar-title-family" : "",
  ].filter(Boolean).join("+");

  const manual = decision.startsWith("بررسی دستی");
  csvRows.push({
    product_id: r.id,
    slug: r.slug,
    issue_type: issue,
    group_size: (dupKey ? byDesc.get(dupKey).length : (tFlag?.size || fFlag?.size || 0)),
    current_title: r.title,
    proposed_title: manual ? (r.title || "") : makeTitle(r, a),
    proposed_sku: manual ? "" : makeSku(r, a),
    price_toman: r.price,
    cost_usd: sp.cost_usd ?? "",
    supplier_product_id: sp.supplier_product_id ?? "",
    access_type: a.access,
    quota: a.quota,
    duration: a.duration,
    warranty: a.warranty,
    is_active: r.isActive ? "فعال" : "غیرفعال",
    category: cat,
    decision,
    title_confidence: isVirtual ? "n/a" : (highConf ? "بالا" : "پایین"),
    base_slug: base ? base.slug : "",
    redirect_to: redirect,
    owner: "",
    status,
  });
}

// ---------- validation (fail loudly, never ship a destructive plan) ----------
const problems = [];
const warnings = [];
const dupKeyOfSlug = new Map(rows.map((r) => [r.slug, dupMembership.get(r.id) || null]));
for (const r of csvRows) {
  if (!r.decision.startsWith("ادغام")) continue;
  if (!r.redirect_to) { problems.push(`merge without redirect: ${r.slug}`); continue; }
  const base = csvRows.find((x) => x.slug === r.redirect_to);
  if (!base) { problems.push(`redirect target not in registry: ${r.slug} -> ${r.redirect_to}`); continue; }
  // the hard rule: the commercial attributes must match (quota + duration)
  if (`${base.quota}|${base.duration}` !== `${r.quota}|${r.duration}`) {
    problems.push(`merge crosses functions: ${r.slug} (${r.quota} ${r.duration}) -> ${r.redirect_to} (${base.quota} ${base.duration})`);
  }
  // identity check: archived row and base must belong to the same supplier group
  const a = dupKeyOfSlug.get(r.slug), b = dupKeyOfSlug.get(r.redirect_to);
  if (!a || !b || a !== b) problems.push(`merge across supplier groups: ${r.slug} -> ${r.redirect_to}`);
  // a differing access LABEL inside one identity group is a legacy-title artefact
  if (base.access_type !== r.access_type) warnings.push(`access label differs within the same offering: ${r.slug} (${r.access_type}) -> ${r.redirect_to} (${base.access_type})`);
}
// every duplicate group must keep exactly one base
for (const [key, members] of byDesc) {
  if (members.length < 2) continue;
  const base = baseByDupKey.get(key);
  const kept = csvRows.filter((x) => members.some((m) => m.slug === x.slug) && x.decision.startsWith("نگهداشتن")).length;
  if (!base || kept !== 1) problems.push(`group ${key} -> bases kept: ${kept} (expected 1)`);
}

// ---------- write ----------
const cols = ["product_id", "slug", "issue_type", "group_size", "current_title", "proposed_title", "proposed_sku",
  "price_toman", "cost_usd", "supplier_product_id", "access_type", "quota", "duration", "warranty", "is_active",
  "category", "decision", "title_confidence", "base_slug", "redirect_to", "owner", "status"];
function esc(v) { const s = String(v ?? ""); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
const csv = [cols.join(",")].concat(csvRows.map((r) => cols.map((c) => esc(r[c])).join(","))).join("\n");
fs.writeFileSync(path.join(OUT_DIR, "product-registry.csv"), "\uFEFF" + csv, "utf8");

const stats = {
  totalProducts: rows.length,
  trueDupGroups: [...byDesc.values()].filter((v) => v.length > 1).length,
  trueDupProducts: [...byDesc.values()].filter((v) => v.length > 1).reduce((s, v) => s + v.length, 0),
  misleadingGroups: [...byTitle.values()].filter((m) => m.length > 1 && new Set(m.map((x) => normKey(x.shortDesc))).size > 1).length,
  misleadingProducts: [...byTitle.values()].filter((m) => m.length > 1 && new Set(m.map((x) => normKey(x.shortDesc))).size > 1).reduce((s, m) => s + m.length, 0),
  similarTitleFamilyGroups: familyGroups,
  similarTitleFamilyProducts: familyProducts,
  flaggedProducts: csvRows.length,
  registryRows: csvRows.length,
  decisions: {
    keepBase: csvRows.filter((r) => r.decision.startsWith("نگهداشتن (مبنا)")).length,
    merge: csvRows.filter((r) => r.decision.startsWith("ادغام")).length,
    rename: csvRows.filter((r) => r.decision.startsWith("تغییر عنوان") || r.decision.startsWith("آرشیو")).length,
    keepUnchanged: csvRows.filter((r) => r.decision.startsWith("نگهداشتن (بدون")).length,
    manualReview: csvRows.filter((r) => r.decision.startsWith("بررسی دستی")).length,
  },
  claudeProducts: rows.filter((r) => /claude/i.test((r.title || "") + (r.shortDesc || ""))).length,
  redirectsPlanned: csvRows.filter((r) => r.redirect_to).length,
  validationProblems: problems,
  validationWarnings: warnings.length,
};
fs.writeFileSync(path.join(OUT_DIR, "audit-stats.json"), JSON.stringify(stats, null, 2), "utf8");
console.log(JSON.stringify(stats, null, 2));
console.log("\nCSV rows:", csvRows.length, "->", path.join(OUT_DIR, "product-registry.csv"));
if (problems.length) { console.error("\nVALIDATION PROBLEMS (" + problems.length + "):"); problems.slice(0, 20).forEach((p) => console.error("  - " + p)); }
else console.log("VALIDATION: OK — every merge has a same-function base in the same supplier group, every group keeps exactly one base.");
if (warnings.length) console.log(`(notes: ${warnings.length} rows keep a legacy access label inside the same offering — expected)`);
