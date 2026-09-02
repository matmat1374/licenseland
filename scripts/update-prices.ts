import { PrismaClient } from '@prisma/client';
import { getUsdToTomanRate } from '../src/lib/supplier';

const db = new PrismaClient();

async function main() {
  const liveUsdRate = await getUsdToTomanRate();
  console.log(`Live USD Rate: ${liveUsdRate}`);
  
  const products = await db.product.findMany();
  
  for (const product of products) {
    let specs: any = {};
    if (product.specifications) {
      try {
        specs = JSON.parse(product.specifications);
      } catch (e) {}
    }
    
    if (specs.price_usd && !specs.is_price_locked) {
      const usdRate = liveUsdRate || specs.usd_rate_used || 60000;
      const markup = specs.markup_used ?? (specs.custom_markup || 200);
      const multiplier = (100 + markup) / 100;
      
      const newPrice = Math.round(specs.price_usd * usdRate * multiplier);
      
      specs.usd_rate_used = usdRate;
      specs.last_synced = new Date().toISOString(); 
      
      await db.product.update({
        where: { id: product.id },
        data: {
          price: newPrice,
          specifications: JSON.stringify(specs)
        }
      });
      console.log(`Updated ${product.title} to ${newPrice} (USD: ${specs.price_usd}, Markup: ${markup}%)`);
    }
  }
}

main().catch(console.error).finally(() => db.$disconnect());
