// @ts-nocheck
import { db } from "../src/lib/db";
import { localizeProduct } from "../src/lib/supplier";

async function main() {
  const products = await db.product.findMany();
  let updated = 0;

  console.log(`Found ${products.length} products. Localizing...`);

  for (const product of products) {
    // We assume shortDesc or title holds the original english name.
    // If it's already localized by our new function, shortDesc is the english name.
    const rawTitle = (product.shortDesc && /[a-zA-Z]/.test(product.shortDesc)) ? product.shortDesc : product.title;

    const loc = localizeProduct(rawTitle, product.category || "software");
    
    if (product.title !== loc.title || product.shortDesc !== loc.shortDesc) {
      await db.product.update({
        where: { id: product.id },
        data: {
          title: loc.title,
          shortDesc: loc.shortDesc,
          description: loc.description,
        }
      });
      updated++;
      console.log(`[UPDATED] ${product.title}\n      => Title: ${loc.title}\n      => Short: ${loc.shortDesc}`);
    }
  }

  console.log(`\n✅ Done! Updated ${updated} products.`);
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
