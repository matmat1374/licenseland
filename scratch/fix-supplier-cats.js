const fs = require('fs');

let content = fs.readFileSync('src/lib/supplier.ts', 'utf8');

const newCode = `// Categorize products based on name/brand
const API_CATEGORY_MAP: Record<string, { slug: string, name: string }> = {
  "ai chatbots": { slug: "ai", name: "هوش مصنوعی" },
  "ai video & image": { slug: "ai-media", name: "هوش مصنوعی تصویر و ویدیو" },
  "accounts & ai video": { slug: "ai-media", name: "هوش مصنوعی تصویر و ویدیو" },
  "design tools": { slug: "design", name: "طراحی و ویرایش" },
  "apis & dev tools": { slug: "software", name: "نرم‌افزار و توسعه" },
  "productivity": { slug: "productivity", name: "ابزارهای بهره‌وری" },
  "nitro": { slug: "gaming", name: "بازی و سرگرمی" },
  "psn (us)": { slug: "gaming", name: "بازی و سرگرمی" },
  "play - us": { slug: "giftcards", name: "گیفت کارت" },
  "itunes - us": { slug: "giftcards", name: "گیفت کارت" },
  "uc (global)": { slug: "gaming", name: "بازی و سرگرمی" },
  "cp (in)": { slug: "gaming", name: "بازی و سرگرمی" },
  "followers": { slug: "social", name: "شبکه‌های اجتماعی" },
  "stars": { slug: "social", name: "شبکه‌های اجتماعی" },
  "premium": { slug: "streaming", name: "فیلم و موسیقی" },
  "otp numbers": { slug: "virtual-numbers", name: "شماره مجازی" },
};

function categorizeProduct(p: SupplierProduct): { slug: string; name: string } {
  const title = pickTitle(p).toLowerCase();
  let cat = (p.category || "").toString().toLowerCase();
  
  let matched = API_CATEGORY_MAP[cat];
  if (!matched && cat) {
     matched = API_CATEGORY_MAP[cat.replace(/-/g, ' ')];
  }
  if (matched) {
     return matched;
  }

  if (cat) {
    const slug = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return { slug: slug || 'other', name: p.category ? String(p.category) : cat };
  }
  if (/chatgpt|claude|gemini|midjourney|perplexity|copilot|ai |gpt|dall-e|leonardo|grammarly/.test(title))
    return { slug: "ai", name: "هوش مصنوعی" };
  if (/spotify|netflix|youtube|disney|apple\\s*music|soundcloud/.test(title))
    return { slug: "streaming", name: "فیلم و موسیقی" };
  if (/vpn|nord|express|surfshark|kaspersky|malware|antivirus|security/.test(title))
    return { slug: "security", name: "امنیت" };
  if (/steam|playstation|xbox|game/.test(title))
    return { slug: "gaming", name: "بازی" };
  if (/capcut|adobe|photoshop|premiere|canva|filmora|camtasia|figma|design/.test(title))
    return { slug: "design", name: "طراحی و ویرایش" };
  return { slug: "software", name: "نرم‌افزار تخصصی" };
}

export async function importProductsFromSupplier(`;

// Replace from `    return { slug: "security", name: "امنیت" };` back to before.
// Actually just replace from `    return { slug: "security", name: "امنیت" };` up to `export async function importProductsFromSupplier`
const matchRegex = /    return \{ slug: "security", name: "امنیت" \};\s*if \(\/steam\|playstation\|xbox\|game\/\.test\(title\)\)\s*return \{ slug: "gaming", name: "بازی" \};\s*if \(\/capcut\|adobe\|photoshop\|premiere\|canva\|filmora\|camtasia\|figma\|design\/\.test\(title\)\)\s*return \{ slug: "design", name: "طراحی و ویرایش" \};\s*return \{ slug: "software", name: "نرم‌افزار تخصصی" \};\s*\}\s*export async function importProductsFromSupplier\(/g;

if (content.match(matchRegex)) {
  content = content.replace(matchRegex, newCode);
  fs.writeFileSync('src/lib/supplier.ts', content, 'utf8');
  console.log('Supplier updated!');
} else {
  console.log('Regex did not match!');
}
