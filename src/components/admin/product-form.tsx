"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface ProductFormData {
  id?: string;
  title: string;
  slug: string;
  shortDesc: string;
  description: string;
  features: string; // textarea, one per line
  price: number | string;
  discountPrice: number | string;
  duration: string;
  category: string;
  brand: string;
  tags: string;
  image: string;
  featured: boolean;
  bestseller: boolean;
  isActive: boolean;
}

interface ProductFormProps {
  initial?: Partial<ProductFormData> & { id?: string };
  categories: { name: string; slug: string }[];
  onSaved?: () => void;
  onCancel?: () => void;
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

export function ProductForm({ initial, categories, onSaved, onCancel }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [slugEdited, setSlugEdited] = useState(!!initial?.slug);
  const [data, setData] = useState<ProductFormData>({
    id: initial?.id,
    title: initial?.title || "",
    slug: initial?.slug || "",
    shortDesc: initial?.shortDesc || "",
    description: initial?.description || "",
    features: initial?.features || "",
    price: initial?.price ?? "",
    discountPrice: initial?.discountPrice ?? "",
    duration: initial?.duration || "",
    category: initial?.category || categories[0]?.slug || "",
    brand: initial?.brand || "",
    tags: initial?.tags || "",
    image: initial?.image || "",
    featured: initial?.featured ?? false,
    bestseller: initial?.bestseller ?? false,
    isActive: initial?.isActive ?? true,
  });

  function set<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  useEffect(() => {
    if (!slugEdited) set("slug", slugifyFa(data.title));
  }, [data.title, slugEdited]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data.title || !data.shortDesc || !data.description || !data.category) {
      toast.error("لطفاً همه فیلدهای ضروری را پر کنید");
      return;
    }

    const features = data.features
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: any = {
      title: data.title,
      slug: data.slug,
      shortDesc: data.shortDesc,
      description: data.description,
      features,
      price: Number(data.price) || 0,
      discountPrice: data.discountPrice ? Number(data.discountPrice) : null,
      duration: data.duration || null,
      category: data.category,
      brand: data.brand || null,
      tags: data.tags || null,
      image: data.image || null,
      featured: data.featured,
      bestseller: data.bestseller,
      isActive: data.isActive,
    };

    setLoading(true);
    try {
      const url = data.id ? `/api/admin/products/${data.id}` : "/api/admin/products";
      const method = data.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "خطا در ذخیره‌سازی");
      toast.success(data.id ? "محصول بروزرسانی شد" : "محصول با موفقیت ساخته شد");
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
          <Label htmlFor="title">عنوان محصول *</Label>
          <Input
            id="title"
            value={data.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="مثلاً: اکانت ChatGPT Plus ۱ ماهه"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slug">شناسه (slug)</Label>
          <Input
            id="slug"
            value={data.slug}
            onChange={(e) => {
              set("slug", e.target.value);
              setSlugEdited(true);
            }}
            placeholder="chatgpt-plus-1-month"
            dir="ltr"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="category">دسته‌بندی *</Label>
          <Select value={data.category} onValueChange={(v) => set("category", v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="انتخاب دسته" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.slug} value={c.slug}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="shortDesc">توضیح کوتاه *</Label>
          <Input
            id="shortDesc"
            value={data.shortDesc}
            onChange={(e) => set("shortDesc", e.target.value)}
            placeholder="یک جمله توضیح محصول"
            required
          />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="description">توضیحات کامل (Markdown) *</Label>
          <Textarea
            id="description"
            value={data.description}
            onChange={(e) => set("description", e.target.value)}
            rows={6}
            placeholder="## عنوان...&#10;متن کامل..."
            required
          />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="features">ویژگی‌ها (هر خط یک ویژگی)</Label>
          <Textarea
            id="features"
            value={data.features}
            onChange={(e) => set("features", e.target.value)}
            rows={4}
            placeholder={"دسترسی کامل به GPT-4o\nتولید تصویر با DALL-E 3\nتحویل آنی"}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price">قیمت (تومان) *</Label>
          <Input
            id="price"
            type="number"
            value={data.price}
            onChange={(e) => set("price", e.target.value)}
            dir="ltr"
            placeholder="480000"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="discountPrice">قیمت با تخفیف (اختیاری)</Label>
          <Input
            id="discountPrice"
            type="number"
            value={data.discountPrice}
            onChange={(e) => set("discountPrice", e.target.value)}
            dir="ltr"
            placeholder="385000"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="duration">مدت اعتبار</Label>
          <Input
            id="duration"
            value={data.duration}
            onChange={(e) => set("duration", e.target.value)}
            placeholder="مثلاً: ۱ ماهه"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="brand">برند</Label>
          <Input
            id="brand"
            value={data.brand}
            onChange={(e) => set("brand", e.target.value)}
            placeholder="OpenAI"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tags">تگ‌ها (با کاما جدا کنید)</Label>
          <Input
            id="tags"
            value={data.tags}
            onChange={(e) => set("tags", e.target.value)}
            placeholder="هوش مصنوعی, چت بات"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="image">تصویر/گرادینت (اختیاری)</Label>
          <Input
            id="image"
            value={data.image}
            onChange={(e) => set("image", e.target.value)}
            placeholder="from-emerald-500 to-teal-600"
            dir="ltr"
          />
        </div>
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-1 gap-3 rounded-lg border p-3 sm:grid-cols-3">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="featured" className="cursor-pointer">محصول ویژه</Label>
          <Switch
            id="featured"
            checked={data.featured}
            onCheckedChange={(v) => set("featured", v)}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="bestseller" className="cursor-pointer">پرفروش</Label>
          <Switch
            id="bestseller"
            checked={data.bestseller}
            onCheckedChange={(v) => set("bestseller", v)}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="isActive" className="cursor-pointer">فعال</Label>
          <Switch
            id="isActive"
            checked={data.isActive}
            onCheckedChange={(v) => set("isActive", v)}
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
          {data.id ? "ذخیره تغییرات" : "ایجاد محصول"}
        </Button>
      </div>
    </form>
  );
}
