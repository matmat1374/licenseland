const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const prod = await p.product.findFirst({
    where: { slug: { contains: '3073' } },
    include: { categoryRel: true }
  });
  console.log('3073 DB:', prod);

  const aiProds = await p.product.findMany({
    where: { category: 'ai' },
    select: { id: true, title: true, category: true, slug: true }
  });
  console.log('OTP in AI:', aiProds.filter(x => x.title.includes('شماره') || x.title.includes('مجازی')));
}

main().finally(() => p.$disconnect());
