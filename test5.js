const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const otpProds = await p.product.findMany({
    where: { 
      OR: [
        { title: { contains: 'شماره' } },
        { title: { contains: 'مجازی' } }
      ]
    },
    select: { id: true, title: true, category: true, slug: true }
  });
  console.log('Virtual Numbers:', otpProds.map(p => `${p.slug} => ${p.category}`));
}

main().finally(() => p.$disconnect());
