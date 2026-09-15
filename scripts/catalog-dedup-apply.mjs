/**
 * Catalog dedup / rename applier (DRAFT — requires explicit --apply)
 * ------------------------------------------------------------------
 * Reads the audit registry (docs/catalog-audit/product-registry.csv) and applies:
 *   - "نگهداشتن (مبنا)"                    -> ensure isActive=true, rename to proposed_title
 *   - "ادغام/آرشیو"                        -> isActive=false + 301 redirect old slug -> base slug
 *   - "آرشیو (غیرفعال) + تغییر عنوان"      -> isActive=false + rename
 *   - "تغییر عنوان (نگهداشتن)"             -> rename only
 *
 * Safety:
 *   - NEVER deletes rows (OrderItem/LicenseKey FKs stay intact).
 *   - Default is DRY RUN; pass --apply to write.
 *   - Merges new redirects into src/data/slug-redirects.json (keeps the existing 777).
 *   - --db <url> lets you target a copy of the DB for verification.
 *
 * Usage:
 *   node scripts/catalog-dedup-apply.mjs                       # dry run (local DB)
 *   node scripts/catalog-dedup-apply.mjs --apply               # apply locally
 *   node scripts/catalog-dedup-apply.mjs --db "file:./audit-test.db" --apply
 */
import fs from "fs";
import path from "path";
import readline from "readline";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const dbIdx = args.indexOf("--db");
const DB_URL = dbIdx !== -1 ? args[dbIdx + 1] : null;
const REGISTRY = "docs/catalog-audit/product-registry.csv";
const REDIRECTS = "src/data/slug-redirects.json";

if (DB_URL) process.env.DATABASE_URL = DB_URL;
const db = new PrismaClient();

function parseCsv(text) {
  const rows = []; let cur = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else {
      if (c === '"') q = true;
      else if (c === ",") { cur.push(field); field = ""; }
      else if (c === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; }
      else if (c === "\r") { /* skip */ }
      else field += c;
    }
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur); }
  return rows;
}

(async () => {
  const raw = fs.readFileSync(REGISTRY, "utf8").replace(/^\uFEFF/, "");
  const rows = parseCsv(raw);
  const head = rows[0];
  const idx = Object.fromEntries(head.map((h, i) => [h, i]));
  const recs = rows.slice(1).filter(r => r.length > 3).map(r => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));

  console.log(`Registry rows: ${recs.length}${APPLY ? "  [APPLY]" : "  [DRY RUN]"}${DB_URL ? "  db=" + DB_URL : ""}`);

  const redirects = JSON.parse(fs.readFileSync(REDIRECTS, "utf8"));
  const beforeRedirects = Object.keys(redirects).length;

  let archived = 0, renamed = 0, kept = 0, newRedirects = 0, manual = 0;

  for (const r of recs) {
    const d = r.decision || "";
    const prod = await db.product.findFirst({ where: { OR: [{ id: r.product_id }, { slug: r.slug }] } });
    if (!prod) { console.log("  ! missing product", r.slug); continue; }

    const data = {};
    if (d.startsWith("ادغام")) {
      if (prod.isActive) { data.isActive = false; archived++; }
      if (r.redirect_to && r.redirect_to !== prod.slug) { redirects[prod.slug] = r.redirect_to; newRedirects++; }
    } else if (d.startsWith("آرشیو")) {
      if (prod.isActive) { data.isActive = false; archived++; }
      if (r.title_confidence === "بالا" && r.proposed_title && r.proposed_title !== prod.title) { data.title = r.proposed_title; renamed++; }
    } else if (d.startsWith("تغییر عنوان")) {
      if (r.title_confidence === "بالا" && r.proposed_title && r.proposed_title !== prod.title) { data.title = r.proposed_title; renamed++; }
      else { manual++; }
    } else if (d.startsWith("نگهداشتن (مبنا)")) {
      if (!prod.isActive) { data.isActive = true; kept++; }
      if (r.title_confidence === "بالا" && r.proposed_title && r.proposed_title !== prod.title) { data.title = r.proposed_title; renamed++; }
    } else {
      manual++;
    }

    if (APPLY && Object.keys(data).length) {
      await db.product.update({ where: { id: prod.id }, data });
    }
  }

  console.log(`\nResult: archived=${archived} renamed=${renamed} kept-active=${kept} manual-review=${manual} new-redirects=${newRedirects}`);
  console.log(`Redirects: ${beforeRedirects} -> ${Object.keys(redirects).length}`);

  if (APPLY) {
    fs.writeFileSync(REDIRECTS, JSON.stringify(redirects, null, 2), "utf8");
    console.log(`Written: ${REDIRECTS}`);
  } else {
    console.log("(dry run — no DB writes, no redirect file write)");
  }
  await db.$disconnect();
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
