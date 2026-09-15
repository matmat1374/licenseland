/**
 * Merge products that share the same identity key.
 * -----------------------------------------------
 * The catalogue cleanup used the supplier's *name* to find duplicates, which is
 * the conservative signal. Now that every product also carries a `dedup_key`
 * (brand + normalised supplier name, or brand + country for virtual numbers), we
 * can enforce the identity rule retroactively: any group of ACTIVE products that
 * share a key is the same offering listed twice.
 *
 * For each such group: keep one base, archive the rest, and add a 301 redirect.
 * Nothing is ever deleted.
 *
 * Usage:
 *   node scripts/merge-by-identity-key.mjs                     # dry run
 *   node scripts/merge-by-identity-key.mjs --apply
 */
import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const dbIdx = args.indexOf("--db");
if (dbIdx !== -1) process.env.DATABASE_URL = args[dbIdx + 1];
const REDIRECTS = "src/data/slug-redirects.json";


// ---- guard against boilerplate supplier names -------------------------------
// Some listings carry a generic description instead of a product name (e.g. a
// Persian "instant delivery … details in the description" sentence). Those rows
// share a normalised name across COMPLETELY different products, so identity by
// name alone is not enough: the two titles must also share a distinctive token.
const STOPWORDS = new Set(["اکانت","اشتراک","پرمیوم","پریمیوم","فعالسازی","فعال","تحویل","گارانتی","بدون","روزه","ماهه","ماهی","ساله","شماره","مجازی","وریفای","پیامک","دریافت","قانونی","آنی","جزئیات","توضیحات","محصول","لطفا","account","subscription","premium","virtual","number","verify","warranty","delivery","instant","details","product","full","with","month","year","days","day"]);
function distinctiveTokens(text) {
  return new Set(String(text || "").toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 4 && !STOPWORDS.has(t)));
}
function sharesDistinctiveToken(a, b) {
  const ta = distinctiveTokens(a);
  for (const t of distinctiveTokens(b)) if (ta.has(t)) return true;
  return false;
}

const db = new PrismaClient();

function specsOf(raw) { try { return JSON.parse(raw || "{}"); } catch { return {}; } }

const products = await db.product.findMany({
  select: { id: true, slug: true, title: true, isActive: true, salesCount: true, specifications: true },
});

const groups = new Map();
for (const p of products) {
  const specs = specsOf(p.specifications);
  const key = specs.dedup_key;
  if (!key) continue;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push({ ...p, cost: Number(specs.cost_usd || 1e9), sup: Number(specs.supplier_product_id || 0) });
}

const collisions = [...groups.entries()].filter(([, v]) => v.filter((x) => x.isActive).length > 1);
console.log(`${APPLY ? "APPLIED" : "DRY RUN"} — products: ${products.length} | identity keys: ${groups.size}`);
console.log(`  keys with more than one ACTIVE product: ${collisions.length}`);

const redirects = fs.existsSync(REDIRECTS) ? JSON.parse(fs.readFileSync(REDIRECTS, "utf8")) : {};
let archived = 0, added = 0, skipped = 0;

for (const [key, members] of collisions) {
  const active = members.filter((m) => m.isActive);
  const base = active.slice().sort((a, b) =>
    (b.salesCount || 0) - (a.salesCount || 0) || a.cost - b.cost || b.sup - a.sup)[0];
  console.log(`\n  ${key}`);
  console.log(`     keep : ${base.slug} (${base.title})`);
  for (const m of active) {
    if (m.id === base.id) continue;
    if (!sharesDistinctiveToken(m.title, base.title)) {
      console.log(`     SKIP : ${m.slug} (${m.title}) — no distinctive token shared with the base`);
      skipped++;
      continue;
    }
    console.log(`     merge: ${m.slug} (${m.title})`);
    archived++;
    if (m.slug !== base.slug && redirects[m.slug] !== base.slug) { redirects[m.slug] = base.slug; added++; }
    if (APPLY) await db.product.update({ where: { id: m.id }, data: { isActive: false } });
  }
}

if (APPLY && added) fs.writeFileSync(REDIRECTS, JSON.stringify(redirects, null, 2), "utf8");
console.log(`\narchived: ${archived} | new redirects: ${added} | skipped by the guard: ${skipped}${APPLY ? " (written)" : ""}`);
if (!APPLY) console.log("(dry run — pass --apply to write)");
await db.$disconnect();
