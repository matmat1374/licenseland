import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES_META: Record<string, string> = {
  gaming: "بازی و سرگرمی",
  streaming: "فیلم، سریال و موسیقی",
  ai: "هوش مصنوعی",
  design: "طراحی و ویرایش",
  security: "امنیت و آنتی‌ویروس",
  software: "نرم‌افزار و توسعه",
  education: "آموزش",
  social: "شبکه‌های اجتماعی",
  "virtual-numbers": "شماره مجازی و وریفای",
  "api-credits": "توکن و کردیت API"
};

function pickTitle(p: any): string {
  let title = (p.title || p.name || "").toString().trim();
  if (/^(Openai|ChatGPT|Claude|Telegram|WhatsApp|Google|Apple|Discord)\s*—/i.test(title) && !title.includes("شماره مجازی")) {
    title = `شماره مجازی وریفای ${title} (دریافت پیامک)`;
  }
  return title;
}

function categorizeProduct(p: any): { slug: string; name: string } {
  const name = pickTitle(p);
  const n = (name || "").toLowerCase();
  
  let slug = "";
  
  const spCat = (p.category || "").toLowerCase().trim();
  if (spCat === "otp numbers") slug = "virtual-numbers";
  else if (spCat === "apis & dev tools") slug = "api-credits";
  else if (spCat === "ai chatbots" || spCat === "ai video & image" || spCat === "accounts & ai video") slug = "ai";
  else if (spCat === "design tools") slug = "design";
  else if (spCat === "premium") {
    slug = /spotify|netflix|deezer|tidal|apple.?music|youtube.?music/i.test(n) ? "streaming" : "software";
  }
  else if (spCat === "nitro" || spCat === "psn (us)" || spCat === "play - us" || spCat === "uc (global)" || spCat === "cp (in)") slug = "gaming";
  else if (spCat === "itunes - us" || spCat === "productivity") slug = "software";
  else if (spCat === "followers" || spCat === "stars") slug = "social";
  
  if (!slug) {
    if (/—\s*(germany|us|france|uk|england|netherlands|russia|usa)|virtual number|otp|phone number/i.test(n) || n.includes("شماره مجازی")) {
      slug = "virtual-numbers";
    } else if (/\b(redeem|credit|token|key|توکن|کردیت)\b/i.test(n)) {
      slug = "api-credits";
    }
  }

  if (!slug) {
    if (/xbox|ایکس باکس|playstation|پلی استیشن|ps4|ps5|nintendo|نینتندو|steam|استیم|epic games|اپیک گیمز|origin|uplay|ea play|game pass|گیم پس|gta|minecraft|ماینکرافت|fortnite|فورتنایت|pubg|پابجی|valorant|ولورانت|battlenet|blizzard|بلیزارد|گیم|بازی/.test(n)) slug = "gaming";
    else if (/netflix|نتفلیکس|spotify|اسپاتیفای|youtube|یوتیوب|apple tv|اپل تی وی|disney|دیزنی|hbo|paramount|پارامونت|deezer|دیزر|tidal|تایدال|crunchyroll|کرانچی رول|prime video|پرایم ویدیو|twitch|توییچ|فیلم|سینما|موسیقی|sound cloud|ساندکلاد/.test(n)) slug = "streaming";
    else if (/chatgpt|چت جی پی تی|چتجیپیتی|claude|کلاود|کلود|gemini|جمینی|midjourney|میدجرنی|openai|اوپن ای آی|anthropic|آنتروپیک|copilot|کوپایلوت|grok|گروک|perplexity|پرپلکسیتی|cursor|کورسور|windsurf|ویندسرف|runway|رانوی|suno|سونو|udio|یودیو|elevenlabs|الون لبز|pika|پیکا|dall|دال ای|kling|کلینگ|leonardo|لئوناردو|heygen|هی جن|هیجن|higgsfield|هیگزفیلد|veo|ویو|گوگل ویو|genspark|جن اسپارک|lovable|لاویبل|openart|اوپن آرت|pixverse|پیکس ورس|seedance|سیدنس|akool|آکول|beeble|بیبل|sora|سورا|هوش مصنوعی/.test(n)) slug = "ai";
    else if (/telegram|تلگرام|discord|دیسکورد|twitter|توییتر|x premium|linkedin|لینکدین|instagram|اینستاگرام|facebook|فیسبوک|tiktok|تیک تاک|تیک آبی/.test(n)) slug = "social";
    else if (/canva|کنوا|کانوا|adobe|ادوبی|figma|فیگما|sketch|اسکچ|invision|notion|نوشن|framer|فریمر|miro|میرو|creativecloud|lightroom|لایت روم|photoshop|فتوشاپ|illustrator|ایلوستریتور|premiere|پریمیر|after effects|افتر افکت|envato|انواتو|freepik|فری پیک/.test(n)) slug = "design";
    else if (/vpn|وی پی ان|فیلترشکن|nordvpn|نورد|expressvpn|اکسپرس|surfshark|سرف شارک|cyberghost|proton|پروتون|malwarebytes|bitdefender|بیت دیفندر|kaspersky|کسپراسکای|کسپرسکی|norton|نورتون|antivirus|آنتی ویروس|1password|وان پسورد|lastpass|bitwarden|بیت واردن/.test(n)) slug = "security";
    else if (/coursera|کورسرا|udemy|یودمی|linkedin learning|masterclass|مسترکلاس|skillshare|اسکیل شیر|duolingo|دولینگو|memrise|ممرایز|babbel|بابل|rosetta|رزتا/.test(n)) slug = "education";
    else slug = "software";
  }

  return { slug, name: CATEGORIES_META[slug] || slug };
}

