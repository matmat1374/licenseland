const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const product = await p.product.findFirst({
    where: { slug: { contains: '3073' } }
  });
  
  const cats = await p.category.findMany();
  const cat = cats.find(c => c.slug === product.category);

  console.log('Product:', product.title);
  console.log('Product category slug:', product.category);
  console.log('Breadcrumb category name:', cat?.name || product.category);
}

main().finally(() => p.$disconnect());
