const fs = require('fs');

let c = fs.readFileSync('src/lib/supplier.ts', 'utf8');

// 1. Completely remove the exact line from wherever it is.
c = c.replace('const existing = await db.product.findUnique({ where: { slug } });', '');

// 2. Put it right before `// --- Translation Logic ---`
c = c.replace('// --- Translation Logic ---', 'const existing = await db.product.findUnique({ where: { slug } });\n      // --- Translation Logic ---');

fs.writeFileSync('src/lib/supplier.ts', c, 'utf8');
console.log('Fixed typescript existing properly by moving it up.');
