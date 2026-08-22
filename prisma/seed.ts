import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/crypto";

const db = new PrismaClient();

async function main() {
  console.log("🧹 Cleaning...");
  await db.licenseKey.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.review.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();
  await db.article.deleteMany();
  await db.discountCode.deleteMany();
  await db.user.deleteMany();

  // ---------------- Admin user ----------------
  await db.user.create({
    data: {
      email: "admin@licenseland.ir",
      name: "مدیر سایت",
      phone: "09100000000",
      password: await hashPassword("admin12345"),
      role: "ADMIN",
    },
  });
  console.log("✅ Admin user created (admin@licenseland.ir / admin12345)");

  // ---------------- Categories ----------------
  const cats = [
    { name: "هوش مصنوعی", slug: "ai", description: "لایسنس و اکانت پریمیوم ابزارهای هوش مصنوعی", icon: "Sparkles", color: "from-emerald-500 to-teal-600", sortOrder: 1 },
    { name: "نرم‌افزار", slug: "software", description: "لایسنس اوریجینال نرم‌افزارهای کاربردی", icon: "AppWindow", color: "from-amber-500 to-orange-600", sortOrder: 2 },
    { name: "استریم و موسیقی", slug: "streaming", description: "اکانت پریمیوم سرویس‌های استریم و موسیقی", icon: "Play", color: "from-rose-500 to-pink-600", sortOrder: 3 },
    { name: "امنیت و آنتی‌ویروس", slug: "security", description: "لایسنس آنتی‌ویروس و ابزارهای امنیتی", icon: "ShieldCheck", color: "from-cyan-500 to-emerald-600", sortOrder: 4 },
    { name: "بازی و سرگرمی", slug: "gaming", description: "گیفت کارت و اکانت پلتفرم‌های بازی", icon: "Gamepad2", color: "from-violet-500 to-fuchsia-600", sortOrder: 5 },
    { name: "طراحی و ویرایش", slug: "design", description: "لایسنس نرم‌افزارهای طراحی و ادیت ویدیو", icon: "PenTool", color: "from-sky-500 to-cyan-600", sortOrder: 6 },
  ];
  for (const c of cats) await db.category.create({ data: c });
  console.log("✅ Categories created");

  // ---------------- Products ----------------
  type P = {
    title: string; slug: string; shortDesc: string; description: string;
    features: string[]; price: number; discountPrice?: number; duration?: string;
    category: string; brand: string; tags: string; featured?: boolean; bestseller?: boolean;
    stock: number; rating: number; reviewCount: number; salesCount: number;
  };

  const products: P[] = [
    // ---- AI ----
    {
      title: "اکانت ChatGPT Plus — اشتراک ۱ ماهه", slug: "chatgpt-plus-1-month",
      shortDesc: "دسترسی به GPT-4o، DALL-E، تحلیل تصویر و اولویت در ساعات اوج",
      description: "## اکانت ChatGPT Plus\n\nبا اشتراک ChatGPT Plus به پیشرفته‌ترین مدل هوش مصنوعی OpenAI یعنی **GPT-4o** دسترسی پیدا کنید. این اشتراک شامل تولید تصویر با DALL-E، تحلیل فایل‌ها و تصاویر، دسترسی به GPTs سفارشی و اولویت در زمان‌های اوج ترافیک است.\n\n### ویژگی‌ها\n- دسترسی کامل به GPT-4o\n- تولید تصویر با DALL-E 3\n- آپلود و تحلیل فایل و تصویر\n- ساخت و استفاده از GPTs سفارشی\n- سرعت بالاتر پاسخگویی",
      features: ["دسترسی کامل به GPT-4o", "تولید تصویر با DALL-E 3", "تحلیل فایل و تصویر", "اولویت در زمان اوج", "تحویل آنی اکانت"],
      price: 480000, discountPrice: 385000, duration: "۱ ماهه", category: "ai", brand: "OpenAI",
      tags: "Bot,MessageCircle", featured: true, bestseller: true, stock: 8, rating: 4.9, reviewCount: 320, salesCount: 1850,
    },
    {
      title: "اکانت ChatGPT Plus — اشتراک ۳ ماهه", slug: "chatgpt-plus-3-months",
      shortDesc: "۳ ماه دسترسی کامل به GPT-4o با صرفه‌جویی ۲۰٪",
      description: "## اشتراک ۳ ماهه ChatGPT Plus\n\nبا خرید اشتراک ۳ ماهه علاوه بر تمام مزایای Plus، از تخفیف ویژه نیز بهره‌مند شوید.",
      features: ["دسترسی کامل به GPT-4o", "تولید تصویر با DALL-E 3", "تخفیف ویژه ۳ ماهه", "تحویل آنی"],
      price: 1300000, discountPrice: 990000, duration: "۳ ماهه", category: "ai", brand: "OpenAI",
      tags: "Bot", featured: true, stock: 5, rating: 4.9, reviewCount: 142, salesCount: 640,
    },
    {
      title: "اکانت Midjourney — اشتراک ماهانه", slug: "midjourney-monthly",
      shortDesc: "تولید تصاویر خیره‌کننده با هوش مصنوعی، نسخه استاندارد",
      description: "## اکانت Midjourney\n\nMidjourney یکی از قدرتمندترین ابزارهای تولید تصویر با هوش مصنوعی است. با این اشتراک می‌توانید تصاویر هنری و واقع‌گرایانه با کیفیت بالا تولید کنید.\n\n### ویژگی‌ها\n- ۱۵ ساعت سریع رندر ماهانه\n- دسترسی به حالت Relax نامحدود\n- کیفیت تصویر تا ۴K\n- دسترسی به نسخه V6",
      features: ["۱۵ ساعت Fast Generation", "حالت Relax نامحدود", "کیفیت تا 4K", "دسترسی به V6", "تحویل آنی"],
      price: 520000, discountPrice: 410000, duration: "۱ ماهه", category: "ai", brand: "Midjourney",
      tags: "Image", featured: true, bestseller: true, stock: 6, rating: 4.8, reviewCount: 210, salesCount: 980,
    },
    {
      title: "اکانت Claude Pro — اشتراک ۱ ماهه", slug: "claude-pro-1-month",
      shortDesc: "دسترسی به Claude 3.5 Sonnet با محدودیت بالاتر و فایل آپلود",
      description: "## اکانت Claude Pro\n\nاشتراک پریمیوم Claude از Anthropic با دسترسی به مدل قدرتمند Claude 3.5 Sonnet، مناسب کارهای نوشتاری، برنامه‌نویسی و تحلیل.",
      features: ["دسترسی به Claude 3.5 Sonnet", "آپلود فایل تا ۵۰۰MB", "اولویت در زمان اوج", "پروژه‌های نامحدود"],
      price: 450000, discountPrice: 365000, duration: "۱ ماهه", category: "ai", brand: "Anthropic",
      tags: "Bot", featured: true, stock: 4, rating: 4.8, reviewCount: 88, salesCount: 420,
    },
    {
      title: "اکانت Perplexity Pro — ۱ ماهه", slug: "perplexity-pro-1-month",
      shortDesc: "موتور جستجوی هوشمند با منابع واقعی و مدل‌های مختلف",
      description: "## اکانت Perplexity Pro\n\nPerplexity Pro موتور جستجوی هوش مصنوعی با دسترسی به GPT-4، Claude و Gemini در یک پلتفرم.",
      features: ["جستجوی نامحدود Pro", "انتخاب مدل (GPT-4/Claude/Gemini)", "آپلود فایل", "تحلیل تصویر"],
      price: 380000, discountPrice: 310000, duration: "۱ ماهه", category: "ai", brand: "Perplexity",
      tags: "Search", stock: 5, rating: 4.7, reviewCount: 56, salesCount: 280,
    },
    {
      title: "اکانت Grammarly Premium — ۱ ماهه", slug: "grammarly-premium-1-month",
      shortDesc: "اصلاح گرامر، لحن و سرقت ادبی متن‌های انگلیسی",
      description: "## اکانت Grammarly Premium\n\nابزار حرفه‌ای اصلاح متن انگلیسی با تشخیص گرامر، لحن، وضوح و سرقت ادبی.",
      features: ["اصلاح پیشرفته گرامر", "تنظیم لحن متن", "بررسی سرقت ادبی", "پیشنهادات واژگان"],
      price: 290000, discountPrice: 230000, duration: "۱ ماهه", category: "ai", brand: "Grammarly",
      tags: "PenTool", stock: 7, rating: 4.7, reviewCount: 74, salesCount: 310,
    },
    {
      title: "اکانت Leonardo AI — ۱ ماهه", slug: "leonardo-ai-1-month",
      shortDesc: "تولید تصویر با مدل‌های متنوع و کنترل دقیق",
      description: "## اکانت Leonardo AI\n\nپلتفرم تولید تصویر با هوش مصنوعی با مدل‌های متنوع و کنترل دقیق روی خروجی.",
      features: ["۸۵۰۰ توکن روزانه", "دسترسی به مدل‌های متنوع", "Image Guidance", "اولویت رندر"],
      price: 340000, discountPrice: 280000, duration: "۱ ماهه", category: "ai", brand: "Leonardo",
      tags: "Image", stock: 4, rating: 4.6, reviewCount: 41, salesCount: 190,
    },

    // ---- Software ----
    {
      title: "لایسنس CapCut Pro — ۱ ساله", slug: "capcut-pro-1-year",
      shortDesc: "ویرایش حرفه‌ای ویدیو با افکت‌ها و قالب‌های ویژه",
      description: "## لایسنس CapCut Pro\n\nCapCut Pro نسخه کامل اپلیکیشن محبوب ادیت ویدیو با افکت‌های حرفه‌ای، قالب‌های آماده و بدون واترمارک.",
      features: ["بدون واترمارک", "افکت‌ها و قالب‌های ویژه", "حذف پس‌زمینه هوشمند", "ترجمه خودکار زیرنویس", "۱ سال اشتراک"],
      price: 920000, discountPrice: 650000, duration: "۱۲ ماهه", category: "software", brand: "ByteDance",
      tags: "Video", featured: true, bestseller: true, stock: 10, rating: 4.9, reviewCount: 410, salesCount: 2200,
    },
    {
      title: "لایسنس Adobe Photoshop ۲۰۲۴", slug: "adobe-photoshop-2024",
      shortDesc: "حرفه‌ای‌ترین نرم‌افزار ویرایش عکس، نسخه کامل",
      description: "## لایسنس Adobe Photoshop\n\nPhotoshop استاندارد صنعت در ویرایش و روتوش تصاویر با ابزارهای هوش مصنوعی.",
      features: ["تمام ابزارهای حرفه‌ای", "قابلیت‌های Generative AI", "پشتیبانی از فایل‌های RAW", "به‌روزرسانی رایگان"],
      price: 1450000, discountPrice: 1180000, duration: "مادام‌العمر", category: "software", brand: "Adobe",
      tags: "Image", featured: true, stock: 6, rating: 4.9, reviewCount: 180, salesCount: 760,
    },
    {
      title: "لایسنس Adobe Premiere Pro ۲۰۲۴", slug: "adobe-premiere-pro-2024",
      shortDesc: "ویرایش حرفه‌ای ویدیو برای سینما و وب",
      description: "## لایسنس Adobe Premiere Pro\n\nنرم‌افزار تدوین ویدیوی حرفه‌ای با ابزارهای پیشرفته.",
      features: ["تدوین چند دوربینه", "پشتیبانی از فرمت‌های متنوع", "افکت‌های حرفه‌ای", "هماهنگی با After Effects"],
      price: 1650000, discountPrice: 1350000, duration: "مادام‌العمر", category: "software", brand: "Adobe",
      tags: "Video", stock: 5, rating: 4.8, reviewCount: 96, salesCount: 410,
    },
    {
      title: "لایسنس Microsoft Office 365 — ۵ دستگاه", slug: "office-365-5-devices",
      shortDesc: "Word، Excel، PowerPoint و ۱ ترابایت OneDrive",
      description: "## لایسنس Microsoft Office 365\n\nپکیج کامل آفیس مایکروسافت با ۱ ترابایت فضای ابری.",
      features: ["Word, Excel, PowerPoint", "۱ ترابایت OneDrive", "نصب روی ۵ دستگاه", "به‌روزرسانی رایگان"],
      price: 890000, discountPrice: 720000, duration: "مادام‌العمر", category: "software", brand: "Microsoft",
      tags: "FileText", featured: true, bestseller: true, stock: 12, rating: 4.9, reviewCount: 540, salesCount: 3100,
    },
    {
      title: "لایسنس Windows 11 Pro — اوریجینال", slug: "windows-11-pro",
      shortDesc: "ویندوز ۱۱ پرو اوریجینال با فعال‌سازی دائمی",
      description: "## لایسنس Windows 11 Pro\n\nویندوز ۱۱ پرو با فعال‌سازی دائمی و تمام قابلیت‌ها.",
      features: ["فعال‌سازی دائمی", "تمام قابلیت‌های Pro", "قابل اعتماد مایکروسافت", "پشتیبانی از BitLocker"],
      price: 680000, discountPrice: 540000, duration: "مادام‌العمر", category: "software", brand: "Microsoft",
      tags: "Monitor", stock: 15, rating: 4.8, reviewCount: 230, salesCount: 1450,
    },
    {
      title: "لایسنس IDM — Internet Download Manager", slug: "idm-lifetime",
      shortDesc: "افزایش سرعت دانلود تا ۵ برابر، مادام‌العمر",
      description: "## لایسنس IDM\n\nInternet Download Manager بهترین ابزار مدیریت دانلود با افزایش سرعت تا ۵ برابر.",
      features: ["افزایش سرعت تا ۵ برابر", "پشتیبانی از تمام مرورگرها", "دانلود دسته‌ای", "لایسنس مادام‌العمر"],
      price: 180000, discountPrice: 120000, duration: "مادام‌العمر", category: "software", brand: "Tonec",
      tags: "Download", bestseller: true, stock: 20, rating: 4.9, reviewCount: 680, salesCount: 4200,
    },

    // ---- Streaming ----
    {
      title: "اکانت Spotify Premium — ۱ ماهه", slug: "spotify-premium-1-month",
      shortDesc: "موسیقی بدون تبلیغ، دانلود آفلاین و کیفیت بالا",
      description: "## اکانت Spotify Premium\n\nاز میلیون‌ها آهنگ بدون تبلیغ و با کیفیت بالا لذت ببرید.",
      features: ["بدون تبلیغ", "دانلود آفلاین", "کیفیت بالا", "Skip نامحدود"],
      price: 145000, discountPrice: 95000, duration: "۱ ماهه", category: "streaming", brand: "Spotify",
      tags: "Music", featured: true, bestseller: true, stock: 14, rating: 4.9, reviewCount: 890, salesCount: 5400,
    },
    {
      title: "اکانت Spotify Premium — ۱۲ ماهه", slug: "spotify-premium-12-months",
      shortDesc: "یک سال موسیقی پریمیوم با صرفه‌جویی ۴۰٪",
      description: "## اکانت Spotify Premium ۱۲ ماهه\n\nیک سال کامل موسیقی پریمیوم با بهترین قیمت.",
      features: ["بدون تبلیغ", "دانلود آفلاین", "صرفه‌جویی ۴۰٪", "کیفیت بالا"],
      price: 1450000, discountPrice: 890000, duration: "۱۲ ماهه", category: "streaming", brand: "Spotify",
      tags: "Music", featured: true, stock: 9, rating: 4.9, reviewCount: 340, salesCount: 1900,
    },
    {
      title: "اکانت YouTube Premium — ۱ ماهه", slug: "youtube-premium-1-month",
      shortDesc: "ویدیو بدون تبلیغ، پس‌زمینه و YouTube Music",
      description: "## اکانت YouTube Premium\n\nویدیوهای یوتیوب بدون تبلیغ، پخش در پس‌زمینه و دسترسی به YouTube Music.",
      features: ["بدون تبلیغ", "پخش پس‌زمینه", "YouTube Music رایگان", "دانلود آفلاین"],
      price: 165000, discountPrice: 125000, duration: "۱ ماهه", category: "streaming", brand: "Google",
      tags: "Play", featured: true, stock: 11, rating: 4.8, reviewCount: 260, salesCount: 1300,
    },
    {
      title: "اکانت Netflix Premium — ۱ ماهه", slug: "netflix-premium-1-month",
      shortDesc: "فیلم و سریال با کیفیت ۴K روی ۴ دستگاه",
      description: "## اکانت Netflix Premium\n\nدسترسی به دنیای فیلم و سریال با کیفیت 4K Ultra HD.",
      features: ["کیفیت 4K Ultra HD", "۴ دستگاه همزمان", "دانلود روی ۶ دستگاه", "تمام محتوا"],
      price: 240000, discountPrice: 185000, duration: "۱ ماهه", category: "streaming", brand: "Netflix",
      tags: "Play", bestseller: true, stock: 8, rating: 4.7, reviewCount: 410, salesCount: 2100,
    },

    // ---- Security ----
    {
      title: "لایسنس NordVPN — ۱ ساله", slug: "nordvpn-1-year",
      shortDesc: "VPN امن و سریع با ۵۰۰۰+ سرور در ۶۰ کشور",
      description: "## لایسنس NordVPN\n\nیکی از امن‌ترین و سریع‌ترین VPN‌های جهان با بیش از ۵۰۰۰ سرور.",
      features: ["۵۰۰۰+ سرور", "۶ دستگاه همزمان", "Kill Switch", "بدون لاگ", "سرعت بالا"],
      price: 980000, discountPrice: 690000, duration: "۱۲ ماهه", category: "security", brand: "Nord",
      tags: "ShieldCheck", featured: true, bestseller: true, stock: 13, rating: 4.8, reviewCount: 520, salesCount: 2800,
    },
    {
      title: "لایسنس Kaspersky Total Security — ۱ ساله", slug: "kaspersky-1-year",
      shortDesc: "محافظت کامل آنتی‌ویروس برای ۳ دستگاه",
      description: "## لایسنس Kaspersky Total Security\n\nمحافظت کامل ضد ویروس، باج‌افزار و تهدیدات آنلاین.",
      features: ["ضد ویروس و باج‌افزار", "فایروال قوی", "محافظت از پرداخت", "کنترل والدین", "۳ دستگاه"],
      price: 540000, discountPrice: 410000, duration: "۱۲ ماهه", category: "security", brand: "Kaspersky",
      tags: "ShieldCheck", stock: 9, rating: 4.7, reviewCount: 180, salesCount: 760,
    },
    {
      title: "لایسنس Malwarebytes Premium — ۱ ساله", slug: "malwarebytes-1-year",
      shortDesc: "حذف باج‌افزار و تهدیدات پیشرفته",
      description: "## لایسنس Malwarebytes Premium\n\nتخصصی در حذف باج‌افزار و تهدیداتی که آنتی‌ویروس‌های معمولی نمی‌بینند.",
      features: ["حذف باج‌افزار", "محافظت بلادرنگ", "محافظت از وب", "۱ دستگاه"],
      price: 420000, discountPrice: 320000, duration: "۱۲ ماهه", category: "security", brand: "Malwarebytes",
      tags: "ShieldAlert", stock: 7, rating: 4.6, reviewCount: 95, salesCount: 380,
    },

    // ---- Gaming ----
    {
      title: "گیفت کارت Steam — ۱۰ دلار", slug: "steam-gift-card-10",
      shortDesc: "شارژ کیف پول استیم برای خرید بازی",
      description: "## گیفت کارت Steam\n\nکیف پول استیم خود را شارژ کنید و بازی بخرید.",
      features: ["کد آنی", "معتبر برای تمام مناطق", "بدون انقضا", "تحویل فوری"],
      price: 620000, discountPrice: 560000, duration: "گیفت کارت", category: "gaming", brand: "Steam",
      tags: "Gamepad2", featured: true, stock: 18, rating: 4.9, reviewCount: 340, salesCount: 1900,
    },
    {
      title: "اکانت PlayStation Plus Essential — ۱۲ ماهه", slug: "ps-plus-essential-12",
      shortDesc: "بازی آنلاین + ۳ بازی رایگان ماهانه",
      description: "## اکانت PlayStation Plus\n\nاشتراک آنلاین پلی‌استیشن با بازی‌های رایگان ماهانه.",
      features: ["بازی آنلاین", "۳ بازی رایگان ماهانه", "تخفیف‌های اختصاصی", "۱۰ گیگ فضای ابری"],
      price: 1180000, discountPrice: 940000, duration: "۱۲ ماهه", category: "gaming", brand: "Sony",
      tags: "Gamepad2", stock: 6, rating: 4.8, reviewCount: 140, salesCount: 580,
    },
    {
      title: "اکانت Xbox Game Pass Ultimate — ۱ ماهه", slug: "xbox-game-pass-1-month",
      shortDesc: "دسترسی به ۱۰۰+ بازی روی کنسول و PC",
      description: "## اکانت Xbox Game Pass Ultimate\n\nکتابخانه‌ای از بیش از ۱۰۰ بازی باکیفیت.",
      features: ["۱۰۰+ بازی", "EA Play رایگان", "بازی آنلاین", "Cloud Gaming"],
      price: 320000, discountPrice: 260000, duration: "۱ ماهه", category: "gaming", brand: "Microsoft",
      tags: "Gamepad2", stock: 8, rating: 4.8, reviewCount: 210, salesCount: 980,
    },

    // ---- Design ----
    {
      title: "اکانت Canva Pro — ۱ ماهه", slug: "canva-pro-1-month",
      shortDesc: "طراحی حرفه‌ای با هزاران قالب و المان",
      description: "## اکانت Canva Pro\n\nپلتفرم طراحی آنلاین با قابلیت‌های حرفه‌ای و هزاران قالب.",
      features: ["صدها هزار قالب", "المان‌های پریمیوم", "حذف پس‌زمینه", "برند کیت", "تیم نامحدود"],
      price: 195000, discountPrice: 145000, duration: "۱ ماهه", category: "design", brand: "Canva",
      tags: "PenTool", featured: true, bestseller: true, stock: 16, rating: 4.9, reviewCount: 620, salesCount: 3400,
    },
    {
      title: "لایسنس Wondershare Filmora — ۱ ساله", slug: "filmora-1-year",
      shortDesc: "ادیت آسان ویدیو با افکت‌های حرفه‌ای",
      description: "## لایسنس Filmora\n\nنرم‌افزار کاربرپسند ادیت ویدیو با افکت‌های آماده.",
      features: ["افکت‌های حرفه‌ای", "ویرایش آسان", "پشتیبانی از ۴K", "ابزارهای AI"],
      price: 680000, discountPrice: 520000, duration: "۱۲ ماهه", category: "design", brand: "Wondershare",
      tags: "Video", stock: 7, rating: 4.6, reviewCount: 130, salesCount: 540,
    },
    {
      title: "لایسنس Camtasia — مادام‌العمر", slug: "camtasia-lifetime",
      shortDesc: "ضبط و ادیت اسکرین‌کست حرفه‌ای",
      description: "## لایسنس Camtasia\n\nبهترین ابزار ضبط صفحه و ساخت ویدیوی آموزشی.",
      features: ["ضبط صفحه و وب‌کم", "ادیت حرفه‌ای", "افکت‌ها و انیمیشن", "لایسنس دائمی"],
      price: 980000, discountPrice: 780000, duration: "مادام‌العمر", category: "design", brand: "TechSmith",
      tags: "Video", stock: 5, rating: 4.7, reviewCount: 84, salesCount: 320,
    },
    {
      title: "اکانت Figma Professional — ۱ ماهه", slug: "figma-professional-1-month",
      shortDesc: "طراحی رابط کاربری تیمی با فایل‌های نامحدود",
      description: "## اکانت Figma Professional\n\nپلتفرم طراحی رابط کاربری با همکاری تیمی.",
      features: ["فایل‌های نامحدود", "تاریخچه نسخه‌ها", "همکاری تیمی", "پلاگین‌ها"],
      price: 380000, discountPrice: 310000, duration: "۱ ماهه", category: "design", brand: "Figma",
      tags: "PenTool", stock: 6, rating: 4.8, reviewCount: 92, salesCount: 410,
    },
  ];

  for (const p of products) {
    const created = await db.product.create({
      data: {
        title: p.title, slug: p.slug, shortDesc: p.shortDesc, description: p.description,
        features: JSON.stringify(p.features), price: p.price, discountPrice: p.discountPrice || null,
        duration: p.duration || null, category: p.category, brand: p.brand, tags: p.tags,
        featured: !!p.featured, bestseller: !!p.bestseller, stock: p.stock,
        rating: p.rating, reviewCount: p.reviewCount, salesCount: p.salesCount, isActive: true,
        specifications: JSON.stringify({ brand: p.brand, duration: p.duration }),
      },
    });

    // license keys inventory
    const keyCount = Math.max(3, Math.min(p.stock, 6));
    for (let i = 0; i < keyCount; i++) {
      await db.licenseKey.create({
        data: {
          productId: created.id,
          key: genKey(p.brand),
          note: `ایمیل: ${randEmail()}`,
          status: "AVAILABLE",
          source: "manual",
        },
      });
    }
  }
  console.log(`✅ ${products.length} products + license keys created`);

  // ---------------- Reviews ----------------
  const sampleReviews = [
    { authorName: "علی محمدی", rating: 5, comment: "عالی و سریع، دقیقاً همون لحظه تحویل دادن." },
    { authorName: "سارا کریمی", rating: 5, comment: "قیمتش از همه‌جا بهتر بود، ممنون." },
    { authorName: "محمد حسینی", rating: 4, comment: "خوب بود ولی راهنما می‌تونست کامل‌تر باشه." },
    { authorName: "نگار احمدی", rating: 5, comment: "پشتیبانی فوق‌العاده، مشکل رو سریع حل کردن." },
    { authorName: "رضا نوری", rating: 5, comment: "سومین خریدمه، همیشه راضی‌ام." },
  ];
  const allProducts = await db.product.findMany();
  for (const p of allProducts) {
    const n = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < n; i++) {
      const r = sampleReviews[(p.title.length + i) % sampleReviews.length];
      await db.review.create({
        data: { productId: p.id, authorName: r.authorName, rating: r.rating, comment: r.comment, verified: true, approved: true },
      });
    }
  }
  console.log("✅ Reviews created");

  // ---------------- Articles ----------------
  for (const a of ARTICLES) {
    await db.article.create({
      data: {
        title: a.title, slug: a.slug, excerpt: a.excerpt, content: a.content,
        category: a.category, cover: null, readingMinutes: a.readingMinutes,
        published: true, featured: !!a.featured, tags: a.tags,
        seoTitle: a.seoTitle, seoDescription: a.seoDescription,
      },
    });
  }
  console.log(`✅ ${ARTICLES.length} articles created`);

  // ---------------- Discount codes ----------------
  await db.discountCode.create({ data: { code: "WELCOME10", type: "PERCENT", value: 10, maxUses: 0, isActive: true } });
  await db.discountCode.create({ data: { code: "OFF20", type: "PERCENT", value: 20, maxUses: 100, isActive: true } });
  console.log("✅ Discount codes created");

  console.log("\n🎉 Seed complete!");
  console.log("Admin login: admin@licenseland.ir / admin12345");
}

