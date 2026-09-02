const fs = require('fs');

let f = fs.readFileSync('src/components/admin/product-form.tsx', 'utf8');
f = f.replace(/isPriceLocked:\s*boolean;/, 'isPriceLocked: boolean;\n  specifications?: string;');
fs.writeFileSync('src/components/admin/product-form.tsx', f, 'utf8');
console.log("Fixed product-form.tsx");

let pm = fs.readFileSync('src/components/admin/product-manager.tsx', 'utf8');
pm = pm.replace(/isPriceLocked:\s*boolean;/, 'isPriceLocked: boolean;\n  specifications?: string;');
fs.writeFileSync('src/components/admin/product-manager.tsx', pm, 'utf8');
console.log("Fixed product-manager.tsx");

