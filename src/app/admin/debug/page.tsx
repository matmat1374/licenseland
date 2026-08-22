import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { readFileSync, existsSync, statSync } from "fs";
import { resolve } from "path";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "دیباگ سیستم" };

export default async function DebugPage() {
  // dev-only page (M2 fix): it dumps .env contents and must not exist in production
  if (process.env.NODE_ENV === "production") {
    return (
      <Card className="p-6">
        <h1 className="text-xl font-black">صفحه دیباگ فقط در محیط توسعه در دسترس است</h1>
      </Card>
    );
  }
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/admin/debug");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  // gather diagnostics
  const cwd = process.cwd();
  const envPath = resolve(cwd, ".env");
  const dbPath = resolve(cwd, "db/custom.db");
  const logPath = resolve(cwd, "logs/app.log");
  const devLogPath = resolve(cwd, "dev.log");

  const envExists = existsSync(envPath);
  const dbExists = existsSync(dbPath);
  const logExists = existsSync(logPath);
  const devLogExists = existsSync(devLogPath);

  let envContent = "";
  if (envExists) {
    envContent = readFileSync(envPath, "utf-8")
      .split("\n")
      .filter((l) => !l.startsWith("#") && l.trim())
      .map((l) => (l.includes("SECRET") || l.includes("KEY") || l.includes("TOKEN") ? l.split("=")[0] + "=***" : l))
      .join("\n");
  }

  let appLog = "";
  if (logExists) {
    appLog = readFileSync(logPath, "utf-8").split("\n").filter(Boolean).slice(-100).join("\n");
  }

  let devLog = "";
  if (devLogExists) {
    devLog = readFileSync(devLogPath, "utf-8").split("\n").filter((l) => !l.includes("prisma:query")).slice(-80).join("\n");
  }

  const dbSize = dbExists ? statSync(dbPath).size : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">دیباگ سیستم</h1>
        <p className="text-sm text-muted-foreground">بررسی وضعیت سرور، دیتابیس و لاگ‌ها</p>
      </div>

      {/* system status */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Node ENV</div>
          <div className="mt-1 font-bold">{process.env.NODE_ENV || "undefined"}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">دیتابیس</div>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={dbExists ? "default" : "destructive"}>{dbExists ? "موجود" : "ناموجود"}</Badge>
            {dbExists && <span className="text-xs text-muted-foreground">{(dbSize / 1024).toFixed(0)} KB</span>}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">.env</div>
          <div className="mt-1">
            <Badge variant={envExists ? "default" : "destructive"}>{envExists ? "موجود" : "ناموجود"}</Badge>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">مسیر کاری</div>
          <div className="mt-1 truncate font-mono text-xs" dir="ltr">{cwd}</div>
        </Card>
      </div>

      {/* env content */}
      <Card className="p-4">
        <h2 className="mb-3 font-bold">متغیرهای محیطی</h2>
        <pre className="overflow-x-auto rounded bg-muted p-3 text-xs" dir="ltr">{envContent || "(.env یافت نشد)"}</pre>
      </Card>

      {/* app log */}
      <Card className="p-4">
        <h2 className="mb-3 font-bold">لاگ برنامه (آخرین ۱۰۰ خط)</h2>
        <pre className="max-h-96 overflow-auto rounded bg-muted p-3 text-xs leading-5" dir="ltr">{appLog || "(خالی)"}</pre>
      </Card>

      {/* dev log */}
      <Card className="p-4">
        <h2 className="mb-3 font-bold">لاگ سرور (آخرین ۸۰ خط بدون prisma)</h2>
        <pre className="max-h-96 overflow-auto rounded bg-muted p-3 text-xs leading-5" dir="ltr">{devLog || "(خالی)"}</pre>
      </Card>
    </div>
  );
}
