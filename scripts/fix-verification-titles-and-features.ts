import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const products = await db.product.findMany();
  let updatedCount = 0;

  for (const product of products) {
    let needsUpdate = false;
    const dataToUpdate: any = {};

    // 1. Title and ShortDesc for virtual numbers
    let title = product.title;
    if (/^(Openai|ChatGPT)\s*—/i.test(title) || /🇩🇪|🇪🇪|🇺🇸|🇬🇧/.test(title)) {
      if (!title.includes("شماره مجازی")) {
        title = `شماره مجازی وریفای ${title} (دریافت پیامک)`;
        dataToUpdate.title = title;
        dataToUpdate.shortDesc = "شماره اختصاصی جهت دریافت پیامک تایید و فعالسازی حساب کاربری";
        needsUpdate = true;
      }
    }

    // 2. Features
    let features: string[] = [];
    try {
      features = JSON.parse(product.features || "[]");
    } catch { }

    const oldFeaturesStr = JSON.stringify(features);
    features = features.filter(f => !f.includes("$") && !f.includes("قیمت عمومی") && !f.includes("موجود:") && !f.includes("true") && !f.includes("false"));
    
    if (features.length === 0) {
      features = ["تحویل فوری و آنی پس از پرداخت", "گارانتی ۱۰۰٪ فعالسازی و تضمین اصالت", "پشتیبانی ۲۴ ساعته"];
    }
    const newFeaturesStr = JSON.stringify(features);
    if (oldFeaturesStr !== newFeaturesStr) {
      dataToUpdate.features = newFeaturesStr;
      needsUpdate = true;
    }

    // 3. Description
    if (product.description) {
      let desc = product.description;
      const oldDesc = desc;
      // Remove lines like:
      // - قیمت پایه: $0.22
      // - نرخ تبدیل: 60,000 تومان به ازای هر دلار
      // - حاشیه: 200٪
      desc = desc.replace(/- قیمت پایه: \$.*\n?/g, "");
      desc = desc.replace(/- نرخ تبدیل: .*\n?/g, "");
      desc = desc.replace(/- حاشیه: .*\n?/g, "");
      // In case default fallback generated this exact format, replace it with clean one
      desc = desc.replace(/### مشخصات\s*$/, "### مشخصات\n- ضمانت اصالت و سلامت\n- خرید امن و مطمئن\n- پشتیبانی فعال");

      if (desc !== oldDesc) {
        dataToUpdate.description = desc;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      await db.product.update({
        where: { id: product.id },
        data: dataToUpdate
      });
      updatedCount++;
      console.log(`Updated product ${product.id} - ${product.slug}`);
    }
  }

  console.log(`Finished updating ${updatedCount} products.`);
  await db.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
