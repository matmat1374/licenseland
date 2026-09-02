import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const API_CATEGORY_MAP: Record<string, { slug: string, name: string, icon: string, color: string }> = {
  "ai chatbots": { slug: "ai", name: "هوش مصنوعی", icon: "Bot", color: "from-blue-500 to-indigo-600" },
  "ai video & image": { slug: "ai-media", name: "هوش مصنوعی تصویر و ویدیو", icon: "Image", color: "from-purple-500 to-pink-600" },
  "accounts & ai video": { slug: "ai-media", name: "هوش مصنوعی تصویر و ویدیو", icon: "Image", color: "from-purple-500 to-pink-600" },
  "design tools": { slug: "design", name: "طراحی و ویرایش", icon: "PenTool", color: "from-sky-500 to-cyan-600" },
  "apis & dev tools": { slug: "software", name: "نرم‌افزار و توسعه", icon: "Code", color: "from-amber-500 to-orange-600" },
  "productivity": { slug: "productivity", name: "ابزارهای بهره‌وری", icon: "Briefcase", color: "from-emerald-500 to-teal-600" },
  "nitro": { slug: "gaming", name: "بازی و سرگرمی", icon: "Gamepad2", color: "from-violet-500 to-fuchsia-600" },
  "psn (us)": { slug: "gaming", name: "بازی و سرگرمی", icon: "Gamepad2", color: "from-violet-500 to-fuchsia-600" },
  "play - us": { slug: "giftcards", name: "گیفت کارت", icon: "Gift", color: "from-rose-500 to-red-600" },
  "itunes - us": { slug: "giftcards", name: "گیفت کارت", icon: "Gift", color: "from-rose-500 to-red-600" },
  "uc (global)": { slug: "gaming", name: "بازی و سرگرمی", icon: "Gamepad2", color: "from-violet-500 to-fuchsia-600" },
  "cp (in)": { slug: "gaming", name: "بازی و سرگرمی", icon: "Gamepad2", color: "from-violet-500 to-fuchsia-600" },
  "followers": { slug: "social", name: "شبکه‌های اجتماعی", icon: "Users", color: "from-blue-400 to-blue-600" },
  "premium": { slug: "streaming", name: "فیلم و موسیقی", icon: "Play", color: "from-rose-500 to-pink-600" },
  "otp numbers": { slug: "virtual-numbers", name: "شماره مجازی", icon: "Phone", color: "from-gray-500 to-slate-600" },
  "stars": { slug: "social", name: "شبکه‌های اجتماعی", icon: "Users", color: "from-blue-400 to-blue-600" },
  "other": { slug: "other", name: "سایر محصولات", icon: "Package", color: "from-gray-400 to-gray-500" },
};

async function fixCategories() {
  const products = await db.product.findMany();
  for (const p of products) {
    const origCat = p.category;
    let normalized = origCat.toLowerCase().replace(/-/g, ' ');
    // Try to match
    let matched = API_CATEGORY_MAP[normalized] || API_CATEGORY_MAP[origCat.toLowerCase()];
    if (!matched) {
      // maybe it's just 'ai', 'software', etc.
      if (origCat === 'ai' || origCat === 'software' || origCat === 'streaming' || origCat === 'security' || origCat === 'gaming' || origCat === 'design') {
        continue;
      }
      matched = { slug: "other", name: "سایر محصولات", icon: "Package", color: "from-gray-400 to-gray-500" };
    }

    // ensure category exists
    await db.category.upsert({
      where: { slug: matched.slug },
      create: {
        name: matched.name,
        slug: matched.slug,
        description: matched.name,
        icon: matched.icon,
        color: matched.color,
        sortOrder: 10,
      },
      update: {
        name: matched.name,
        icon: matched.icon,
        color: matched.color,
      }
    });

    if (p.category !== matched.slug) {
      await db.product.update({
        where: { id: p.id },
        data: { category: matched.slug }
      });
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

  console.log("Categories fixed!");
}

fixCategories();
