import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const inStockProducts = await db.product.findMany({
    where: { isActive: true, stock: { gt: 0 } },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  const outOfStockProducts = await db.product.findMany({
    where: { isActive: true, stock: { lte: 0 } },
    orderBy: { createdAt: "desc" },
  });

  const products = [...inStockProducts, ...outOfStockProducts];

  console.log("--- First 5 Products ---");
  products.slice(0, 5).forEach((p, i) => {
    console.log(`${i+1}. [${p.id}] ${p.title} (Stock: ${p.stock})`);
  });

  console.log("\n--- Last 5 Products ---");
  products.slice(-5).forEach((p, i) => {
    console.log(`${products.length - 5 + i + 1}. [${p.id}] ${p.title} (Stock: ${p.stock})`);
  });
}

main().finally(() => db.$disconnect());
