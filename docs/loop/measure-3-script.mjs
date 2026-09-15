// Loop iteration 3 — read-only measurements against a locally served prod build.
import fs from "node:fs";
import zlib from "node:zlib";
import path from "node:path";

const BASE = process.env.BASE || "http://localhost:3011";
const REPO = process.env.REPO || "C:\\Users\\matin\\Documents\\antigravity\\licenseland";
const TAG = process.env.TAG || "baseline";
const out = { tag: TAG, base: BASE };

async function get(p) {
  const r = await fetch(BASE + p, { redirect: "manual" });
  const buf = Buffer.from(await r.arrayBuffer());
  return { status: r.status, buf, text: buf.toString("utf8") };
}

// ---------- A. every /shop?cat= URL ----------
const slugs = JSON.parse(fs.readFileSync(process.env.SLUGS, "utf8"));
const cats = [];
for (const slug of slugs) {
  const p = `/shop?cat=${encodeURIComponent(slug)}`;
  const { status, text } = await get(p);
  const title = (text.match(/<title>([^<]*)<\/title>/) || [, null])[1];
  const canonical = (text.match(/<link rel="canonical" href="([^"]*)"/) || [, null])[1];
  const productLinks = new Set([...text.matchAll(/href="\/product\/([^"]+)"/g)].map((m) => m[1]));
  const emptyState = text.includes("محصولی یافت نشد");
  const h1 = (text.match(/<h1[^>]*>([^<]*)<\/h1>/) || [, null])[1];
  cats.push({ slug, status, products: productLinks.size, emptyState, title, canonical, h1 });
}
out.categories = cats;
out.categoriesSummary = {
  total: cats.length,
  nonEmpty: cats.filter((c) => c.products > 0).length,
  empty: cats.filter((c) => c.products === 0).length,
  distinctTitles: new Set(cats.map((c) => c.title)).size,
  distinctCanonicals: new Set(cats.map((c) => c.canonical)).size,
  distinctH1: new Set(cats.map((c) => c.h1)).size,
};

// ---------- B. /shop and / payload ----------
const payload = {};
for (const p of ["/", "/shop", "/shop?cat=ai", "/contact"]) {
  const { status, buf, text } = await get(p);
  const gz = zlib.gzipSync(buf);
  const br = zlib.brotliCompressSync(buf);
  // flight payload = the inline self.__next_f.push(...) chunks (JSON-escaped inside the script literal)
  const pushChunks = [...text.matchAll(/self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g)];
  const rawFlightBytes = pushChunks.reduce((a, m) => a + m[1].length, 0);
  const flight = pushChunks
    .map((m) => {
      try { return JSON.parse(`"${m[1]}"`); } catch { return ""; }
    })
    .join("");
  const fieldBytes = (name) => {
    const re = new RegExp(`"${name}":`, "g");
    let total = 0, n = 0;
    for (const m of flight.matchAll(re)) {
      n++;
      // crude but consistent: measure the JSON value that follows
      let i = m.index + m[0].length, depth = 0, inStr = false, esc = false;
      const start = i;
      for (; i < flight.length; i++) {
        const ch = flight[i];
        if (esc) { esc = false; continue; }
        if (ch === "\\") { esc = true; continue; }
        if (ch === '"') { inStr = !inStr; continue; }
        if (inStr) continue;
        if (ch === "{" || ch === "[") depth++;
        else if (ch === "}" || ch === "]") { if (depth === 0) break; depth--; }
        else if ((ch === "," ) && depth === 0) break;
      }
      total += i - start;
    }
    return { occurrences: n, bytes: total };
  };
  payload[p] = {
    status,
    htmlBytes: buf.length,
    gzipBytes: gz.length,
    brotliBytes: br.length,
    flightBytes: Buffer.byteLength(flight),
    flightRawInHtmlBytes: rawFlightBytes,
    description: fieldBytes("description"),
    features: fieldBytes("features"),
    specifications: fieldBytes("specifications"),
    shortDesc: fieldBytes("shortDesc"),
    title_field: fieldBytes("title"),
    lucideClassNames: [...new Set([...text.matchAll(/lucide-([a-z0-9-]+)/g)].map((m) => m[1]))].sort(),
    iconClassesTotal: [...text.matchAll(/lucide-[a-z0-9-]+/g)].length,
  };
}
out.payload = payload;

// ---------- C. JS chunks actually referenced by each route's HTML ----------
function chunkSizes(files) {
  const rows = files.map((f) => {
    const abs = path.join(REPO, ".next", f.replace(/^\/_next\//, ""));
    let raw = 0, gz = 0;
    try {
      const b = fs.readFileSync(abs);
      raw = b.length;
      gz = zlib.gzipSync(b, { level: 9 }).length;
    } catch { /* missing */ }
    return { file: f, raw, gz };
  });
  const sum = (k) => rows.reduce((a, b) => a + b[k], 0);
  return { count: rows.length, rawTotal: sum("raw"), gzTotal: sum("gz"), rows: rows.sort((a, b) => b.raw - a.raw) };
}
const routes = {};
for (const p of ["/", "/shop", "/shop?cat=ai", "/contact"]) {
  const { text } = await get(p);
  const files = [...new Set([...text.matchAll(/<script src="(\/_next\/[^"]+\.js)"/g)].map((m) => m[1]))];
  routes[p] = chunkSizes(files);
}
out.chunks = routes;

// biggest chunk on /shop: what is it?
const biggest = routes["/shop"].rows[0];
if (biggest && biggest.raw > 0) {
  const b = fs.readFileSync(path.join(REPO, ".next", biggest.file.replace(/^\/_next\//, "")));
  const s = b.toString("utf8");
  const names = [...new Set([...s.matchAll(/lucide-([a-z0-9-]+)/g)].map((m) => m[1]))];
  out.biggestChunkProbe = {
    file: biggest.file,
    raw: biggest.raw,
    gz: biggest.gz,
    hasCreateLucideIcon: s.includes("createLucideIcon"),
    uniqueLucideIconNames: names.length,
    sampleIcons: names.slice(0, 15),
  };
}

const OUT = process.env.OUT || path.join(REPO, `.loop3-measure-${TAG}.json`);
fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(`wrote ${OUT}`);
console.log(JSON.stringify({ categoriesSummary: out.categoriesSummary, payload: out.payload, chunks: Object.fromEntries(Object.entries(out.chunks).map(([k, v]) => [k, { count: v.count, rawTotal: v.rawTotal, gzTotal: v.gzTotal, top: v.rows.slice(0, 3).map(r => `${r.file} ${r.raw}/${r.gz}`) }])), biggestChunkProbe: out.biggestChunkProbe }, null, 2));
