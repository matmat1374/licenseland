import { db } from "@/lib/db";
import { DEFAULT_CONTENT, CONTENT_FIELDS, DEFAULT_HERO_SLIDES, HeroSlideItem } from "@/lib/content";
import { ContentManager } from "@/components/admin/content-manager";
import { HeroSliderManager } from "@/components/admin/hero-slider-manager";
import { Sparkles, FileText } from "lucide-react";

export const metadata = { title: "مدیریت محتوا و اسلایدر کمپین‌ها | پنل مدیریت" };
export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const [rows, products] = await Promise.all([
    db.siteContent.findMany(),
    db.product.findMany({
      select: { id: true, title: true, slug: true, price: true, discountPrice: true },
      orderBy: { title: "asc" },
    }),
  ]);

  const map: Record<string, string> = { ...DEFAULT_CONTENT };
  for (const r of rows) {
    if (r.value !== null && r.value !== undefined) map[r.key] = r.value;
  }

  // Parse hero slides from map or use default
  let heroSlides: HeroSlideItem[] = DEFAULT_HERO_SLIDES;
  if (map.hero_campaign_slides) {
    try {
      const parsed = JSON.parse(map.hero_campaign_slides);
      if (Array.isArray(parsed) && parsed.length > 0) {
        heroSlides = parsed;
      }
    } catch (err) {
      console.error("Error parsing hero_campaign_slides in admin page:", err);
    }
  }

  // Build groups of fields by group name, preserving definition order
  const groups: { name: string; fields: typeof CONTENT_FIELDS }[] = [];
  for (const f of CONTENT_FIELDS) {
    let g = groups.find((x) => x.name === f.group);
    if (!g) {
      g = { name: f.group, fields: [] };
      groups.push(g);
    }
    g.fields.push(f);
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-foreground">
          مدیریت محتوا و کمپین‌ها
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          تنظیم اسلایدر کمپین‌های هدر و ویرایش متون و بنرهای سایت به صورت زنده و بدون نیاز به برنامه‌نویسی
        </p>
      </div>

      {/* Hero Campaign Slider Management */}
      <section className="space-y-4">
        <HeroSliderManager
          initialSlides={heroSlides}
          availableProducts={products}
        />
      </section>

      {/* General Site Content Management */}
      <section className="space-y-4 pt-6 border-t border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">
            سایر متون و بنرهای سایت
          </h2>
        </div>
        <ContentManager initialContent={map} groups={groups} />
      </section>
    </div>
  );
}
