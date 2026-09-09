"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Zap,
  Flame,
  RotateCcw,
  CheckCircle2,
  Tag,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { HeroSlideItem, DEFAULT_HERO_SLIDES } from "@/lib/content";
import { toToman, toTomanWithUnit, calcDiscountPercent } from "@/lib/format";
import { toFa } from "@/lib/date";

interface ProductOption {
  id: string;
  title: string;
  slug: string;
  price: number;
  discountPrice: number | null;
}

interface Props {
  initialSlides: HeroSlideItem[];
  availableProducts?: ProductOption[];
}

const COLOR_OPTIONS: {
  value: HeroSlideItem["badgeColor"];
  label: string;
  bgClass: string;
  borderClass: string;
}[] = [
  { value: "purple", label: "بنفش نئونی (Purple)", bgClass: "bg-purple-500", borderClass: "border-purple-500" },
  { value: "emerald", label: "سبز زمردی (Emerald)", bgClass: "bg-emerald-500", borderClass: "border-emerald-500" },
  { value: "cyan", label: "آبی فیروزه‌ای (Cyan)", bgClass: "bg-cyan-500", borderClass: "border-cyan-500" },
  { value: "amber", label: "کهربایی طلایی (Amber)", bgClass: "bg-amber-500", borderClass: "border-amber-500" },
  { value: "rose", label: "قرمز رز (Rose)", bgClass: "bg-rose-500", borderClass: "border-rose-500" },
];

