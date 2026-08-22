// Ensures .env has ALL required variables including a stable NEXTAUTH_SECRET.
// This script runs before both `next dev` and `next build` to prevent crashes.
import { writeFileSync, readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { randomBytes as cryptoRandomBytes } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const envPath = resolve(projectRoot, ".env");

// Generate a random secret (only if missing — never overwrites existing)
function generateSecret() {
  return cryptoRandomBytes(32).toString("base64");
}

const REQUIRED = {
  NEXTAUTH_SECRET: generateSecret(), // generated fresh only if missing
  ZARINPAL_SANDBOX: "true",
  SUPPLIER_MARKUP_PERCENT: "200",
};

// Read existing
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
