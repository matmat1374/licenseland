const fs = require('fs');

let c = fs.readFileSync('src/lib/supplier.ts', 'utf8');

const targetStr = 'if (!slug) { skipped++; continue; }';
const replacement = targetStr + '\n      const existing = await db.product.findUnique({ where: { slug } });';

// Prevent duplicate insertions
if (!c.includes('const existing = await db.product.findUnique({ where: { slug } });')) {
    c = c.replace(targetStr, replacement);
}

// Fix err typing
c = c.replace(/catch \(err\) \{/g, 'catch (err: any) {');

fs.writeFileSync('src/lib/supplier.ts', c, 'utf8');
console.log('Fixed typescript existing and err properly.');
