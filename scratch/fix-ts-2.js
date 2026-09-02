const fs = require('fs');
let c = fs.readFileSync('src/lib/supplier.ts', 'utf8');

// 1. Remove the old existing declaration
c = c.replace('const existing = await db.product.findUnique({ where: { slug } });', '');

// 2. Insert it before description parsing
c = c.replace('let rawDesc = pickDescription(sp)', 'const slugBase = sp.id ? `${sp.id}-${title}` : title;\n      const slug = slugifyFa(slugBase);\n      const existing = await db.product.findUnique({ where: { slug } });\n      let rawDesc = pickDescription(sp)');

// 3. Fix the err.message typing issue
c = c.replace(/catch \(err\) \{/g, 'catch (err: any) {');

fs.writeFileSync('src/lib/supplier.ts', c, 'utf8');
console.log('Fixed typescript errors robustly');
