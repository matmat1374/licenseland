import { db } from "./src/lib/db";

async function run() {
  const p1 = await db.product.findFirst({
    where: { specifications: { contains: '"supplier_product_id":3656' } }
  });
  const p2 = await db.product.findFirst({
    where: { specifications: { contains: '"supplier_product_id":3073' } }
  });
  
  console.log('Product 3656 (ChatGPT Plus):', p1?.price);
  console.log('Product 3073 (Virtual Number):', p2?.price);
}

run().catch(console.error).finally(() => process.exit(0));
