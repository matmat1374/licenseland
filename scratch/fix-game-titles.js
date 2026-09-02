const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

const psnSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%23003791"/><text x="50" y="65" font-family="Arial" font-weight="bold" font-size="35" fill="white" text-anchor="middle">PSN</text></svg>`;
const codSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23111"/><text x="50" y="65" font-family="Arial" font-weight="900" font-style="italic" font-size="40" fill="%23f9a01b" text-anchor="middle">CoD</text></svg>`;
const pubgSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23e59000"/><text x="50" y="62" font-family="Arial" font-weight="900" font-size="30" fill="white" text-anchor="middle">PUBG</text></svg>`;

async function run() {
  const products = await db.product.findMany();
  let updatedCount = 0;
  
  for (const p of products) {
    let newTitle = p.title;
    let newImage = p.image;
    let changed = false;
    
    // Fix CP (Call of Duty)
    if (/\bCP\b/.test(p.title) && /^\d/.test(p.title)) {
      newTitle = `Call of Duty Mobile - ${p.title}`;
      newImage = codSvg;
      changed = true;
    }
    // Fix UC (PUBG)
    else if (/\bUC\b/.test(p.title) && /^\d/.test(p.title)) {
      newTitle = `PUBG Mobile - ${p.title}`;
      newImage = pubgSvg;
      changed = true;
    }
    // Fix PlayStation / PSN
    if (/playstation|psn/i.test(p.title)) {
      newImage = psnSvg;
      changed = true;
    }
    
    if (changed) {
      console.log(`Updating: ${newTitle}`);
      await db.product.update({
        where: { id: p.id },
        data: { title: newTitle, image: newImage }
      });
      updatedCount++;
    }
  }
  console.log(`Updated ${updatedCount} products.`);
}

run().catch(console.error).finally(() => db.$disconnect());
