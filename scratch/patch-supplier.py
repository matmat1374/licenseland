import re
import sys

with open('src/lib/supplier.ts', 'r', encoding='utf-8') as f:
    content = f.read()

new_func = """// Categorize products based on name/brand
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
    return { slug: "streaming", name: "استریم و موسیقی" };
  if (/vpn|nord|express|surfshark|kaspersky|malware|antivirus|security/.test(title))
    return { slug: "security", name: "امنیت" };
  if (/steam|playstation|xbox|game/.test(title))
    return { slug: "gaming", name: "بازی" };
  if (/capcut|adobe|photoshop|premiere|canva|filmora|camtasia|figma|design/.test(title))
    return { slug: "design", name: "طراحی و ویرایش" };
  return { slug: "software", name: "نرم‌افزار تخصصی" };
}"""

# find function categorizeProduct(p: SupplierProduct): { slug: string; name: string } {
# and replace it up to the next function export async function importProductsFromSupplier(
pattern = re.compile(r'// Categorize products based on name/brand.*?function categorizeProduct.*?return { slug: "software", name: "[^"]+" };\n}', re.DOTALL)

if pattern.search(content):
    content = pattern.sub(new_func, content)
    with open('src/lib/supplier.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched categorizeProduct!")
else:
    print("Could not find categorizeProduct match!")

# Also patch the shortDesc map to fallback properly, wait, user wants Persian descriptions
# Right now shortDesc is sp.shortDesc or title. We can just use python to add a translation step?
# Not needed right here.
