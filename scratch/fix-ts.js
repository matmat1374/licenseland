const fs = require('fs');

let c = fs.readFileSync('src/lib/supplier.ts', 'utf8');

// 1. Remove the old existing declaration
c = c.replace('const existing = await db.product.findUnique({ where: { slug } });', '');

// 2. Insert it right after slug declaration
c = c.replace('const slug = slugifyFa(slugBase);\n      if (!slug) { skipped++; continue; }', 'const slug = slugifyFa(slugBase);\n      if (!slug) { skipped++; continue; }\n      const existing = await db.product.findUnique({ where: { slug } });');

// 3. Fix the err.message typing issue
c = c.replace(/catch \(err\) \{/g, 'catch (err: any) {');

fs.writeFileSync('src/lib/supplier.ts', c, 'utf8');
console.log('Fixed typescript errors in supplier.ts');
