const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const products = await prisma.product.findMany();
  products.forEach(p => {
    const s = JSON.stringify(p);
    if (s.includes('43')) {
      if (p.slug.includes('3656')) {
         console.log(`Product: ${p.slug}`);
         if (p.description?.includes('43')) console.log('Found in description');
         if (p.shortDesc?.includes('43')) console.log('Found in shortDesc');
         if (p.features?.includes('43')) console.log('Found in features');
         if (p.title?.includes('43')) console.log('Found in title');
         if (p.specifications?.includes('43')) console.log('Found in specifications:', p.specifications);
      }
    }
  });
}
main();
