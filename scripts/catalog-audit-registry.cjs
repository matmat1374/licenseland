/**
 * Catalog audit — registry generator
 * Reads audit-all-products.json, classifies problems, and emits:
 *   1. product-registry.csv  (traceable registry with decisions + proposed titles/SKUs)
 *   2. audit-stats.json      (numbers used in the report)
 * No DB access, no writes to production.
 */
const fs = require("fs");
const path = require("path");

const SRC = "audit-all-products.json";
const OUT_DIR = "docs/catalog-audit";
const rows = JSON.parse(fs.readFileSync(SRC, "utf8"));
fs.mkdirSync(OUT_DIR, { recursive: true });

// ---------- parsers ----------
function specsOf(r) {
  try { return JSON.parse(r.specifications || "{}"); } catch { return {}; }
}

function parseAttrs(r) {
  const s = (r.shortDesc || "") + " " + (r.title || "");
  const sum = specsOf(r);
  const out = { access: "", quota: "", duration: "", warranty: "", tier: "" };

  // access type
  if (/premium seat|seat/i.test(s)) out.access = "سیت اشتراکی";
  else if (/api|token|credit/i.test(s)) out.access = "API/توکن";
  else if (/gift card|giftcard/i.test(s)) out.access = "گیفتکارت";
  else if (/شماره مجازی|virtual/i.test(s)) out.access = "شماره مجازی";
  else if (/account|اکانت/i.test(s)) out.access = "اکانت";
  else out.access = "نامشخص";

  // quota
  const mT = s.match(/(\d+)\s*M\s*(credit|token)/i) || s.match(/(\d+)\s*(million)?\s*tokens?/i);
  if (mT) out.quota = mT[1] + "M توکن";
  if (!out.quota) { const mD = s.match(/\$\s*(\d+)/i) || s.match(/(\d+)\s*usd/i); if (mD) out.quota = (mD[1] || mD[2]) + "$"; }
  if (!out.quota) { const mC = s.match(/(\d+)\s*(k)?\s*credits?/i); if (mC) out.quota = mC[1] + (mC[2] ? "K" : "") + " کردیت"; }

  // duration
  // duration — months take precedence over day tokens ("24H" is often the warranty window)
  if (/12\s*months?|1\s*year/i.test(s)) out.duration = "۱ ساله";
  else if (/6\s*months?|180\s*d\b/i.test(s)) out.duration = "۶ ماهه";
  else if (/3\s*months?|90\s*d\b/i.test(s)) out.duration = "۳ ماهه";
  else if (/2\s*months?|60\s*d\b/i.test(s)) out.duration = "۲ ماهه";
  else if (/1\s*month|30\s*days?|30\s*d\b|1\s*m\b/i.test(s)) out.duration = "۱ ماهه";
  else if (/3\s*days?/i.test(s)) out.duration = "۳ روزه";
  else if (/7\s*days?|7\s*d\b/i.test(s)) out.duration = "۷ روزه";
  else if (/14\s*days?/i.test(s)) out.duration = "۱۴ روزه";
  else if (/1\s*day|24\s*h\b/i.test(s)) out.duration = "۱ روزه";
  else if (/(\d+)\s*days?/i.test(s)) { const m = s.match(/(\d+)\s*days?/i); out.duration = toFaDigits(m[1]) + " روزه"; }
  if (!out.duration && r.duration) out.duration = r.duration;

  // warranty
  if (/no warranty|بدون گارانتی/i.test(s)) out.warranty = "بدون گارانتی";
  else if (/warranty|گارانتی/i.test(s)) out.warranty = "با گارانتی";

  // tier
  if (/\bvip\b/i.test(s)) out.tier = "VIP";
  else if (/\bstandard\b/i.test(s)) out.tier = "Standard";
  else if (/\bmega\b/i.test(s)) out.tier = "Mega";

  return out;
}

