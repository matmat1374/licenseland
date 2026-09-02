import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function main() {
  const products = await db.product.findMany();
  for (const p of products) {
    let farsiTitle = p.title;
    
    // Parse title to extract farsi title and english parts.
    // Example: `[Slot] نتفلیکس 4K Premium 1 month Full warranty` -> `اکانت نتفلیکس ۴K پریمیوم ۱ ماهه با گارانتی کامل [اسلات اختصاصی]`
    
    if (p.title.includes("Netflix 4K Premium 1 month Full warranty [Slot]") || p.title.includes("[Slot] نتفلیکس 4K")) {
        farsiTitle = "اکانت نتفلیکس ۴K پریمیوم ۱ ماهه با گارانتی کامل [اسلات اختصاصی]";
    } else if (p.title.includes("Admin Canva Pro Business 100 Slots 3 Months")) {
        farsiTitle = "اکانت ادمین کنوا پرو بیزینس ۱۰۰ کاربره ۳ ماهه";
    } else if (p.title.includes("Chatgpt Plus 30D no warranty")) {
        farsiTitle = "اشتراک ChatGPT Plus اختصاصی ۳۰ روزه";
    } else if (p.title.includes("API 100M Token Claude 1 Day")) {
        farsiTitle = "کلید API کلود ۱۰۰ میلیون توکن ۱ روزه";
    } else if (p.title.includes("Canva Pro Slot 1 Month")) {
        farsiTitle = "اشتراک کنوا پرو ۱ ماهه";
    } else if (p.title.includes("Adobe Express 12m")) {
        farsiTitle = "اشتراک ادوبی اکسپرس ۱۲ ماهه";
    } else if (p.title.includes("YouTube Premium 1 Month")) {
        farsiTitle = "اشتراک یوتیوب پریمیوم ۱ ماهه";
    } else if (p.title.includes("Spotify Premium 1 Month")) {
        farsiTitle = "اشتراک اسپاتیفای پریمیوم ۱ ماهه";
    } else {
        farsiTitle = p.title; // fallback
    }
    
    // Convert shortDesc to english clean subtitle
    let englishSub = p.shortDesc;
    if (p.title.includes("Netflix") || p.title.includes("نتفلیکس")) {
        englishSub = "Netflix 4K Premium 1 month Full warranty [Slot]";
    } else if (p.title.includes("Admin Canva Pro")) {
        englishSub = "Admin Canva Pro Business 100 Slots 3 Months";
    } else if (p.title.includes("Chatgpt Plus")) {
        englishSub = "Chatgpt Plus 30D no warranty";
    } else if (p.title.includes("Claude")) {
        englishSub = "API 100M Token Claude 1 Day";
    } else if (p.title.includes("Canva Pro Slot")) {
        englishSub = "Canva Pro Slot 1 Month";
    } else if (p.title.includes("Adobe Express")) {
        englishSub = "Adobe Express 12m";
    } else if (p.title.includes("YouTube")) {
        englishSub = "YouTube Premium 1 Month";
    } else if (p.title.includes("Spotify")) {
        englishSub = "Spotify Premium 1 Month";
    } else {
        // try extracting english words
        const matches = p.title.match(/[a-zA-Z0-9\s\-\.]+/g);
        if (matches && matches.length > 0) {
            englishSub = matches.join("").trim();
        }
    }
    
    await db.product.update({
        where: { id: p.id },
        data: {
            title: farsiTitle,
            shortDesc: englishSub
        }
    });
  }
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await db.$disconnect(); });
