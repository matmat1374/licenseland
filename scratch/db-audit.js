const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const badFeatures = await prisma.product.findMany({
    where: {
      OR: [
        { features: { contains: 'false' } },
        { features: { contains: 'true' } },
        { features: { contains: 'undefined' } },
        { features: { contains: '$' } },
        { features: { contains: 'usd' } }
      ]
    },
    select: { id: true, title: true, features: true }
  });
  console.log('Products with bad features count:', badFeatures.length);
  if (badFeatures.length > 0) {
    console.log('Sample bad features (first 5):', JSON.stringify(badFeatures.slice(0, 5), null, 2));
  }

  const allProducts = await prisma.product.findMany({
    select: { id: true, title: true, price: true, stock: true, specifications: true, features: true, isActive: true }
  });
  console.log('Total products:', allProducts.length);

  let missingSpecsCount = 0;
  let brokenJsonCount = 0;
  for (const p of allProducts) {
    if (!p.specifications) continue;
    try {
      const s = JSON.parse(p.specifications);
      if (s.usd_rate_used === undefined || s.markup_used === undefined) {
        missingSpecsCount++;
      }
    } catch (e) {
      brokenJsonCount++;
    }
  }
  console.log('Products missing usd_rate_used or markup_used:', missingSpecsCount);
  console.log('Products with broken specifications JSON:', brokenJsonCount);

  // Check categories
  const categories = await prisma.category.findMany();
  console.log('Total categories:', categories.length);
  console.log('Categories list:', categories.map(c => ({ name: c.name, slug: c.slug })));

  // Check orders
  const orders = await prisma.order.findMany({ take: 5 });
  console.log('Total sample orders count:', orders.length);

  // Check settings
  const settings = await prisma.setting.findMany();
  console.log('Settings in DB:', settings.map(s => `${s.key}: ${s.value}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
