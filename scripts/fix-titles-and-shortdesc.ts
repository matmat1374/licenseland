import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany();
  let categoryUpdates = 0;
  let titleUpdates = 0;
  let shortDescUpdates = 0;

  const categoryStats: Record<string, number> = {
    streaming: 0,
    design: 0,
    ai: 0,
    'api-credits': 0,
    gaming: 0,
    social: 0,
  };

  for (const p of products) {
    let newCategory = p.category;
    let newTitle = p.title;
    let newShortDesc = p.shortDesc;

    // 1. Categorization (only for software)
    if (p.category === 'software') {
      const n = (p.title + ' ' + p.shortDesc).toLowerCase();
      if (/xbox|ایکس باکس|playstation|پلی استیشن|ps4|ps5|psn|nintendo|نینتندو|steam|استیم|epic games|اپیک گیمز|origin|uplay|ea play|game pass|گیم پس|gta|minecraft|ماینکرافت|fortnite|فورتنایت|pubg|پابجی|valorant|ولورانت|battlenet|blizzard|بلیزارد|nitro|uc|cp|گیم|بازی/.test(n)) newCategory = "gaming";
      else if (/netflix|نتفلیکس|spotify|اسپاتیفای|youtube|یوتیوب|apple music|youtube music|apple tv|اپل تی وی|disney|دیزنی|hbo|paramount|پارامونت|deezer|دیزر|tidal|تایدال|crunchyroll|کرانچی رول|prime video|پرایم ویدیو|twitch|توییچ|فیلم|سینما|موسیقی|sound cloud|soundcloud|ساندکلاد/.test(n)) newCategory = "streaming";
      else if (/api|codex|deepseek|qwen|token|credit|ردیم|توکن|کردیت/.test(n)) newCategory = "api-credits";
      else if (/chatgpt|چت جی پی تی|چتجیپیتی|claude|کلاود|کلود|gemini|جمینی|midjourney|میدجرنی|openai|اوپن ای آی|anthropic|آنتروپیک|copilot|کوپایلوت|grok|گروک|perplexity|پرپلکسیتی|cursor|کورسور|windsurf|ویندسرف|runway|رانوی|suno|سونو|udio|یودیو|elevenlabs|الون لبز|pika|پیکا|dall|دال ای|kling|کلینگ|leonardo|لئوناردو|heygen|هی جن|هیجن|higgsfield|هیگزفیلد|veo|ویو|گوگل ویو|genspark|جن اسپارک|lovable|لاویبل|openart|اوپن آرت|pixverse|پیکس ورس|seedance|سیدنس|akool|آکول|beeble|بیبل|sora|سورا|gamma|gamma app|هوش مصنوعی/.test(n)) newCategory = "ai";
      else if (/telegram|تلگرام|discord|دیسکورد|twitter|توییتر|x premium|linkedin|لینکدین|instagram|اینستاگرام|facebook|فیسبوک|tiktok|تیک تاک|تیک آبی/.test(n)) newCategory = "social";
      else if (/capcut|corel|canva|کنوا|کانوا|adobe|ادوبی|figma|فیگما|sketch|اسکچ|invision|notion|نوشن|framer|فریمر|miro|میرو|creativecloud|lightroom|لایت روم|photoshop|فتوشاپ|illustrator|ایلوستریتور|premiere|پریمیر|after effects|افتر افکت|envato|انواتو|freepik|فری پیک/.test(n)) newCategory = "design";
      
      if (newCategory !== 'software') {
        categoryUpdates++;
        categoryStats[newCategory] = (categoryStats[newCategory] || 0) + 1;
      }
    }

    // 2. Title Fixes
    // Remove duplicate durations e.g., "12 ماهه 12 ماهه"
    newTitle = newTitle.replace(/(۱ ماهه|۲ ماهه|۳ ماهه|۴ ماهه|۵ ماهه|۶ ماهه|۱۲ ماهه|1 ماهه|2 ماهه|3 ماهه|4 ماهه|5 ماهه|6 ماهه|12 ماهه)(?:\s+\1)+/g, "$1");
    // Remove "For 75% OFF"
    newTitle = newTitle.replace(/For\s*\d+%\s*OFF/ig, "");
    
    // Fix "100 ماهه" bug for API/Credit products
    if (newCategory === 'api-credits' || newCategory === 'ai' || /credit|api|token/i.test(newTitle)) {
      newTitle = newTitle.replace(/(\d+)\s*ماهه/g, "$1 میلیون");
      newTitle = newTitle.replace(/با گارانتی کامل با گارانتی کامل/g, "با گارانتی کامل");
    }

    if (p.title !== newTitle) {
      titleUpdates++;
    }

    // 3. ShortDesc Fixes (English Name)
    // Try to extract the English part from the start of shortDesc
    const match = newShortDesc.match(/^([A-Za-z0-9\s\.\-_\(\)\[\]]+?)(?:[\u0600-\u06FF]|$)/);
    if (match && match[1].trim().length > 3) {
      let extracted = match[1].trim();
      // Remove trailing hyphens or numbers that were left over
      extracted = extracted.replace(/\s*[-—]\s*(?:\d+\s*)?$/, '').trim();
      if (extracted.length > 3) {
        newShortDesc = extracted;
      }
    }
    
    // specific cleanup for duplicates
    newShortDesc = newShortDesc.replace(/(1 month|2 months|3 months|6 months|12 months)(?:\s+\1)+/ig, "$1");

    if (p.shortDesc !== newShortDesc) {
      shortDescUpdates++;
    }

    if (p.category !== newCategory || p.title !== newTitle || p.shortDesc !== newShortDesc) {
      await prisma.product.update({
        where: { id: p.id },
        data: {
          category: newCategory,
          title: newTitle,
          shortDesc: newShortDesc
        }
      });
    }
  }

  console.log('--- گزارش اجرا ---');
  console.log(`محصولات تغییر دسته داده شده: ${categoryUpdates}`);
  for (const cat in categoryStats) {
    if (categoryStats[cat] > 0) {
      console.log(`  -> ${cat}: ${categoryStats[cat]}`);
    }
  }
  console.log(`عناوین اصلاح شده: ${titleUpdates}`);
  console.log(`shortDesc اصلاح شده: ${shortDescUpdates}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
