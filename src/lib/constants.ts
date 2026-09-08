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

// Category definitions — keep in sync with seed
export const CATEGORIES = [
  {
    name: "شماره مجازی و وریفای",
    slug: "virtual-numbers",
    description: "شماره‌های مجازی برای شبکه‌های اجتماعی و ابزارهای هوش مصنوعی",
    icon: "Smartphone",
    color: "from-emerald-500 to-teal-600",
  },
  {
    name: "هوش مصنوعی",
    slug: "ai",
    description: "لایسنس و اکانت پریمیوم ابزارهای هوش مصنوعی",
    icon: "Sparkles",
    color: "from-emerald-500 to-teal-600",
  },
  {
    name: "توکن و کردیت API",
    slug: "api-credits",
    description: "توکن و موجودی انواع API‌های برنامه‌نویسی و هوش مصنوعی",
    icon: "Code2",
    color: "from-blue-500 to-cyan-600",
  },
  {
    name: "نرم‌افزار",
    slug: "software",
    description: "لایسنس اوریجینال نرم‌افزارهای کاربردی",
    icon: "AppWindow",
    color: "from-amber-500 to-orange-600",
  },
  {
    name: "فیلم، سریال و موسیقی",
    slug: "streaming",
    description: "اکانت پریمیوم سرویس‌های استریم و موسیقی",
    icon: "Play",
    color: "from-rose-500 to-pink-600",
  },
  {
    name: "امنیت و آنتی‌ویروس",
    slug: "security",
    description: "لایسنس آنتی‌ویروس و ابزارهای امنیتی",
    icon: "ShieldCheck",
    color: "from-cyan-500 to-emerald-600",
  },
  {
    name: "بازی و سرگرمی",
    slug: "gaming",
    description: "گیفت کارت و اکانت پلتفرم‌های بازی",
    icon: "Gamepad2",
    color: "from-violet-500 to-fuchsia-600",
  },
  {
    name: "طراحی و ویرایش",
    slug: "design",
    description: "لایسنس نرم‌افزارهای طراحی و ادیت ویدیو",
    icon: "PenTool",
    color: "from-sky-500 to-cyan-600",
  },
  {
    name: "شبکه‌های اجتماعی",
    slug: "social",
    description: "خدمات پریمیوم شبکه‌های اجتماعی",
    icon: "Share2",
    color: "from-indigo-500 to-blue-600",
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
