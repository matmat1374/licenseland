import './deploy-env.cjs';
import { createRequire } from "module";
import path from "path";
import fs from "fs";

const require = createRequire(import.meta.url);
const { Client } = require("ssh2");

const SERVER = {
  host: "109.122.254.151",
  port: 22,
  username: "root",
  password: process.env.DEPLOY_PASS,
};

const FILES_TO_UPLOAD = [
  { local: "src/components/admin/admin-shell.tsx", remote: "/var/www/licenseland/src/components/admin/admin-shell.tsx" },
  { local: "src/app/admin/instagram/page.tsx", remote: "/var/www/licenseland/src/app/admin/instagram/page.tsx" },
  { local: "src/app/api/admin/instagram/route.ts", remote: "/var/www/licenseland/src/app/api/admin/instagram/route.ts" },
  { local: "src/app/api/instagram/webhook/route.ts", remote: "/var/www/licenseland/src/app/api/instagram/webhook/route.ts" },
  { local: "mini-services/instagram-bot/main.py", remote: "/var/www/licenseland/mini-services/instagram-bot/main.py" },
  { local: "mini-services/instagram-bot/content.py", remote: "/var/www/licenseland/mini-services/instagram-bot/content.py" },
  { local: "mini-services/instagram-bot/dm_bot.py", remote: "/var/www/licenseland/mini-services/instagram-bot/dm_bot.py" },
  { local: "mini-services/instagram-bot/engagement.py", remote: "/var/www/licenseland/mini-services/instagram-bot/engagement.py" },
  { local: "mini-services/instagram-bot/scheduler.py", remote: "/var/www/licenseland/mini-services/instagram-bot/scheduler.py" },
  { local: "mini-services/instagram-bot/requirements.txt", remote: "/var/www/licenseland/mini-services/instagram-bot/requirements.txt" },
  { local: "mini-services/instagram-bot/Dockerfile", remote: "/var/www/licenseland/mini-services/instagram-bot/Dockerfile" },
  { local: "src/components/admin/instagram/instagram-banner-canvas.tsx", remote: "/var/www/licenseland/src/components/admin/instagram/instagram-banner-canvas.tsx" }
];

const conn = new Client();

function executeCommand(conn, cmd) {
  return new Promise((resolve, reject) => {
    console.log(`\n>>> Executing on server: ${cmd}`);
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let stdout = "";
      let stderr = "";
      stream.on("close", (code, signal) => {
        console.log(`\n>>> Finished with code: ${code}`);
        resolve({ code, stdout, stderr });
      });
      stream.on("data", (data) => {
        const text = data.toString();
        stdout += text;
        process.stdout.write(text);
      });
      stream.stderr.on("data", (data) => {
        const text = data.toString();
        stderr += text;
        process.stderr.write(text);
      });
    });
  });
}

function uploadFile(sftp, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    console.log(`Uploading ${localPath} to ${remotePath}...`);
    sftp.fastPut(path.resolve(localPath), remotePath, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

conn.on("ready", async () => {
  console.log("✓ SSH Connection Established.");
  
  try {
    const mkdirCmd = `mkdir -p /var/www/licenseland/src/app/admin/instagram /var/www/licenseland/src/app/api/admin/instagram /var/www/licenseland/src/app/api/instagram/webhook /var/www/licenseland/mini-services/instagram-bot /var/www/licenseland/src/components/admin/instagram`;
    await executeCommand(conn, mkdirCmd);
    
    conn.sftp(async (err, sftp) => {
      if (err) { console.error("SFTP error:", err); conn.end(); return; }
      
      try {
        for (const file of FILES_TO_UPLOAD) {
          await uploadFile(sftp, file.local, file.remote);
        }
        
        console.log("\n--- Build ---");
        await executeCommand(conn, `cd /var/www/licenseland && NODE_OPTIONS="--max-old-space-size=1536" npm run build`);
        
        console.log("\n--- PM2 Reload ---");
        await executeCommand(conn, `pm2 reload licenseland || pm2 restart all`);
        
        console.log("\n--- Validation ---");
        await executeCommand(conn, `curl -s -o /dev/null -w "%{http_code}" localhost:3000/admin/instagram`);
        
      } catch (e) {
        console.error(e);
      } finally {
        conn.end();
      }
    });
  } catch (e) {
    console.error(e);
    conn.end();
  }
});

conn.on("error", (err) => console.error("SSH Error:", err));
conn.connect(SERVER);
