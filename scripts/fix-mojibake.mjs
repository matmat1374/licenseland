/**
 * Repair Windows-1252 mojibake in source files.
 * --------------------------------------------
 * Some tool wrote `src/lib/supplier.ts` by decoding UTF-8 bytes as Windows-1252,
 * which turned Persian strings into sequences like "Ø´Ù…Ø§Ø±Ù‡" (شماره) and emoji
 * into "ðŸ”"" (🔔). Consequence: Persian regexes such as /شماره مجازی/ never match,
 * and any string built by this file is written to the catalogue as garbage.
 *
 * The transform is byte-exact and reversible: map the mojibake characters back
 * to their cp1252 bytes, then decode those bytes as UTF-8.
 *
 * Safety guards:
 *   - only non-ASCII, non-Persian runs of length >= 2 are considered;
 *   - a run is replaced only if the recovery yields valid UTF-8 with no U+FFFD;
 *   - default is DRY RUN (report only); pass --apply to write.
 *
 * Usage:
 *   node scripts/fix-mojibake.mjs                 # report
 *   node scripts/fix-mojibake.mjs --apply         # repair in place
 */
import fs from "fs";
import path from "path";

const APPLY = process.argv.includes("--apply");
const TARGETS = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const ROOTS = TARGETS.length ? TARGETS : ["src", "scripts", "kernel"];

const CP1252 = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85, 0x2020: 0x86,
  0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a, 0x2039: 0x8b, 0x0152: 0x8c,
  0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92, 0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95,
  0x2013: 0x96, 0x2014: 0x97, 0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b,
  0x0153: 0x9c, 0x017e: 0x9e, 0x0178: 0x9f,
};

function recoverOne(run) {
  const bytes = [];
  for (const ch of run) {
    const cp = ch.codePointAt(0);
    if (CP1252[cp] !== undefined) bytes.push(CP1252[cp]);
    else if (cp <= 0xff) bytes.push(cp);
    else return null;
  }
  const text = Buffer.from(bytes).toString("utf8");
  if (text.includes("\uFFFD")) return null;
  if (!text.trim()) return null;
  return text;
}

// maximal runs of characters that are neither ASCII nor Persian letters
const RUN = /[^\x00-\x7F\u0600-\u06FF]+/g;

function repair(text) {
  let changed = 0;
  const out = text.replace(RUN, (run) => {
    if (run.length < 2) return run;
    const fixed = recoverOne(run);
    if (fixed === null) return run;
    // require the recovery to actually produce Persian or a symbol — never ASCII-only
    if (!/[\u0600-\u06FF\u2000-\u2BFF\u{1F000}-\u{1FAFF}]/u.test(fixed)) return run;
    changed++;
    return fixed;
  });
  return { out, changed };
}

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!/node_modules|[.]next|[.]git|dist/.test(p)) walk(p, acc);
    } else if (/\.(ts|tsx|mjs|cjs|js)$/.test(e.name)) {
      acc.push(p);
    }
  }
  return acc;
}

let filesTouched = 0, runsFixed = 0;
for (const root of ROOTS) {
  if (!fs.existsSync(root)) continue;
  const files = fs.statSync(root).isDirectory() ? walk(root) : [root];
  for (const f of files) {
    const src = fs.readFileSync(f, "utf8");
    if (!/[ØÙÃÂðÚ]/.test(src)) continue;
    const { out, changed } = repair(src);
    if (changed === 0) continue;
    filesTouched++; runsFixed += changed;
    console.log(`${APPLY ? "FIX " : "WOULD FIX"} ${f.replace(/\\/g, "/")}  (${changed} runs)`);
    const before = src.split(/\r?\n/).find((l) => /[ØÙÃÂðÚ]/.test(l));
    const afterLine = out.split(/\r?\n/).find((l) => l.includes(before.trim().slice(0, 12)));
    if (before && afterLine) {
      console.log(`    before: ${before.trim().slice(0, 90)}`);
      console.log(`    after : ${afterLine.trim().slice(0, 90)}`);
    }
    if (APPLY) fs.writeFileSync(f, out, "utf8");
  }
}
console.log(`\n${APPLY ? "Repaired" : "Would repair"}: ${runsFixed} runs in ${filesTouched} files.`);
if (!APPLY) console.log("(dry run — pass --apply to write)");
