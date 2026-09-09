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
    id: "slide-claude-pro",
    active: true,
    badge: "🔥 پرچمدار هوش مصنوعی ۲۰۲۵",
    badgeColor: "purple",
    titleLine1: "اشتراک اختصاصی Claude Pro",
    titleLine2: "دسترسی نامحدود به Claude 3.7 Sonnet",
    description: "قدرتمندترین مدل استدلال و کدنویسی جهان با پنجره کانتکست ۲۰۰K توکن، سرعت بی‌نظیر و فعال‌سازی روی ایمیل شخصی شما.",
    originalPrice: 1650000,
    salePrice: 1190000,
    discountPercent: 28,
    features: [
      "تحویل فوری زیر ۳ دقیقه",
      "فعال‌سازی ۱۰۰٪ قانونی روی اکانت شخصی",
      "ضمانت کامل کارکرد تا روز آخر اشتراک",
    ],
    urgencyText: "تنها ۴ اکانت با تخفیف این دوره باقی‌مانده است",
    ctaText: "خرید اشتراک Claude Pro",
    ctaLink: "/product/claude-pro-1-month",
    secondaryCtaText: "بررسی مشخصات",
    secondaryCtaLink: "/product/claude-pro-1-month",
    productSlug: "claude-pro-1-month",
  },
  {
    id: "slide-chatgpt-plus",
    active: true,
    badge: "⚡ پیشنهاد شگفت‌انگیز و پرفروش",
    badgeColor: "emerald",
    titleLine1: "اکانت رسمی ChatGPT Plus",
    titleLine2: "مجهز به آخرین موتورهای GPT-4o و o3-mini",
    description: "تولید نامحدود عکس DALL-E 3، کد پایتون پیشرفته، جستجوی زنده وب، تحلیل فایل‌های سنگین و بدون قطعی در اوج مصرف.",
    originalPrice: 1580000,
    salePrice: 1150000,
    discountPercent: 27,
    features: [
      "تحویل آنی و خودکار بلافاصله پس از پرداخت",
      "پایداری ۱۰۰٪ بدون خطر بن شدن اکانت",
      "پشتیبانی فنی و سریع ۲۴/۷ لایسنو",
    ],
    urgencyText: "تخفیف ویژه جشنواره — انقضا تا ۲۴ ساعت آینده",
    ctaText: "دریافت ChatGPT Plus",
    ctaLink: "/product/chatgpt-plus-1-month",
    secondaryCtaText: "مشاهده پلن‌ها",
    secondaryCtaLink: "/product/chatgpt-plus-1-month",
    productSlug: "chatgpt-plus-1-month",
  },
  {
    id: "slide-cursor-pro",
    active: true,
    badge: "💻 دستیار شماره ۱ برنامه‌نویسان",
    badgeColor: "cyan",
    titleLine1: "اشتراک حرفه‌ای Cursor AI Pro",
    titleLine2: "کدنویسی ۱۰ برابر سریع‌تر با ادیتور هوشمند",
    description: "ادیتور انقلابی بر پایه VS Code با ۵۰۰ درخواست فست ماهانه Claude 3.7 و GPT-4o برای تسلط کامل روی کل پروژه و ریپازیتوری شما.",
    originalPrice: 1450000,
    salePrice: 980000,
    discountPercent: 32,
    features: [
      "۵۰۰ درخواست Fast و نامحدود استاندارد",
      "تحلیل جامع ساختار پروژه و Codebase",
      "گارانتی تعویض و بازگشت وجه کامل",
    ],
    urgencyText: "ظرفیت محدود — تنها ۳ لایسنس با این قیمت",
    ctaText: "ارتقا به Cursor Pro",
    ctaLink: "/shop?cat=ai",
    secondaryCtaText: "کاتالوگ هوش مصنوعی",
    secondaryCtaLink: "/shop?cat=ai",
    productSlug: "cursor-ai-pro",
  },
  {
    id: "slide-midjourney-standard",
    active: true,
    badge: "🎨 برترین ابزار خلق تصاویر واقع‌گرایانه",
    badgeColor: "amber",
    titleLine1: "اکانت اوریجینال Midjourney",
    titleLine2: "تولید تصویر نامحدود با موتور v6.1",
    description: "بهترین موتور هوش مصنوعی فوتورئالیستی دنیا برای طراحان و هنرمندان دیجیتال؛ با ۱۵ ساعت رندر پرسرعت ماهانه و لایسنس تجاری کامل.",
    originalPrice: 1850000,
    salePrice: 1350000,
    discountPercent: 27,
    features: [
      "حالت محرمانه Stealth Mode بدون نمایش عمومی",
      "دسترسی سریع به سرورهای Fast Hours",
      "پشتیبانی فنی و آموزش اختصاصی لایسنو",
    ],
    urgencyText: "پیشنهاد اختصاصی کاربران جدید — زمان محدود",
    ctaText: "خرید اکانت Midjourney",
    ctaLink: "/product/midjourney-monthly",
    secondaryCtaText: "مشاهده جزئیات",
    secondaryCtaLink: "/product/midjourney-monthly",
    productSlug: "midjourney-monthly",
  },
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
  banner1_discount: "پیشنهاد ویژه",
  banner1_description: "اشتراک قانونی برترین هوش‌های مصنوعی جهان (ChatGPT، Claude، Cursor) با فعالسازی آنی.",
  banner1_features: "Claude 3.7 Sonnet & Opus, ChatGPT Plus (GPT-4o), Midjourney Pro",
  banner1_button_text: "مشاهده همه سرویس‌های هوش مصنوعی",
  banner1_link: "/shop?cat=ai",
  banner1_product_ids: "",

  banner2_badge: "💎 ابزارهای حرفه‌ای",
  banner2_title_line1: "استودیو تخصصی",
  banner2_title_line2: "طراحی و کدنویسی",
  banner2_discount: "ویژه خلاقان",
  banner2_description: "سرویس‌های اوریجینال برای گرافیست‌ها و برنامه‌نویسان با لایسنس رسمی و پشتیبانی مداوم.",
  banner2_features: "Cursor AI Pro, GitHub Copilot, Canva Pro / Adobe CC",
  banner2_button_text: "مشاهده همه ابزارهای طراحی و توسعه",
  banner2_link: "/shop?cat=design",
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

// Get Hero Campaign Slides parsed from DB or return defaults
export async function getHeroSlides(): Promise<HeroSlideItem[]> {
  try {
    const row = await db.siteContent.findUnique({ where: { key: "hero_campaign_slides" } });
    if (row?.value) {
      const parsed = JSON.parse(row.value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Failed to parse hero_campaign_slides from DB:", err);
  }
  return DEFAULT_HERO_SLIDES;
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
