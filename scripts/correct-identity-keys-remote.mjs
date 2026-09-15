/**
 * Correct the identity keys on production and merge same-identity duplicates.
 * -------------------------------------------------------------------------
 * The first key design special-cased virtual numbers as `brand|VNO|country`,
 * which collapsed DIFFERENT services for one country (Google and ChatGPT for
 * Canada). That was caught by a local dry run before it could merge anything.
 * This script:
 *   1. uploads the corrected key map + tools
 *   2. re-runs the backfill with --force (overwrites the bad keys)
 *   3. dry-runs the identity merge, then applies it
 *   4. pulls the resulting slug-redirects.json back so the repo stays in sync
 */
import fs from "fs";
import path from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { Client } = require("ssh2");

const ROOT = process.cwd();
const REMOTE = "/var/www/licenseland";
const DB_URL = `file:${REMOTE}/prisma/db/custom.db`;

const env = {};
for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const SERVER = { host: env.DEPLOY_HOST, port: 22, username: env.DEPLOY_USER || "root", password: env.DEPLOY_PASS };

const UPLOAD = [
  "docs/catalog-audit/dedup-keys.json",
  "scripts/backfill-dedup-keys.mjs",
  "scripts/merge-by-identity-key.mjs",
];

const conn = new Client();
const run = (cmd) => new Promise((res, rej) => {
  conn.exec(cmd, (e, st) => {
    if (e) return rej(e);
    let out = "";
    st.on("data", (d) => { out += d; });
    st.stderr.on("data", (d) => { out += d; });
    st.on("close", () => res(out.trim()));
  });
});

conn.on("ready", async () => {
  try {
    console.log("✓ SSH connected");
    await new Promise((res, rej) => {
      conn.sftp(async (err, sftp) => {
        if (err) return rej(err);
        for (const f of UPLOAD) {
          await new Promise((r2) => { sftp.mkdir(path.posix.dirname(`${REMOTE}/${f}`), { recursive: true }, () => r2()); });
          await new Promise((r2, j2) => sftp.fastPut(path.join(ROOT, f), `${REMOTE}/${f}`, (e2) => (e2 ? j2(e2) : r2())));
          console.log("  ↑", f);
        }
        res();
      });
    });

    console.log("\n--- registry rows currently on the server ---");
    console.log((await run(`cd ${REMOTE} && wc -l docs/catalog-audit/product-registry.csv`)).slice(0, 120));

    console.log("\n--- backfill --force (correct the bad keys) ---");
    console.log(await run(`cd ${REMOTE} && DATABASE_URL="${DB_URL}" node scripts/backfill-dedup-keys.mjs --map docs/catalog-audit/dedup-keys.json --apply --force 2>&1 | tail -8`));

    console.log("\n--- identity merge (dry run) ---");
    console.log(await run(`cd ${REMOTE} && DATABASE_URL="${DB_URL}" node scripts/merge-by-identity-key.mjs 2>&1 | tail -20`));

    console.log("\n--- identity merge (apply) ---");
    console.log(await run(`cd ${REMOTE} && DATABASE_URL="${DB_URL}" node scripts/merge-by-identity-key.mjs --apply 2>&1 | tail -8`));

    console.log("\n--- pull slug-redirects.json back into the repo ---");
    await new Promise((res, rej) => {
      conn.sftp((err, sftp) => {
        if (err) return rej(err);
        sftp.fastGet(`${REMOTE}/src/data/slug-redirects.json`, path.join(ROOT, "src/data/slug-redirects.json"), (e2) => (e2 ? rej(e2) : res()));
      });
    });
    console.log("  ↓ src/data/slug-redirects.json", Object.keys(JSON.parse(fs.readFileSync("src/data/slug-redirects.json", "utf8"))).length, "entries");

    console.log("\n--- reload ---");
    console.log((await run("pm2 reload licenseland 2>&1 | tail -2")).slice(0, 200));
  } catch (e) {
    console.error("\n✗ FAILED:", e.message);
    process.exitCode = 1;
  } finally {
    conn.end();
  }
});
conn.on("error", (e) => { console.error("SSH error:", e.message); process.exitCode = 1; });
conn.connect(SERVER);
