"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Plus, Trash2, Loader2, KeyRound, Package } from "lucide-react";
import { toast } from "sonner";
import { toFa, formatJalaliDate } from "@/lib/date";

interface ProductItem {
  id: string;
  title: string;
  slug: string;
  stock: number;
  counts: { available: number; sold: number; reserved: number; total: number };
}

interface LicenseItem {
  id: string;
  key: string;
  note: string | null;
  status: string;
  source: string | null;
  createdAt: string;
  soldAt: string | null;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  AVAILABLE: {
    label: "موجود",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  SOLD: {
    label: "فروخته شده",
    className: "bg-muted text-muted-foreground border-border",
  },
  RESERVED: {
    label: "رزرو شده",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
};

export function LicenseManager({
  products,
  initialProductId,
  licenses,
}: {
  products: ProductItem[];
  initialProductId: string;
  licenses: LicenseItem[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [productId, setProductId] = useState(initialProductId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [list, setList] = useState<LicenseItem[]>(licenses);

  useEffect(() => {
    setList(licenses);
  }, [licenses]);

  useEffect(() => {
    setProductId(initialProductId);
  }, [initialProductId]);

  function selectProduct(id: string) {
    setProductId(id);
    const next = new URLSearchParams(params.toString());
    next.set("productId", id);
    router.push(`/admin/licenses?${next.toString()}`, { scroll: false });
  }

  const selected = products.find((p) => p.id === productId);

  async function handleBulkAdd() {
    if (!productId || !bulkText.trim()) {
      toast.error("محصول را انتخاب و کلیدها را وارد کنید");
      return;
    }
    const keys = bulkText
      .split("\n")
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return null;
        const [key, ...noteParts] = trimmed.split("|");
        return { key: key.trim(), note: noteParts.join("|").trim() || null };
      })
      .filter(Boolean) as { key: string; note: string | null }[];

    if (keys.length === 0) {
      toast.error("هیچ کلید معتبری یافت نشد");
      return;
    }

    setAdding(true);
    try {
      const res = await fetch("/api/admin/licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, keys }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "خطا");
      toast.success(`${toFa(keys.length)} کلید اضافه شد (موجودی: ${toFa(json.stock)})`);
      setBulkText("");
      setDialogOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "خطای ناشناخته");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/licenses/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "خطا");
      toast.success("کلید حذف شد");
      setList((l) => l.filter((x) => x.id !== id));
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "خطای ناشناخته");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Product selector + counts */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex-1 space-y-2">
            <Label>انتخاب محصول</Label>
            <Select value={productId} onValueChange={selectProduct}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="یک محصول انتخاب کنید" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title} — موجودی: {toFa(p.counts.available)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selected && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <KeyRound className="h-3 w-3" /> موجود: {toFa(selected.counts.available)}
              </Badge>
              <Badge variant="outline" className="gap-1 bg-muted text-muted-foreground">
                فروخته: {toFa(selected.counts.sold)}
              </Badge>
              <Badge variant="outline" className="gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                رزرو: {toFa(selected.counts.reserved)}
              </Badge>
              <Badge variant="outline" className="gap-1">
                کل: {toFa(selected.counts.total)}
              </Badge>
            </div>
          )}
        </div>
      </Card>

      {/* License list */}
      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="font-bold">
            کلیدهای {selected?.title || ""}
          </h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" disabled={!productId}>
                <Plus className="h-4 w-4" />
                افزودن کلیدها
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>افزودن کلیدهای لایسنس</DialogTitle>
                <DialogDescription>
                  هر خط یک کلید. برای افزودن یادداشت از فرمت <code dir="ltr">key|note</code> استفاده کنید.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label>محصول: {selected?.title}</Label>
                <Textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  rows={8}
                  dir="ltr"
                  placeholder={"XXXX-XXXX-XXXX-XXXX|email@example.com\nYYYY-YYYY-YYYY-YYYY"}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  تعداد کلیدهای وارد شده: {toFa(bulkText.split("\n").filter((l) => l.trim()).length)}
                </p>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={adding}>
                  انصراف
                </Button>
                <Button onClick={handleBulkAdd} disabled={adding} className="gap-2">
                  {adding && <Loader2 className="h-4 w-4 animate-spin" />}
                  افزودن
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {list.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
            <Package className="h-10 w-10" />
            <p>هیچ کلیدی برای این محصول ثبت نشده است</p>
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/40 backdrop-blur">
                <tr className="text-right text-xs text-muted-foreground">
                  <th className="px-4 py-2 font-medium">کلید</th>
                  <th className="px-4 py-2 font-medium">یادداشت</th>
                  <th className="px-4 py-2 font-medium">وضعیت</th>
                  <th className="px-4 py-2 font-medium">منبع</th>
                  <th className="px-4 py-2 font-medium">تاریخ</th>
                  <th className="px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {list.map((l) => {
                  const st = STATUS_MAP[l.status] || STATUS_MAP.AVAILABLE;
                  return (
                    <tr key={l.id} className="border-t hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <code className="font-mono text-xs" dir="ltr">{l.key}</code>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{l.note || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={st.className}>
                          {st.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {l.source === "telegram" ? "تلگرام" : l.source === "manual" ? "دستی" : l.source || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatJalaliDate(l.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {l.status !== "SOLD" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-rose-500 hover:text-rose-600"
                                disabled={deletingId === l.id}
                                aria-label="حذف"
                              >
                                {deletingId === l.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>حذف کلید؟</AlertDialogTitle>
                                <AlertDialogDescription>
                                  این کلید لایسنس حذف خواهد شد. عمل قابل بازگشت نیست.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>انصراف</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(l.id)}
                                  className="gap-2 bg-rose-500 text-white hover:bg-rose-600"
                                >
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
