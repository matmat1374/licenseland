// Site content helper — reads editable content from the SiteContent table.
// Used by the homepage and other pages so admin can edit content without code changes.
// Falls back to DEFAULT_CONTENT if a key is not set in DB.

import { db } from "@/lib/db";

export interface HeroSlideItem {
  id: string;
  active: boolean;
  badge: string; // مثل: ⚡ پیشنهاد شگفت‌انگیز یا 🔥 پرچمدار هوش مصنوعی
  badgeColor: "emerald" | "purple" | "amber" | "cyan" | "rose";
  titleLine1: string;
  titleLine2: string;
  description: string;
  originalPrice: number; // قیمت خط‌خورده به تومان
  salePrice: number; // قیمت با تخفیف به تومان
  discountPercent: number; // درصد تخفیف مثلا ۳۰
  features: string[]; // ۳ ویژگی کلیدی ترغیب‌کننده
  urgencyText: string; // متن اضطرار مثل: تنها ۴ عدد با این قیمت باقیمانده
  ctaText: string; // دکمه خرید اصلی
  ctaLink: string; // لینک به صفحه محصول
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  productSlug?: string;
  image?: string;
}

export const DEFAULT_HERO_SLIDES: HeroSlideItem[] = [
  {
    id: "slide-gemini-18m",
    active: true,
    badge: "پیشنهاد ویژه / اکانت هوش مصنوعی / رسمی و قانونی",
    badgeColor: "amber",
    titleLine1: "اشتراک ۱۸ ماهه Google One و Gemini Advanced (1.5 Pro)",
    titleLine2: "",
    description: "",
    originalPrice: 1750000,
    salePrice: 892000,
    discountPercent: 49,
    features: [
      "۵ ترابایت حافظه ابری Drive و Google Photos",
      "فعال‌سازی روی ایمیل شخصی کاربر بدون نیاز به رمز عبور",
      "دسترسی به برترین مدل‌های Gemini",
      "گارانتی تعویض ۱۸ ماهه کامل، تحویل آنی"
    ],
    urgencyText: "تخفیف ویژه جشنواره — تحویل آنی خودکار زیر ۵ دقیقه",
    ctaText: "خرید اشتراک ۱۸ ماهه",
    ctaLink: "/product/364-gemini-ai-pro-۱۸-ماهه",
    secondaryCtaText: "بررسی مشخصات و خرید",
    secondaryCtaLink: "/product/364-gemini-ai-pro-۱۸-ماهه",
    productSlug: "364-gemini-ai-pro-۱۸-ماهه",
  }
];

