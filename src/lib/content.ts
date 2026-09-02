// Site content helper — reads editable content from the SiteContent table.
// Used by the homepage and other pages so admin can edit content without code changes.
// Falls back to DEFAULT_CONTENT if a key is not set in DB.

import { db } from "@/lib/db";

// Default content (used on first run, before admin edits anything)
export const DEFAULT_CONTENT: Record<string, string> = {
  // Hero section
  hero_badge: "بازار لایسنس دیجیتال ایران",
  hero_title: "لایسنس اوریجینال",
  hero_gradient_text: "هوش مصنوعی و نرم‌افزار",
  hero_subtitle: "با تحویل آنی",
  hero_description:
    "لایسنس ChatGPT، Midjourney، CapCut، Adobe و صدها محصول دیجیتال دیگر را با بهترین قیمت و تحویل خودکار بلافاصله پس از پرداخت دریافت کنید.",
  hero_cta_text: "مشاهده محصولات",
  hero_cta2_text: "جستجوی سریع",

  // Stats (4 items)
  stats_1_value: "۵۰٬۰۰۰+",
  stats_1_label: "مشتری راضی",
  stats_2_value: "۱٬۲۰۰+",
  stats_2_label: "محصول فعال",
  stats_3_value: "۴.۹/۵",
  stats_3_label: "امتیاز کاربران",
  stats_4_value: "۲۴/۷",
  stats_4_label: "پشتیبانی",

  // About section
  about_title: "تجربه‌ای متفاوت از خرید لایسنس",
  about_description:
    "ما به جزئیات اهمیت می‌دهیم تا شما با خیال راحت خرید کنید",

  // Promo Banners
  banner1_badge: "⚡ تحویل زیر ۵ دقیقه",
  banner1_title_line1: "پکیج سلطنتی",
  banner1_title_line2: "هوش مصنوعی",
  banner1_discount: "-۴۰٪",
  banner1_description: "قدرتمندترین مدل‌های زبانی جهان را در یک پکیج شگفت‌انگیز تجربه کنید.",
  banner1_features: "Claude 3.7 Sonnet & Opus, ChatGPT Plus (GPT-4o), Midjourney Pro",
  banner1_button_text: "خرید سریع پکیج",
  banner1_link: "/shop?cat=ai",
  banner1_product_ids: "",

  banner2_badge: "💎 لایسنس ۱۰۰٪ قانونی",
  banner2_title_line1: "کیت تخصصی",
  banner2_title_line2: "دولوپر و طراح",
  banner2_discount: "ویژه",
  banner2_description: "ابزارهای حرفه‌ای برای کدنویسی سریع‌تر و طراحی خلاقانه‌تر.",
  banner2_features: "Cursor AI Pro, GitHub Copilot, Canva Pro / Adobe CC",
  banner2_button_text: "ورود به بخش برنامه‌نویسی",
  banner2_link: "/shop?cat=developer",
  banner2_product_ids: "",
};

// Returns a map of all content keys from DB merged with defaults.
// DB values override defaults.
export async function getContentMap(): Promise<Record<string, string>> {
  try {
    const rows = await db.siteContent.findMany();
    const map: Record<string, string> = { ...DEFAULT_CONTENT };
    for (const r of rows) {
      if (r.value !== null && r.value !== undefined) map[r.key] = r.value;
    }
    return map;
  } catch {
    // If DB not available, return defaults
    return { ...DEFAULT_CONTENT };
  }
}

// Get a single content value by key (with default fallback)
export async function getContentValue(key: string): Promise<string> {
  try {
    const row = await db.siteContent.findUnique({ where: { key } });
    if (row?.value) return row.value;
  } catch {
    // ignore
  }
  return DEFAULT_CONTENT[key] || "";
}

