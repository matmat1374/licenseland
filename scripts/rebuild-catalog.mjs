import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const db = new PrismaClient();

const STANDARD_CATEGORIES = [
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

const DEFAULT_PRICING_TIERS = [
  { maxUsd: 2, markupPercent: 100 },
  { maxUsd: 5, markupPercent: 80 },
  { maxUsd: 8, markupPercent: 60 },
  { maxUsd: 10, markupPercent: 60 },
  { maxUsd: 20, markupPercent: 50 },
  { maxUsd: 60, markupPercent: 40 },
  { maxUsd: 70, markupPercent: 30 },
  { maxUsd: 100, markupPercent: 25 },
  { maxUsd: 200, markupPercent: 20 },
  { maxUsd: 500, markupPercent: 15 },
  { maxUsd: null, markupPercent: 10 },
];

function getTierMarkup(costUsd, tiers = DEFAULT_PRICING_TIERS) {
  const sorted = [...tiers].sort((a, b) => {
    const aVal = a.maxUsd === null || a.maxUsd === undefined || isNaN(a.maxUsd) ? Number.POSITIVE_INFINITY : a.maxUsd;
    const bVal = b.maxUsd === null || b.maxUsd === undefined || isNaN(b.maxUsd) ? Number.POSITIVE_INFINITY : b.maxUsd;
    return aVal - bVal;
  });
  for (const tier of sorted) {
    const max = tier.maxUsd === null || tier.maxUsd === undefined || isNaN(tier.maxUsd)
      ? Number.POSITIVE_INFINITY
      : tier.maxUsd;
    if (costUsd < max) return tier.markupPercent;
  }
  return sorted[sorted.length - 1]?.markupPercent ?? 10;
}

function calculateSellPrice(costUsd, usdtRate, customMarkupPercent, customTiers) {
  const safeCostUsd = Number(costUsd) || 0;
  const safeUsdtRate = Number(usdtRate) || 0;
  let effectiveMarkup = (customMarkupPercent !== null && customMarkupPercent !== undefined && !isNaN(customMarkupPercent) && customMarkupPercent >= 0)
    ? Number(customMarkupPercent)
    : getTierMarkup(safeCostUsd, customTiers);

  const costToman = Math.round(safeCostUsd * safeUsdtRate);
  if (safeCostUsd <= 0 || safeUsdtRate <= 0) {
    return { sellPriceToman: 0, markupPercent: effectiveMarkup, costToman };
  }
  const rawSellPrice = safeCostUsd * safeUsdtRate * (1 + effectiveMarkup / 100);
  const sellPriceToman = Math.ceil(rawSellPrice / 1000) * 1000;
  return { sellPriceToman, markupPercent: effectiveMarkup, costToman };
}

function isVpnProduct(text) {
  return /vpn|nordvpn|expressvpn|surfshark|hma|hidemyass|hide\s*my\s*ass|ipvanish|cyberghost|protonvpn|mullvad|windscribe|tunnelbear|purevpn|adguard\s*vpn|pia\s*vpn|v2ray|shadowsocks|wireguard|openvpn|outline|warp|psiphon|فیلترشکن|وی\s*پی\s*ان/i.test(text);
}

function slugifyFa(s) {
  return (s || "")
    .trim()
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function pickTitle(p) {
  let title = (p.title || p.name || "").toString().trim();
  if (/^(Openai|ChatGPT|Claude|Telegram|WhatsApp|Google|Apple|Discord)\s*—/i.test(title) && !title.includes("شماره مجازی")) {
    title = `شماره مجازی وریفای ${title} (دریافت پیامک)`;
  }
  return title;
}

function getProductRankingInfo(p, title, catSlug) {
  const t = (title || "").toLowerCase();
  const rawTitle = (p.title || p.name || "").toLowerCase();
  const comb = `${t} ${rawTitle}`;

  if (catSlug === "ai") {
    if (/chatgpt|gpt[- ]?plus|gpt[- ]?4/i.test(comb)) return { sortOrder: 1, bestseller: true, featured: true, salesCount: 480 };
    if (/claude/i.test(comb) && !/otp|virtual/i.test(comb)) return { sortOrder: 2, bestseller: true, featured: true, salesCount: 420 };
    if (/midjourney|میدجرنی/i.test(comb)) return { sortOrder: 3, bestseller: true, featured: true, salesCount: 390 };
    if (/perplexity|پرپلکسیتی/i.test(comb)) return { sortOrder: 4, bestseller: true, featured: true, salesCount: 310 };
    if (/runway|kling|luma/i.test(comb)) return { sortOrder: 5, bestseller: false, featured: true, salesCount: 260 };
    if (/gemini|جمینی|جمنای/i.test(comb)) return { sortOrder: 3, bestseller: true, featured: true, salesCount: 395 };
    if (/grok/i.test(comb)) return { sortOrder: 7, bestseller: false, featured: true, salesCount: 210 };
  }
  if (catSlug === "virtual-numbers") {
    if (/telegram|تلگرام/i.test(comb)) return { sortOrder: 1, bestseller: true, featured: true, salesCount: 520 };
    if (/openai|chatgpt/i.test(comb)) return { sortOrder: 2, bestseller: true, featured: true, salesCount: 490 };
    if (/claude/i.test(comb)) return { sortOrder: 3, bestseller: true, featured: true, salesCount: 360 };
    if (/whatsapp|apple|google/i.test(comb)) return { sortOrder: 4, bestseller: false, featured: true, salesCount: 280 };
  }
  if (catSlug === "dev-tools") {
    if (/cursor/i.test(comb)) return { sortOrder: 1, bestseller: true, featured: true, salesCount: 450 };
    if (/windsurf/i.test(comb)) return { sortOrder: 2, bestseller: true, featured: true, salesCount: 380 };
    if (/copilot/i.test(comb)) return { sortOrder: 3, bestseller: true, featured: true, salesCount: 340 };
    if (/api.*(openai|claude|codex)|token.*claude/i.test(comb)) return { sortOrder: 4, bestseller: true, featured: true, salesCount: 310 };
    if (/lovable|lovabe|supabase|railway/i.test(comb)) return { sortOrder: 5, bestseller: false, featured: true, salesCount: 230 };
  }
  if (catSlug === "design") {
    if (/canva|کنوا|کانوا/i.test(comb)) return { sortOrder: 1, bestseller: true, featured: true, salesCount: 510 };
    if (/adobe|creative cloud|photoshop|illustrator/i.test(comb)) return { sortOrder: 2, bestseller: true, featured: true, salesCount: 430 };
    if (/figma|فیگما/i.test(comb)) return { sortOrder: 3, bestseller: true, featured: true, salesCount: 350 };
    if (/capcut|کپ‌کات/i.test(comb)) return { sortOrder: 4, bestseller: true, featured: true, salesCount: 320 };
    if (/freepik|envato/i.test(comb)) return { sortOrder: 5, bestseller: false, featured: true, salesCount: 240 };
  }
  if (catSlug === "streaming") {
    if (/spotify|اسپاتیفای/i.test(comb)) return { sortOrder: 1, bestseller: true, featured: true, salesCount: 540 };
    if (/netflix|نتفلیکس/i.test(comb)) return { sortOrder: 2, bestseller: true, featured: true, salesCount: 510 };
    if (/youtube/i.test(comb)) return { sortOrder: 3, bestseller: true, featured: true, salesCount: 460 };
    if (/apple music|disney/i.test(comb)) return { sortOrder: 4, bestseller: false, featured: true, salesCount: 260 };
  }
  if (catSlug === "gaming") {
    if (/discord nitro|nitro/i.test(comb)) return { sortOrder: 1, bestseller: true, featured: true, salesCount: 490 };
    if (/playstation|psn/i.test(comb)) return { sortOrder: 2, bestseller: true, featured: true, salesCount: 380 };
    if (/google play/i.test(comb)) return { sortOrder: 3, bestseller: true, featured: true, salesCount: 340 };
    if (/pubg|\buc\b/i.test(comb)) return { sortOrder: 4, bestseller: true, featured: true, salesCount: 320 };
    if (/\bcp\b|call of duty/i.test(comb)) return { sortOrder: 5, bestseller: true, featured: true, salesCount: 290 };
  }
  if (catSlug === "productivity") {
    if (/office 365|ms365|آفیس/i.test(comb)) return { sortOrder: 1, bestseller: true, featured: true, salesCount: 460 };
    if (/grammarly|گرامرلی/i.test(comb)) return { sortOrder: 2, bestseller: true, featured: true, salesCount: 380 };
    if (/notion|نوشن/i.test(comb)) return { sortOrder: 3, bestseller: true, featured: true, salesCount: 320 };
    if (/windows|ویندوز/i.test(comb)) return { sortOrder: 4, bestseller: true, featured: true, salesCount: 300 };
    if (/duolingo|tradingview/i.test(comb)) return { sortOrder: 5, bestseller: false, featured: true, salesCount: 250 };
  }
  if (catSlug === "social") {
    if (/stars|استارز/i.test(comb)) return { sortOrder: 1, bestseller: true, featured: true, salesCount: 530 };
    if (/telegram premium|پریمیوم تلگرام/i.test(comb)) return { sortOrder: 2, bestseller: true, featured: true, salesCount: 480 };
    if (/twitter|x premium/i.test(comb)) return { sortOrder: 3, bestseller: true, featured: true, salesCount: 310 };
  }
  return { sortOrder: 50, bestseller: false, featured: false, salesCount: 15 };
}

function categorizeProduct(p) {
  const name = pickTitle(p);
  const n = (name || "").toLowerCase();
  const priceUsd = Number(p.price_usd ?? p.retail_usd ?? p.price ?? 0);
  const spCat = (p.category || "").toLowerCase().trim();

  let slug = "";
  const countryRegex = /\b(germany|usa?|uk|england|netherlands|russia|afghanistan|india|indonesia|brazil|turkey|malaysia|vietnam|philippines|thailand|mexico|canada|argentina|colombia|nigeria|egypt|south africa|pakistan|bangladesh|china|japan|korea|australia|spain|italy|poland|ukraine|romania|kazakhstan|uzbekistan|morocco|algeria|kenya|estonia|sweden|norway|finland|denmark|austria|switzerland|belgium|portugal|greece|czech|ireland|singapore|hong kong|taiwan|israel|chile|peru|venezuela|cambodia|laos|myanmar)\b/i;
  const hasEmDash = /—/u.test(name);
  const hasFlag = /[\uD83C][\uDDE6-\uDDFF]/u.test(name);
  const isGiftCardOrGame = /psn|playstation|itunes|google play|nintendo|steam|xbox|cp \(in\)|pubg|discord/i.test(n);

  // 1. MUST BE FIRST: Virtual Numbers
  if (spCat === "otp numbers") {
    slug = "virtual-numbers";
  } else if (/virtual number|شماره مجازی|\botp\b|phone number|sms activate|sms-activate|temp phone|دریافت پیامک|تایید پیامکی/i.test(n)) {
    slug = "virtual-numbers";
  } else if (!isGiftCardOrGame && (hasEmDash || hasFlag) && countryRegex.test(name)) {
    slug = "virtual-numbers";
  } else if (!isGiftCardOrGame && priceUsd > 0 && priceUsd < 0.6 && countryRegex.test(name) && (hasEmDash || hasFlag || name.includes("-"))) {
    slug = "virtual-numbers";
  }

  // 2. Dev Tools & API Credits
  if (!slug) {
    if (spCat === "apis & dev tools") slug = "dev-tools";
    else if (/\b(cursor|windsurf|github copilot|copilot pro|codex|api|token|tokens|credit|credits|توکن|کردیت|ردیم کد|ردیم|supabase|railway|lovable|lovabe|replit|v0\.dev|postman)\b/i.test(n)) {
      if (!/canva|figma|adobe|spotify|netflix|disney|psn|playstation|xbox|nitro|office 365|ms365/i.test(n)) {
        slug = "dev-tools";
      }
    }
  }

  // 3. Gaming & Gift Cards
  if (!slug) {
    if (["nitro", "psn (us)", "play - us", "uc (global)", "cp (in)"].includes(spCat)) slug = "gaming";
    else if (/discord nitro|\bnitro\b|playstation|\bpsn\b|google play|pubg|\buc\b|\bcp\b|xbox|game pass|steam|epic games|battlenet|blizzard|riot|valorant|minecraft|nintendo/i.test(n)) {
      slug = "gaming";
    }
  }

  // 4. Streaming & Entertainment
  if (!slug) {
    if (spCat === "streaming") slug = "streaming";
    else if (/netflix|نتفلیکس|spotify|اسپاتیفای|youtube premium|youtube music|یوتیوب|disney|دیزنی|apple music|apple tv|hbo|paramount|crunchyroll|deezer|tidal|vieon|soundcloud/i.test(n)) {
      slug = "streaming";
    }
  }

  // 5. Design & Graphics
  if (!slug) {
    if (spCat === "design tools") slug = "design";
    else if (/canva|کنوا|کانوا|adobe|ادوبی|photoshop|illustrator|premiere|after effects|creative cloud|lightroom|figma|فیگما|freepik|فری پیک|envato|انواتو|capcut|کپ‌کات|autodesk|autocad|3ds max|corel|sketch|invision|framer|miro|dzine/i.test(n)) {
      slug = "design";
    }
  }

  // 6. Social
  if (!slug) {
    if (["stars", "boost", "likes", "page likes", "comments", "commentes", "followers", "members", "reactions", "mention", "watch time", "bot start"].includes(spCat)) {
      slug = "social";
    } else if (/telegram stars|telegram premium|تلگرام|استارز|فالوور|ممبر|لایک|سوشال|توییتر|اینستاگرام|تیک تاک|tiktok|instagram|twitter|\bx premium\b|facebook|linkedin|snapchat|reddit|threads/i.test(n)) {
      slug = "social";
    }
  }

  // 7. AI & Language Models
  if (!slug) {
    if (spCat === "ai chatbots" || spCat === "ai video & image") slug = "ai";
    else if (/chatgpt|gpt plus|gpt-4|openai|claude|کلاود|کلود|anthropic|midjourney|میدجرنی|perplexity|پرپلکسیتی|runway|رانوی|kling|کلینگ|luma|لوما|veo|گوگل ویو|elevenlabs|الون لبز|heygen|هیجن|gemini|جمینی|grok|گروک|suno|سونو|udio|یودیو|pika|پیکا|leonardo|لئوناردو|dall-?e|sora|سورا|genspark|openart|pixverse|seedance|akool|beeble|gamma|higgfield|higgsfield|krea|manus|chatprd/i.test(n)) {
      slug = "ai";
    }
  }

  // 8. Productivity & Software (default)
  if (!slug) {
    slug = "productivity";
  }

  const ranking = getProductRankingInfo(p, name, slug);
  const meta = {
    ai: "هوش مصنوعی",
    "virtual-numbers": "شماره مجازی و OTP",
    "dev-tools": "ابزارهای توسعه و برنامه‌نویسی",
    design: "طراحی و گرافیک",
    streaming: "استریم و سرگرمی",
    gaming: "گیمینگ و گیفت‌کارت",
    productivity: "نرم‌افزار و بهره‌وری",
    social: "شبکه‌های اجتماعی",
  };

  return {
    slug,
    name: meta[slug] || slug,
    ...ranking,
  };
}

function localizeProduct(name, category, sp) {
  let shortDesc = (sp?.name || sp?.title || name).toString().trim();
  let t = (sp?.name || sp?.title || name).toString().trim();

  // Helper for Persian numbers
  const normalizePersianNumbers = (str) => {
    return str.replace(/0/g, '۰').replace(/1/g, '۱').replace(/2/g, '۲').replace(/3/g, '۳')
              .replace(/4/g, '۴').replace(/5/g, '۵').replace(/6/g, '۶').replace(/7/g, '۷')
              .replace(/8/g, '۸').replace(/9/g, '۹');
  };

  // Specific check: Product 364 (Gemini AI Pro 18 Month)
  if (sp?.id == 364 || (/gemini/i.test(t) && /18\s*month/i.test(t))) {
    const title = "Gemini AI Pro (۱۸ ماهه)";
    const description = `## Gemini AI Pro (۱۸ ماهه)\n\nاشتراک رسمی و قانونی Gemini AI Pro گوگل به همراه ۵ ترابایت فضای ابری Google One با فعال‌سازی آنی.\n\n### مشخصات و امکانات\n- **سرویس:** Google Gemini AI Pro + 5TB Cloud Storage\n- **مدت اشتراک:** ۱۸ ماهه\n- **تحویل:** فوری پس از پرداخت\n- فعال‌سازی مستقیم روی اکانت جیمیل شخصی بدون نیاز به کارت بانکی\n- دسترسی کامل به پیشرفته‌ترین مدل هوش مصنوعی گوگل (Gemini 1.5 Pro / Ultra)\n- ۵ ترابایت فضای ابری جهت استفاده در Google Drive، Photos و Gmail\n- گارانتی و ضمانت اصالت و سلامت فعال‌سازی\n- پشتیبانی ۲۴ ساعته\n`;
    return { title, shortDesc, description };
  }

  // Virtual numbers localization
  if (category === "virtual-numbers") {
    let brand = "سرویس";
    let country = "";
    const match = t.match(/^(Openai|ChatGPT|Claude|Telegram|WhatsApp|Google|Apple|Discord)\s*—\s*(.*)$/i);
    if (match) {
      brand = match[1];
      country = match[2].trim();
    } else {
      const matchBrand = t.match(/(Openai|ChatGPT|Claude|Telegram|WhatsApp|Google|Apple|Discord)/i);
      brand = matchBrand ? matchBrand[1] : (t.toLowerCase().includes("chatgpt") ? "ChatGPT" : "OpenAI");
      country = t.replace(/(Openai|ChatGPT|Claude|Telegram|WhatsApp|Google|Apple|Discord|شماره مجازی وریفای|شماره مجازی|شماره|دریافت پیامک|\(|\)|—|-)/ig, "").trim();
    }
    let brandFa = brand;
    if (/openai|chatgpt/i.test(brand)) brandFa = "چت‌جی‌پی‌تی OpenAI";
    else if (/claude/i.test(brand)) brandFa = "کلود Claude";
    else if (/apple/i.test(brand)) brandFa = "اپل Apple";
    else if (/telegram/i.test(brand)) brandFa = "تلگرام Telegram";

    const title = `شماره مجازی فعالسازی ${brandFa} (${country})`;
    const description = `> ⚠️ **توجه مهم — این محصول شماره مجازی است، نه اکانت یا اشتراک:**\n> این سرویس صرفاً یک **شماره تلفن موقت** جهت دریافت پیامک کد تایید (SMS OTP) برای ساخت یا فعالسازی حساب کاربری در ${brand} است.\n\n## ${title}\n\nشماره مجازی معتبر جهت وریفای سرویس.\n\n### مشخصات\n- **نام اصلی و فنی:** ${shortDesc}\n- دریافت آنی پیامک\n- اختصاصی و امن\n- گارانتی فعال‌سازی\n`;
    return { title, shortDesc, description };
  }

  // Clean raw supplier artifacts: warranty notes, emojis, internal codes
  let cleanName = t;
  cleanName = cleanName.replace(/\s*[\-\|—]?\s*(full\s+warranty|warranty\s*\d*[hd]?|w\d+[mhd]?|no\s+warranty|with\s+warranty|guaranteed?)\b/ig, '');
  cleanName = cleanName.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
  cleanName = cleanName.replace(/\s*[\-\|]\s*antigravity/ig, '');
  cleanName = cleanName.replace(/\[(slot|private|shared)\]/ig, '');

  // Extract duration
  let durationFa = '';
  if (/\b18\s*(months?|m)\b/i.test(cleanName)) { durationFa = '۱۸ ماهه'; cleanName = cleanName.replace(/\b18\s*(months?|m)\b/ig, ''); }
  else if (/\b12\s*(months?|m)\b|\b1\s*(year|y)\b/i.test(cleanName)) { durationFa = '۱ ساله'; cleanName = cleanName.replace(/\b12\s*(months?|m)\b|\b1\s*(year|y)\b/ig, ''); }
  else if (/\b6\s*(months?|m)\b/i.test(cleanName)) { durationFa = '۶ ماهه'; cleanName = cleanName.replace(/\b6\s*(months?|m)\b/ig, ''); }
  else if (/\b3\s*(months?|m)\b/i.test(cleanName)) { durationFa = '۳ ماهه'; cleanName = cleanName.replace(/\b3\s*(months?|m)\b/ig, ''); }
  else if (/\b2\s*(months?|m)\b/i.test(cleanName)) { durationFa = '۲ ماهه'; cleanName = cleanName.replace(/\b2\s*(months?|m)\b/ig, ''); }
  else if (/\b1\s*(month|m)\b/i.test(cleanName)) { durationFa = '۱ ماهه'; cleanName = cleanName.replace(/\b1\s*(month|m)\b/ig, ''); }
  else if (/\b(1|one)\s*days?\b|\b24h\b/i.test(cleanName)) { durationFa = '۱ روزه'; cleanName = cleanName.replace(/\b(1|one)\s*days?\b|\b24h\b/ig, ''); }
  else if (/\b(\d+)\s*days?\b/i.test(cleanName)) {
    const dMatch = cleanName.match(/\b(\d+)\s*days?\b/i);
    if (dMatch) { durationFa = normalizePersianNumbers(dMatch[1]) + ' روزه'; cleanName = cleanName.replace(/\b(\d+)\s*days?\b/ig, ''); }
  }

  // Clean trailing/leading delimiters
  cleanName = cleanName.replace(/[\-\|—:]+\s*$/g, '').replace(/^\s*[\-\|—:]+/g, '').replace(/\s{2,}/g, ' ').trim();

  // Well-known product brand cleanings
  let finalTitle = cleanName;
  if (/chatgpt plus/i.test(t)) {
    finalTitle = "ChatGPT Plus";
  } else if (/claude/i.test(t) && !/otp|virtual/i.test(t)) {
    if (/team/i.test(t)) finalTitle = "Claude Team";
    else finalTitle = "Claude Pro";
  } else if (/midjourney/i.test(t)) {
    if (/standard/i.test(t)) finalTitle = "Midjourney Standard";
    else if (/pro/i.test(t)) finalTitle = "Midjourney Pro";
    else if (/mega/i.test(t)) finalTitle = "Midjourney Mega";
    else finalTitle = "Midjourney";
  } else if (/canva pro/i.test(t)) {
    finalTitle = "Canva Pro";
  } else if (/spotify/i.test(t)) {
    finalTitle = "Spotify Premium";
  } else if (/netflix/i.test(t)) {
    finalTitle = "Netflix 4K Ultra HD";
  } else if (/youtube premium/i.test(t)) {
    finalTitle = "YouTube Premium";
  } else if (/discord nitro/i.test(t)) {
    finalTitle = "Discord Nitro";
  } else if (/cursor/i.test(t)) {
    if (/cursor pro/i.test(t)) finalTitle = "Cursor Pro";
  } else if (/windsurf/i.test(t)) {
    if (/windsurf pro/i.test(t)) finalTitle = "Windsurf Pro";
  } else if (/adobe/i.test(t)) {
    if (/creative cloud/i.test(t)) finalTitle = "Adobe Creative Cloud Pro";
    else if (/express/i.test(t)) finalTitle = "Adobe Express";
  }

  if (durationFa && !finalTitle.includes(durationFa)) {
    finalTitle = `${finalTitle} (${durationFa})`;
  }

  finalTitle = finalTitle.replace(/\s{2,}/g, ' ').trim();

  const description = `## ${finalTitle}\n\nمحصول اوریجینال و قانونی با تحویل آنی و پشتیبانی ۲۴ ساعته.\n\n### مشخصات\n- **نام اصلی و فنی:** ${shortDesc}\n- ضمانت اصالت و سلامت فعال‌سازی\n- خرید امن و تحویل فوری پس از پرداخت\n- پشتیبانی فعال\n`;
  return { title: finalTitle, shortDesc, description };
}

async function getUsdToTomanRate() {
  const s = await db.setting.findUnique({ where: { key: "usd_to_toman_rate" } }).catch(() => null);
  return Number(s?.value) || 220000;
}

async function main() {
  console.log("==================================================");
  console.log("  فاز ۲: بازسازی کاتالوگ با ساختار ۸ دسته استاندارد");
  console.log("==================================================");

  const apiKey = process.env.SUPPLIER_API_KEY || "anb_74b07789c0405c1b2e3f381c2c8ed2fdee37df94";
  const apiUrl = "https://api.irmarket.store/api/buyer/products";

  console.log("۱. بازسازی دسته‌بندی‌های استاندارد در دیتابیس...");
  for (const cat of STANDARD_CATEGORIES) {
    await db.category.upsert({
      where: { slug: cat.slug },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        color: cat.color,
        sortOrder: cat.sortOrder,
      },
      update: {
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        color: cat.color,
        sortOrder: cat.sortOrder,
      },
    });
    console.log(`  ✓ دسته: ${cat.name} (${cat.slug}) رتبه: ${cat.sortOrder}`);
  }

  // Migrate old categories in existing products
  await db.product.updateMany({
    where: { category: "api-credits" },
    data: { category: "dev-tools" },
  });
  await db.product.updateMany({
    where: { category: { in: ["software", "other", "security", "education"] } },
    data: { category: "productivity" },
  });

  console.log("\n۲. پاکسازی محصولات قدیمی تامین‌کننده (Clean First)...");
  const orderItems = await db.orderItem.findMany({ select: { productId: true } });
  const orderProductIds = new Set(orderItems.map((o) => o.productId));

  const deactivated = await db.product.updateMany({
    where: {
      fulfillmentMode: "AUTO",
      id: { in: Array.from(orderProductIds) },
    },
    data: { isActive: false },
  });
  console.log(`  - تعداد ${deactivated.count} محصول دارای سفارش به حالت غیرفعال در آمدند.`);

  const unusedProducts = await db.product.findMany({
    where: {
      fulfillmentMode: "AUTO",
      id: { notIn: Array.from(orderProductIds) },
    },
    select: { id: true },
  });
  const unusedIds = unusedProducts.map((p) => p.id);
  if (unusedIds.length > 0) {
    await db.licenseKey.deleteMany({
      where: { productId: { in: unusedIds } },
    });
    const deleted = await db.product.deleteMany({
      where: { id: { in: unusedIds } },
    });
    console.log(`  - تعداد ${deleted.count} محصول بدون سفارش قبلی با موفقیت حذف شدند.`);
  }

  console.log("\n۳. دریافت کل کاتالوگ irMarket از API...");
  const res = await fetch(apiUrl, {
    headers: { "X-API-Key": apiKey },
  });
  if (!res.ok) {
    throw new Error(`API Error ${res.status}: ${await res.text()}`);
  }
  const rawData = await res.json();
  const rawProducts = Array.isArray(rawData) ? rawData : rawData.products || rawData.data || [];
  console.log(`  ✓ تعداد کل محصولات دریافت شده از تامین‌کننده: ${rawProducts.length}`);

  const usdRate = await getUsdToTomanRate();
  console.log(`  ✓ نرخ تبدیل دلار به تومان: ${usdRate.toLocaleString("fa-IR")} تومان`);

  let imported = 0, updated = 0, skipped = 0;
  const categoryCounts = {};

  console.log("\n۴. اعمال اعتبارسنجی، قیمت‌گذاری پلکانی، رتبه‌بندی و ذخیره‌سازی...");
  for (const sp of rawProducts) {
    const title = pickTitle(sp);
    const priceUSD = Number(sp.price_usd ?? sp.retail_usd ?? sp.price ?? 0);

    if (!title || !priceUSD || priceUSD <= 0) {
      skipped++;
      continue;
    }
    if (isVpnProduct(title)) {
      skipped++;
      continue;
    }
    const requiredInputs = Array.isArray(sp.required_inputs) ? sp.required_inputs : [];
    const nonEmailInputs = requiredInputs.filter(
      (input) => !/email|buyer_email|customer_email/i.test(input)
    );
    if (sp.pricing_unit === "per_1000" || sp.requires_link || sp.requires_comments || sp.requires_password || nonEmailInputs.length > 0) {
      skipped++;
      continue;
    }

    const catInfo = categorizeProduct(sp);
    const catSlug = catInfo.slug;
    categoryCounts[catSlug] = (categoryCounts[catSlug] || 0) + 1;

    const loc = localizeProduct((sp.title || sp.name || title).toString().trim(), catSlug, sp);
    const finalTitle = loc.title;
    const shortDesc = loc.shortDesc;
    const finalDescription = loc.description || `## ${finalTitle}\n\nمحصول اوریجینال با تحویل آنی و پشتیبانی ۲۴ ساعته.`;

    const cleanTitleSlug = slugifyFa(finalTitle);
    const slug = sp.id ? `${sp.id}-${cleanTitleSlug || "item"}` : cleanTitleSlug;
    if (!slug) {
      skipped++;
      continue;
    }

    const { sellPriceToman, markupPercent: effectiveMarkup } = calculateSellPrice(
      priceUSD,
      usdRate,
      null,
      DEFAULT_PRICING_TIERS
    );

    const features = [];
    if (sp.discount_percent) features.push(`تخفیف ویژه: ${sp.discount_percent}٪`);
    if (sp.duration_days) features.push(`مدت: ${sp.duration_days} روز`);
    features.push("تحویل فوری و آنی پس از پرداخت");
    features.push("گارانتی ۱۰۰٪ فعالسازی و تضمین اصالت");
    features.push("پشتیبانی ۲۴ ساعته");

    const brand = sp.brand ? String(sp.brand) : null;
    const duration = sp.duration ? String(sp.duration) : (sp.duration_days ? `${sp.duration_days} روز` : null);
    const tags = sp.tags ? String(sp.tags) : (sp.requires_email ? "requires_email" : null);
    let stock = 0;
    if (typeof sp.stock === "number") {
      stock = sp.stock;
    } else if (typeof sp.in_stock === "number") {
      stock = sp.in_stock;
    } else if (sp.in_stock === true || sp.stock === true) {
      stock = 99;
    } else if (sp.in_stock === false || sp.stock === false) {
      stock = 0;
    } else {
      stock = 99;
    }

    const nextSpecs = {
      supplier_product_id: sp.id,
      price_usd: priceUSD,
      cost_usd: priceUSD,
      pricing_unit: sp.pricing_unit,
      requires_email: sp.requires_email,
      requires_link: sp.requires_link,
      supplier_name: shortDesc,
      markup_percent: effectiveMarkup,
      markup_used: effectiveMarkup,
    };

    const existing = await db.product.findFirst({
      where: {
        OR: [
          { slug },
          { specifications: { contains: `"supplier_product_id":${sp.id}` } },
          { specifications: { contains: `"supplier_product_id":"${sp.id}"` } },
        ],
      },
    });
    if (existing) {
      await db.product.update({
        where: { id: existing.id },
        data: {
          title: finalTitle,
          shortDesc,
          description: finalDescription,
          features: JSON.stringify(features),
          price: sellPriceToman,
          duration: duration || existing.duration,
          brand,
          tags,
          category: catSlug,
          sortOrder: catInfo.sortOrder,
          bestseller: catInfo.bestseller || existing.bestseller,
          featured: catInfo.featured || existing.featured,
          salesCount: Math.max(catInfo.salesCount, existing.salesCount),
          image: sp.image || sp.imageUrl || sp.images?.[0] || existing.image,
          isActive: true,
          stock,
          lastSyncedAt: new Date(),
          specifications: JSON.stringify(nextSpecs),
          fulfillmentMode: "AUTO",
        },
      });
      updated++;
    } else {
      await db.product.create({
        data: {
          title: finalTitle,
          slug,
          shortDesc,
          description: finalDescription,
          features: JSON.stringify(features),
          price: sellPriceToman,
          duration,
          category: catSlug,
          sortOrder: catInfo.sortOrder,
          bestseller: catInfo.bestseller,
          featured: catInfo.featured,
          salesCount: catInfo.salesCount,
          brand,
          tags,
          image: sp.image || sp.imageUrl || sp.images?.[0] || null,
          isActive: true,
          stock,
          rating: 5,
          reviewCount: 0,
          specifications: JSON.stringify(nextSpecs),
          fulfillmentMode: "AUTO",
        },
      });
      imported++;
    }
  }

  console.log("\n==================================================");
  console.log("  خلاصه نتایج بازسازی کاتالوگ:");
  console.log("==================================================");
  console.log(`- تعداد کل دریافت شده: ${rawProducts.length}`);
  console.log(`- محصولات جدید ایجاد شده: ${imported}`);
  console.log(`- محصولات به‌روزرسانی شده: ${updated}`);
  console.log(`- محصولات نامعتبر/ناموجود رد شده: ${skipped}`);
  console.log("\nتوزیع محصولات بر اساس ۸ دسته استاندارد:");
  for (const [cat, count] of Object.entries(categoryCounts)) {
    console.log(`  - [${cat}]: ${count} محصول`);
  }

  // Safety check: ensure 0 virtual numbers in AI
  const vnInAi = await db.product.findMany({
    where: {
      category: "ai",
      OR: [
        { title: { contains: "شماره مجازی" } },
        { title: { contains: "پیامک" } },
        { specifications: { contains: '"category":"OTP Numbers"' } },
      ],
    },
    select: { id: true, title: true },
  });
  console.log(`\nبررسی ایمنی: تعداد شماره مجازی در دسته هوش مصنوعی: ${vnInAi.length}`);
  if (vnInAi.length > 0) {
    console.error("هشدار: شماره‌های مجازی در هوش مصنوعی یافت شدند:", vnInAi);
  } else {
    console.log("  ✓ تایید شد: هیچ شماره مجازی در دسته هوش مصنوعی وجود ندارد!");
  }

  // Check top bestsellers
  const topBestsellers = await db.product.findMany({
    where: { bestseller: true, isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { title: true, category: true, sortOrder: true, price: true },
    take: 10,
  });
  console.log("\nمحصولات برتر و پرفروش در بالای لیست (Bestsellers):");
  topBestsellers.forEach((p, idx) => {
    console.log(`  ${idx + 1}. ${p.title} [دسته: ${p.category}] رتبه: ${p.sortOrder} | قیمت: ${p.price.toLocaleString("fa-IR")} ت`);
  });

  await db.$disconnect();
}

main().catch((e) => {
  console.error("Error in rebuild catalog script:", e);
  process.exit(1);
});
