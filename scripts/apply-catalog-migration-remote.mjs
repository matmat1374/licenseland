/**
 * Apply the catalog migration on the PRODUCTION server.
 * ----------------------------------------------------
 * 1. upload the migration assets (script + registry CSV + precomputed key map)
 * 2. back up the live SQLite database
 * 3. run the dedup/rename migration   (catalog-dedup-apply.mjs --apply)
 * 4. backfill the identity keys       (backfill-dedup-keys.mjs --apply)
 * 5. reload pm2 so the new slug-redirects.json is picked up
 * 6. report before/after counts
 *
 * Credentials come from the local .env (DEPLOY_HOST / DEPLOY_USER / DEPLOY_PASS).
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

const FILES = [
  "scripts/catalog-dedup-apply.mjs",
  "scripts/backfill-dedup-keys.mjs",
  "docs/catalog-audit/product-registry.csv",
  "docs/catalog-audit/dedup-keys.json",
];

const conn = new Client();
const run = (cmd) => new Promise((res, rej) => {
  conn.exec(cmd, (e, st) => {
    if (e) return rej(e);
    let out = "";
    st.on("data", (d) => { out += d; });
    st.stderr.on("data", (d) => { out += d; });
    st.on("close", (code) => res({ code, out: out.trim() }));
  });
});

conn.on("ready", async () => {
  try {
    console.log("✓ SSH connected");
    // 1) upload assets
    await new Promise((res, rej) => {
      conn.sftp(async (err, sftp) => {
        if (err) return rej(err);
        for (const f of FILES) {
          const remote = `${REMOTE}/${f}`;
          await new Promise((r2, j2) => { sftp.mkdir(path.posix.dirname(remote), { recursive: true }, () => r2()); });
          await new Promise((r2, j2) => sftp.fastPut(path.join(ROOT, f), remote, (e2) => (e2 ? j2(e2) : r2())));
          console.log("  ↑", f);
        }
        res();
      });
    });

    // 2) backup + before counts
    const before = await run(`cd ${REMOTE} && cp prisma/db/custom.db /root/backups/custom.db.pre-publish-$(date +%F-%H%M%S) && ls -la /root/backups/ | tail -2`);
    console.log("\n--- backup ---\n" + before.out);

    const snapshot = async (label) => {
      const r = await run(`cd ${REMOTE} && DATABASE_URL="${DB_URL}" node -e "
const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();
(async()=>{
 const total=await p.product.count();
 const active=await p.product.count({where:{isActive:true}});
 const dup=await p.product.count({where:{title:{contains:'Claude Pro ('}}});
 const k=await p.product.findMany({where:{isActive:true,slug:{contains:'claude-pro'}},select:{title:true}});
 const withKey=await p.product.count({where:{specifications:{contains:'dedup_key'}}});
 console.log(JSON.stringify({total,active,legacyClaudeTitles:dup,claudeActive:k.map(x=>x.title),withKey}));
 await p.\\$disconnect();
})();"`);
      console.log(`\n--- ${label} ---\n` + r.out.slice(0, 1400));
    };

    await snapshot("BEFORE");

    // 3) migration
    console.log("\n--- migration (dry run) ---");
    const dry = await run(`cd ${REMOTE} && DATABASE_URL="${DB_URL}" node scripts/catalog-dedup-apply.mjs 2>&1 | tail -6`);
    console.log(dry.out);

    console.log("\n--- migration (apply) ---");
    const applied = await run(`cd ${REMOTE} && DATABASE_URL="${DB_URL}" node scripts/catalog-dedup-apply.mjs --apply 2>&1 | tail -6`);
    console.log(applied.out);

    // 4) backfill identity keys
    console.log("\n--- identity keys backfill ---");
    const bf = await run(`cd ${REMOTE} && DATABASE_URL="${DB_URL}" node scripts/backfill-dedup-keys.mjs --map docs/catalog-audit/dedup-keys.json --apply 2>&1 | tail -8`);
    console.log(bf.out);

    // 5) reload
    console.log("\n--- reload ---");
    const rel = await run(`pm2 reload licenseland 2>&1 | tail -3`);
    console.log(rel.out);

    await snapshot("AFTER");

    // 6) health
    const health = await run(`sleep 3 && curl -s http://127.0.0.1:3000/api/health && echo && curl -s -o /dev/null -w "home:%{http_code}\n" http://127.0.0.1:3000/`);
    console.log("\n--- health ---\n" + health.out);
  } catch (e) {
    console.error("\n✗ FAILED:", e.message);
    process.exitCode = 1;
  } finally {
    conn.end();
  }
});
conn.on("error", (e) => { console.error("SSH error:", e.message); process.exitCode = 1; });
conn.connect(SERVER);