function brandOf(r) {
  const s = (r.title || "") + " " + (r.shortDesc || "");
  const known = [["claude", "کلود"], ["chatgpt", "چتجیپیتی"], ["openai", "OpenAI"], ["gemini", "جمینای"],
    ["capcut", "کپکات"], ["genspark", "Genspark"], ["magica", "Magica"], ["codex", "Codex"],
    ["canva", "کانوا"], ["spotify", "اسپاتیفای"], ["netflix", "نتفلیکس"], ["youtube", "یوتیوب"],
    ["midjourney", "میدجرنی"], ["adobe", "ادوبی"], ["telegram", "تلگرام"], ["whatsapp", "واتساپ"],
    ["gmail", "جیمیل"], ["itunes", "آیتیونز"], ["amazon", "آمازون"], ["google play", "گوگل پلی"],
    ["playstation", "پلیاستیشن"], ["razer", "ریزر"], ["mobile legends", "موبایل لجندز"],
    ["free fire", "فری فایر"], ["curs(or)?", "کرسر"], ["windsurf", "ویندسرف"]];
  for (const [re, fa] of known) if (new RegExp(re, "i").test(s)) return fa;
  return (r.brand || "—");
}

const BRAND_SKU = [[/claude/i,"CLAUDE"],[/chatgpt/i,"CHATGPT"],[/openai/i,"OPENAI"],[/gemini/i,"GEMINI"],[/capcut/i,"CAPCUT"],[/genspark/i,"GENSPARK"],[/magica/i,"MAGICA"],[/codex/i,"CODEX"],[/canva/i,"CANVA"],[/spotify/i,"SPOTIFY"],[/netflix/i,"NETFLIX"],[/youtube/i,"YOUTUBE"],[/midjourney/i,"MIDJOURNEY"],[/adobe/i,"ADOBE"],[/telegram/i,"TELEGRAM"],[/whatsapp/i,"WHATSAPP"],[/gmail/i,"GMAIL"],[/itunes/i,"ITUNES"],[/amazon/i,"AMAZON"],[/google play/i,"GPLAY"],[/playstation|psn/i,"PSN"],[/razer/i,"RAZER"],[/mobile legends/i,"MLBB"],[/free fire/i,"FF"],[/cursor/i,"CURSOR"],[/windsurf/i,"WINDSURF"]];

function skuPart(x) {
  return (x || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

function brandSku(r) {
  const s = (r.title || "") + " " + (r.shortDesc || "");
  for (const [re, code] of BRAND_SKU) if (re.test(s)) return code;
  return "ITEM";
}

function toFaDigits(s) {
  return String(s).replace(/0/g,"۰").replace(/1/g,"۱").replace(/2/g,"۲").replace(/3/g,"۳").replace(/4/g,"۴").replace(/5/g,"۵").replace(/6/g,"۶").replace(/7/g,"۷").replace(/8/g,"۸").replace(/9/g,"۹");
}

function makeSku(r, a) {
  const brand = brandSku(r);
  const type = a.access === "API/توکن" ? "API" : a.access === "سیت اشتراکی" ? "SEAT" : a.access === "گیفتکارت" ? "GC" : a.access === "شماره مجازی" ? "VNO" : "ACC";
  const quota = skuPart(a.quota.replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/\$/g, "USD")) || "";
  const dur = a.duration.replace(/[^\u06F0-\u06F9۰-۹0-9]/g, "");
  const durMap = { "۱": "1", "۲": "2", "۳": "3", "۶": "6", "۷": "7", "۱۰": "10", "۱۲": "12" };
  const durN = durMap[dur] || dur;
  const durUnit = /روزه/.test(a.duration) ? "D" : "M";
  const tier = a.tier ? skuPart(a.tier) : "";
  const warn = a.warranty === "بدون گارانتی" ? "NOWAR" : "";
  return [brand, type, quota, durN + durUnit, tier, warn].filter(Boolean).join("-");
}

function makeTitle(r, a) {
  const brand = brandOf(r);
  const parts = [brand];
  if (a.access === "گیفتکارت") parts.push("گیفتکارت" + (a.quota ? ` ${toFaDigits(a.quota)}` : ""));
  else if (a.access === "API/توکن") parts.push("API" + (a.quota ? ` — ${toFaDigits(a.quota)}` : ""));
  else if (a.access === "سیت اشتراکی") parts.push("سیت اشتراکی" + (a.tier ? ` (${a.tier})` : ""));
  else if (a.access === "اکانت") parts.push("اکانت" + (a.tier && a.tier !== "Pro" ? ` (${a.tier})` : ""));
  else if (a.access === "شماره مجازی") parts.push("شماره مجازی");
  else if (a.access === "گیفتکارت") parts.push("گیفتکارت");
  let t = parts.join(" ");
  if (a.duration) t += ` (${a.duration})`;
  if (a.warranty) t += ` — ${a.warranty}`;
  return t.replace(/\s+/g, " ").trim();
}

// ---------- grouping ----------
// Normalized supplier key: catches brand aliases, emojis/flags, and noise words
// that make the *same* supplier product look different (e.g. "Openai" vs "ChatGPT").
function normKey(shortDesc) {
  return (shortDesc || "").toLowerCase()
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2B00}-\u{2BFF}]/gu, " ")
    .replace(/\bopenai\b/g, "chatgpt")
    .replace(/\b(official|slot|full warranty|full|no warranty|with warranty|warranty)\b/g, " ")
    .replace(/[^a-z0-9\u0600-\u06FF\s]/g, " ")
    .replace(/\s+/g, " ").trim();
}