function genKey(brand: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const seg = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${brand.slice(0, 3).toUpperCase()}-${seg(5)}-${seg(5)}-${seg(4)}`;
}
function randEmail(): string {
  const names = ["user", "test", "mail", "info", "acc"];
  return `${names[Math.floor(Math.random() * names.length)]}${Math.floor(Math.random() * 9999)}@gmail.com`;
}

// ---------------- Articles content ----------------  (2 full articles + 4 stubs for the blog subagent to enrich)
const ARTICLES = [
  {
    title: "راهنمای کامل خرید لایسنس اوریجینال در سال ۲۰۲۴",
    slug: "buy-original-license-guide-2024",
    excerpt: "هر آنچه باید قبل از خرید لایسنس نرم‌افزار و هوش مصنوعی بدانید؛ از تفاوت اوریجینال و کرک تا نکات امنیتی.",
    category: "راهنمای خرید",
    tags: "لایسنس,خرید,راهنما",
    readingMinutes: 8,
    featured: true,
    seoTitle: "راهنمای کامل خرید لایسنس اوریجینال نرم‌افزار ۲۰۲۴ | لیسانس‌لَند",
    seoDescription: "راهنمای جامع خرید لایسنس اوریجینال: تفاوت لایسنس و کرک، نکات امنیتی، و بهترین روش خرید مطمئن.",
    content: `## چرا باید لایسنس اوریجینال بخریم؟

در دنیای امروز، نرم‌افزارها و ابزارهای هوش مصنوعی بخش جدایی‌ناپذیری از کار و زندگی ما شده‌اند. اما بسیاری از کاربران هنوز از نسخه‌های کرک‌شده استفاده می‌کنند که خطرات جدی به همراه دارد.

### خطرات استفاده از نسخه‌های کرک‌شده

- **آلوده به بدافزار:** بیش از ۶۰٪ نرم‌افزارهای کرک‌شده حاوی تروجان یا باج‌افزار هستند.
- **عدم به‌روزرسانی:** نسخه‌های کرک‌شده از آپدیت‌های امنیتی محروم می‌مانند.
- **ناپایداری:** کرک‌ها ممکن است باعث از کار افتادن نرم‌افزار یا سیستم شوند.
- **مشکلات قانونی:** استفاده از نرم‌افزار کرک‌شده نقض کپی‌رایت است.

### مزایای لایسنس اوریجینال

با خرید لایسنس اوریجینال، علاوه بر خیال راحت، از مزایای زیر بهره‌مند می‌شوید:

1. **دریافت به‌روزرسانی‌های منظم** و امن
2. **پشتیبانی رسمی** سازنده نرم‌افزار
3. **دسترسی به تمام قابلیت‌ها** بدون محدودیت
4. **امنیت داده‌ها** و حفاظت از حریم خصوصی

### چگونه لایسنس مطمئن بخریم؟

برای خرید مطمئن لایسنس به این نکات توجه کنید:

- از فروشگاه‌های معتبر با سابقه خرید کنید
- ضمانت اصالت و بازگشت وجه را بررسی کنید
- از پشتیبانی پس از فروش اطمینان حاصل کنید
- پرداخت را از طریق درگاه‌های معتبر انجام دهید

در **لیسانس‌لَند** تمامی این موارد رعایت می‌شود تا شما با اطمینان کامل خرید کنید.`,
  },
  {
    title: "ChatGPT Plus چیست و آیا ارزش خرید دارد؟",
    slug: "what-is-chatgpt-plus-worth-it",
    excerpt: "بررسی کامل ویژگی‌ها، مزایا و معایب اشتراک پریمیوم ChatGPT و مقایسه آن با نسخه رایگان.",
    category: "هوش مصنوعی",
    tags: "ChatGPT,AI,OpenAI",
    readingMinutes: 7,
    featured: true,
    seoTitle: "ChatGPT Plus چیست؟ بررسی کامل + آیا ارزش خرید دارد؟ | لیسانس‌لَند",
    seoDescription: "بررسی کامل اشتراک ChatGPT Plus: ویژگی‌ها، تفاوت با نسخه رایگان، قیمت و اینکه آیا ارزش خرید دارد.",
    content: `## معرفی ChatGPT Plus

ChatGPT Plus نسخه پریمیوم چت‌بات محبوب OpenAI است که با ماهانه ۲۰ دلار عرضه می‌شود. اما آیا واقعاً ارزش این مبلغ را دارد؟

### ویژگی‌های اصلی ChatGPT Plus

- **دسترسی به GPT-4o:** پیشرفته‌ترین مدل زبانی OpenAI
- **تولید تصویر با DALL-E 3:** ساخت تصاویر با کیفیتی خیره‌کننده
- **تحلیل فایل و تصویر:** آپلود و بررسی اسناد و تصاویر
- **اولویت در زمان اوج:** دسترسی سریع‌تر در ساعات شلوغی
- **GPTs سفارشی:** استفاده و ساخت دستیارهای هوشمند

### تفاوت با نسخه رایگان

| ویژگی | رایگان | Plus |
|---|---|---|
| مدل | GPT-3.5/4o محدود | GPT-4o کامل |
| تولید تصویر | محدود | نامحدود |
| آپلود فایل | محدود | کامل |
| سرعت | معمولی | سریع |

### آیا ارزش دارد؟

اگر روزانه از ChatGPT استفاده می‌کنید، محتوای تولید می‌کنید یا برنامه‌نویس هستید، **بدون شک بله**. اشتراک Plus سرعت و کیفیت کار شما را به شکل چشمگیری افزایش می‌دهد.

### خرید ChatGPT Plus در ایران

به دلیل تحریم‌ها، خرید مستقیم از ایران ممکن نیست. اما از طریق **لیسانس‌لَند** می‌توانید اکانت پریمیوم ChatGPT را با بهترین قیمت و تحویل آنی دریافت کنید.`,
  },
  {
    title: "بهترین ابزارهای هوش مصنوعی برای تولید محتوا در ۲۰۲۴",
    slug: "best-ai-content-tools-2024",
    excerpt: "معرفی و مقایسه بهترین ابزارهای AI برای تولید متن، تصویر و ویدیو که هر تولیدکننده محتوایی باید بشناسد.",
    category: "هوش مصنوعی",
    tags: "AI,تولید محتوا,ابزار",
    readingMinutes: 6,
    featured: false,
    seoTitle: "بهترین ابزارهای هوش مصنوعی تولید محتوا ۲۰۲۴ | لیسانس‌لَند",
    seoDescription: "معرفی بهترین ابزارهای AI برای تولید متن، تصویر و ویدیو در سال ۲۰۲۴.",
    content: `## معرفی بهترین ابزارهای هوش مصنوعی

در سال ۲۰۲۴، ابزارهای هوش مصنوعی به ابزار اصلی تولیدکنندگان محتوا تبدیل شده‌اند. در این مقاله بهترین‌ها را معرفی می‌کنیم.

### تولید متن

- **ChatGPT Plus:** همه‌کاره‌ترین گزینه برای متن، کد و تحلیل
- **Claude Pro:** بهترین برای متن‌های طولانی و تحلیلی
- **Grammarly:** برای اصلاح و بهبود متن انگلیسی

### تولید تصویر

- **Midjourney:** کیفیت هنری بی‌نظیر
- **Leonardo AI:** کنترل دقیق و مدل‌های متنوع
- **DALL-E 3:** یکپارچه با ChatGPT

### ویرایش ویدیو

- **CapCut Pro:** محبوب‌ترین برای شبکه‌های اجتماعی
- **Filmora:** کاربرپسند با افکت‌های آماده

### نتیجه‌گیری

ترکیب این ابزارها می‌تواند بهره‌وری شما را تا ۱۰ برابر افزایش دهد. تمامی این ابزارها با بهترین قیمت در **لیسانس‌لَند** موجود هستند.`,
  },
  {
    title: "VPN امن چیست و چگونه انتخاب کنیم؟",
    slug: "secure-vpn-selection-guide",
    excerpt: "راهنمای انتخاب VPN امن و سریع؛ معیارهای مهم و مقایسه بهترین گزینه‌های بازار.",
    category: "امنیت",
    tags: "VPN,امنیت,حریم خصوصی",
    readingMinutes: 5,
    featured: false,
    seoTitle: "راهنمای انتخاب VPN امن و سریع | لیسانس‌لَند",
    seoDescription: "چگونه VPN امن انتخاب کنیم؟ معیارهای مهم و معرفی بهترین VPN‌ها.",
    content: `## چرا به VPN نیاز داریم؟

VPN (شبکه خصوصی مجازی) ارتباط اینترنتی شما را رمزنگاری کرده و حریم خصوصی‌تان را حفظ می‌کند.

### معیارهای انتخاب VPN

1. **سیاست No-Logs:** عدم ثبت فعالیت کاربران
2. **تعداد و موقعیت سرورها:** هرچه بیشتر، بهتر
3. **سرعت:** مهم برای استریم و دانلود
4. **پروتکل‌های امنیتی:** WireGuard، OpenVPN
5. **تعداد دستگاه‌های مجاز**

### بهترین VPN‌های ۲۰۲۴

- **NordVPN:** بهترین ترکیب امنیت و سرعت
- **ExpressVPN:** سرعت بالا و ساده
- **Surfshark:** دستگاه‌های نامحدود

در **لیسانس‌لَند**، لایسنس NordVPN را با بهترین قیمت و تحویل آنی دریافت کنید.`,
  },
  {
    title: "Spotify Premium بهتر است یا YouTube Music؟",
    slug: "spotify-vs-youtube-music",
    excerpt: "مقایسه کامل دو سرویس محبوب موسیقی از نظر کیفیت، کتابخانه آهنگ و قیمت.",
    category: "مقایسه",
    tags: "Spotify,YouTube,موسیقی",
    readingMinutes: 5,
    featured: false,
    seoTitle: "Spotify Premium یا YouTube Music؟ مقایسه کامل | لیسانس‌لَند",
    seoDescription: "مقایسه Spotify و YouTube Music: کیفیت صدا، کتابخانه، قیمت و مزایا.",
    content: `## معرفی

Spotify و YouTube Music دو غول سرویس‌های موسیقی هستند. کدام برای شما بهتر است؟

### Spotify Premium

- کتابخانه عظیم آهنگ و پادکست
- الگوریتم پیشنهاد فوق‌العاده
- Spotify Connect برای پخش روی دستگاه‌های مختلف
- کیفیت صدا تا ۳۲۰ kbps

### YouTube Music

- دسترسی به remix و نسخه‌های زنده
- یکپارچه با اکوسیستم YouTube
- ویدیوهای موسیقی
- کیفیت صدا بالا

### نتیجه

اگر پادکست و کشف موسیقی جدید برایتان مهم است، **Spotify**. اگر ویدیو و تنوع بیشتر می‌خواهید، **YouTube Music**.`,
  },
  {
    title: "چگونه با Adobe Photoshop حرفه‌ای شویم؟",
    slug: "learn-adobe-photoshop-professionally",
    excerpt: "نقشه راه یادگیری فتوشاپ از صفر تا حرفه‌ای، با منابع و نکات کاربردی.",
    category: "آموزش",
    tags: "Photoshop,Adobe,طراحی",
    readingMinutes: 6,
    featured: false,
    seoTitle: "آموزش فتوشاپ از صفر تا حرفه‌ای | لیسانس‌لَند",
    seoDescription: "نقشه راه کامل یادگیری Adobe Photoshop با منابع و نکات کاربردی.",
    content: `## شروع یادگیری فتوشاپ

Adobe Photoshop قدرتمندترین ابزار ویرایش تصویر است. یادگیری آن زمان می‌برد اما ارزشش را دارد.

### نقشه راه

1. **مفاهیم پایه:** لایه‌ها، ماسک‌ها، انتخاب
2. **ابزارهای اصلی:** برش، قلم‌مو، لایه تنظیم
3. **تکنیک‌های روتوش:** فرکانس جداسازی، داج و برن
4. **ترکیب‌بندی (Compositing):** ترکیب تصاویر
5. **قابلیت‌های AI:** Generative Fill

### منابع یادگیری

- آموزش‌های رسمی Adobe
- کانال‌های یوتیوب تخصصی
- تمرین روزانه با پروژه‌های واقعی

### نکته مهم

برای تمرین حرفه‌ای به لایسنس اوریجینال Photoshop نیاز دارید. در **لیسانس‌لَند** با بهترین قیمت دریافت کنید.`,
  },
];

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
