"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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

interface ArticleData {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string;
  readingMinutes: number | string;
  published: boolean;
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
  cover: string;
}

function slugifyFa(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function ArticleForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: Partial<ArticleData>;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [slugEdited, setSlugEdited] = useState(!!initial?.slug);
  const [data, setData] = useState<ArticleData>({
    id: initial?.id,
    title: initial?.title || "",
    slug: initial?.slug || "",
    excerpt: initial?.excerpt || "",
    content: initial?.content || "",
    category: initial?.category || "عمومی",
    tags: initial?.tags || "",
    readingMinutes: initial?.readingMinutes ?? 5,
    published: initial?.published ?? true,
    featured: initial?.featured ?? false,
    seoTitle: initial?.seoTitle || "",
    seoDescription: initial?.seoDescription || "",
    cover: initial?.cover || "",
  });

  function set<K extends keyof ArticleData>(key: K, value: ArticleData[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  useEffect(() => {
    if (!slugEdited) set("slug", slugifyFa(data.title));
  }, [data.title, slugEdited]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data.title || !data.excerpt || !data.content) {
      toast.error("عنوان، خلاصه و محتوا الزامی است");
      return;
    }

    const payload: any = {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      category: data.category || "عمومی",
      tags: data.tags || null,
      readingMinutes: Number(data.readingMinutes) || 5,
      published: data.published,
      featured: data.featured,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
      cover: data.cover || null,
    };

    setLoading(true);
    try {
      const url = data.id ? `/api/admin/articles/${data.id}` : "/api/admin/articles";
      const method = data.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "خطا در ذخیره‌سازی");
      toast.success(data.id ? "مقاله بروزرسانی شد" : "مقاله ساخته شد");
      onSaved?.();
    } catch (e: any) {
      toast.error(e?.message || "خطای ناشناخته");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="a-title">عنوان *</Label>
          <Input
            id="a-title"
            value={data.title}
            onChange={(e) => set("title", e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="a-slug">شناسه (slug)</Label>
          <Input
            id="a-slug"
            value={data.slug}
            onChange={(e) => {
              set("slug", e.target.value);
              setSlugEdited(true);
            }}
            dir="ltr"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="a-cat">دسته</Label>
          <Input
            id="a-cat"
            value={data.category}
            onChange={(e) => set("category", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="a-excerpt">خلاصه *</Label>
          <Textarea
            id="a-excerpt"
            value={data.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
            rows={2}
            required
          />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="a-content">محتوا (Markdown) *</Label>
          <Textarea
            id="a-content"
            value={data.content}
            onChange={(e) => set("content", e.target.value)}
            rows={10}
            className="font-mono"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="a-tags">تگ‌ها (با کاما)</Label>
          <Input
            id="a-tags"
            value={data.tags}
            onChange={(e) => set("tags", e.target.value)}
            placeholder="هوش مصنوعی, آموزش"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="a-read">زمان مطالعه (دقیقه)</Label>
          <Input
            id="a-read"
            type="number"
            value={data.readingMinutes}
            onChange={(e) => set("readingMinutes", e.target.value)}
            dir="ltr"
          />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="a-cover">کاور/گرادینت (اختیاری)</Label>
          <Input
            id="a-cover"
            value={data.cover}
            onChange={(e) => set("cover", e.target.value)}
            dir="ltr"
            placeholder="from-emerald-500 to-teal-600"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="a-seo-title">عنوان سئو (اختیاری)</Label>
          <Input
            id="a-seo-title"
            value={data.seoTitle}
            onChange={(e) => set("seoTitle", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="a-seo-desc">توضیح سئو (اختیاری)</Label>
          <Input
            id="a-seo-desc"
            value={data.seoDescription}
            onChange={(e) => set("seoDescription", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-lg border p-3">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="a-pub" className="cursor-pointer">منتشر شود</Label>
          <Switch
            id="a-pub"
            checked={data.published}
            onCheckedChange={(v) => set("published", v)}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="a-feat" className="cursor-pointer">مقاله ویژه</Label>
          <Switch
            id="a-feat"
            checked={data.featured}
            onCheckedChange={(v) => set("featured", v)}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
            انصراف
          </Button>
        )}
        <Button type="submit" disabled={loading} className="gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {data.id ? "ذخیره تغییرات" : "ایجاد مقاله"}
        </Button>
      </div>
    </form>
  );
}

interface ShortArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string | null;
  readingMinutes: number;
  published: boolean;
  featured: boolean;
  createdAt: string;
}

export function ArticleManager({
  mode,
  article,
  children,
}: {
  mode: "create" | "edit";
  article?: ShortArticle;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [full, setFull] = useState<ArticleData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const router = useRouter();

  async function loadDetail() {
    if (mode !== "edit" || !article) return;
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/articles/${article.id}`);
      const json = await res.json();
      if (json.ok) {
        setFull({
          id: json.article.id,
          title: json.article.title,
          slug: json.article.slug,
          excerpt: json.article.excerpt,
          content: json.article.content,
          category: json.article.category,
          tags: json.article.tags || "",
          readingMinutes: json.article.readingMinutes,
          published: json.article.published,
          featured: json.article.featured,
          seoTitle: json.article.seoTitle || "",
          seoDescription: json.article.seoDescription || "",
          cover: json.article.cover || "",
        });
      }
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleDelete() {
    if (!article) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/articles/${article.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "خطا");
      toast.success("مقاله حذف شد");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "خطای ناشناخته");
    } finally {
      setDeleting(false);
    }
  }

  if (mode === "create") {
    return (
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) router.refresh(); }}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>افزودن مقاله جدید</DialogTitle>
            <DialogDescription>یک مقاله جدید برای وبلاگ بسازید</DialogDescription>
          </DialogHeader>
          <ArticleForm
            onSaved={() => { setOpen(false); router.refresh(); }}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (v && !full) loadDetail();
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
            <DialogTitle>ویرایش مقاله</DialogTitle>
            <DialogDescription>{article?.title}</DialogDescription>
          </DialogHeader>
          {loadingDetail ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : full ? (
            <ArticleForm
              initial={full}
              onSaved={() => { setOpen(false); router.refresh(); }}
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
            <AlertDialogTitle>حذف مقاله؟</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف «{article?.title}» مطمئن هستید؟
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