const byDesc = {}, byTitle = {};
for (const r of rows) {
  const d = normKey(r.shortDesc);
  const t = (r.title || "").trim();
  if (d) (byDesc[d] = byDesc[d] || []).push(r);
  if (t) (byTitle[t] = byTitle[t] || []).push(r);
}

const flagged = new Map(); // id -> {kind, note}
for (const [k, v] of Object.entries(byDesc)) {
  if (v.length > 1) for (const r of v) flagged.set(r.id, { kind: "true-duplicate", groupKey: k, groupSize: v.length });
}
for (const [k, v] of Object.entries(byTitle)) {
  const descs = new Set(v.map(x => normKey(x.shortDesc)));
  if (v.length > 1 && descs.size > 1) {
    for (const r of v) {
      const prev = flagged.get(r.id);
      flagged.set(r.id, { kind: prev ? "true-duplicate+misleading" : "misleading-title", groupKey: k, groupSize: v.length });
    }
  }
}
// similar-title family: same brand + same duration, but different function (access/quota).
// This is the Claude case: "Claude Pro (۱ ماهه)" covering an API credit, a Premium seat
// and a trial account — no single title is *duplicated* yet users can't tell them apart.
const byFamily = {};
for (const r of rows) {
  const b = brandOf(r);
  if (b === "—") continue;
  const fam = b + "|" + (parseAttrs(r).duration || "?");
  (byFamily[fam] = byFamily[fam] || []).push(r);
}
let familyGroups = 0, familyProducts = 0;
for (const [fam, v] of Object.entries(byFamily)) {
  if (v.length < 2) continue;
  const sigs = new Set(v.map(x => { const a = parseAttrs(x); return a.access + "|" + a.quota; }));
  if (sigs.size < 2) continue;
  familyGroups++; familyProducts += v.length;
  for (const r of v) {
    if (flagged.has(r.id)) continue;
    flagged.set(r.id, { kind: "similar-title-family", groupKey: fam, groupSize: v.length });
  }
}

// ---------- decisions ----------
// base = highest salesCount among active members of the same true-dup group; fallbacks:
// cheapest cost_usd active; then newest supplier id.
function chooseBase(members) {
  const active = members.filter(m => m.isActive);
  const pool = active.length ? active : members;
  return pool.slice().sort((a, b) => {
    if ((b.salesCount || 0) !== (a.salesCount || 0)) return (b.salesCount || 0) - (a.salesCount || 0);
    const ca = specsOf(a).cost_usd || 1e9, cb = specsOf(b).cost_usd || 1e9;
    if (ca !== cb) return ca - cb;
    return (specsOf(b).supplier_product_id || 0) - (specsOf(a).supplier_product_id || 0);
  })[0];
}

const groups = {};
for (const [id, meta] of flagged) {
  const key = meta.groupKey + "|" + (meta.kind.includes("misleading") ? "T" : "D");
  (groups[key] = groups[key] || []).push(rows.find(r => r.id === id));
}

const baseBySlug = {};
for (const [key, members] of Object.entries(groups)) {
  if (!key.endsWith("|D")) continue;
  baseBySlug[key] = chooseBase(members);
}
// title-groups don't get merged (different function) — each keeps its own row, rename only

