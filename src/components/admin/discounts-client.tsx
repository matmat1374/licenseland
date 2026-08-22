"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Trash2, Loader2, Power } from "lucide-react";
import { toast } from "sonner";
import { toFa } from "@/lib/date";

interface DiscountCode {
  id: string;
  code: string;
  type: string;
  value: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export function DiscountsClient({
  codes: _codes,
  mode,
  code,
  children,
}: {
  codes?: DiscountCode[];
  mode?: "create" | "row";
  code?: DiscountCode;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  // Create form state
  const [form, setForm] = useState({
    code: "",
    type: "PERCENT",
    value: "",
    maxUses: "",
    expiresAt: "",
    isActive: true,
  });

  async function handleCreate() {
    if (!form.code || !form.value) {
      toast.error("کد و مقدار الزامی است");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code.toUpperCase(),
          type: form.type,
          value: Number(form.value),
          maxUses: Number(form.maxUses) || 0,
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
          isActive: form.isActive,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "خطا");
      toast.success("کد تخفیف ایجاد شد");
      setForm({ code: "", type: "PERCENT", value: "", maxUses: "", expiresAt: "", isActive: true });
      setOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "خطای ناشناخته");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!code) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/discounts/${code.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "خطا");
      toast.success("کد حذف شد");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "خطای ناشناخته");
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggle() {
    if (!code) return;
    setToggling(true);
    try {
      const res = await fetch(`/api/admin/discounts/${code.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !code.isActive }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "خطا");
      toast.success(code.isActive ? "کد غیرفعال شد" : "کد فعال شد");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "خطای ناشناخته");
    } finally {
      setToggling(false);
    }
  }

  if (mode === "row" && code) {
    return (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleToggle}
          disabled={toggling}
          aria-label="فعال/غیرفعال"
        >
          {toggling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-rose-500 hover:text-rose-600"
              disabled={code.usedCount > 0}
              aria-label="حذف"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>حذف کد تخفیف؟</AlertDialogTitle>
              <AlertDialogDescription>
                کد <span dir="ltr" className="font-mono">{code.code}</span> حذف خواهد شد.
                {code.usedCount > 0 && ` این کد ${toFa(code.usedCount)} بار استفاده شده و قابل حذف نیست.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>انصراف</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="gap-2 bg-rose-500 text-white hover:bg-rose-600"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // create mode
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            افزودن کد
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>افزودن کد تخفیف</DialogTitle>
          <DialogDescription>یک کد تخفیف جدید ایجاد کنید</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="d-code">کد *</Label>
            <Input
              id="d-code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="WELCOME10"
              dir="ltr"
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="d-type">نوع تخفیف</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger id="d-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENT">درصدی</SelectItem>
                <SelectItem value="FIXED">مبلغی (تومان)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="d-value">مقدار *</Label>
            <Input
              id="d-value"
              type="number"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              dir="ltr"
              placeholder={form.type === "PERCENT" ? "10" : "50000"}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="d-max">حداکثر استفاده (۰ = نامحدود)</Label>
            <Input
              id="d-max"
              type="number"
              value={form.maxUses}
              onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
              dir="ltr"
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="d-exp">تاریخ انقضا (اختیاری)</Label>
            <Input
              id="d-exp"
              type="datetime-local"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              dir="ltr"
            />
          </div>
          <div className="flex items-center justify-between gap-2 sm:col-span-2 rounded-lg border p-3">
            <Label htmlFor="d-active" className="cursor-pointer">کد فعال باشد</Label>
            <Switch
              id="d-active"
              checked={form.isActive}
              onCheckedChange={(v) => setForm({ ...form, isActive: v })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>انصراف</Button>
          <Button onClick={handleCreate} disabled={loading} className="gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            ایجاد کد
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
