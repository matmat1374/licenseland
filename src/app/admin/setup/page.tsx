import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SetupWizardForm, SETUP_FIELDS } from "@/components/admin/setup-wizard-form";
import { Rocket, CheckCircle2, AlertCircle } from "lucide-react";

export const metadata = { title: "راه‌اندازی اولیه" };

function toFa(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}

export default async function AdminSetupPage() {
  const rows = await db.setting.findMany();
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;

  const settings: Record<string, string> = {};
  for (const f of SETUP_FIELDS) settings[f.key] = map[f.key] || "";

  // Progress: how many required fields are filled
  const requiredKeys = SETUP_FIELDS.filter((f) => !f.optional).map((f) => f.key);
  const filledRequired = requiredKeys.filter((k) => settings[k]?.trim()).length;
  const totalRequired = requiredKeys.length;
  const isComplete = filledRequired === totalRequired;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
            <Rocket className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black">راه‌اندازی اولیه</h1>
            <p className="text-sm text-muted-foreground">
              این ویزارد را یک‌بار برای پیکربندی سایت تکمیل کنید
            </p>
          </div>
        </div>
      </div>

      {/* Progress banner */}
      <Card className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {isComplete ? (
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            ) : (
              <AlertCircle className="h-8 w-8 text-amber-500" />
            )}
            <div>
              <div className="font-bold">
                {isComplete
                  ? "راه‌اندازی کامل شد ✓"
                  : `پیشرفت: ${toFa(filledRequired)} از ${toFa(totalRequired)} فیلد ضروری`}
              </div>
              <p className="text-xs text-muted-foreground">
                {isComplete
                  ? "تمام فیلدهای ضروری پر شده‌اند. می‌توانید مقادیر را در صورت نیاز ویرایش کنید."
                  : "فیلدهای ضروری را تکمیل کنید تا سایت آماده به‌کار شود."}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={
              isComplete
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
            }
          >
            {isComplete ? "تکمیل شده" : "در حال تکمیل"}
          </Badge>
        </div>
        {/* Progress bar */}
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
            style={{ width: `${(filledRequired / totalRequired) * 100}%` }}
          />
        </div>
      </Card>

      <Card className="p-6">
        <SetupWizardForm settings={settings} />
      </Card>
    </div>
  );
}
