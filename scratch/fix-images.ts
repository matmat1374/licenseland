import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const IMAGE_RULES = [
  { match: /uc/i, url: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9f/PUBG_Mobile_logo.jpg/220px-PUBG_Mobile_logo.jpg' },
  { match: /cp/i, url: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e9/CallofDutyMobileLogo.png/250px-CallofDutyMobileLogo.png' },
  { match: /telegram/i, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Telegram_logo.svg/512px-Telegram_logo.svg.png' },
  { match: /netflix/i, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/1024px-Netflix_2015_logo.svg.png' },
  { match: /spotify/i, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Spotify_logo_with_text.svg/1024px-Spotify_logo_with_text.svg.png' },
  { match: /chatgpt|gpt/i, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/1024px-ChatGPT_logo.svg.png' },
  { match: /midjourney/i, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Midjourney_Emblem.png/1024px-Midjourney_Emblem.png' },
  { match: /claude|anthropic/i, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Claude_Bot_logo.svg/1024px-Claude_Bot_logo.svg.png' },
  { match: /canva/i, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Canva_icon_2021.svg/1024px-Canva_icon_2021.svg.png' },
  { match: /adobe|photoshop|premiere|illustrator/i, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Adobe_A_logo.svg/512px-Adobe_A_logo.svg.png' },
  { match: /figma/i, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Figma-logo.svg/512px-Figma-logo.svg.png' },
  { match: /playstation|psn/i, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Playstation_logo_colour.svg/512px-Playstation_logo_colour.svg.png' },
  { match: /xbox/i, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Xbox_logo_%282019%29.svg/512px-Xbox_logo_%282019%29.svg.png' },
  { match: /steam/i, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/512px-Steam_icon_logo.svg.png' },
  { match: /apple|itunes/i, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/512px-Apple_logo_black.svg.png' },
  { match: /discord|nitro/i, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Discord_logo_svg.svg/512px-Discord_logo_svg.svg.png' },
  { match: /google|youtube/i, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/512px-Google_2015_logo.svg.png' },
  { match: /microsoft|office|windows/i, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Microsoft_logo_%282012%29.svg/512px-Microsoft_logo_%282012%29.svg.png' },
  { match: /duolingo/i, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Duolingo_logo.svg/512px-Duolingo_logo.svg.png' },
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
    
    // If we matched a rule, or if the product has no image, we update it
    if (targetImg && p.image !== targetImg) {
      await db.product.update({
        where: { id: p.id },
        data: { image: targetImg }
      });
      updated++;
    }
  }
  
  console.log(`Assigned/Fixed images for ${updated} products.`);
}

assignImages();
