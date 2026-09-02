const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const products = await prisma.product.findMany();
  let updatedCount = 0;

  for (const p of products) {
    let changed = false;

    // 1. Clean features
    let currentFeatures = [];
    try {
      currentFeatures = JSON.parse(p.features || '[]');
    } catch (e) {
      currentFeatures = [];
    }

    if (Array.isArray(currentFeatures)) {
      const cleanFeatures = currentFeatures
        .filter(f => !f.includes('$') && !f.toLowerCase().includes('usd'))
        .filter(f => !/false/i.test(f) && !/true/i.test(f) && !/undefined/i.test(f))
        .map(f => f.replace(/موجود:\s*در انبار/g, 'موجودی: تضمین شده'))
        .map(f => f.replace(/موجود:\s*تضمین شده/g, 'موجودی: تضمین شده'))
        .map(f => f.replace(/\$/g, ' دلار '))
        .map(f => f.trim())
        .filter(Boolean);

      // also check if "موجود: X عدد" -> "موجودی: X عدد"
      for (let i = 0; i < cleanFeatures.length; i++) {
         if (cleanFeatures[i].startsWith('موجود:')) {
            cleanFeatures[i] = cleanFeatures[i].replace('موجود:', 'موجودی:');
         }
         // Also remove "true عدد" and "false عدد" if it somehow survived inside
         cleanFeatures[i] = cleanFeatures[i].replace(/true عدد/gi, 'تضمین شده').replace(/false عدد/gi, '');
      }

      if (JSON.stringify(currentFeatures) !== JSON.stringify(cleanFeatures)) {
        p.features = JSON.stringify(cleanFeatures);
        changed = true;
      }
    }

    // 2. Clean specifications
    let specs = {};
    try {
      specs = JSON.parse(p.specifications || '{}');
    } catch (e) {
      specs = {};
    }

    let specsChanged = false;

    if (!specs.usd_rate_used) {
      specs.usd_rate_used = 200000;
      specsChanged = true;
    }
    if (!specs.markup_used) {
      specs.markup_used = 200;
      specsChanged = true;
    }
    if (!specs.last_synced) {
      specs.last_synced = new Date().toISOString();
      specsChanged = true;
    }
    if (specs.is_price_locked === undefined) {
      specs.is_price_locked = false;
      specsChanged = true;
    }
    
    if (specs.price_usd && p.price && (!specs.usd_rate_used || specs.usd_rate_used === 60000)) {
        const usd_rate = 200000;
        let markup = 200;
        if (specs.price_usd < 1) markup = 200;
        else if (specs.price_usd < 10) markup = 150;
        else if (specs.price_usd < 20) markup = 100;
        else if (specs.price_usd < 50) markup = 80;
        else markup = 50;

        specs.markup_used = markup;
        specs.usd_rate_used = usd_rate;
        specsChanged = true;
    }

    if (specsChanged) {
        for (const k of Object.keys(specs)) {
            if (specs[k] === undefined) {
                specs[k] = null;
            }
        }
        p.specifications = JSON.stringify(specs);
        changed = true;
    }

    // 3. Update in db
    if (changed) {
      await prisma.product.update({
        where: { id: p.id },
        data: {
          features: p.features,
          specifications: p.specifications
        }
      });
      updatedCount++;
    }
  }

  console.log(`Successfully cleaned up ${updatedCount} products.`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
