// Ensures .env has ALL required variables including stable secrets.
// Runs before dev/build to prevent crashes. Never overwrites existing values.
import { writeFileSync, readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { randomBytes as cryptoRandomBytes } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const envPath = resolve(projectRoot, ".env");

function generateSecret() {
  return cryptoRandomBytes(32).toString("base64");
}

// values generated fresh ONLY if missing
const REQUIRED = {
  NEXTAUTH_SECRET: generateSecret(),
  // 32-byte base64 key for AES-256-GCM license vault (losing it = keys unrecoverable)
  LICENSE_VAULT_KEY: generateSecret(),
  ZARINPAL_SANDBOX: "true",
  SUPPLIER_MARKUP_PERCENT: "200",
};

var existing = {};
if (existsSync(envPath)) {
  var content = readFileSync(envPath, "utf-8");
  var lines = content.split("\n");
  for (var i = 0; i < lines.length; i++) {
    var m = lines[i].match(/^([A-Z_]+)=(.*)$/);
    if (m) existing[m[1]] = m[2];
  }
}

// Only set DATABASE_URL if not present
if (!existing.DATABASE_URL) {
  existing.DATABASE_URL = "file:./db/custom.db";
}

// Dev-only default for NextAuth callback URLs (production sets its real domain)
if (!existing.NEXTAUTH_URL && (process.env.NODE_ENV || "development") !== "production") {
  existing.NEXTAUTH_URL = "http://localhost:3000";
}

// Fill in missing required vars
var changed = false;
for (var k in REQUIRED) {
  if (!existing[k]) {
    existing[k] = REQUIRED[k];
    changed = true;
  }
}

// Write if anything was missing
if (changed || !existsSync(envPath)) {
  var out = "";
  for (var key in existing) {
    out += key + "=" + existing[key] + "\n";
  }
  writeFileSync(envPath, out, "utf-8");
  console.log("[ensure-env] .env updated with missing variables");
} else {
  console.log("[ensure-env] .env already complete");
}
