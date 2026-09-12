import { createRequire } from "module";
import path from "path";
import fs from "fs";

const require = createRequire(import.meta.url);
const { Client } = require("C:/Users/matin/.gemini/antigravity/brain/38ee4971-2ffe-435c-bfc1-7bad148df9e3/scratch/node_modules/ssh2");

const SERVER = {
  host: "109.122.254.151",
  port: 22,
  username: "root",
  password: "Licenseland@2026!",
};

const localArchive = path.resolve("deploy_bundle.tar.gz");
const remoteArchive = "/tmp/deploy_bundle.tar.gz";

console.log("==================================================");
console.log("  فاز ۵: استقرار پروژه و همگام‌سازی روی سرور لایو");
console.log("==================================================");
console.log(`Local archive: ${localArchive} (${(fs.statSync(localArchive).size / 1024).toFixed(1)} KB)`);

const conn = new Client();

function executeCommand(conn, cmd) {
  return new Promise((resolve, reject) => {
    console.log(`\n>>> Executing on server: ${cmd}`);
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let stdout = "";
      let stderr = "";
      stream.on("close", (code, signal) => {
        console.log(`>>> Finished with code: ${code}`);
        if (code !== 0) {
          console.warn(`Warning: Command exited with code ${code}`);
        }
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

conn.on("ready", async () => {
  console.log("✓ SSH Connection Established.");

  conn.sftp(async (err, sftp) => {
    if (err) {
      console.error("SFTP error:", err);
      conn.end();
      return;
    }

    console.log(`Uploading ${localArchive} to ${remoteArchive}...`);
    sftp.fastPut(localArchive, remoteArchive, async (err) => {
      if (err) {
        console.error("Failed to upload archive:", err);
        conn.end();
        return;
      }
      console.log("✓ File uploaded successfully via SFTP.");

      try {
        // Step 1: Extract bundle
        console.log("\n--- ۱. اکسترکت فایل‌های بروزرسانی شده ---");
        await executeCommand(conn, `tar -xzf ${remoteArchive} -C /var/www/licenseland && ls -l /var/www/licenseland/scripts/rebuild-catalog.mjs`);

        // Step 2: Prisma db push
        console.log("\n--- ۲. اجرای Prisma db push ---");
        await executeCommand(conn, `cd /var/www/licenseland && npx prisma db push`);

        // Step 3: Next.js Build
        console.log("\n--- ۳. بیلد پروداکشن Next.js ---");
        await executeCommand(conn, `cd /var/www/licenseland && NODE_OPTIONS="--max-old-space-size=1536" npm run build`);

        // Step 4: PM2 Reload
        console.log("\n--- ۴. بارگذاری مجدد سرویس در PM2 ---");
        await executeCommand(conn, `pm2 reload licenseland && sleep 3 && pm2 status licenseland`);

        // Step 5: Clean Catalog Rebuild
        console.log("\n--- ۵. اجرای بازسازی تمیز کاتالوگ در دیتابیس لایو ---");
        await executeCommand(conn, `cd /var/www/licenseland && node scripts/rebuild-catalog.mjs`);

        // Step 6: Verification
        console.log("\n--- ۶. اعتبارسنجی سلامت صفحات وب‌سایت ---");
        await executeCommand(conn, `curl -s -I http://127.0.0.1:3000/`);
        await executeCommand(conn, `curl -s -I https://liceno.ir/ && curl -s -I https://liceno.ir/shop`);

        console.log("\n==================================================");
        console.log("  ✓ تمام مراحل با موفقیت به پایان رسید!");
        console.log("==================================================");
      } catch (execErr) {
        console.error("Execution error:", execErr);
      } finally {
        conn.end();
      }
    });
  });
});

conn.on("error", (err) => {
  console.error("SSH Connection Error:", err);
});

conn.connect(SERVER);
