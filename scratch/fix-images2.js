const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

const IMAGE_RULES = [
  { match: /uc|pubg/i, url: 'https://img.icons8.com/color/512/pubg.png' },
  { match: /cp|call of duty/i, url: 'https://img.icons8.com/color/512/call-of-duty-mobile.png' },
  { match: /telegram/i, url: 'https://img.icons8.com/color/512/telegram-app.png' },
  { match: /netflix/i, url: 'https://img.icons8.com/color/512/netflix.png' },
  { match: /spotify/i, url: 'https://img.icons8.com/color/512/spotify.png' },
  { match: /chatgpt|gpt|openai/i, url: 'https://img.icons8.com/color/512/chatgpt.png' },
  { match: /claude|anthropic/i, url: 'https://img.icons8.com/color/512/bot.png' },
  { match: /canva/i, url: 'https://img.icons8.com/color/512/canva.png' },
  { match: /adobe|photoshop|premiere|illustrator/i, url: 'https://img.icons8.com/color/512/adobe-creative-cloud.png' },
  { match: /figma/i, url: 'https://img.icons8.com/color/512/figma.png' },
  { match: /playstation|psn/i, url: 'https://img.icons8.com/color/512/playstation.png' },
  { match: /xbox/i, url: 'https://img.icons8.com/color/512/xbox.png' },
  { match: /steam/i, url: 'https://img.icons8.com/color/512/steam.png' },
  { match: /apple|itunes/i, url: 'https://img.icons8.com/color/512/mac-os.png' },
  { match: /discord|nitro/i, url: 'https://img.icons8.com/color/512/discord-logo.png' },
  { match: /google|youtube/i, url: 'https://img.icons8.com/color/512/google-logo.png' },
  { match: /microsoft|office|windows/i, url: 'https://img.icons8.com/color/512/windows-10.png' },
  { match: /duolingo/i, url: 'https://img.icons8.com/color/512/duolingo-logo.png' },
  { match: /genspark/i, url: 'https://img.icons8.com/color/512/sparkling.png' },
  { match: /api|codex/i, url: 'https://img.icons8.com/color/512/api.png' },
  { match: /number|sms/i, url: 'https://img.icons8.com/color/512/sim-card-chip.png' },
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
    
    // If the image is currently wikimedia, or if we found a rule, let's forcefully override
    if (targetImg && (!p.image || p.image.includes('wikimedia') || p.image !== targetImg)) {
      await db.product.update({
        where: { id: p.id },
        data: { image: targetImg }
      });
      updated++;
    } else if (p.image && p.image.includes('wikimedia')) {
        // null out broken images so fallback works
        await db.product.update({
            where: { id: p.id },
            data: { image: null }
        });
        updated++;
    }
  }
  
  console.log('Fixed images for ' + updated + ' products.');
}

assignImages().catch(console.error);
