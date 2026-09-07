import { db } from '../src/lib/db';

async function main() {
  const products = await db.product.findMany({
    where: { category: 'ai' },
    take: 5
  });
  console.log(JSON.stringify(products.map(p => ({ title: p.title, shortDesc: p.shortDesc })), null, 2));
}

main().catch(console.error).finally(() => process.exit(0));
