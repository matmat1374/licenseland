import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Starting rank-bestsellers script ===");

  // 1. Reset all products to default low priority
  console.log("Resetting all products to sortOrder: 99, bestseller: false...");
  const resetResult = await prisma.product.updateMany({
    data: {
      sortOrder: 99,
      bestseller: false,
    },
  });
  console.log(`Reset ${resetResult.count} products.`);

  // 2. Define our curated bestsellers with accurate fields matching irmarket.store/fa
  const bestsellerList = [
    // 1. Code 364: Gemini AI Pro 18 Month + 5TB Cloud
    {
      slug: "364-gemini-ai-pro-۱۸-ماهه",
      match: { id: "cmty0z8so00ahu2tsi6qemga5" },
      data: {
        title: "جمنای پرو ۱۸ ماهه همراه ۵ ترابایت ابری | تحویل آنی",
        sortOrder: 1,
        bestseller: true,
        salesCount: 842,
        rating: 4.9,
        stock: 235,
        isActive: true,
      },
    },
    // 2. ChatGPT Plus 1 Month
    {
      slug: "3576-chatgpt-plus-۱-ماهه",
      match: { id: "cmty0zdsx017hu2ts0yhxzu16" }, // slug: 3576-chatgpt-plus-۱-ماهه
      data: {
        title: "اکانت چت‌جی‌پی‌تی پلاس ۱ ماهه (ChatGPT Plus) | تحویل فوری",
        sortOrder: 2,
        bestseller: true,
        salesCount: 780,
        rating: 4.9,
        stock: 120,
        isActive: true,
      },
    },
    {
      slug: "3077-chatgpt-plus",
      match: { id: "cmty0zdu5017pu2ts3bj38812" }, // slug: 3077-chatgpt-plus
      data: {
        title: "اشتراک اختصاصی چت‌جی‌پی‌تی پلاس (ChatGPT Plus)",
        sortOrder: 2,
        bestseller: true,
        salesCount: 650,
        rating: 4.9,
        stock: 100,
        isActive: true,
      },
    },
    // 3. Spotify 3-Month and 1-Month
    {
      slug: "3117-spotify-premium-۳-ماهه",
      match: { id: "cmty0zatw00p3u2ts9ezhtozm" }, // 3117-spotify-premium-۳-ماهه
      data: {
        title: "اکانت اسپاتیفای پرمیوم ۳ ماهه (Spotify Premium)",
        sortOrder: 3,
        bestseller: true,
        salesCount: 710,
        rating: 4.8,
        stock: 474,
        isActive: true,
      },
    },
    {
      slug: "2439-spotify-premium-۱-ماهه",
      match: { id: "cmty0zasa00opu2tsmqagah9q" }, // 2439-spotify-premium-۱-ماهه
      data: {
        title: "اکانت اسپاتیفای پرمیوم ۱ ماهه (Spotify Premium)",
        sortOrder: 3,
        bestseller: true,
        salesCount: 540,
        rating: 4.8,
        stock: 99,
        isActive: true,
      },
    },
    // 4. Claude Pro
    {
      slug: "2992-claude-pro-۱-ماهه",
      match: { id: "cmty0zbux00vxu2tsrz5z7emy" }, // 2992-claude-pro-۱-ماهه
      data: {
        title: "اکانت کلود پرو ۱ ماهه (Claude Pro AI) | قانونی و پایدار",
        sortOrder: 4,
        bestseller: true,
        salesCount: 630,
        rating: 4.9,
        stock: 85,
        isActive: true,
      },
    },
    {
      slug: "2379-claude-pro-۱-ماهه",
      match: { id: "cmty0z8aw006du2tsc7z4eohh" }, // 2379-claude-pro-۱-ماهه
      data: {
        title: "اکانت کلود پرو اختصاصی (Claude Pro AI)",
        sortOrder: 4,
        bestseller: true,
        salesCount: 410,
        rating: 4.8,
        stock: 50,
        isActive: true,
      },
    },
    // 5. Telegram Stars (50, 100, 1000)
    {
      slug: "708-50-telegram-stars",
      match: { id: "cmty0z7s6001bu2ts5swe1r65" }, // 708-50-telegram-stars
      data: {
        title: "۵۰ استارز تلگرام (Telegram Stars) | واریز فوری",
        sortOrder: 5,
        bestseller: true,
        salesCount: 820,
        rating: 4.9,
        stock: 99,
        isActive: true,
      },
    },
    {
      slug: "709-100-telegram-stars",
      match: { id: "cmty0z7oh000bu2tspejc6b1v" }, // 709-100-telegram-stars
      data: {
        title: "۱۰۰ استارز تلگرام (Telegram Stars) | واریز فوری",
        sortOrder: 5,
        bestseller: true,
        salesCount: 760,
        rating: 4.9,
        stock: 99,
        isActive: true,
      },
    },
    {
      slug: "712-1000-telegram-stars",
      match: { id: "cmty0z7oo000du2ts6ahwziky" }, // 712-1000-telegram-stars
      data: {
        title: "۱۰۰۰ استارز تلگرام (Telegram Stars) | واریز فوری",
        sortOrder: 5,
        bestseller: true,
        salesCount: 680,
        rating: 5.0,
        stock: 99,
        isActive: true,
      },
    },
    // 6. YouTube Premium 1-Month
    {
      slug: "412-youtube-premium-۱-ماهه",
      match: { id: "cmty0zcur011xu2ts31t81st7" }, // 412-youtube-premium-۱-ماهه
      data: {
        title: "یوتیوب پریمیوم اختصاصی ۱ ماهه (YouTube Premium)",
        sortOrder: 6,
        bestseller: true,
        salesCount: 640,
        rating: 4.8,
        stock: 99,
        isActive: true,
      },
    },
    {
      slug: "1428-youtube-premium-۱-ماهه",
      match: { id: "cmty0zcvf0121u2ts9p24fk02" }, // 1428-youtube-premium-۱-ماهه
      data: {
        title: "یوتیوب پریمیوم قانونی بدون قطعی ۱ ماهه",
        sortOrder: 6,
        bestseller: true,
        salesCount: 510,
        rating: 4.8,
        stock: 99,
        isActive: true,
      },
    },
    {
      slug: "2736-youtube-premium-۳-ماهه",
      match: { id: "cmty0zcu5011tu2ts6g4b4i2p" }, // 2736-youtube-premium-۳-ماهه
      data: {
        title: "یوتیوب پریمیوم اختصاصی ۳ ماهه (YouTube Premium)",
        sortOrder: 6,
        bestseller: true,
        salesCount: 420,
        rating: 4.8,
        stock: 56,
        isActive: true,
      },
    },
    // 7. Canva Pro 1-Year & 3-Month
    {
      slug: "2387-canva-pro-۱-ساله",
      match: { id: "cmty0zaqn00obu2tsya4pvtrv" }, // 2387-canva-pro-۱-ساله
      data: {
        title: "اکانت کانوا پرو ۱ ساله اختصاصی (Canva Pro)",
        sortOrder: 7,
        bestseller: true,
        salesCount: 590,
        rating: 4.9,
        stock: 50,
        isActive: true,
      },
    },
    {
      slug: "2849-canva-pro-۳-ماهه",
      match: { id: "cmty0zd5a013pu2ts9ajn8dng" }, // 2849-canva-pro-۳-ماهه
      data: {
        title: "اکانت کانوا پرو ۳ ماهه (Canva Pro)",
        sortOrder: 7,
        bestseller: true,
        salesCount: 380,
        rating: 4.8,
        stock: 50,
        isActive: true,
      },
    },
    // 8. Programming tools: Cursor Pro & Windsurf
    {
      slug: "3062-cursor-pro-۱-ماهه",
      match: { id: "cmty0z7y10033u2ts0d1wnvhv" }, // 3062-cursor-pro-۱-ماهه
      data: {
        title: "اکانت کرسر پرو ۱ ماهه (Cursor Pro AI Code Editor)",
        sortOrder: 8,
        bestseller: true,
        salesCount: 490,
        rating: 4.9,
        stock: 50,
        isActive: true,
      },
    },
    {
      slug: "2372-cursor-pro-۱-ماهه",
      match: { id: "cmty0z7yd0037u2tsenr5txuc" }, // 2372-cursor-pro-۱-ماهه
      data: {
        title: "ابزار کدنویسی ویندسرف / کرسر پرو ۱ ماهه (Windsurf & Cursor)",
        sortOrder: 8,
        bestseller: true,
        salesCount: 350,
        rating: 4.8,
        stock: 50,
        isActive: true,
      },
    },
    // 9. Midjourney & Runway
    {
      slug: "3129-runway-max-5-days-۱-ماهه",
      match: { id: "cmty0zf5v01f3u2ts49nv5ie1" }, // 3129-runway-max-5-days-۱-ماهه
      data: {
        title: "اکانت رانوی و میدجرنی (Runway & Midjourney AI)",
        sortOrder: 9,
        bestseller: true,
        salesCount: 430,
        rating: 4.8,
        stock: 50,
        isActive: true,
      },
    },
    {
      slug: "2093-runway-pro-۱-ساله",
      match: { id: "cmty0zf6901f5u2tsh30j4emt" }, // 2093-runway-pro-۱-ساله
      data: {
        title: "اشتراک پریمیوم ساخت ویدیو و انیمیشن هوش مصنوعی (Runway Pro)",
        sortOrder: 9,
        bestseller: true,
        salesCount: 290,
        rating: 4.7,
        stock: 50,
        isActive: true,
      },
    },
    // 10. Discord Nitro Boost
    {
      slug: "2313-discord-nitro-۱-ماهه",
      match: { id: "cmty0z8ga007lu2tst1espi5c" }, // 2313-discord-nitro-۱-ماهه
      data: {
        title: "دیسکورد نیترو بوست ۱ ماهه (Discord Nitro Boost)",
        sortOrder: 10,
        bestseller: true,
        salesCount: 520,
        rating: 4.8,
        stock: 99,
        isActive: true,
      },
    },
    {
      slug: "2752-discord-nitro-۳-ماهه",
      match: { id: "cmty0zdx40189u2tsc94e51jv" }, // 2752-discord-nitro-۳-ماهه
      data: {
        title: "دیسکورد نیترو بوست ۳ ماهه (Discord Nitro Boost)",
        sortOrder: 10,
        bestseller: true,
        salesCount: 330,
        rating: 4.8,
        stock: 99,
        isActive: true,
      },
    },
    // 11. PUBG UC & COD CP
    {
      slug: "2159-60-uc",
      match: { id: "cmty0z7tb001lu2tsy7mu45y0" }, // 2159-60-uc
      data: {
        title: "۶۰ یوسی پابجی موبایل (PUBG Mobile UC) | شارژ آنی",
        sortOrder: 11,
        bestseller: true,
        salesCount: 740,
        rating: 4.9,
        stock: 99,
        isActive: true,
      },
    },
    {
      slug: "2161-600-60-uc",
      match: { id: "cmty0z7tj001nu2ts7p7bez01" }, // 2161-600-60-uc
      data: {
        title: "۶۶۰ یوسی پابجی موبایل (PUBG Mobile UC) | شارژ آنی",
        sortOrder: 11,
        bestseller: true,
        salesCount: 620,
        rating: 4.9,
        stock: 99,
        isActive: true,
      },
    },
    {
      slug: "2301-80-8-cp",
      match: { id: "cmty0z7tv001ru2tsd90mi6pg" }, // 2301-80-8-cp
      data: {
        title: "۸۸ سی‌پی کالاف دیوتی موبایل (Call of Duty CP)",
        sortOrder: 11,
        bestseller: true,
        salesCount: 580,
        rating: 4.8,
        stock: 99,
        isActive: true,
      },
    },
    {
      slug: "2303-800-160-cp",
      match: { id: "cmty0z7u2001tu2tsr1tuqx73" }, // 2303-800-160-cp
      data: {
        title: "۹۶۰ سی‌پی کالاف دیوتی موبایل (Call of Duty CP)",
        sortOrder: 11,
        bestseller: true,
        salesCount: 470,
        rating: 4.8,
        stock: 99,
        isActive: true,
      },
    },
    // 12. CapCut Pro 7-Day & 1-Month
    {
      slug: "3319-capcut-pro-7-day",
      match: { id: "cmty0z84b004ru2tsvxgq859m" }, // 3319-capcut-pro-7-day
      data: {
        title: "کپ‌کات پرو ۷ روزه (CapCut Pro VIP)",
        sortOrder: 12,
        bestseller: true,
        salesCount: 690,
        rating: 4.9,
        stock: 81,
        isActive: true,
      },
    },
    {
      slug: "1548-capcut-pro-7-d-comes-with",
      match: { id: "cmty0z843004pu2tsnrw3ipgv" }, // 1548-capcut-pro-7-d-comes-with
      data: {
        title: "کپ‌کات پرو ۷ روزه اشتراکی بدون قطعی (CapCut Pro)",
        sortOrder: 12,
        bestseller: true,
        salesCount: 530,
        rating: 4.8,
        stock: 163,
        isActive: true,
      },
    },
    {
      slug: "1797-capcut-pro-۱-ماهه",
      match: { id: "cmty0z83f004ju2ts2wvg803x" }, // 1797-capcut-pro-۱-ماهه
      data: {
        title: "کپ‌کات پرو ۱ ماهه (CapCut Pro VIP) | بدون قطعی",
        sortOrder: 12,
        bestseller: true,
        salesCount: 510,
        rating: 4.9,
        stock: 109,
        isActive: true,
      },
    },
    // 13. ElevenLabs
    {
      slug: "3177-elevenlabs-۱-ماهه",
      match: { id: "cmty0zdyu018lu2ts7qq1h749" }, // 3177-elevenlabs-۱-ماهه
      data: {
        title: "اکانت ایلون‌لبز ۱ ماهه ساخت صدا و دوبله (ElevenLabs AI)",
        sortOrder: 13,
        bestseller: true,
        salesCount: 390,
        rating: 4.8,
        stock: 50,
        isActive: true,
      },
    },
    {
      slug: "728-elevenlabs-creator-۱-ماهه",
      match: { id: "cmty0zdzo018ru2tsveqvdsta" }, // 728-elevenlabs-creator-۱-ماهه
      data: {
        title: "ایلون‌لبز پلن کرییتور (ElevenLabs Creator Plan)",
        sortOrder: 13,
        bestseller: true,
        salesCount: 260,
        rating: 4.7,
        stock: 50,
        isActive: true,
      },
    },
    // 14. Office 365 & Duolingo
    {
      slug: "2748-ms-office-365-plus-۱-ساله",
      match: { id: "cmty0za9b00k9u2ts7f7lgfin" }, // 2748-ms-office-365-plus-۱-ساله
      data: {
        title: "مایکروسافت آفیس ۳۶۵ اورجینال ۱ ساله (Microsoft Office 365)",
        sortOrder: 14,
        bestseller: true,
        salesCount: 530,
        rating: 4.9,
        stock: 30,
        isActive: true,
      },
    },
    {
      slug: "1431-microsoft-office-365-premium-slot-۱-ساله",
      match: { id: "cmty0za3600ifu2tsom3cwj6n" }, // 1431-microsoft-office-365-premium-slot-۱-ساله
      data: {
        title: "مایکروسافت آفیس ۳۶۵ پلن پرمیوم ۱ ساله (Office 365)",
        sortOrder: 14,
        bestseller: true,
        salesCount: 360,
        rating: 4.8,
        stock: 99,
        isActive: true,
      },
    },
    {
      slug: "3535-duolingo-super-۱-ساله",
      match: { id: "cmty0z8hq007xu2tsxmp10uo1" }, // 3535-duolingo-super-۱-ساله
      data: {
        title: "اکانت دولینگو سوپر ۱ ساله (Duolingo Super)",
        sortOrder: 14,
        bestseller: true,
        salesCount: 480,
        rating: 4.9,
        stock: 50,
        isActive: true,
      },
    },
    {
      slug: "3536-duolingo-super-۳-ماهه",
      match: { id: "cmty0z8hz007zu2tsjvxbs10c" }, // 3536-duolingo-super-۳-ماهه
      data: {
        title: "اکانت دولینگو سوپر ۳ ماهه (Duolingo Super)",
        sortOrder: 14,
        bestseller: true,
        salesCount: 320,
        rating: 4.8,
        stock: 50,
        isActive: true,
      },
    },
    // 15. Netflix
    {
      slug: "4648-netflix-4k-ultra-hd-۱-ماهه",
      match: { id: "cmty0zd4y013nu2tswk4d0h06" }, // 4648-netflix-4k-ultra-hd-۱-ماهه
      data: {
        title: "نتفلیکس پریمیوم 4K اولترا اچ‌دی ۱ ماهه (Netflix 4K)",
        sortOrder: 15,
        bestseller: true,
        salesCount: 470,
        rating: 4.8,
        stock: 60,
        isActive: true,
      },
    },
    // 16. Apple Music & Apple ID
    {
      slug: "2744-apple-music-5m",
      match: { id: "cmty0z7zd003hu2tsv5u1fsfd" }, // 2744-apple-music-5m
      data: {
        title: "اپل موزیک ۵ ماهه اختصاصی (Apple Music 5M)",
        sortOrder: 16,
        bestseller: true,
        salesCount: 440,
        rating: 4.8,
        stock: 48,
        isActive: true,
      },
    },
    {
      slug: "4538-apple-id-2fa-gmail",
      match: { id: "cmty0z7z5003fu2tsj08wmtay" }, // 4538-apple-id-2fa-gmail
      data: {
        title: "اپل آیدی معتبر آمریکا ۲ مرحله‌ای با جیمیل (Apple ID US)",
        sortOrder: 16,
        bestseller: true,
        salesCount: 530,
        rating: 4.9,
        stock: 50,
        isActive: true,
      },
    },
    // 17. Google Play Gift Card
    {
      slug: "2251-google-play-gift-card-us-google-play-us-us-10-gift-card-code",
      match: { id: "cmty0z90o00c1u2tslos2h8p4" }, // 2251-google-play-gift-card-us-google-play-us-us-10-gift-card-code
      data: {
        title: "گیفت کارت گوگل پلی ۱۰ دلاری آمریکا (Google Play US $10)",
        sortOrder: 17,
        bestseller: true,
        salesCount: 390,
        rating: 4.9,
        stock: 99,
        isActive: true,
      },
    },
    // 18. PlayStation Network Card
    {
      slug: "2259-playstation-network-card-us-psn-card-25-usd",
      match: { id: "cmty0zakp00mxu2tsj2ctjkz0" }, // 2259-playstation-network-card-us-psn-card-25-usd
      data: {
        title: "گیفت کارت پلی‌استیشن ۲۵ دلاری آمریکا (PlayStation PSN $25)",
        sortOrder: 18,
        bestseller: true,
        salesCount: 370,
        rating: 4.9,
        stock: 99,
        isActive: true,
      },
    },
    // 19. Xbox Game Pass Ultimate
    {
      slug: "2778-xbox-game-pass-ultimate-1-month-۱-ساله",
      match: { id: "cmty0zcsc011ju2tsach1k4wl" }, // 2778-xbox-game-pass-ultimate-1-month-۱-ساله
      data: {
        title: "ایکس‌باکس گیم‌پس التیمیت (Xbox Game Pass Ultimate)",
        sortOrder: 19,
        bestseller: true,
        salesCount: 320,
        rating: 4.8,
        stock: 50,
        isActive: true,
      },
    },
    // 20. Figma & Notion
    {
      slug: "4328-figma-pro-education-2-years-year",
      match: { id: "cmty0ze1v0195u2tswnkj0vwe" }, // 4328-figma-pro-education-2-years-year
      data: {
        title: "اکانت فیگما پرو ۲ ساله (Figma Pro 2 Years)",
        sortOrder: 20,
        bestseller: true,
        salesCount: 290,
        rating: 4.8,
        stock: 50,
        isActive: true,
      },
    },
    {
      slug: "3908-notion-plus-education-2-years-year",
      match: { id: "cmty0zf0a01e7u2ts2ljtkgfe" }, // 3908-notion-plus-education-2-years-year
      data: {
        title: "اکانت نوشن پلاس ۲ ساله (Notion Plus 2 Years)",
        sortOrder: 20,
        bestseller: true,
        salesCount: 280,
        rating: 4.8,
        stock: 50,
        isActive: true,
      },
    },
  ];

  console.log(`Updating ${bestsellerList.length} priority products...`);
  let updatedCount = 0;

  for (const item of bestsellerList) {
    try {
      let targetProduct = null;
      if (item.slug) {
        targetProduct = await prisma.product.findUnique({ where: { slug: item.slug } });
      }
      if (!targetProduct && item.match?.id) {
        targetProduct = await prisma.product.findUnique({ where: { id: item.match.id } });
      }
      if (!targetProduct) {
        const prefix = (item.slug || "").split("-")[0];
        if (prefix && prefix.length >= 2) {
          targetProduct = await prisma.product.findFirst({
            where: { slug: { startsWith: prefix + "-" } },
          });
        }
      }

      if (!targetProduct) {
        console.error(`Product not found for: ${item.slug || JSON.stringify(item.match)}`);
        continue;
      }

      const updated = await prisma.product.update({
        where: { id: targetProduct.id },
        data: item.data,
      });
      console.log(`[Rank ${updated.sortOrder}] Updated: ${updated.title} (ID: ${updated.id}, Slug: ${updated.slug})`);
      updatedCount++;
    } catch (err) {
      console.error(`Failed to update product ${item.slug || JSON.stringify(item.match)}:`, err.message);
    }
  }

  console.log(`Successfully updated ${updatedCount} bestseller products!`);

  // Verify top 15 products sorted by sortOrder asc
  const topProducts = await prisma.product.findMany({
    where: { bestseller: true },
    orderBy: [{ sortOrder: "asc" }, { salesCount: "desc" }],
    take: 20,
    select: { id: true, title: true, sortOrder: true, salesCount: true, bestseller: true, price: true },
  });

  console.log("\n=== Current Top Ranked Products ===");
  topProducts.forEach((p, idx) => {
    console.log(`${idx + 1}. [Order: ${p.sortOrder}] ${p.title} | Sales: ${p.salesCount} | Price: ${p.price}`);
  });

  console.log("\nDone!");
}

main()
  .catch((e) => {
    console.error("Error running rank-bestsellers:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
