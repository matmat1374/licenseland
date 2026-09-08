"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Clock, History } from "lucide-react";
import { toFa } from "@/lib/date";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { faIR } from "date-fns/locale";

interface SupplierSyncCardProps {
  lastFullSyncAt: string | null;
  initialInterval: string | null;
}

export function SupplierSyncCard({ lastFullSyncAt, initialInterval }: SupplierSyncCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [intervalVal, setIntervalVal] = useState<string>(initialInterval || "disabled");
  const [timeAgo, setTimeAgo] = useState<string>("");

  useEffect(() => {
    if (lastFullSyncAt) {
      const updateAgo = () => {
        const date = new Date(lastFullSyncAt);
        if (isNaN(date.getTime())) return;
        const str = formatDistanceToNow(date, { addSuffix: true, locale: faIR });
        setTimeAgo(toFa(str));
      };
      updateAgo();
      const t = setInterval(updateAgo, 60000);
      return () => clearInterval(t);
    }
  }, [lastFullSyncAt]);

  const saveInterval = async (val: string) => {
    setIntervalVal(val);
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: { supplier_sync_interval: val } }),
      });
      toast.success("تنظیمات بروزرسانی خودکار ذخیره شد");
    } catch (e) {
      toast.error("خطا در ذخیره تنظیمات");
    }
  };

  const forceSync = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products/sync-all", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        toast.success(`بروزرسانی انجام شد. ${toFa(data.updatedCount || 0)} محصول بروز شد.`);
        router.refresh();
      } else {
        toast.error(data.message || "خطا در بروزرسانی");
      }
    } catch (e) {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6 bg-slate-50/50 dark:bg-slate-900/50 border-blue-100 dark:border-blue-900">
      <CardHeader className="pb-3 flex flex-row items-start sm:items-center justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <CardTitle className="flex items-center gap-2 text-lg text-blue-700 dark:text-blue-400">
            <RefreshCw className="h-5 w-5" />
            همگام‌سازی قیمت و موجودی تامین‌کننده
          </CardTitle>
          <CardDescription>
            دریافت آخرین قیمت و موجودی از تامین‌کننده و آپدیت خودکار محصولات سایت و ترب
          </CardDescription>
        </div>
        <Button onClick={forceSync} disabled={loading} size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          بروزرسانی فوری (Force Sync)
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row sm:items-center gap-6 text-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">آخرین بروزرسانی:</span>
          </div>
          <div className="font-medium flex items-center gap-2" dir="ltr">
            {lastFullSyncAt ? (
              <>
                <span>{new Date(lastFullSyncAt).toLocaleString("fa-IR")}</span>
                <span className="text-xs text-muted-foreground bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full" dir="rtl">
                  {timeAgo}
                </span>
              </>
            ) : (
              <span dir="rtl">نامشخص</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 mr-auto">
          <History className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">بازه بروزرسانی خودکار:</span>
          <Select value={intervalVal} onValueChange={saveInterval} disabled={loading}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15m">هر ۱۵ دقیقه</SelectItem>
              <SelectItem value="30m">هر ۳۰ دقیقه</SelectItem>
              <SelectItem value="1h">هر ۱ ساعت</SelectItem>
              <SelectItem value="3h">هر ۳ ساعت</SelectItem>
              <SelectItem value="6h">هر ۶ ساعت</SelectItem>
              <SelectItem value="12h">هر ۱۲ ساعت</SelectItem>
              <SelectItem value="disabled">غیرفعال (فقط دستی)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
