const fs = require('fs');

let c = fs.readFileSync('src/lib/supplier.ts', 'utf8');

// We want to hook into the loop inside `importProductsFromSupplier`
// The loop starts with `for (const sp of products) {`
// Then it has `const title = pickTitle(sp);`

const targetStr = 'const title = pickTitle(sp);';
const insertion = `let title = pickTitle(sp);
    
    // Fix Numeric Game Titles
    if (/\\bCP\\b/.test(title) && /^\\d/.test(title)) title = "Call of Duty Mobile - " + title;
    else if (/\\bUC\\b/.test(title) && /^\\d/.test(title)) title = "PUBG Mobile - " + title;
`;

if (!c.includes('// Fix Numeric Game Titles')) {
    c = c.replace(targetStr, insertion);
}

// Now the image part. Inside the update and create blocks:
// `image: sp.image || sp.imageUrl || sp.images?.[0] || existing.image,`
// Let's replace that with a function call to a new `pickImage` function

const newPickImageFunc = `
function pickImage(sp: any, title: string, existingImage?: string | null): string | null {
  const psnSvg = \`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%23003791"/><text x="50" y="65" font-family="Arial" font-weight="bold" font-size="35" fill="white" text-anchor="middle">PSN</text></svg>\`;
  const codSvg = \`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23111"/><text x="50" y="65" font-family="Arial" font-weight="900" font-style="italic" font-size="40" fill="%23f9a01b" text-anchor="middle">CoD</text></svg>\`;
  const pubgSvg = \`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23e59000"/><text x="50" y="62" font-family="Arial" font-weight="900" font-size="30" fill="white" text-anchor="middle">PUBG</text></svg>\`;

  if (/playstation|psn/i.test(title)) return psnSvg;
  if (/call of duty/i.test(title)) return codSvg;
  if (/pubg/i.test(title)) return pubgSvg;

  const rawImage = sp.image || sp.imageUrl || (sp.images && sp.images[0]) || existingImage;
  
  if (!rawImage || rawImage.includes('wikimedia')) {
    const rules = [
      { match: /telegram/i, url: 'https://img.icons8.com/color/512/telegram-app.png' },
      { match: /netflix/i, url: 'https://img.icons8.com/color/512/netflix.png' },
      { match: /spotify/i, url: 'https://img.icons8.com/color/512/spotify.png' },
      { match: /chatgpt|gpt|openai/i, url: 'https://img.icons8.com/color/512/chatgpt.png' },
      { match: /claude|anthropic/i, url: 'https://img.icons8.com/color/512/bot.png' },
      { match: /canva/i, url: 'https://img.icons8.com/color/512/canva.png' },
      { match: /adobe|photoshop|premiere|illustrator/i, url: 'https://img.icons8.com/color/512/adobe-creative-cloud.png' },
      { match: /figma/i, url: 'https://img.icons8.com/color/512/figma.png' },
      { match: /xbox/i, url: 'https://img.icons8.com/color/512/xbox.png' },
      { match: /steam/i, url: 'https://img.icons8.com/color/512/steam.png' },
      { match: /apple|itunes/i, url: 'https://img.icons8.com/color/512/mac-os.png' },
      { match: /discord|nitro/i, url: 'https://img.icons8.com/color/512/discord-logo.png' },
      { match: /google|youtube/i, url: 'https://img.icons8.com/color/512/google-logo.png' },
      { match: /microsoft|office|windows/i, url: 'https://img.icons8.com/color/512/windows-10.png' },
    ];
    for (const rule of rules) {
      if (rule.match.test(title)) return rule.url;
    }
  }
  return rawImage || null;
}
`;

if (!c.includes('function pickImage')) {
    c = c.replace('function pickDescription', newPickImageFunc + '\nfunction pickDescription');
    c = c.replace(/image: sp\.image \|\| sp\.imageUrl \|\| sp\.images\?\.\[0\] \|\| existing\.image,/g, 'image: pickImage(sp, title, existing.image),');
    c = c.replace(/image: sp\.image \|\| sp\.imageUrl \|\| sp\.images\?\.\[0\],/g, 'image: pickImage(sp, title),');
}

fs.writeFileSync('src/lib/supplier.ts', c, 'utf8');
console.log('Supplier rules patched');