// Default content (used on first run, before admin edits anything)
export const DEFAULT_CONTENT: Record<string, string> = {
  // Hero Campaign Slides (JSON array of HeroSlideItem)
  hero_campaign_slides: JSON.stringify(DEFAULT_HERO_SLIDES),

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
  stats_1_value: "۹۵۰+",
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
  banner1_badge: "⚡ دسترسی سریع و قانونی",
  banner1_title_line1: "مجموعه برگزیده",
  banner1_title_line2: "هوش مصنوعی",
  banner1_discount: "🔥 پرطرفدار",
  banner1_description: "اشتراک قانونی برترین هوش‌های مصنوعی جهان (Gemini، Claude، Cursor) با فعالسازی آنی و گارانتی.",
  banner1_features: "Google Gemini Advanced, Claude 3.7 Sonnet, Cursor AI Pro",
  banner1_button_text: "مشاهده همه سرویس‌های هوش مصنوعی",
  banner1_link: "/shop?cat=ai",
  banner1_product_ids: "364-gemini-ai-pro-۱۸-ماهه,2992-claude-pro-۱-ماهه,3062-cursor-pro-۱-ماهه",

  banner2_badge: "💎 اقتصادی و کاربردی",
  banner2_title_line1: "اشتراک‌های محبوب",
  banner2_title_line2: "زیر ۵۰۰ هزار تومان",
  banner2_discount: "ارزش خرید بالا",
  banner2_description: "سرویس‌های اوریجینال اسپاتیفای، تلگرام استارز و کپکات با قیمت به‌صرفه و تحویل آنی.",
  banner2_features: "Spotify Premium, Telegram Stars, CapCut Pro VIP",
  banner2_button_text: "مشاهده همه محصولات اقتصادی",
  banner2_link: "/shop",
  banner2_product_ids: "3117-spotify-premium-۳-ماهه,708-50-telegram-stars,1548-capcut-pro-7-d-comes-with",
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

export async function getHeroSlides(): Promise<HeroSlideItem[]> {
  const slides = [...DEFAULT_HERO_SLIDES];
  
  try {
    const gemini = await db.product.findFirst({
      where: {
        OR: [
          { specifications: { contains: '"supplier_product_id":364' } },
          { specifications: { contains: '"supplier_product_id": 364' } },
          { slug: { startsWith: "364-" } },
        ],
      },
    });

    if (gemini && gemini.price > 0) {
      const originalPrice = Math.ceil((gemini.price * 1.5) / 10000) * 10000;
      const discountPercent = Math.round(((originalPrice - gemini.price) / originalPrice) * 100);

      slides[0].salePrice = gemini.price;
      slides[0].originalPrice = originalPrice;
      slides[0].discountPercent = discountPercent;
      slides[0].ctaLink = `/product/${gemini.slug}`;
      slides[0].secondaryCtaLink = `/product/${gemini.slug}`;
      slides[0].productSlug = gemini.slug;
    }
  } catch (err) {
    console.error("Failed to fetch gemini product for hero slide:", err);
  }

  return slides;
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
  { key: "stats_1_value", label: "آمار ۱ — مقدار", group: "آمار‌ها", placeholder: "۹۵۰+" },
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
  { key: "banner1_badge", label: "بج بنر ۱", group: "بنرهای تبلیغاتی بنتو (Promo Banners)", placeholder: "⚡ دسترسی سریع و قانونی" },
  { key: "banner1_title_line1", label: "عنوان خط ۱ بنر ۱", group: "بنرهای تبلیغاتی بنتو (Promo Banners)", placeholder: "مجموعه برگزیده" },
  { key: "banner1_title_line2", label: "عنوان خط ۲ بنر ۱", group: "بنرهای تبلیغاتی بنتو (Promo Banners)", placeholder: "هوش مصنوعی" },
  { key: "banner1_discount", label: "تخفیف بنر ۱", group: "بنرهای تبلیغاتی بنتو (Promo Banners)", placeholder: "🔥 پرطرفدار" },
  { key: "banner1_description", label: "توضیحات بنر ۱", type: "textarea", group: "بنرهای تبلیغاتی بنتو (Promo Banners)", placeholder: "اشتراک قانونی برترین هوش‌های مصنوعی جهان..." },
  { key: "banner1_features", label: "ویژگی‌های بنر ۱ (با کاما جدا کنید)", type: "textarea", group: "بنرهای تبلیغاتی بنتو (Promo Banners)", placeholder: "Google Gemini, Claude Pro, Cursor Pro" },
  { key: "banner1_button_text", label: "متن دکمه بنر ۱", group: "بنرهای تبلیغاتی بنتو (Promo Banners)", placeholder: "مشاهده همه سرویس‌های هوش مصنوعی" },
  { key: "banner1_link", label: "لینک دکمه بنر ۱", group: "بنرهای تبلیغاتی بنتو (Promo Banners)", placeholder: "/shop?cat=ai" },
  { key: "banner1_product_ids", label: "محصولات بنر ۱ (شناسه یا اسلاگ، با کاما جدا شود)", group: "بنرهای تبلیغاتی بنتو (Promo Banners)", placeholder: "364-gemini-ai-pro-۱۸-ماهه,2992-claude-pro-۱-ماهه,3062-cursor-pro-۱-ماهه" },

  { key: "banner2_badge", label: "بج بنر ۲", group: "بنرهای تبلیغاتی بنتو (Promo Banners)", placeholder: "💎 اقتصادی و کاربردی" },
  { key: "banner2_title_line1", label: "عنوان خط ۱ بنر ۲", group: "بنرهای تبلیغاتی بنتو (Promo Banners)", placeholder: "اشتراک‌های محبوب" },
  { key: "banner2_title_line2", label: "عنوان خط ۲ بنر ۲", group: "بنرهای تبلیغاتی بنتو (Promo Banners)", placeholder: "زیر ۵۰۰ هزار تومان" },
  { key: "banner2_discount", label: "تخفیف بنر ۲", group: "بنرهای تبلیغاتی بنتو (Promo Banners)", placeholder: "ارزش خرید بالا" },
  { key: "banner2_description", label: "توضیحات بنر ۲", type: "textarea", group: "بنرهای تبلیغاتی بنتو (Promo Banners)", placeholder: "سرویس‌های اوریجینال اسپاتیفای، تلگرام استارز و کپکات..." },
  { key: "banner2_features", label: "ویژگی‌های بنر ۲ (با کاما جدا کنید)", type: "textarea", group: "بنرهای تبلیغاتی بنتو (Promo Banners)", placeholder: "Spotify, Telegram Stars, CapCut Pro" },
  { key: "banner2_button_text", label: "متن دکمه بنر ۲", group: "بنرهای تبلیغاتی بنتو (Promo Banners)", placeholder: "مشاهده همه محصولات اقتصادی" },
  { key: "banner2_link", label: "لینک دکمه بنر ۲", group: "بنرهای تبلیغاتی بنتو (Promo Banners)", placeholder: "/shop" },
  { key: "banner2_product_ids", label: "محصولات بنر ۲ (شناسه یا اسلاگ، با کاما جدا شود)", group: "بنرهای تبلیغاتی بنتو (Promo Banners)", placeholder: "3117-spotify-premium-۳-ماهه,708-50-telegram-stars,1548-capcut-pro-7-d-comes-with" },
];
