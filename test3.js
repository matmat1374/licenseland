const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const claudeProds = await p.product.findMany({
    where: { title: { contains: 'Claude' } },
    select: { id: true, title: true, category: true, slug: true }
  });
  console.log('Claude prods:', claudeProds);
  const aiProds = await p.product.findMany({
    where: { category: 'ai' },
    select: { id: true, title: true, category: true, slug: true }
  });
  console.log('AI prods with شماره or مجازی:', aiProds.filter(x => x.title.includes('شماره') || x.title.includes('مجازی')));
}

main().finally(() => p.$disconnect());
