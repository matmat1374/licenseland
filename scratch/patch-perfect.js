const fs = require('fs');
let c = fs.readFileSync('src/lib/supplier.ts', 'utf8');

c = c.split('import { IrMarketClient } from "@kernel/supplier/provider";').join('import { IrMarketClient } from "@kernel/supplier/provider";\nimport translate from "google-translate-api-x";');

c = c.replace(/const markupBps = markup \* 100;.*?\n/, `
    let dynamicMarkup = markup;
    if (priceUSD < 1) dynamicMarkup = 200;
    else if (priceUSD < 10) dynamicMarkup = 150;
    else if (priceUSD < 20) dynamicMarkup = 100;
    else if (priceUSD < 50) dynamicMarkup = 80;
    else dynamicMarkup = 50;

    const existingProd = await db.product.findUnique({ where: { slug: slugifyFa(sp.id ? \`\${sp.id}-\${pickTitle(sp)}\` : pickTitle(sp)) || pickTitle(sp) } }).catch(()=>null);
    let specsToParse: any = {};
    if (existingProd && existingProd.specifications) {
       try { specsToParse = JSON.parse(existingProd.specifications); } catch(e){}
    }

    if (specsToParse.custom_markup !== undefined && specsToParse.custom_markup !== null) {
        dynamicMarkup = Number(specsToParse.custom_markup);
    }

    const markupBps = dynamicMarkup * 100; 
`);

const targetBlock = `    const description = pickDescription(sp) || \`## \${title}\\n\\nمحصول اوریجینال با تحویل آنی.\\n\\n### مشخصات\\n- قیمت پایه: $\${priceUSD}\\n- نرخ تبدیل: \${usdRate.toLocaleString("fa-IR")} تومان به ازای هر دلار\\n- حاشیه: \${markup}٪\`;`;

const newTranslationBlock = `
    let rawDesc = pickDescription(sp) || \`## \${title}\\n\\nخرید لایسنس و اشتراک پریمیوم با بهترین قیمت و تحویل آنی.\\n\\n### تضمین کیفیت\\nاین محصول به صورت مستقیم تأمین شده و دارای ضمانت اصالت و پشتیبانی می‌باشد.\`;
    let finalDesc = rawDesc;
    
    const hasPersian = /[\\u0600-\\u06FF]/.test(rawDesc);
    if (!hasPersian && existingProd && existingProd.description && /[\\u0600-\\u06FF]/.test(existingProd.description)) {
        finalDesc = existingProd.description;
    } else if (!hasPersian && rawDesc) {
        try {
            const res = await translate(rawDesc, { to: 'fa' });
            finalDesc = res.text;
        } catch (err: any) {
            console.error("Translation failed for", title, err?.message);
        }
    }
    const description = finalDesc;
    
    // clean features
    const cleanFeatures = features.filter(f => !f.includes('$') && !f.toLowerCase().includes('usd')).map(f => f.replace(/true عدد/g, 'تضمین شده').replace(/موجود: در انبار/g, 'موجودی: تضمین شده'));
`;

c = c.split(targetBlock).join(newTranslationBlock);
c = c.split('features: JSON.stringify(features)').join('features: JSON.stringify(cleanFeatures)');
c = c.split('const existing = await db.product.findUnique({ where: { slug } });').join('const existing = existingProd;');

const targetUpdate = `          image: sp.image || sp.imageUrl || sp.images?.[0] || existing.image,
          isActive: true,`;
const targetUpdateReplace = `          image: sp.image || sp.imageUrl || sp.images?.[0] || existing.image,
          price: specsToParse.is_price_locked ? existing.price : sellPriceToman,
          specifications: JSON.stringify({ supplier_product_id: sp.id, price_usd: priceUSD, pricing_unit: sp.pricing_unit, requires_email: sp.requires_email, requires_link: sp.requires_link, is_price_locked: specsToParse.is_price_locked, custom_markup: specsToParse.custom_markup }),`;
c = c.split(targetUpdate).join(targetUpdateReplace);

const targetCreate = `          image: sp.image || sp.imageUrl || sp.images?.[0] || null,
          isActive: true,`;
const targetCreateReplace = `          image: sp.image || sp.imageUrl || sp.images?.[0] || null,
          isActive: false,`;
c = c.split(targetCreate).join(targetCreateReplace);

c = c.split('{(100+markup)/100}').join('{((100+dynamicMarkup)/100).toFixed(2)}');

const new_func = `// Categorize products based on name/brand
const API_CATEGORY_MAP: Record<string, { slug: string, name: string }> = {
  "ai chatbots": { slug: "ai", name: "هوش مصنوعی" },
  "ai video & image": { slug: "ai-media", name: "هوش مصنوعی تصویر و ویدیو" },
  "accounts & ai video": { slug: "ai-media", name: "هوش مصنوعی تصویر و ویدیو" },
  "design tools": { slug: "design", name: "طراحی و گرافیک" },
  "apis & dev tools": { slug: "software", name: "نرم‌افزار و توسعه" },
  "productivity": { slug: "productivity", name: "ابزار کاربردی" },
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
  if (matched) return matched;

  if (cat) {
    const slug = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return { slug: slug || 'other', name: p.category ? String(p.category) : cat };
  }
  if (/chatgpt|claude|gemini|midjourney|perplexity|copilot|ai |gpt|dall-e|leonardo|grammarly/.test(title)) return { slug: "ai", name: "هوش مصنوعی" };
  if (/spotify|netflix|youtube|disney|apple\\s*music|soundcloud/.test(title)) return { slug: "streaming", name: "فیلم و موسیقی" };
  if (/vpn|nord|express|surfshark|kaspersky|malware|antivirus|security/.test(title)) return { slug: "security", name: "امنیت" };
  if (/steam|playstation|xbox|game/.test(title)) return { slug: "gaming", name: "بازی" };
  if (/capcut|adobe|photoshop|premiere|canva|filmora|camtasia|figma|design/.test(title)) return { slug: "design", name: "طراحی و گرافیک" };
  return { slug: "software", name: "نرم‌افزار عمومی" };
}
`;

const startIdx = c.indexOf('function categorizeProduct');
const endIdx = c.indexOf('export async function importProductsFromSupplier');
if (startIdx !== -1 && endIdx !== -1) {
    c = c.substring(0, startIdx) + new_func + '\n' + c.substring(endIdx);
}

fs.writeFileSync('src/lib/supplier.ts', c, 'utf8');
console.log("Pristine patch applied beautifully!");