export function HeroSliderManager({ initialSlides, availableProducts = [] }: Props) {
  const router = useRouter();
  const [slides, setSlides] = useState<HeroSlideItem[]>(
    initialSlides && initialSlides.length > 0 ? initialSlides : DEFAULT_HERO_SLIDES
  );
  const [expandedId, setExpandedId] = useState<string | null>(
    slides[0]?.id || null
  );
  const [loading, setLoading] = useState(false);

  // Update a single slide field
  const updateSlide = (id: string, updates: Partial<HeroSlideItem>) => {
    setSlides((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const merged = { ...s, ...updates };

        // Auto-recalculate discount if prices changed
        if ("originalPrice" in updates || "salePrice" in updates) {
          const orig = updates.originalPrice ?? s.originalPrice;
          const sale = updates.salePrice ?? s.salePrice;
          if (orig > 0 && sale > 0 && orig > sale) {
            merged.discountPercent = Math.round(((orig - sale) / orig) * 100);
          }
        }
        return merged;
      })
    );
  };

  // Reorder slides
  const moveSlide = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const newSlides = [...slides];
    const [moved] = newSlides.splice(index, 1);
    newSlides.splice(targetIndex, 0, moved);
    setSlides(newSlides);
  };

  // Add new slide
  const handleAddSlide = () => {
    const newId = `slide-${Date.now()}`;
    const newSlide: HeroSlideItem = {
      id: newId,
      active: true,
      badge: "⚡ پیشنهاد ویژه جدید",
      badgeColor: "purple",
      titleLine1: "اشتراک جدید هوش مصنوعی",
      titleLine2: "دسترسی نامحدود و قانونی",
      description: "توضیحات جذاب و ترغیب‌کننده برای جذب خریدار...",
      originalPrice: 1500000,
      salePrice: 1050000,
      discountPercent: 30,
      features: [
        "تحویل فوری زیر ۳ دقیقه",
        "گارانتی و تضمین ۱۰۰٪ لایسنو",
        "پشتیبانی فنی اختصاصی",
      ],
      urgencyText: "ظرفیت محدود ویژه جشنواره",
      ctaText: "خرید فوری با تخفیف",
      ctaLink: "/shop?cat=ai",
      secondaryCtaText: "مشاهده جزئیات",
      secondaryCtaLink: "/shop?cat=ai",
      productSlug: "",
    };

    setSlides((prev) => [newSlide, ...prev]);
    setExpandedId(newId);
    toast.info("اسلاید جدید ایجاد شد — مشخصات آن را تکمیل و دکمه ذخیره را بزنید");
  };

  // Delete a slide
  const handleDeleteSlide = (id: string) => {
    if (slides.length <= 1) {
      toast.error("حداقل یک اسلاید باید وجود داشته باشد");
      return;
    }
    if (confirm("آیا از حذف این اسلاید اطمینان دارید؟")) {
      setSlides((prev) => prev.filter((s) => s.id !== id));
      toast.success("اسلاید حذف شد");
    }
  };

  // Auto-fill from existing product
  const handleSelectProduct = (id: string, productSlug: string) => {
    const prod = availableProducts.find((p) => p.slug === productSlug);
    if (!prod) return;

    const orig = prod.price;
    const sale = prod.discountPrice || prod.price;
    const discount = orig > sale ? Math.round(((orig - sale) / orig) * 100) : 0;

    updateSlide(id, {
      productSlug: prod.slug,
      titleLine1: prod.title,
      ctaLink: `/product/${prod.slug}`,
      secondaryCtaLink: `/product/${prod.slug}`,
      originalPrice: orig,
      salePrice: sale,
      discountPercent: discount,
    });
    toast.success(`اطلاعات محصول «${prod.title}» جایگزین شد`);
  };

  // Save all slides to DB
  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: {
            hero_campaign_slides: JSON.stringify(slides),
          },
        }),
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.message || "خطا در ذخیره‌سازی");

      toast.success("اسلایدر کمپین‌های هدر با موفقیت ذخیره شد");
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "خطای ناشناخته در ذخیره اسلایدر");
    } finally {
      setLoading(false);
    }
  };

  // Reset to default
  const handleResetToDefaults = () => {
    if (confirm("آیا مایلید تمام اسلایدها به تنظیمات اولیه و پیش‌فرض بازگردند؟")) {
      setSlides(DEFAULT_HERO_SLIDES);
      setExpandedId(DEFAULT_HERO_SLIDES[0]?.id || null);
      toast.info("اسلایدها به مقادیر پیش‌فرض بازگردانده شدند — جهت اعمال روی سایت دکمه ذخیره را بزنید");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-card p-4 rounded-2xl border">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>مدیریت اسلایدر کمپین‌های هدر (Hero Campaign Slider)</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            تعداد کل اسلایدها: {toFa(slides.length)} | فعال در سایت:{" "}
            {toFa(slides.filter((s) => s.active).length)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetToDefaults}
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>پیش‌فرض</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddSlide}
            className="gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary/10"
          >
            <Plus className="h-4 w-4" />
            <span>افزودن اسلاید</span>
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="gap-2 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>ذخیره تغییرات اسلایدر</span>
          </Button>
        </div>
      </div>

      {/* Slides list */}
      <div className="space-y-4">
        {slides.map((slide, index) => {
          const isExpanded = expandedId === slide.id;
          const savings = Math.max(0, slide.originalPrice - slide.salePrice);

          return (
            <Card
              key={slide.id}
              className={`overflow-hidden border transition-all duration-200 ${
                slide.active ? "border-white/15 bg-card/80" : "border-dashed border-muted bg-muted/20 opacity-70"
              }`}
            >
              {/* Slide Summary Row */}
              <div className="p-4 flex items-center justify-between gap-3 bg-muted/10">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Order reorder buttons */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveSlide(index, "up")}
                      className="p-1 rounded hover:bg-white/10 text-muted-foreground disabled:opacity-30"
                      title="انتقال به بالا"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === slides.length - 1}
                      onClick={() => moveSlide(index, "down")}
                      className="p-1 rounded hover:bg-white/10 text-muted-foreground disabled:opacity-30"
                      title="انتقال به پایین"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Badge & Title Preview */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-muted-foreground">
                        #{toFa(index + 1)}
                      </span>

                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white ${
                          COLOR_OPTIONS.find((c) => c.value === slide.badgeColor)?.bgClass || "bg-purple-600"
                        }`}
                      >
                        {slide.badge}
                      </span>

                      {!slide.active && (
                        <Badge variant="outline" className="text-[10px] text-rose-400 border-rose-500/30">
                          غیرفعال
                        </Badge>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-foreground truncate max-w-md">
                      {slide.titleLine1}{" "}
                      <span className="text-muted-foreground text-xs font-normal">
                        ({slide.titleLine2})
                      </span>
                    </h4>
                  </div>
                </div>

                {/* Right quick actions */}
                <div className="flex items-center gap-3 shrink-0">
                  {/* Price info pill */}
                  <div className="hidden sm:flex flex-col items-end text-xs">
                    <span className="font-bold text-emerald-400">
                      {toTomanWithUnit(slide.salePrice)}
                    </span>
                    <span className="text-[10px] text-muted-foreground line-through">
                      {toTomanWithUnit(slide.originalPrice)} (٪{toFa(slide.discountPercent)})
                    </span>
                  </div>

                  {/* Active toggle */}
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor={`active-${slide.id}`} className="text-xs cursor-pointer">
                      {slide.active ? "روشن" : "خاموش"}
                    </Label>
                    <Switch
                      id={`active-${slide.id}`}
                      checked={slide.active}
                      onCheckedChange={(val) => updateSlide(slide.id, { active: val })}
                    />
                  </div>

                  {/* Delete button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSlide(slide.id)}
                    className="text-rose-400 hover:text-rose-500 hover:bg-rose-500/10 h-8 w-8 p-0"
                    title="حذف اسلاید"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>

                  {/* Expand / Collapse toggle */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedId(isExpanded ? null : slide.id)}
                    className="h-8 w-8 p-0 text-muted-foreground"
                    title={isExpanded ? "بستن فرم" : "ویرایش فرم"}
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Slide Detail Editor Form */}
              {isExpanded && (
                <div className="p-6 border-t border-white/10 space-y-6 bg-card/40">
                  {/* Quick autofill from available product */}
                  {availableProducts.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                        <Tag className="h-4 w-4" />
                        <span>اتصال سریع به یکی از محصولات موجود سایت:</span>
                      </div>
                      <select
                        className="bg-background border border-border rounded-lg text-xs py-1.5 px-3 text-foreground outline-none cursor-pointer max-w-xs"
                        value={slide.productSlug || ""}
                        onChange={(e) => handleSelectProduct(slide.id, e.target.value)}
                      >
                        <option value="">-- انتخاب محصول سایت جهت پر شدن خودکار --</option>
                        {availableProducts.map((p) => (
                          <option key={p.id} value={p.slug}>
                            {p.title} ({toToman(p.price)} تومان)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Fields Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Badge text */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">متن بج بالای اسلاید</Label>
                      <Input
                        value={slide.badge}
                        onChange={(e) => updateSlide(slide.id, { badge: e.target.value })}
                        placeholder="مثل: 🔥 پرچمدار هوش مصنوعی ۲۰۲۵"
                      />
                    </div>

                    {/* Badge color theme */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">تم رنگی نئونی (Color Theme)</Label>
                      <select
                        className="w-full bg-background border border-border rounded-md text-xs py-2 px-3 text-foreground outline-none"
                        value={slide.badgeColor}
                        onChange={(e) =>
                          updateSlide(slide.id, {
                            badgeColor: e.target.value as HeroSlideItem["badgeColor"],
                          })
                        }
                      >
                        {COLOR_OPTIONS.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Urgency text */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">متن فوریت و کمبود (Scarcity / Urgency)</Label>
                      <Input
                        value={slide.urgencyText}
                        onChange={(e) => updateSlide(slide.id, { urgencyText: e.target.value })}
                        placeholder="مثل: تنها ۴ اشتراک با این قیمت باقیمانده"
                      />
                    </div>

                    {/* Title Line 1 */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">عنوان خط اول (سفید و برجسته)</Label>
                      <Input
                        value={slide.titleLine1}
                        onChange={(e) => updateSlide(slide.id, { titleLine1: e.target.value })}
                        placeholder="مثل: اکانت رسمی ChatGPT Plus"
                      />
                    </div>

                    {/* Title Line 2 */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">عنوان خط دوم (گرادینت نئونی)</Label>
                      <Input
                        value={slide.titleLine2}
                        onChange={(e) => updateSlide(slide.id, { titleLine2: e.target.value })}
                        placeholder="مثل: مجهز به موتورهای GPT-4o و o3-mini"
                      />
                    </div>

                    {/* Product Slug */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">اسلاگ محصول (جهت نمایش کاور لوگو)</Label>
                      <Input
                        value={slide.productSlug || ""}
                        onChange={(e) => updateSlide(slide.id, { productSlug: e.target.value })}
                        placeholder="مثل: chatgpt-plus-1-month"
                      />
                    </div>

                    {/* Original Price */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">قیمت قبل از تخفیف (تومان)</Label>
                      <Input
                        type="number"
                        value={slide.originalPrice}
                        onChange={(e) =>
                          updateSlide(slide.id, { originalPrice: Number(e.target.value) || 0 })
                        }
                        placeholder="1650000"
                      />
                      <span className="text-[11px] text-muted-foreground">
                        {toTomanWithUnit(slide.originalPrice)}
                      </span>
                    </div>

                    {/* Sale Price */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">قیمت با تخفیف لایسنو (تومان)</Label>
                      <Input
                        type="number"
                        value={slide.salePrice}
                        onChange={(e) =>
                          updateSlide(slide.id, { salePrice: Number(e.target.value) || 0 })
                        }
                        placeholder="1190000"
                      />
                      <span className="text-[11px] text-emerald-400 font-bold">
                        {toTomanWithUnit(slide.salePrice)}
                      </span>
                    </div>

                    {/* Discount percent */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">درصد تخفیف (محاسبه خودکار)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={slide.discountPercent}
                          onChange={(e) =>
                            updateSlide(slide.id, { discountPercent: Number(e.target.value) || 0 })
                          }
                          className="font-bold text-rose-500"
                        />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          ٪{toFa(slide.discountPercent)}
                        </span>
                      </div>
                      {savings > 0 && (
                        <span className="text-[11px] text-muted-foreground">
                          سود خریدار: {toTomanWithUnit(savings)}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2 lg:col-span-3 space-y-1.5">
                      <Label className="text-xs">توضیحات معرفی و مزیت پیشنهادی</Label>
                      <Textarea
                        rows={2}
                        value={slide.description}
                        onChange={(e) => updateSlide(slide.id, { description: e.target.value })}
                        placeholder="توضیحات مختصر و ترغیب‌کننده..."
                      />
                    </div>

                    {/* 3 Features */}
                    <div className="md:col-span-2 lg:col-span-3 space-y-2">
                      <Label className="text-xs">۳ ویژگی کلیدی و ضد ریسک</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[0, 1, 2].map((fIndex) => (
                          <Input
                            key={fIndex}
                            value={slide.features?.[fIndex] || ""}
                            onChange={(e) => {
                              const copy = [...(slide.features || ["", "", ""])];
                              copy[fIndex] = e.target.value;
                              updateSlide(slide.id, { features: copy });
                            }}
                            placeholder={`ویژگی ${fIndex + 1}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* CTA Button Text & Link */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">متن دکمه اصلی (CTA)</Label>
                      <Input
                        value={slide.ctaText}
                        onChange={(e) => updateSlide(slide.id, { ctaText: e.target.value })}
                        placeholder="خرید اشتراک با تخفیف"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">لینک دکمه اصلی (CTA Link)</Label>
                      <Input
                        value={slide.ctaLink}
                        onChange={(e) => updateSlide(slide.id, { ctaLink: e.target.value })}
                        placeholder="/product/claude-pro-1-month"
                      />
                    </div>

                    {/* Secondary CTA */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">متن دکمه دوم (اختیاری)</Label>
                      <Input
                        value={slide.secondaryCtaText || ""}
                        onChange={(e) => updateSlide(slide.id, { secondaryCtaText: e.target.value })}
                        placeholder="مشاهده مشخصات"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">لینک دکمه دوم (اختیاری)</Label>
                      <Input
                        value={slide.secondaryCtaLink || ""}
                        onChange={(e) => updateSlide(slide.id, { secondaryCtaLink: e.target.value })}
                        placeholder="/product/claude-pro-1-month"
                      />
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Bottom Save bar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          onClick={handleSave}
          disabled={loading}
          size="lg"
          className="gap-2 font-bold bg-primary hover:bg-primary/90 text-primary-foreground px-8"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          <span>ذخیره نهایی اسلایدر کمپین‌ها</span>
        </Button>
      </div>
    </div>
  );
}
