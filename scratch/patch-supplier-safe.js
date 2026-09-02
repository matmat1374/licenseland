const fs = require('fs');

let content = fs.readFileSync('src/lib/supplier.ts', 'utf8');

// 1. Replace categorizeProduct entirely
const catStart = content.indexOf('function categorizeProduct(p: SupplierProduct)');
const catEnd = content.indexOf('export async function importProductsFromSupplier');

if (catStart > -1 && catEnd > -1) {
    const newCatCode = `// Categorize products based on name/brand
const API_CATEGORY_MAP: Record<string, { slug: string, name: string }> = {
  "ai chatbots": { slug: "ai", name: "هوش مصنوعی" },
  "ai-chatbots": { slug: "ai", name: "هوش مصنوعی" },
  "ai video & image": { slug: "ai-media", name: "هوش مصنوعی تصویر" },
  "ai-video-image": { slug: "ai-media", name: "هوش مصنوعی تصویر" },
  "accounts & ai video": { slug: "ai-media", name: "هوش مصنوعی تصویر" },
  "accounts-ai-video": { slug: "ai-media", name: "هوش مصنوعی تصویر" },
  "design tools": { slug: "design", name: "طراحی و ویرایش" },
  "design-tools": { slug: "design", name: "طراحی و ویرایش" },
  "apis & dev tools": { slug: "software", name: "نرم‌افزار و توسعه" },
  "apis-dev-tools": { slug: "software", name: "نرم‌افزار و توسعه" },
  "productivity": { slug: "productivity", name: "ابزارهای بهره‌وری" },
  "nitro": { slug: "gaming", name: "بازی و سرگرمی" },
  "psn (us)": { slug: "gaming", name: "بازی و سرگرمی" },
  "psn-us": { slug: "gaming", name: "بازی و سرگرمی" },
  "play - us": { slug: "giftcards", name: "گیفت کارت" },
  "play-us": { slug: "giftcards", name: "گیفت کارت" },
  "itunes - us": { slug: "giftcards", name: "گیفت کارت" },
  "itunes-us": { slug: "giftcards", name: "گیفت کارت" },
  "uc (global)": { slug: "gaming", name: "بازی و سرگرمی" },
  "uc-global": { slug: "gaming", name: "بازی و سرگرمی" },
  "cp (in)": { slug: "gaming", name: "بازی و سرگرمی" },
  "cp-in": { slug: "gaming", name: "بازی و سرگرمی" },
  "followers": { slug: "social", name: "شبکه‌های اجتماعی" },
  "stars": { slug: "social", name: "شبکه‌های اجتماعی" },
  "premium": { slug: "streaming", name: "فیلم و موسیقی" },
  "otp numbers": { slug: "virtual-numbers", name: "شماره مجازی" },
  "otp-numbers": { slug: "virtual-numbers", name: "شماره مجازی" },
  "virtual-numbers": { slug: "virtual-numbers", name: "شماره مجازی" },
  "other": { slug: "other", name: "سایر محصولات" },
};

function categorizeProduct(p: SupplierProduct): { slug: string; name: string } {
  const title = pickTitle(p).toLowerCase();
  let cat = (p.category || "").toString().toLowerCase();
  
  let matched = API_CATEGORY_MAP[cat];
  if (!matched && cat) {
     matched = API_CATEGORY_MAP[cat.replace(/-/g, ' ')];
  }
  if (matched) return matched;
  if (cat) {
    const slug = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return { slug: slug || 'other', name: p.category ? String(p.category) : cat };
  }
  return { slug: "software", name: "نرم‌افزار تخصصی" };
}

`;
    content = content.substring(0, catStart) + newCatCode + content.substring(catEnd);
}

// 2. Remove USD logic from description and features
const featStart = content.indexOf('const features: string[] = Array.isArray(sp.features)');
const descEnd = content.indexOf('const { slug: catSlug, name: catName } = categorizeProduct(sp);');

if (featStart > -1 && descEnd > -1) {
    const newFeatCode = `const features: string[] = Array.isArray(sp.features) ? sp.features : (sp.features ? String(sp.features).split("\\n").filter(Boolean) : []);
      if (features.length === 0) {
        if (sp.discount_percent) features.push(\`تخفیف ویژه: \${sp.discount_percent}%\`);
        if (sp.duration_days) features.push(\`مدت زمان: \${sp.duration_days} روز\`);
      }
      // Filter out USD prices completely to prevent any accidental display
      const cleanFeatures = features.filter(f => !f.includes('$') && !f.toLowerCase().includes('usd'));

      const description = pickDescription(sp) || \`## \${title}\\n\\nخرید لایسنس و اشتراک پریمیوم با بهترین قیمت و تحویل آنی.\\n\\n### تضمین کیفیت\\nاین محصول به صورت مستقیم تأمین شده و دارای ضمانت اصالت و پشتیبانی می‌باشد.\`;
      
      `;
    content = content.substring(0, featStart) + newFeatCode + content.substring(descEnd);
}

// Add features field in upsert/update since I changed the variable name
content = content.replace(/features: JSON.stringify\(features\)/g, 'features: JSON.stringify(cleanFeatures)');

fs.writeFileSync('src/lib/supplier.ts', content, 'utf8');
console.log('Supplier patched successfully!');
