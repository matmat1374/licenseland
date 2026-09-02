const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

const IMAGE_RULES = [
  { match: /eleven/i, url: 'https://img.icons8.com/color/512/audio-wave.png' },
  { match: /cursor/i, url: 'https://img.icons8.com/color/512/programming-flag.png' },
  { match: /capcut/i, url: 'https://img.icons8.com/color/512/video-editing.png' },
  { match: /autodesk|autocad|3ds/i, url: 'https://img.icons8.com/color/512/autocad.png' },
  { match: /amazon prime/i, url: 'https://img.icons8.com/color/512/amazon-prime-video.png' },
  { match: /facebook/i, url: 'https://img.icons8.com/color/512/facebook-new.png' },
];

async function assignImages() {
  const products = await db.product.findMany();
  let updated = 0;
  
  for (const p of products) {
    let targetImg = null;
    for (const rule of IMAGE_RULES) {
      if (rule.match.test(p.title) || rule.match.test(p.category) || (p.brand && rule.match.test(p.brand))) {
        targetImg = rule.url;
        break;
      }
    }
    
    // If the product matched and has no image or a blocked wikimedia one
    if (targetImg && (!p.image || p.image.includes('wikimedia') || p.image !== targetImg)) {
      await db.product.update({
        where: { id: p.id },
        data: { image: targetImg }
      });
      updated++;
    }
  }
  
  console.log('Fixed additional images for ' + updated + ' products.');
}

assignImages().catch(console.error);
