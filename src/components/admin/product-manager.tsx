"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
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
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ProductForm, type ProductFormData } from "./product-form";

interface ShortProduct {
  id: string;
  title: string;
  slug: string;
  shortDesc: string;
  price: number;
  discountPrice: number | null;
  stock: number;
  category: string;
  featured: boolean;
  bestseller: boolean;
  isActive: boolean;
  // optional fields used for prefill — fetched lazily if not provided
}

interface ProductManagerProps {
  mode: "create" | "edit";
  product?: ShortProduct;
  categories: { name: string; slug: string }[];
  children?: React.ReactNode;
}

export function ProductManager({ mode, product, categories, children }: ProductManagerProps) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleSaved() {
    setOpen(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!product) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "خطا در حذف");
      toast.success("محصول حذف شد");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "خطای ناشناخته");
    } finally {
      setDeleting(false);
    }
  }

  // For edit mode: fetch full product details when dialog opens (to get description/features)
  const [fullProduct, setFullProduct] = useState<ProductFormData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  async function loadDetail() {
    if (mode !== "edit" || !product) return;
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`);
      const json = await res.json();
      if (json.ok && json.product) {
        const p = json.product;
        let features = "";
        try {
          const arr = JSON.parse(p.features || "[]");
          if (Array.isArray(arr)) features = arr.join("\n");
        } catch {}
        setFullProduct({
          id: p.id,
          title: p.title,
          slug: p.slug,
          shortDesc: p.shortDesc,
          description: p.description,
          features,
          price: p.price,
          discountPrice: p.discountPrice ?? "",
          duration: p.duration || "",
          category: p.category,
          brand: p.brand || "",
          tags: p.tags || "",
          image: p.image || "",
          featured: p.featured,
          bestseller: p.bestseller,
          isActive: p.isActive,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  }

  if (mode === "create") {
    return (
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) router.refresh(); }}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>افزودن محصول جدید</DialogTitle>
            <DialogDescription>اطلاعات محصول را وارد کنید</DialogDescription>
          </DialogHeader>
          <ProductForm
            categories={categories}
            onSaved={handleSaved}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // edit mode
  return (
    <div className="flex items-center gap-1">
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (v && !fullProduct) loadDetail();
          if (!v) router.refresh();
        }}
      >
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="ویرایش">
            <Pencil className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ویرایش محصول</DialogTitle>
            <DialogDescription>{product?.title}</DialogDescription>
          </DialogHeader>
          {loadingDetail ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : fullProduct ? (
            <ProductForm
              initial={fullProduct}
              categories={categories}
              onSaved={handleSaved}
              onCancel={() => setOpen(false)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-rose-500 hover:text-rose-600"
            aria-label="حذف"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف محصول؟</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف «{product?.title}» مطمئن هستید؟ این عمل قابل بازگشت نیست.
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
