// Loads DEPLOY_* (and the rest of the repo .env) into process.env.
// Keeps deploy credentials out of source control: scripts read process.env.DEPLOY_PASS.
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '..', '.env');
try {
  const txt = fs.readFileSync(envPath, 'utf8');
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const i = line.indexOf('=');
    const key = line.slice(0, i).trim();
    const value = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  // No .env (CI, fresh clone). Callers fall back to their existing process.env.
}
module.exports = {
  host: process.env.DEPLOY_HOST,
  user: process.env.DEPLOY_USER,
  pass: process.env.DEPLOY_PASS,
};
