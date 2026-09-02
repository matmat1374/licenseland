const fs = require('fs');
let c = fs.readFileSync('src/lib/supplier.ts', 'utf8');

const injection = `
  let imported = 0, updated = 0, skipped = 0;
  const details: string[] = [];

  const allExistingProducts = await db.product.findMany({ select: { id: true, slug: true, specifications: true, shortDesc: true, image: true, duration: true, price: true } });
  const existingMap = new Map();
  for (const p of allExistingProducts) {
    if (p.specifications) {
      try {
        const sp = JSON.parse(p.specifications);
        if (sp.supplier_product_id) {
          existingMap.set(String(sp.supplier_product_id), p);
        }
      } catch (e) {}
    }
  }

  for (const sp of products) {
`;

c = c.replace(/let imported = 0, updated = 0, skipped = 0;\s*const details: string\[\] = \[\];\s*for \(const sp of products\) {/, injection);

const oldLookup = `const slugCheck = slugifyFa(sp.id ? \`\${sp.id}-\${title}\` : title); const existingProd = slugCheck ? await db.product.findUnique({ where: { slug: slugCheck } }).catch(()=>null) : null;`;
const newLookup = `const slugCheck = slugifyFa(sp.id ? \`\${sp.id}-\${title}\` : title); const existingProd = existingMap.get(String(sp.id)) || (slugCheck ? await db.product.findUnique({ where: { slug: slugCheck } }).catch(()=>null) : null);`;

c = c.replace(oldLookup, newLookup);

fs.writeFileSync('src/lib/supplier.ts', c);
console.log('Patched lookup!');
