const fs = require('fs');

const domainMapCode = `
const DOMAIN_MAP: Record<string, string> = {
  chatgpt: "openai.com",
  gpt: "openai.com",
  spotify: "spotify.com",
  netflix: "netflix.com",
  telegram: "telegram.org",
  pubg: "pubg.com",
  "call of duty": "callofduty.com",
  coursera: "coursera.org",
  hotmail: "outlook.live.com",
  outlook: "outlook.live.com",
  instagram: "instagram.com",
  apple: "apple.com",
  playstation: "playstation.com",
  psn: "playstation.com",
  xbox: "xbox.com",
  steam: "steampowered.com",
  canva: "canva.com",
  adobe: "adobe.com",
  figma: "figma.com",
  discord: "discord.com",
  duolingo: "duolingo.com",
  claude: "anthropic.com",
  notion: "notion.so",
  zoom: "zoom.us",
  replit: "replit.com",
  amazon: "amazon.com",
  microsoft: "microsoft.com",
  windows: "microsoft.com",
  google: "google.com",
  youtube: "youtube.com",
  tiktok: "tiktok.com",
  midjourney: "midjourney.com",
  capcut: "capcut.com",
};

function getBrandDomain(title: string): string | null {
  const t = title.toLowerCase();
  for (const [key, domain] of Object.entries(DOMAIN_MAP)) {
    if (t.includes(key)) return domain;
  }
  return null;
}
`;

let content = fs.readFileSync('src/components/site/product-cover.tsx', 'utf8');

if (!content.includes('DOMAIN_MAP')) {
    content = content.replace('export function ProductCover', domainMapCode + '\nexport function ProductCover');
}

// Modify the logic to use getBrandDomain
const logicTarget = `const [imgError, setImgError] = React.useState(false);`;
const logicReplacement = `const [imgError, setImgError] = React.useState(false);
  
  let finalImage = image;
  if (!finalImage || finalImage.includes('icons8') || finalImage.includes('wikimedia')) {
    const domain = getBrandDomain(title);
    if (domain) {
      finalImage = \`https://icon.horse/icon/\${domain}\`;
    }
  }
  // Clear error if image changes
  React.useEffect(() => { setImgError(false); }, [finalImage]);
`;

if (!content.includes('let finalImage = image;')) {
    content = content.replace(logicTarget, logicReplacement);
    content = content.replace(/image && !imgError/g, 'finalImage && !imgError');
    content = content.replace(/src={image}/g, 'src={finalImage}');
}

fs.writeFileSync('src/components/site/product-cover.tsx', content, 'utf8');
console.log('patched ProductCover');
