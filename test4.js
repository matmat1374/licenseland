const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const cats = await p.category.findMany();
  console.log('Categories:', cats);
  
  const product = await p.product.findFirst({
    where: { slug: { contains: '3073' } }
  });
  console.log('Product Category:', product.category);
  
  const related = await p.product.findMany({
    where: { category: product.category },
    take: 4
  });
  console.log('Related products for that category count:', related.length);
}

main().finally(() => p.$disconnect());
