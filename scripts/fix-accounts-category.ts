import { db } from "../src/lib/db";

async function main() {
  console.log("Starting fix-accounts-category script...");
  
  const products = await db.product.findMany({
    where: { category: "ai" }
  });

  console.log(`Found ${products.length} products in 'ai' category.`);

  let stats: Record<string, number> = {
    gaming: 0,
    software: 0,
    social: 0,
    streaming: 0,
    untouched: 0
  };

  for (const p of products) {
    const n = (p.shortDesc || p.title || "").toLowerCase();
    
    let newSlug = "";

    if (/xbox|game pass|playstation|nintendo|steam/i.test(n)) {
      newSlug = "gaming";
    } else if (/gmail|outlook|hotmail|yahoo mail|microsoft/i.test(n) && !/midjourney|openai/i.test(n)) {
      newSlug = "software";
    } else if (/tiktok|twitter|instagram|facebook|linkedin|discord/i.test(n)) {
      newSlug = "social";
    } else if (/netflix|spotify|youtube premium|prime video|disney|apple tv/i.test(n)) {
      newSlug = "streaming";
    }

    if (newSlug) {
      await db.product.update({
        where: { id: p.id },
        data: { category: newSlug }
      });
      stats[newSlug]++;
      console.log(`Moved: [${p.shortDesc}] -> ${newSlug}`);
    } else {
      stats.untouched++;
    }
  }

  console.log("\n=== Stats ===");
  console.log(`Gaming: ${stats.gaming}`);
  console.log(`Software: ${stats.software}`);
  console.log(`Social: ${stats.social}`);
  console.log(`Streaming: ${stats.streaming}`);
  console.log(`Untouched (stayed AI): ${stats.untouched}`);
  const totalMoved = stats.gaming + stats.software + stats.social + stats.streaming;
  console.log(`\nTotal moved out of AI: ${totalMoved}`);
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
