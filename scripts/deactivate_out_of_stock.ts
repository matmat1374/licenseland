import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Fetching active products...");
  const products = await db.product.findMany({
    where: { isActive: true }
  });

  const outOfStockKeywords = ['not available', 'out of stock', 'is not included', 'ناموجود', 'cannot create'];
  let deactivatedCount = 0;

  for (const p of products) {
    const titleLower = p.title.toLowerCase();
    const descLower = (p.description || "").toLowerCase();
    
    let isAct = true;
    let specs: any = {};
    try {
      specs = typeof p.specifications === 'string' ? JSON.parse(p.specifications) : (p.specifications || {});
    } catch(e) {}

    const supplierStock = specs.supplier_stock;
    if (supplierStock === 0) {
      isAct = false;
    } else if (outOfStockKeywords.some(kw => titleLower.includes(kw) || descLower.includes(kw))) {
      isAct = false;
    }

    if (!isAct) {
      await db.product.update({
        where: { id: p.id },
        data: { isActive: false }
      });
      deactivatedCount++;
      console.log(`Deactivated: ${p.title}`);
    }
  }

  console.log(`\nTotal deactivated: ${deactivatedCount}`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await db.$disconnect();
  });
