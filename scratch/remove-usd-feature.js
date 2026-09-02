const fs = require('fs');

let content = fs.readFileSync('src/lib/supplier.ts', 'utf8');

// The line is:
// if (sp.retail_usd && sp.price_usd) features.push(`قیمت خرده‌فروشی: $${sp.retail_usd}`);
// Because of encoding it might be corrupted in my view, but I can remove it with regex
content = content.replace(/if\s*\([^)]+\)\s*features\.push\([^)]+\$[^)]+\);\s*/g, '');

fs.writeFileSync('src/lib/supplier.ts', content, 'utf8');
console.log('Removed retail_usd feature push');

