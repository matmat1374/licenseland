import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const p3 = await prisma.product.findFirst({
    where: { slug: { contains: '3656' } }
  });
  console.log('p3 title:', p3?.title);
  console.log('p3 shortDesc:', p3?.shortDesc);
}
main().finally(() => prisma.$disconnect());