// Define which keys are supported and their labels/descriptions for the admin UI
export const CONTENT_FIELDS: {
  key: string;
  label: string;
  type?: "text" | "textarea";
  group: string;
  placeholder?: string;
}[] = [
  // Hero
  { key: "hero_badge", label: "متن بج هرو", group: "بخش هرو (Hero)", placeholder: "بازار لایسنس دیجیتال ایران" },
  { key: "hero_title", label: "عنوان اصلی هرو", group: "بخش هرو (Hero)", placeholder: "لایسنس اوریجینال" },
  { key: "hero_gradient_text", label: "متن گرادینت (خط دوم)", group: "بخش هرو (Hero)", placeholder: "هوش مصنوعی و نرم‌افزار" },
  { key: "hero_subtitle", label: "خط سوم هرو", group: "بخش هرو (Hero)", placeholder: "با تحویل آنی" },
  {
    key: "hero_description",
    label: "توضیحات هرو",
    type: "textarea",
    group: "بخش هرو (Hero)",
    placeholder: "لایسنس ChatGPT، Midjourney، CapCut، Adobe و صدها محصول دیجیتال دیگر...",
  },
  { key: "hero_cta_text", label: "متن دکمه اصلی", group: "بخش هرو (Hero)", placeholder: "مشاهده محصولات" },
  { key: "hero_cta2_text", label: "متن دکمه دوم", group: "بخش هرو (Hero)", placeholder: "جستجوی سریع" },

  // Stats
  { key: "stats_1_value", label: "آمار ۱ — مقدار", group: "آمار‌ها", placeholder: "۵۰٬۰۰۰+" },
  { key: "stats_1_label", label: "آمار ۱ — برچسب", group: "آمار‌ها", placeholder: "مشتری راضی" },
  { key: "stats_2_value", label: "آمار ۲ — مقدار", group: "آمار‌ها", placeholder: "۱٬۲۰۰+" },
  { key: "stats_2_label", label: "آمار ۲ — برچسب", group: "آمار‌ها", placeholder: "محصول فعال" },
  { key: "stats_3_value", label: "آمار ۳ — مقدار", group: "آمار‌ها", placeholder: "۴.۹/۵" },
  { key: "stats_3_label", label: "آمار ۳ — برچسب", group: "آمار‌ها", placeholder: "امتیاز کاربران" },
  { key: "stats_4_value", label: "آمار ۴ — مقدار", group: "آمار‌ها", placeholder: "۲۴/۷" },
  { key: "stats_4_label", label: "آمار ۴ — برچسب", group: "آمار‌ها", placeholder: "پشتیبانی" },

  // About
  { key: "about_title", label: "عنوان درباره ما", group: "بخش درباره ما", placeholder: "تجربه‌ای متفاوت از خرید لایسنس" },
  {
    key: "about_description",
    label: "توضیحات درباره ما",
    type: "textarea",
    group: "بخش درباره ما",
    placeholder: "ما به جزئیات اهمیت می‌دهیم تا شما با خیال راحت خرید کنید",
  },

  // Promo Banners
  { key: "banner1_badge", label: "بج بنر ۱", group: "بنرهای تبلیغاتی بنتو (Promo Banners)", placeholder: "⚡ تحویل زیر ۵ دقیقه" },
  { key: "banner1_title_line1", label: "عنوان خط ۱ بنر ۱", group: "بنرهای تبلیغاتی بنتو (Promo Banners)", placeholder: "پکیج سلطنتی" },
  { key: "banner1_title_line2", label: "عنوان خط ۲ بنر ۱", group: "بنرهای تبلیغاتی بنتو (Promo Banners)", placeholder: "هوش مصنوعی" },
  { key: "banner1_discount", label: "تخفیف بنر ۱", group: "بنرهای تبلیغاتی بنتو (Promo Banners)", placeholder: "-۴۰٪" },
  { key: "banner1_description", label: "توضیحات بنر ۱", type: "textarea", group: "بنرهای تبلیغاتی بنتو (Promo Banners)", placeholder: "قدرتمندترین مدلهای زبانی جهان..." },
  { key: "banner1_features", label: "ویژگی‌های بنر ۱ (با کاما جدا کنید)", type: "textarea", group: "بنرهای تبلیغاتی بنتو (Promo Banners)", placeholder: "Claude 3.7 Sonnet & Opus, ChatGPT Plus (GPT-4o), Midjourney Pro" },
  { key: "banner1_button_text", label: "متن دکمه بنر ۱", group: "بنرهای تبلیغاتی بنتو (Promo Banners)", placeholder: "خرید سریع پکیج" },
  { key: "banner1_link", label: "لینک دکمه بنر ۱", group: "بنرهای تبلیغاتی بنتو (Promo Banners)", placeholder: "/shop?cat=ai" },
  { key: "banner1_product_ids", label: "محصولات بنر ۱ (شناسه یا اسلاگ، با کاما جدا شود)", group: "بنرهای تبلیغاتی بنتو (Promo Banners)", placeholder: "chatgpt-plus,midjourney-pro" },

  { key: "banner2_badge", label: "بج بنر ۲", group: "بنرهای تبلیغاتی بنتو (Promo Banners)", placeholder: "💎 لایسنس ۱۰۰٪ قانونی" },
  { key: "banner2_title_line1", label: "عنوان خط ۱ بنر ۲", group: "بنرهای تبلیغاتی بنتو (Promo Banners)", placeholder: "کیت تخصصی" },
  { key: "banner2_title_line2", label: "عنوان خط ۲ بنر ۲", group: "بنرهای تبلیغاتی بنتو (Promo Banners)", placeholder: "دولوپر و طراح" },
  { key: "banner2_discount", label: "تخفیف بنر ۲", group: "بنرهای تبلیغاتی بنتو (Promo Banners)", placeholder: "ویژه" },
  { key: "banner2_description", label: "توضیحات بنر ۲", type: "textarea", group: "بنرهای تبلیغاتی بنتو (Promo Banners)", placeholder: "ابزارهای حرفه‌ای برای کدنویسی..." },
  { key: "banner2_features", label: "ویژگی‌های بنر ۲ (با کاما جدا کنید)", type: "textarea", group: "بنرهای تبلیغاتی بنتو (Promo Banners)", placeholder: "Cursor AI Pro, GitHub Copilot, Canva Pro / Adobe CC" },
  { key: "banner2_button_text", label: "متن دکمه بنر ۲", group: "بنرهای تبلیغاتی بنتو (Promo Banners)", placeholder: "ورود به بخش برنامه‌نویسی" },
  { key: "banner2_link", label: "لینک دکمه بنر ۲", group: "بنرهای تبلیغاتی بنتو (Promo Banners)", placeholder: "/shop?cat=developer" },
  { key: "banner2_product_ids", label: "محصولات بنر ۲ (شناسه یا اسلاگ، با کاما جدا شود)", group: "بنرهای تبلیغاتی بنتو (Promo Banners)", placeholder: "github-copilot,cursor-ai" },
];
