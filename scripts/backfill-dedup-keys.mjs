/**
 * Backfill `dedup_key` on existing products.
 * ------------------------------------------
 * The supply sync now records an identity key on every product it writes, but
 * rows created before that change have none — so the identity lookup cannot
 * match them yet. This script fills the gap once.
 *
 * The keys are precomputed into docs/catalog-audit/dedup-keys.json by
 * `node --input-type=module` from src/lib/product-naming.ts. The mapping is
 * passed in as data on purpose: the production server runs Node 20, which cannot
 * import TypeScript directly, so this script must stay dependency-free.
 *
 * Usage:
 *   node scripts/backfill-dedup-keys.mjs                                # report (local DB)
 *   node scripts/backfill-dedup-keys.mjs --apply                        # write
 *   node scripts/backfill-dedup-keys.mjs --db "file:./x.db" --map docs/catalog-audit/dedup-keys.json --apply
 */
import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const FORCE = args.includes("--force"); // overwrite keys already present (used to correct an earlier bad key)
const dbIdx = args.indexOf("--db");
if (dbIdx !== -1) process.env.DATABASE_URL = args[dbIdx + 1];
const mapIdx = args.indexOf("--map");
const MAP_PATH = mapIdx !== -1 ? args[mapIdx + 1] : "docs/catalog-audit/dedup-keys.json";

const keyBySlug = JSON.parse(fs.readFileSync(MAP_PATH, "utf8"));
const db = new PrismaClient();

function specsOf(raw) {
  try { return JSON.parse(raw || "{}"); } catch { return {}; }
}

const products = await db.product.findMany({
  select: { id: true, slug: true, specifications: true },
});

let already = 0, filled = 0, missingKey = 0, changes = 0;

for (const p of products) {
  const specs = specsOf(p.specifications);
  const key = keyBySlug[p.slug];
  if (!key) { missingKey++; continue; }
  if (specs.dedup_key === key) { already++; continue; }
  if (specs.dedup_key && !FORCE) { already++; continue; }
  filled++;
  if (APPLY) {
    specs.dedup_key = key;
    await db.product.update({ where: { id: p.id }, data: { specifications: JSON.stringify(specs) } });
    changes++;
  }
}

const grouped = new Map();
for (const [slug, key] of Object.entries(keyBySlug)) {
  if (!grouped.has(key)) grouped.set(key, []);
  grouped.get(key).push(slug);
}
const shared = [...grouped.values()].filter((v) => v.length > 1);

console.log(`${APPLY ? "APPLIED" : "DRY RUN"} — products: ${products.length}`);
console.log(`  already had a key        : ${already}`);
console.log(`  key ${APPLY ? "written" : "pending"}            : ${APPLY ? changes : filled}`);
console.log(`  no key in the mapping    : ${missingKey}`);
console.log(`  distinct identity keys   : ${grouped.size}`);
console.log(`  keys shared by >1 product: ${shared.length}`);
if (!APPLY) console.log("(dry run — pass --apply to write)");
await db.$disconnect();
