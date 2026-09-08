import { fetchLiveUsdtRate, repriceAllProductsWithLiveRate } from "./src/lib/live-repricer";
import { db } from "./src/lib/db";

async function run() {
  console.log("Fetching live rate...");
  const rate = await fetchLiveUsdtRate();
  console.log("Live rate:", rate);
  
  console.log("Repricing all products...");
  const result = await repriceAllProductsWithLiveRate();
  console.log("Reprice result:", result);
  
  const products = await db.product.findMany({
    where: { id: { in: ["3656", "3073"] } }
  });
  
  console.log("Selected products:");
  for (const p of products) {
    console.log(`Product ${p.id} (${p.title}): ${p.price}`);
  }
}

run().catch(console.error).finally(() => process.exit(0));
