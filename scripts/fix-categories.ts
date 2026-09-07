import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function categorizeProduct(name: string): string {
  const n = (name || "").toLowerCase();

  // 1. Gaming
  if (/xbox|ایکس باکس|playstation|پلی استیشن|ps4|ps5|nintendo|نینتندو|steam|استیم|epic games|اپیک گیمز|origin|uplay|ea play|game pass|گیم پس|gta|minecraft|ماینکرافت|fortnite|فورتنایت|pubg|پابجی|valorant|ولورانت|battlenet|blizzard|بلیزارد|گیم|بازی/.test(n)) {
    return "gaming";
  }

  // 2. Streaming (Movies, Series, Music, Audio)
  if (/netflix|نتفلیکس|spotify|اسپاتیفای|youtube|یوتیوب|apple tv|اپل تی وی|disney|دیزنی|hbo|paramount|پارامونت|deezer|دیزر|tidal|تایدال|crunchyroll|کرانچی رول|prime video|پرایم ویدیو|twitch|توییچ|فیلم|سینما|موسیقی|sound cloud|ساندکلاد/.test(n)) {
    return "streaming";
  }

  // 3. AI & Generative Media
  if (/chatgpt|چت جی پی تی|چتجیپیتی|claude|کلاود|کلود|gemini|جمینی|midjourney|میدجرنی|openai|اوپن ای آی|anthropic|آنتروپیک|copilot|کوپایلوت|grok|گروک|perplexity|پرپلکسیتی|cursor|کورسور|windsurf|ویندسرف|runway|رانوی|suno|سونو|udio|یودیو|elevenlabs|الون لبز|pika|پیکا|dall|دال ای|kling|کلینگ|leonardo|لئوناردو|heygen|هی جن|هیجن|higgsfield|هیگزفیلد|veo|ویو|گوگل ویو|genspark|جن اسپارک|lovable|لاویبل|openart|اوپن آرت|pixverse|پیکس ورس|seedance|سیدنس|akool|آکول|beeble|بیبل|sora|سورا|هوش مصنوعی/.test(n)) {
    return "ai";
  }

  // 4. Social & Social Media Accounts
  if (/telegram|تلگرام|discord|دیسکورد|twitter|توییتر|x premium|linkedin|لینکدین|instagram|اینستاگرام|facebook|فیسبوک|tiktok|تیک تاک|تیک آبی/.test(n)) {
    return "social";
  }

  // 5. Design & Creative
  if (/canva|کنوا|کانوا|adobe|ادوبی|figma|فیگما|sketch|اسکچ|invision|notion|نوشن|framer|فریمر|miro|میرو|creativecloud|lightroom|لایت روم|photoshop|فتوشاپ|illustrator|ایلوستریتور|premiere|پریمیر|after effects|افتر افکت|envato|انواتو|freepik|فری پیک/.test(n)) {
    return "design";
  }

  // 6. Security & Privacy
  if (/vpn|وی پی ان|فیلترشکن|nordvpn|نورد|expressvpn|اکسپرس|surfshark|سرف شارک|cyberghost|proton|پروتون|malwarebytes|bitdefender|بیت دیفندر|kaspersky|کسپراسکای|کسپرسکی|norton|نورتون|antivirus|آنتی ویروس|1password|وان پسورد|lastpass|bitwarden|بیت واردن/.test(n)) {
    return "security";
  }

  // 7. Education & Languages
  if (/coursera|کورسرا|udemy|یودمی|linkedin learning|masterclass|مسترکلاس|skillshare|اسکیل شیر|duolingo|دولینگو|memrise|ممرایز|babbel|بابل|rosetta|رزتا/.test(n)) {
    return "education";
  }

  // 8. Software & Productivity
  if (/windows|ویندوز|office|آفیس|microsoft|مایکروسافت|visual studio|ویژوال استودیو|jetbrains|جت برینز|autocad|اتوکد|vmware|parallels|zoom|زوم|slack|اسلک|dropbox|دراپ باکس|grammarly|گرامرلی/.test(n)) {
    return "software";
  }

  return "software";
}

async function main() {
  const products = await db.product.findMany({ select: { id: true, title: true, category: true } });
  const categories = await db.category.findMany({ select: { slug: true } });
  const validSlugs = new Set(categories.map(c => c.slug));

  let fixed = 0;
  for (const p of products) {
    const correctCat = categorizeProduct(p.title);
    if (p.category !== correctCat && validSlugs.has(correctCat)) {
      await db.product.update({ where: { id: p.id }, data: { category: correctCat } });
      console.log(`Fixed: ${p.title} -> ${p.category} -> ${correctCat}`);
      fixed++;
    }
  }
  console.log(`\no. Fixed ${fixed} products`);
  await db.$disconnect();
}

main().catch(console.error);

