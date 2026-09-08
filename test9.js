const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const limit = 50;
  let orderBy = { salesCount: "desc" };
  const inStockProducts = await p.product.findMany({
    where: { category: "ai", isActive: true, stock: { gt: 0 } },
    orderBy,
    take: limit,
  });

  const remainingLimit = limit ? limit - inStockProducts.length : undefined;

  const outOfStockProducts = (remainingLimit === undefined || remainingLimit > 0) ? await p.product.findMany({
    where: { category: "ai", isActive: true, stock: { lte: 0 } },
    orderBy,
    take: remainingLimit,
  }) : [];

  const products = [...inStockProducts, ...outOfStockProducts];

  console.log('AI Products:', products.map(p => p.title + ' | ' + p.category));
}

main().finally(() => p.$disconnect());
