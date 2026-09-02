const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

const API_CATEGORY_MAP = {
  "ai chatbots": { slug: "ai", name: "هوش مصنوعی", icon: "Bot", color: "from-blue-500 to-indigo-600" },
  "ai-chatbots": { slug: "ai", name: "هوش مصنوعی", icon: "Bot", color: "from-blue-500 to-indigo-600" },
  "ai video & image": { slug: "ai", name: "هوش مصنوعی", icon: "Bot", color: "from-blue-500 to-indigo-600" },
  "ai-video-image": { slug: "ai", name: "هوش مصنوعی", icon: "Bot", color: "from-blue-500 to-indigo-600" },
  "accounts & ai video": { slug: "ai", name: "هوش مصنوعی", icon: "Bot", color: "from-blue-500 to-indigo-600" },
  "accounts-ai-video": { slug: "ai", name: "هوش مصنوعی", icon: "Bot", color: "from-blue-500 to-indigo-600" },
  "design tools": { slug: "design", name: "طراحی و ویرایش", icon: "PenTool", color: "from-sky-500 to-cyan-600" },
  "design-tools": { slug: "design", name: "طراحی و ویرایش", icon: "PenTool", color: "from-sky-500 to-cyan-600" },
  "apis & dev tools": { slug: "software", name: "نرم‌افزار و توسعه", icon: "Code", color: "from-amber-500 to-orange-600" },
  "apis-dev-tools": { slug: "software", name: "نرم‌افزار و توسعه", icon: "Code", color: "from-amber-500 to-orange-600" },
  "productivity": { slug: "productivity", name: "ابزارهای بهره‌وری", icon: "Briefcase", color: "from-emerald-500 to-teal-600" },
  "nitro": { slug: "gaming", name: "بازی و سرگرمی", icon: "Gamepad2", color: "from-violet-500 to-fuchsia-600" },
  "psn (us)": { slug: "gaming", name: "بازی و سرگرمی", icon: "Gamepad2", color: "from-violet-500 to-fuchsia-600" },
  "psn-us": { slug: "gaming", name: "بازی و سرگرمی", icon: "Gamepad2", color: "from-violet-500 to-fuchsia-600" },
  "play - us": { slug: "giftcards", name: "گیفت کارت", icon: "Gift", color: "from-rose-500 to-red-600" },
  "play-us": { slug: "giftcards", name: "گیفت کارت", icon: "Gift", color: "from-rose-500 to-red-600" },
  "itunes - us": { slug: "giftcards", name: "گیفت کارت", icon: "Gift", color: "from-rose-500 to-red-600" },
  "itunes-us": { slug: "giftcards", name: "گیفت کارت", icon: "Gift", color: "from-rose-500 to-red-600" },
  "uc (global)": { slug: "gaming", name: "بازی و سرگرمی", icon: "Gamepad2", color: "from-violet-500 to-fuchsia-600" },
  "uc-global": { slug: "gaming", name: "بازی و سرگرمی", icon: "Gamepad2", color: "from-violet-500 to-fuchsia-600" },
  "cp (in)": { slug: "gaming", name: "بازی و سرگرمی", icon: "Gamepad2", color: "from-violet-500 to-fuchsia-600" },
  "cp-in": { slug: "gaming", name: "بازی و سرگرمی", icon: "Gamepad2", color: "from-violet-500 to-fuchsia-600" },
  "followers": { slug: "social", name: "شبکه‌های اجتماعی", icon: "Users", color: "from-blue-400 to-blue-600" },
  "stars": { slug: "social", name: "شبکه‌های اجتماعی", icon: "Users", color: "from-blue-400 to-blue-600" },
  "premium": { slug: "streaming", name: "فیلم و موسیقی", icon: "Play", color: "from-rose-500 to-pink-600" },
  "otp numbers": { slug: "virtual-numbers", name: "شماره مجازی", icon: "Phone", color: "from-gray-500 to-slate-600" },
  "otp-numbers": { slug: "virtual-numbers", name: "شماره مجازی", icon: "Phone", color: "from-gray-500 to-slate-600" },
  "virtual-numbers": { slug: "virtual-numbers", name: "شماره مجازی", icon: "Phone", color: "from-gray-500 to-slate-600" },
  "other": { slug: "other", name: "سایر محصولات", icon: "Package", color: "from-gray-400 to-gray-500" },
};

async function fixCategories() {
  // 1. Ensure core categories exist
  const coreCats = Object.values(API_CATEGORY_MAP);
  for (const c of coreCats) {
    await db.category.upsert({
      where: { slug: c.slug },
      create: { name: c.name, slug: c.slug, description: c.name, icon: c.icon, color: c.color, sortOrder: 10 },
      update: { name: c.name, icon: c.icon, color: c.color }
    });
  }

  const products = await db.product.findMany();
  let updated = 0;
  for (const p of products) {
    const origCat = p.category;
    let matched = API_CATEGORY_MAP[origCat.toLowerCase()];
    if (!matched) {
      if (['ai', 'software', 'streaming', 'security', 'gaming', 'design'].includes(origCat)) {
         continue;
      }
      matched = API_CATEGORY_MAP['other'];
    }

    if (p.category !== matched.slug) {
      await db.product.update({
        where: { id: p.id },
        data: { category: matched.slug }
      });
      updated++;
    }
  }

  // Delete unused categories
  const usedCats = await db.product.findMany({ select: { category: true }, distinct: ['category'] });
  const usedSlugs = usedCats.map(c => c.category);
  
  await db.category.deleteMany({
    where: {
      slug: { notIn: usedSlugs }
    }
  });

  console.log("Categories fixed for products: " + updated);
}

fixCategories().catch(console.error);
