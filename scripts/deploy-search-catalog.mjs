import { Client } from "ssh2";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const SERVER = {
  host: "109.122.254.151",
  port: 22,
  username: "root",
  password: "Licenseland@2026!",
  keepaliveInterval: 15000,
  readyTimeout: 30000,
};

const filesToUpload = [
  "src/lib/queries.ts",
  "src/app/api/products/route.ts",
  "src/components/site/product-filters.tsx",
  "src/components/site/search-dialog.tsx",
  "src/lib/supplier.ts",
  "scripts/rebuild-catalog.mjs",
];

const remoteBase = "/var/www/licenseland";

function executeCommand(conn, cmd) {
  return new Promise((resolve, reject) => {
    console.log(`\n==================================================`);
    console.log(`>>> Executing: ${cmd}`);
    console.log(`==================================================`);
    conn.exec(cmd, { pty: true }, (err, stream) => {
      if (err) return reject(err);
      let stdout = "";
      stream.on("close", (code, signal) => {
        console.log(`\n>>> Command exited with code: ${code}`);
        resolve({ code, stdout });
      });
      stream.on("data", (data) => {
        const text = data.toString();
        stdout += text;
        process.stdout.write(text);
      });
      stream.stderr?.on("data", (data) => {
        const text = data.toString();
        stdout += text;
        process.stderr.write(text);
      });
    });
  });
}

const conn = new Client();

conn.on("ready", () => {
  console.log("✓ SSH Connection Established successfully to " + SERVER.host);

  conn.sftp(async (err, sftp) => {
    if (err) {
      console.error("SFTP error:", err);
      conn.end();
      process.exit(1);
    }

    try {
      console.log("\n--- ۱. انتقال فایل‌های بروزرسانی شده به سرور لایو ---");
      for (let i = 0; i < filesToUpload.length; i++) {
        const relPath = filesToUpload[i];
        const localFile = path.resolve(rootDir, relPath);
        const remoteFile = `${remoteBase}/${relPath.replace(/\\/g, "/")}`;

        if (!fs.existsSync(localFile)) {
          throw new Error(`Local file not found: ${localFile}`);
        }

        const stats = fs.statSync(localFile);
        console.log(`[${i + 1}/${filesToUpload.length}] Uploading ${relPath} (${(stats.size / 1024).toFixed(1)} KB)...`);

        await new Promise((res, rej) => {
          sftp.fastPut(localFile, remoteFile, (err) => {
            if (err) rej(err);
            else {
              console.log(`  ✓ Uploaded to ${remoteFile}`);
              res();
            }
          });
        });
      }

      // Step 2: Server Build
      console.log("\n--- ۲. اجرای بیلد سرور پروداکشن Next.js ---");
      const buildRes = await executeCommand(
        conn,
        `cd /var/www/licenseland && NODE_OPTIONS="--max-old-space-size=1536" npm run build`
      );
      if (buildRes.code !== 0) {
        throw new Error(`Build failed with code ${buildRes.code}`);
      }

      // Step 3: PM2 Reload
      console.log("\n--- ۳. ریلود سرویس در PM2 ---");
      await executeCommand(conn, `pm2 reload licenseland && sleep 3 && pm2 status licenseland`);

      // Step 4: Rebuild Catalog
      console.log("\n--- ۴. اجرای اسکریپت بازسازی کاتالوگ در سرور ---");
      const rebuildRes = await executeCommand(
        conn,
        `cd /var/www/licenseland && node scripts/rebuild-catalog.mjs`
      );
      if (rebuildRes.code !== 0) {
        console.warn(`Rebuild catalog finished with non-zero code: ${rebuildRes.code}`);
      }

      // Step 5: Test endpoints via curl on localhost & liceno.ir
      console.log("\n--- ۵. تست آنلاین لایو اندپوینت‌های سرچ ---");

      console.log("\n>>> تست ۱: سرچ ۳۶۴");
      await executeCommand(
        conn,
        `curl -s "https://liceno.ir/api/products?q=364" | head -c 500 && echo ""`
      );

      console.log("\n>>> تست ۲: سرچ Gemini");
      await executeCommand(
        conn,
        `curl -s "https://liceno.ir/api/products?q=Gemini" | head -c 500 && echo ""`
      );

      console.log("\n>>> تست ۳: سرچ جمینی (Persian)");
      await executeCommand(
        conn,
        `curl -s -G "https://liceno.ir/api/products" --data-urlencode "q=جمینی" | head -c 500 && echo ""`
      );

      console.log("\n==================================================");
      console.log("  ✓ تمام مراحل با موفقیت به پایان رسید!");
      console.log("==================================================");
    } catch (e) {
      console.error("Deployment error:", e);
      process.exitCode = 1;
    } finally {
      conn.end();
    }
  });
});

conn.on("error", (err) => {
  console.error("SSH connection error:", err);
  process.exit(1);
});

conn.connect(SERVER);
