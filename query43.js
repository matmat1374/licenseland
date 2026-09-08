const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.product.findFirst({
    where: { slug: { contains: '3656' } }
  });
  console.log(p.features);
  console.log(p.description);
}
main();
