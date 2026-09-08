const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.product.findMany();
  for (let pr of p) {
    if (JSON.stringify(pr).includes('43')) {
      console.log(pr.slug);
      console.log(pr.features);
    }
  }
}
main();
