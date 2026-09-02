const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: {
      specifications: { contains: 'custom_markup' }
    },
    select: { id: true, title: true, specifications: true, price: true }
  });
  console.log('Products with custom markup:', products);
}

main().catch(console.error).finally(() => prisma.$disconnect());
