import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function cleanProducts() {
  const products = await db.product.findMany();
  let updated = 0;
  
  for (const p of products) {
    let changed = false;
    
    // Clean features
    let features: string[] = [];
    try {
      features = JSON.parse(p.features);
    } catch(e) {}
    
    const newFeatures = features.filter((f: string) => !f.includes('$') && !f.includes('U,UOU.O') && !f.toLowerCase().includes('usd'));
    
    // Check description
    let newDesc = p.description;
    if (newDesc.includes('$') || newDesc.includes('U.OO') || newDesc.includes('USD') || newDesc.match(/[a-zA-Z]{20,}/)) {
      newDesc = `## ${p.title}\n\nخرید لایسنس و اشتراک پریمیوم با بهترین قیمت و تحویل آنی. محصولی بی‌نظیر برای استفاده شما با بالاترین کیفیت ممکن.\n\n### تضمین کیفیت\nاین محصول به صورت مستقیم تأمین شده و دارای ضمانت اصالت و پشتیبانی می‌باشد.`;
    }

    if (JSON.stringify(features) !== JSON.stringify(newFeatures) || newDesc !== p.description) {
      await db.product.update({
        where: { id: p.id },
        data: {
          features: JSON.stringify(newFeatures),
          description: newDesc
        }
      });
      updated++;
    }
  }
  
  console.log(`Cleaned ${updated} products.`);
}

cleanProducts();
