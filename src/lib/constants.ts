// Shared constants for LicenseLand

export const SITE = {
  name: "لایسنو",
  nameEn: "Liceno",
  tagline: "مرجع خرید لایسنس و اشتراک‌های قانونی دیجیتال",
  description:
    "خرید آنی لایسنس اوریجینال هوش مصنوعی و نرم‌افزار با تحویل خودکار، بهترین قیمت و پشتیبانی ۲۴ ساعته. لایسنس ChatGPT، Claude، Midjourney، CapCut، Adobe و...",
  url: "https://liceno.ir",
  email: "info@liceno.ir",
  phone: "۰۷۶-۴۴۴۵۸۷۹۱",
  mobile: "۰۹۱۲۱۱۴۵۶۸۷",
  telegram: "https://t.me/matinmazi",
  telegramHandle: "@matinmazi",
  instagram: "https://instagram.com/liceno",
  whatsapp: "https://wa.me/989121145687",
  address: "جزیره کیش، بازار شارستان، پلاک ۲۹",
};

export const NAV_LINKS = [
  { href: "/", label: "خانه" },
  { href: "/shop", label: "فروشگاه" },
  { href: "/blog", label: "وبلاگ" },
  { href: "/contact", label: "راهنما و پشتیبانی" },
];

// Category definitions — standard 8 categories matching irmarket.store
export const CATEGORIES = [
  {
    name: "هوش مصنوعی",
    slug: "ai",
    description: "اشتراک و اکانت قانونی ChatGPT، Claude، Midjourney و هوش‌های مصنوعی پیشرفته",
    icon: "Sparkles",
    color: "from-emerald-500 to-teal-600",
    sortOrder: 1,
  },
  {
    name: "شماره مجازی و OTP",
    slug: "virtual-numbers",
    description: "شماره‌های مجازی اختصاصی جهت دریافت پیامک تایید تلگرام، OpenAI، Claude و سرویس‌های خارجی",
    icon: "Smartphone",
    color: "from-teal-500 to-cyan-600",
    sortOrder: 2,
  },
  {
    name: "ابزارهای توسعه و برنامه‌نویسی",
    slug: "dev-tools",
    description: "Cursor Pro، Windsurf، GitHub Copilot و انواع توکن و کردیت API",
    icon: "Code2",
    color: "from-blue-500 to-indigo-600",
    sortOrder: 3,
  },
  {
    name: "طراحی و گرافیک",
    slug: "design",
    description: "لایسنس و اشتراک Canva Pro، Adobe Creative Cloud، Figma و ابزارهای ویدیویی",
    icon: "PenTool",
    color: "from-purple-500 to-pink-600",
    sortOrder: 4,
  },
  {
    name: "استریم و سرگرمی",
    slug: "streaming",
    description: "اکانت پریمیوم Spotify، Netflix، YouTube Premium و سرویس‌های فیلم و موسیقی",
    icon: "Play",
    color: "from-rose-500 to-pink-600",
    sortOrder: 5,
  },
  {
    name: "گیمینگ و گیفت‌کارت",
    slug: "gaming",
    description: "Discord Nitro، گیفت‌کارت PSN، Google Play، PUBG UC و CoD CP",
    icon: "Gamepad2",
    color: "from-violet-500 to-fuchsia-600",
    sortOrder: 6,
  },
  {
    name: "نرم‌افزار و بهره‌وری",
    slug: "productivity",
    description: "لایسنس آفیس ۳۶۵، ویندوز، گرامرلی، نوشن و ابزارهای سازمانی",
    icon: "LayoutGrid",
    color: "from-amber-500 to-orange-600",
    sortOrder: 7,
  },
  {
    name: "شبکه‌های اجتماعی",
    slug: "social",
    description: "تلگرام استارز، تلگرام پریمیوم، ممبر و خدمات شبکه‌های اجتماعی",
    icon: "Share2",
    color: "from-sky-500 to-blue-600",
    sortOrder: 8,
  },
];

export const TRUST_BADGES = [
  { icon: "Zap", title: "تحویل آنی خودکار", desc: "لایسنس بلافاصله بعد از پرداخت" },
  { icon: "ShieldCheck", title: "ضمانت اصل بودن", desc: "۱۰۰٪ اوریجینال و قانونی" },
  { icon: "Headphones", title: "پشتیبانی ۲۴/۷", desc: "همیشه کنار شما هستیم" },
  { icon: "BadgePercent", title: "بهترین قیمت", desc: "ارزان‌تر از همه‌جا" },
];

export const FAQS = [
  {
    q: "لایسنس‌ها چگونه تحویل داده می‌شوند؟",
    a: "بلافاصله پس از موفقیت‌آمیز بودن پرداخت، لایسنس و راهنمای فعال‌سازی به‌صورت خودکار در پنل کاربری شما نمایش داده می‌شود و از طریق پیامک و ایمیل نیز اطلاع‌رسانی می‌شود.",
  },
  {
    q: "آیا لایسنس‌ها اوریجینال و قانونی هستند؟",
    a: "بله، تمامی لایسنس‌ها اوریجینال بوده و ضمانت اصالت دارند. در صورت بروز مشکل، تا ۷ روز امکان تعویض یا بازگشت وجه وجود دارد.",
  },
  {
    q: "پشتیبانی چگونه است؟",
    a: "تیم پشتیبانی ما به‌صورت ۲۴ ساعته از طریق تیکت، تلگرام و تماس تلفنی پاسخگوی شماست.",
  },
  {
    q: "چه روش‌های پرداختی پشتیبانی می‌شود؟",
    a: "در حال حاضر پرداخت از طریق درگاه امن زرین‌پال با تمام کارت‌های شتاب امکان‌پذیر است.",
  },
  {
    q: "اگر لایسنس کار نکرد چه کنم؟",
    a: "کمتر از ۰.۱٪ موارد این اتفاق می‌افتد. در صورت بروز مشکل، با ارسال تیکت در کمتر از ۲ ساعت لایسنس جایگزین دریافت می‌کنید.",
  },
  {
    q: "آیا امکان صدور فاکتور وجود دارد؟",
    a: "بله، پس از هر خرید فاکتور رسمی در پنل کاربری شما قابل دریافت است.",
  },
];

export const STATS = [
  { value: "۹۵۰+", label: "مشتری راضی" },
  { value: "۱٬۲۰۰+", label: "لایسنس فعال" },
  { value: "۴.۹/۵", label: "امتیاز کاربران" },
  { value: "۲۴/۷", label: "پشتیبانی" },
];

export const PAYMENT_PROVIDERS = ["زرین‌پال"];

export function formatToman(n: number | null | undefined): string {
  if (n === null || n === undefined) return "۰";
  return n.toLocaleString("fa-IR");
}

export function formatTomanWithUnit(n: number | null | undefined): string {
  return `${formatToman(n)} تومان`;
}
