"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Search, ChevronLeft, CheckCircle2, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { toFa, formatJalaliDate } from "@/lib/date";
import { toToman } from "@/lib/format";

interface OrderItem {
  id: string;
  code: string;
  status: string;
  total: number;
  discount: number;
  discountCode: string | null;
  zarinpalRefId: string | null;
  guestEmail: string | null;
  guestName: string | null;
  guestPhone: string | null;
  itemsCount: number;
  createdAt: string;
  paidAt: string | null;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PAID: { label: "پرداخت شده", variant: "default" },
  PENDING: { label: "در انتظار", variant: "secondary" },
  FAILED: { label: "ناموفق", variant: "destructive" },
  CANCELLED: { label: "لغو شده", variant: "outline" },
};

export function OrdersClient({
  orders,
  counts,
  initialStatus,
  initialQuery,
}: {
  orders: OrderItem[];
  counts: { all: number; PAID: number; PENDING: number; FAILED: number; CANCELLED: number };
  initialStatus: string;
  initialQuery: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus || "all");
  const [q, setQ] = useState(initialQuery);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);

  // Debounced URL update
  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams();
      if (status && status !== "all") next.set("status", status);
      if (q.trim()) next.set("q", q.trim());
      const search = next.toString();
      router.push(`/admin/orders${search ? `?${search}` : ""}`, { scroll: false });
    }, 350);
    return () => clearTimeout(t);
  }, [status, q]);

  async function handleMarkPaid(id: string) {
    setMarkingPaid(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "خطا");
      toast.success(json.message || "سفارش پرداخت شد");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "خطای ناشناخته");
    } finally {
      setMarkingPaid(null);
    }
  }

  async function handleCancel(id: string) {
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "خطا");
      toast.success("سفارش لغو شد و کلیدهای رزرو شده آزاد شدند");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "خطای ناشناخته");
    }
  }

  const tabs: { key: string; label: string; count: number }[] = [
    { key: "all", label: "همه", count: counts.all },
    { key: "PAID", label: "پرداخت شده", count: counts.PAID },
    { key: "PENDING", label: "در انتظار", count: counts.PENDING },
    { key: "FAILED", label: "ناموفق", count: counts.FAILED },
    { key: "CANCELLED", label: "لغو شده", count: counts.CANCELLED },
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setStatus(t.key)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  status === t.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {t.label}
                <span className="rounded bg-black/10 px-1.5 py-0.5 text-[10px]">
                  {toFa(t.count)}
                </span>
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="جستجو با کد، ایمیل، نام، تلفن..."
              className="pr-9"
            />
          </div>
        </div>
      </Card>

      {/* Orders table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-right text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">کد سفارش</th>
                <th className="px-4 py-3 font-medium">مشتری</th>
                <th className="px-4 py-3 font-medium">تماس</th>
                <th className="px-4 py-3 font-medium">تعداد اقلام</th>
                <th className="px-4 py-3 font-medium">مبلغ</th>
                <th className="px-4 py-3 font-medium">تخفیف</th>
                <th className="px-4 py-3 font-medium">وضعیت</th>
                <th className="px-4 py-3 font-medium">تاریخ</th>
                <th className="px-4 py-3 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const st = STATUS_MAP[o.status] || STATUS_MAP.PENDING;
                return (
                  <tr key={o.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono font-medium" dir="ltr">{o.code}</td>
                    <td className="px-4 py-3">{o.guestName || "—"}</td>
                    <td className="px-4 py-3 text-xs" dir="ltr">
                      {o.guestEmail || o.guestPhone || "—"}
                    </td>
                    <td className="px-4 py-3">{toFa(o.itemsCount)}</td>
                    <td className="px-4 py-3 font-bold text-primary">{toToman(o.total)} ت</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {o.discount > 0 ? (
                        <span>
                          {toToman(o.discount)} ت
                          {o.discountCode && <div dir="ltr" className="font-mono">{o.discountCode}</div>}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3"><Badge variant={st.variant}>{st.label}</Badge></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatJalaliDate(o.createdAt, true)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button asChild size="icon" variant="ghost" className="h-8 w-8" aria-label="مشاهده">
                          <Link href={`/order/${o.id}`} target="_blank">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>

                        {o.status === "PENDING" && (
                          <>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
                                  disabled={markingPaid === o.id}
                                  aria-label="ثبت پرداخت"
                                >
                                  {markingPaid === o.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>ثبت دستی به‌عنوان پرداخت‌شده؟</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    با تأیید، سفارش <span dir="ltr" className="font-mono">{o.code}</span> پرداخت‌شده ثبت می‌شود، کلیدهای رزرو شده به فروخته‌شده تبدیل شده و موجودی محصول کاهش می‌یابد.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>انصراف</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleMarkPaid(o.id)}
                                    className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                                  >
                                    <CheckCircle2 className="h-4 w-4" /> ثبت پرداخت
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-rose-500 hover:text-rose-600"
                                  aria-label="لغو سفارش"
                                >
                                  <span className="text-xs font-bold">×</span>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>لغو سفارش؟</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    سفارش لغو شده و کلیدهای رزرو شده آزاد می‌شوند.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>انصراف</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleCancel(o.id)}
                                    className="gap-2 bg-rose-500 text-white hover:bg-rose-600"
                                  >
                                    لغو سفارش
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    هیچ سفارشی یافت نشد
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
