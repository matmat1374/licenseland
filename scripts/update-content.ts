import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const updates = {
    banner1_title_line1: "مجموعه برگزیده",
    banner1_title_line2: "هوش مصنوعی",
    banner1_badge: "⚡ دسترسی سریع و قانونی",
    banner1_discount: "پیشنهاد ویژه",
    banner1_description: "اشتراک قانونی برترین هوش‌های مصنوعی جهان (ChatGPT، Claude، Cursor) با فعالسازی آنی.",
    banner1_button_text: "مشاهده همه سرویس‌های هوش مصنوعی",
    banner1_link: "/shop?cat=ai",

    banner2_title_line1: "استودیو تخصصی",
    banner2_title_line2: "طراحی و کدنویسی",
    banner2_badge: "💎 ابزارهای حرفه‌ای",
    banner2_discount: "ویژه خلاقان",
    banner2_description: "سرویس‌های اوریجینال برای گرافیست‌ها و برنامه‌نویسان با لایسنس رسمی و پشتیبانی مداوم.",
    banner2_button_text: "مشاهده همه ابزارهای طراحی و توسعه",
    banner2_link: "/shop?cat=design",
  };

  for (const [key, value] of Object.entries(updates)) {
    await db.siteContent.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    console.log(`Updated ${key} in DB`);
  }
  
  // Set default products if empty (find popular ai and design products)
  const aiProducts = await db.product.findMany({ where: { category: "ai", stock: { gt: 0 } }, take: 3, orderBy: { salesCount: "desc" }});
  const designProducts = await db.product.findMany({ where: { category: { in: ["design", "software"] }, stock: { gt: 0 } }, take: 3, orderBy: { salesCount: "desc" }});

  if (aiProducts.length > 0) {
    const ids = aiProducts.map(p => p.id).join(",");
    await db.siteContent.upsert({
      where: { key: "banner1_product_ids" },
      update: { value: ids },
      create: { key: "banner1_product_ids", value: ids },
    });
    console.log(`Updated banner1_product_ids`);
  }

  if (designProducts.length > 0) {
    const ids = designProducts.map(p => p.id).join(",");
    await db.siteContent.upsert({
      where: { key: "banner2_product_ids" },
      update: { value: ids },
      create: { key: "banner2_product_ids", value: ids },
    });
    console.log(`Updated banner2_product_ids`);
  }

  console.log("Done updating content!");
}

main().catch(console.error).finally(() => db.$disconnect());
