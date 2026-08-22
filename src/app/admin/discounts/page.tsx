import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { toFa, formatJalaliDate } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { DiscountsClient } from "@/components/admin/discounts-client";

export const metadata = { title: "کدهای تخفیف" };

export default async function AdminDiscountsPage() {
  const codes = await db.discountCode.findMany({
    orderBy: { createdAt: "desc" },
  });

  const serializable = codes.map((c) => ({
    id: c.id,
    code: c.code,
    type: c.type,
    value: c.value,
    maxUses: c.maxUses,
    usedCount: c.usedCount,
    expiresAt: c.expiresAt?.toISOString() || null,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black">کدهای تخفیف</h1>
          <p className="text-sm text-muted-foreground">مجموع {toFa(codes.length)} کد</p>
        </div>
        <DiscountsClient codes={serializable} />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-right text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">کد</th>
                <th className="px-4 py-3 font-medium">نوع</th>
                <th className="px-4 py-3 font-medium">مقدار</th>
                <th className="px-4 py-3 font-medium">استفاده</th>
                <th className="px-4 py-3 font-medium">حداکثر استفاده</th>
                <th className="px-4 py-3 font-medium">انقضا</th>
                <th className="px-4 py-3 font-medium">وضعیت</th>
                <th className="px-4 py-3 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {serializable.map((c) => (
                <tr key={c.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono font-bold" dir="ltr">{c.code}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">
                      {c.type === "PERCENT" ? "درصدی" : "مبلغی"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-bold">
                    {c.type === "PERCENT" ? `${toFa(c.value)}٪` : `${toFa(c.value.toLocaleString("en-US"))} ت`}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={c.usedCount > 0 ? "default" : "secondary"}>
                      {toFa(c.usedCount)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.maxUses === 0 ? "نامحدود" : toFa(c.maxUses)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {c.expiresAt ? formatJalaliDate(c.expiresAt) : "بدون انقضا"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={c.isActive ? "default" : "secondary"}>
                      {c.isActive ? "فعال" : "غیرفعال"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <DiscountsClient mode="row" code={c} />
                  </td>
                </tr>
              ))}
              {serializable.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    هنوز کد تخفیفی ثبت نشده است
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
