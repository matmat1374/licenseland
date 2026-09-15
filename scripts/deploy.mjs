/**
 * Unified production deploy for Liceno (liceno.ir)
 * Usage:
 *   node scripts/deploy.mjs                     # full source bundle from git-tracked files
 *   node scripts/deploy.mjs --files src/a.tsx   # deploy specific files
 *   node scripts/deploy.mjs --list deploy_files.txt
 *   node scripts/deploy.mjs --dry              # show bundle contents, no upload
 * Credentials come from .env: DEPLOY_HOST, DEPLOY_USER, DEPLOY_PASS (never hardcoded).
 */
import { createRequire } from "module";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const { Client } = require("ssh2");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REMOTE_APP_DIR = "/var/www/licenseland";
const LOCAL_BUNDLE = path.join(ROOT, "deploy_bundle.tar.gz");

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const FORCE = args.includes("--force");
const SKIP_DB = args.includes("--skip-db");
const filesFlagIdx = args.indexOf("--files");
const listFlagIdx = args.indexOf("--list");

let explicitFiles = [];
if (filesFlagIdx !== -1) explicitFiles = args.slice(filesFlagIdx + 1).filter(a => !a.startsWith("--"));
let listFile = null;
if (listFlagIdx !== -1) listFile = args[listFlagIdx + 1];

function loadEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) { console.error("ERROR: .env not found"); process.exit(1); }
  const env = {};
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = loadEnv();
const SERVER = {
  host: env.DEPLOY_HOST || "109.122.254.151",
  port: 22,
  username: env.DEPLOY_USER || "root",
  password: env.DEPLOY_PASS,
};
if (!SERVER.password) { console.error("ERROR: DEPLOY_PASS missing in .env"); process.exit(1); }

let files = [];
if (explicitFiles.length) {
  files = explicitFiles.map(f => f.replace(/\\/g, "/"));
  for (const f of files) if (!fs.existsSync(path.join(ROOT, f))) { console.error("ERROR: file not found: " + f); process.exit(1); }
} else if (listFile) {
  files = fs.readFileSync(path.join(ROOT, listFile), "utf8").split(/\r?\n/).map(s => s.trim()).filter(Boolean);
} else {
  const all = execSync("git ls-files", { cwd: ROOT, encoding: "utf8" }).split(/\r?\n/).filter(Boolean);
  files = all.filter(f => /^src\/|^prisma\/schema\.prisma$|^scripts\/|^public\/|^package\.json$|^next\.config\.ts$|^tsconfig\.json$|^tailwind\.config\.ts$|^postcss\.config\.mjs$|^components\.json$|^eslint\.config\.mjs$/.test(f) && !/\.md$/.test(f));
}
if (!files.length) { console.error("ERROR: no files to deploy"); process.exit(1); }

if (!FORCE && !DRY) {
  let dirty = false;
  try { execSync("git diff --quiet", { cwd: ROOT }); execSync("git diff --cached --quiet", { cwd: ROOT }); }
  catch { dirty = true; }
  if (dirty) { console.error("ERROR: uncommitted changes - commit first or use --force"); process.exit(1); }
}

console.log("==================================================");
console.log("  Liceno deploy - bundle from git-tracked source");
console.log("==================================================");
console.log("Files in bundle: " + files.length);

const fileList = path.join(ROOT, ".openclaw-deploy-files.txt");
fs.writeFileSync(fileList, files.join("\n") + "\n");
execSync('tar -czf "' + LOCAL_BUNDLE + '" -T "' + fileList + '"', { cwd: ROOT, stdio: "pipe" });
const bundleKB = (fs.statSync(LOCAL_BUNDLE).size / 1024).toFixed(1);
console.log("OK bundle built: deploy_bundle.tar.gz (" + bundleKB + " KB)");

if (DRY) { console.log("\n--- DRY RUN - bundle contents ---"); console.log(files.join("\n")); process.exit(0); }

const conn = new Client();
function executeCommand(conn, cmd, opts = {}) {
  return new Promise((resolve, reject) => {
    console.log("\n>>> " + cmd);
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      stream.on("close", code => {
        if (code !== 0 && !opts.allowFail) return reject(new Error("command failed (code " + code + "): " + cmd));
        resolve({ code });
      });
      stream.on("data", d => process.stdout.write(d));
      stream.stderr.on("data", d => process.stderr.write(d));
    });
  });
}

conn.on("ready", async () => {
  console.log("OK SSH connected.");
  try {
    await new Promise((res, rej) => {
      conn.sftp((err, sftp) => {
        if (err) return rej(err);
        console.log("Uploading bundle (" + bundleKB + " KB)...");
        sftp.fastPut(LOCAL_BUNDLE, "/tmp/deploy_bundle.tar.gz", err2 => {
          if (err2) return rej(err2);
          console.log("OK uploaded.");
          res();
        });
      });
    });
    await executeCommand(conn, "tar -xzf /tmp/deploy_bundle.tar.gz -C " + REMOTE_APP_DIR);
    const schemaChanged = files.includes("prisma/schema.prisma");
    if (!SKIP_DB && schemaChanged) {
      await executeCommand(conn, "cd " + REMOTE_APP_DIR + " && npx prisma db push");
    } else { console.log("\n(schema unchanged - skipping prisma db push)"); }
    await executeCommand(conn, 'cd ' + REMOTE_APP_DIR + ' && NODE_OPTIONS="--max-old-space-size=1536" npm run build');
    const workerFiles = files.some(f => f.includes("supplier-sync-worker") || f.includes("cron/sync"));
    await executeCommand(conn, "pm2 reload licenseland");
    if (workerFiles) await executeCommand(conn, "pm2 restart licenseland-sync");
    console.log("\n--- Health checks ---");
    await executeCommand(conn, 'sleep 3 && curl -s -o /dev/null -w "home: %{http_code}\\n" http://127.0.0.1:3000/', { allowFail: true });
    await executeCommand(conn, "curl -s http://127.0.0.1:3000/api/health", { allowFail: true });
    await executeCommand(conn, 'curl -s -o /dev/null -w "liceno.ir: %{http_code}\\n" https://liceno.ir/', { allowFail: true });
    console.log("\n==================================================");
    console.log("  Deploy complete.");
    console.log("==================================================");
  } catch (e) {
    console.error("\nFAIL deploy failed:", e.message);
    process.exitCode = 1;
  } finally {
    conn.end();
  }
});
conn.on("error", err => { console.error("SSH error:", err.message); process.exitCode = 1; });
conn.connect(SERVER);
