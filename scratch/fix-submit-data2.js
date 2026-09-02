const fs = require('fs');
let c = fs.readFileSync('src/components/admin/product-form.tsx', 'utf8');

c = c.replace('return JSON.stringify(sp);', 'return sp;');
c = c.replace('return JSON.stringify({ is_price_locked: data.isPriceLocked });', 'return { is_price_locked: data.isPriceLocked };');

fs.writeFileSync('src/components/admin/product-form.tsx', c);
console.log('Fixed double stringify');
