const { PrismaClient } = require('@prisma/client');
const { translate } = require('google-translate-api-x');

const db = new PrismaClient();

async function run() {
  const products = await db.product.findMany();
  let count = 0;
  
  for (const p of products) {
    // If the description contains English words/letters, let's translate it!
    if (/[a-zA-Z]{4,}/.test(p.description)) {
      try {
        console.log(`Translating: ${p.title}`);
        const res = await translate(p.description, { to: 'fa' });
        
        await db.product.update({
          where: { id: p.id },
          data: { description: res.text }
        });
        
        count++;
        // Small delay to prevent rate limit
        await new Promise(r => setTimeout(r, 200));
      } catch (err) {
        console.error(`Failed to translate ${p.id}: ${err.message}`);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
  
  console.log(`Done! Translated ${count} mixed/English descriptions.`);
}

run().catch(console.error).finally(() => db.$disconnect());
