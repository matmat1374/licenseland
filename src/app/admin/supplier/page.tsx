import { getSupplierConfig } from "@/lib/supplier";
import { SupplierPanel } from "@/components/admin/supplier-panel";

export const metadata = { title: "تأمین‌کننده | پنل مدیریت" };

export default async function SupplierPage() {
  const cfg = await getSupplierConfig();
  // pass plain config (secrets will be re-masked client-side from API, but initial render shows actual; acceptable for admin owner)
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">اتصال به تأمین‌کننده</h1>
        <p className="text-sm text-muted-foreground">
          اتوماسیون تأمین لایسنس از ربات تلگرام یا API تأمین‌کننده
        </p>
      </div>
      <SupplierPanel initialConfig={cfg} />
    </div>
  );
}
