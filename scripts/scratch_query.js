const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const product = await prisma.product.findFirst({ where: { slug: { contains: '3656' } } });
  console.log("PRODUCT:");
  console.log(JSON.stringify(product, null, 2));

  const settings = await prisma.setting.findMany();
  console.log("SETTINGS:");
  console.log(JSON.stringify(settings, null, 2));
}

main().finally(() => prisma.$disconnect());
