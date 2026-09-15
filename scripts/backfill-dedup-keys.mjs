/**
 * Backfill `dedup_key` on existing products.
 * ------------------------------------------
 * The supply sync now records an identity key on every product it writes, but
 * rows created before that change don't have one — so the identity lookup can't
 * match them yet. This script fills the gap once.
 *
 * Usage:
 *   node scripts/backfill-dedup-keys.mjs                      # report (local DB)
 *   node scripts/backfill-dedup-keys.mjs --apply              # write
 *   node scripts/backfill-dedup-keys.mjs --db "file:./x.db" --apply
 */
import { createRequire } from "module";
import { buildDedupKey } from "../src/lib/product-naming.ts";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const dbIdx = args.indexOf("--db");
if (dbIdx !== -1) process.env.DATABASE_URL = args[dbIdx + 1];

const db = new PrismaClient();

function specsOf(raw) {
  try { return JSON.parse(raw || "{}"); } catch { return {}; }
}

const products = await db.product.findMany({
  select: { id: true, slug: true, title: true, shortDesc: true, category: true, specifications: true, isActive: true },
});

let already = 0, filled = 0, skipped = 0, changes = 0;
const byKey = new Map();

for (const p of products) {
  if (!p.shortDesc) { skipped++; continue; }
  const specs = specsOf(p.specifications);
  if (specs.dedup_key) { already++; }
  const key = buildDedupKey(p.shortDesc, { category: p.category || "" });
  if (!byKey.has(key)) byKey.set(key, []);
  byKey.get(key).push(p.slug);

  if (!specs.dedup_key) {
    filled++;
    if (APPLY) {
      specs.dedup_key = key;
      await db.product.update({ where: { id: p.id }, data: { specifications: JSON.stringify(specs) } });
      changes++;
    }
  }
}

const dupKeys = [...byKey.entries()].filter(([, slugs]) => slugs.length > 1);
console.log(`${APPLY ? "APPLIED" : "DRY RUN"} — products: ${products.length}`);
console.log(`  already had a key : ${already}`);
console.log(`  key written       : ${changes}${APPLY ? "" : ` (would be ${filled})`}`);
console.log(`  skipped (no supplier name): ${skipped}`);
console.log(`  distinct identity keys: ${byKey.size}`);
console.log(`  identity keys shared by >1 product (would merge on the next sync): ${dupKeys.length}`);
for (const [k, slugs] of dupKeys.slice(0, 8)) console.log(`     ${k}\n        ${slugs.slice(0, 6).join(", ")}`);
if (!APPLY) console.log("(dry run — pass --apply to write)");
await db.$disconnect();