const csvRows = [];
for (const r of rows) {
  const meta = flagged.get(r.id);
  if (!meta) continue;
  const a = parseAttrs(r);
  const sp = specsOf(r);
  const cat = (r.categoryRel && r.categoryRel.name) || r.category || "";
  const brandOk = brandOf(r) !== "—";
  const isVirtual = /شماره مجازی|OTP/i.test(cat);
  const highConf = brandOk && a.access !== "نامشخص" && (a.quota || a.duration) && !isVirtual;
  let decision, base, redirect, status;
  if (meta.kind.includes("true-duplicate")) {
    const key = meta.groupKey + "|D";
    base = baseBySlug[key];
    if (base && base.id === r.id) { decision = "نگهداشتن (مبنا)"; redirect = ""; }
    else { decision = "ادغام/آرشیو"; redirect = base ? base.slug : ""; }
    status = "در انتظار تأیید";
  } else if (isVirtual) {
    decision = "نگهداشتن (بدون تغییر)";
    redirect = "";
    status = "—";
  } else if (!highConf) {
    decision = "بررسی دستی (عنوان)";
    redirect = "";
    status = "نیازمند بررسی";
  } else if (!r.isActive) {
    decision = "آرشیو (غیرفعال) + تغییر عنوان";
    redirect = "";
    status = "در انتظار تأیید";
  } else {
    decision = "تغییر عنوان (نگهداشتن)";
    redirect = "";
    status = "در انتظار تأیید";
  }
  csvRows.push({
    product_id: r.id,
    slug: r.slug,
    issue_type: meta.kind,
    group_size: meta.groupSize,
    current_title: r.title,
    proposed_title: makeTitle(r, a),
    proposed_sku: makeSku(r, a),
    price_toman: r.price,
    cost_usd: sp.cost_usd ?? "",
    supplier_product_id: sp.supplier_product_id ?? "",
    access_type: a.access,
    quota: a.quota,
    duration: a.duration,
    warranty: a.warranty,
    is_active: r.isActive ? "فعال" : "غیرفعال",
    category: (r.categoryRel && r.categoryRel.name) || r.category || "",
    decision,
    title_confidence: isVirtual ? "n/a" : (highConf ? "بالا" : "پایین"),
    base_slug: base ? base.slug : "",
    redirect_to: redirect,
    owner: "",
    status
  });
}

// ---------- write CSV ----------
const cols = ["product_id","slug","issue_type","group_size","current_title","proposed_title","proposed_sku","price_toman","cost_usd","supplier_product_id","access_type","quota","duration","warranty","is_active","category","decision","title_confidence","base_slug","redirect_to","owner","status"];
function esc(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
const csv = [cols.join(",")].concat(csvRows.map(r => cols.map(c => esc(r[c])).join(","))).join("\n");
fs.writeFileSync(path.join(OUT_DIR, "product-registry.csv"), "\uFEFF" + csv, "utf8");

// ---------- stats ----------
const stats = {
  totalProducts: rows.length,
  trueDupGroups: Object.values(byDesc).filter(v => v.length > 1).length,
  trueDupProducts: Object.values(byDesc).filter(v => v.length > 1).reduce((s, v) => s + v.length, 0),
  misleadingGroups: Object.entries(byTitle).filter(([, v]) => v.length > 1 && new Set(v.map(x => normKey(x.shortDesc))).size > 1).length,
  misleadingProducts: Object.entries(byTitle).filter(([, v]) => v.length > 1 && new Set(v.map(x => normKey(x.shortDesc))).size > 1).reduce((s, [, v]) => s + v.length, 0),
  flaggedProducts: flagged.size,
  registryRows: csvRows.length,
  decisions: {
    keepBase: csvRows.filter(r => r.decision.startsWith("نگهداشتن (مبنا)")).length,
    merge: csvRows.filter(r => r.decision.startsWith("ادغام")).length,
    rename: csvRows.filter(r => r.decision.startsWith("تغییر عنوان") || r.decision.startsWith("آرشیو")).length,
    keepUnchanged: csvRows.filter(r => r.decision.startsWith("نگهداشتن (بدون تغییر)")).length,
    manualReview: csvRows.filter(r => r.decision.startsWith("بررسی دستی")).length
  },
  claudeProducts: rows.filter(r => /claude/i.test((r.title || "") + (r.shortDesc || ""))).length,
  similarTitleFamilyGroups: familyGroups,
  similarTitleFamilyProducts: familyProducts,
  redirectsPlanned: csvRows.filter(r => r.redirect_to).length
};
fs.writeFileSync(path.join(OUT_DIR, "audit-stats.json"), JSON.stringify(stats, null, 2), "utf8");
console.log(JSON.stringify(stats, null, 2));
console.log("\nCSV rows:", csvRows.length, "->", path.join(OUT_DIR, "product-registry.csv"));
