import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const p1 = await prisma.product.findFirst({
    where: { slug: '2143-gpt-plus-apple-30d-covers-24h' }
  });
  console.log('p1 title:', p1?.title);
  console.log('p1 shortDesc:', p1?.shortDesc);
  console.log('p1 specs:', p1?.specifications);
  console.log('p1 features:', p1?.features);

  const p2 = await prisma.product.findFirst({
    where: { id: '3656' } // assuming ID is string in prisma schema? Let's check string vs int
  });
  if (p2) {
      console.log('p2 (id 3656):', p2.title, p2.price, p2.specifications);
  } else {
      const p3 = await prisma.product.findFirst({
        where: { slug: { contains: '3656' } }
      });
      console.log('p3 (slug contains 3656):', p3?.title, p3?.price, p3?.specifications);
  }

  // settings for usd_to_toman_rate_auto
  const usdRate = await prisma.setting.findMany({
      where: { key: { in: ['usd_to_toman_rate_auto', 'usd_to_toman_rate', 'usd_rate_mode'] } }
  });
  console.log('USD Rates in DB:', usdRate);
}
main().finally(() => prisma.$disconnect());