async function main() {
  const setting = await prisma.setting.findUnique({ where: { key: 'supplier_api_key' } });
  const apiKey = setting?.value || process.env.SUPPLIER_API_KEY || '';
  
  if (!apiKey) {
    console.error('No supplier API key found');
    process.exit(1);
  }

  console.log('Fetching products from supplier API...');
  const res = await fetch('https://api.irmarket.store/api/buyer/products', {
    headers: {
      'X-API-Key': apiKey,
    },
  });

  if (!res.ok) {
    console.error(`Supplier API Error: ${res.status} - ${await res.text()}`);
    process.exit(1);
  }

  const data = await res.json();
  const supplierProducts: any[] = Array.isArray(data) ? data : (data.products || data.data || data.items || []);

  const supplierProductMap = new Map();
  for (const sp of supplierProducts) {
    if (sp.id) {
      supplierProductMap.set(String(sp.id), sp);
    }
  }
  
  const products = await prisma.product.findMany();
  console.log(`Found ${products.length} local products.`);
  
  let virtualNumbersCount = 0;
  let apiCreditsCount = 0;

  for (const p of products) {
    let spId = null;
    try {
      if (p.specifications) {
        const specs = JSON.parse(p.specifications);
        spId = specs.supplier_product_id;
      }
    } catch (e) {
      // ignore parse error
    }

    let matchedSp = null;
    if (spId && supplierProductMap.has(String(spId))) {
      matchedSp = supplierProductMap.get(String(spId));
    } else {
      // Try to find by title if no id
      matchedSp = supplierProducts.find(s => pickTitle(s) === p.title);
    }

    if (!matchedSp) {
      // Create a dummy SP with just title for regex matching if not found
      matchedSp = { title: p.title };
    }

    const { slug } = categorizeProduct(matchedSp);
    
    const n = (p.title || "").toLowerCase();
    const isFeatured = /chatgpt plus|claude pro|midjourney|sora|stable diffusion|netflix|spotify|adobe|github copilot/i.test(n);
    
    if (slug === 'virtual-numbers') virtualNumbersCount++;
    if (slug === 'api-credits') apiCreditsCount++;
    
    await prisma.product.update({
      where: { id: p.id },
      data: {
        category: slug,
        featured: isFeatured,
      }
    });
  }

  console.log(`Finished reorganizing catalog.`);
  console.log(`Products moved to virtual-numbers: ${virtualNumbersCount}`);
  console.log(`Products moved to api-credits: ${apiCreditsCount}`);
}

main().finally(() => prisma.$disconnect());
