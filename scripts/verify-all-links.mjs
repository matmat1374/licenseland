import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching active products...');
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { slug: true, title: true }
  });

  console.log(`Found ${products.length} active products.`);

  let successCount = 0;
  let failCount = 0;

  for (const product of products) {
    const url = `https://liceno.ir/product/${encodeURIComponent(product.slug)}`;
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.status === 200) {
        successCount++;
        console.log(`[OK] ${url}`);
      } else {
        failCount++;
        console.error(`[FAIL - ${res.status}] ${url} (${product.title})`);
      }
    } catch (err) {
      failCount++;
      console.error(`[ERROR] ${url}: ${err.message}`);
    }
  }
  
  console.log(`\nVerification Complete.`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
