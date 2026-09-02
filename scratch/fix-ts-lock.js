const fs = require('fs');

// 1. Fix product-form.tsx
let f = fs.readFileSync('src/components/admin/product-form.tsx', 'utf8');
if (!f.includes('specifications?: string;')) {
    f = f.replace('isPriceLocked: boolean;\n}', 'isPriceLocked: boolean;\n  specifications?: string;\n}');
    fs.writeFileSync('src/components/admin/product-form.tsx', f, 'utf8');
}

// 2. Fix product-manager.tsx
let pm = fs.readFileSync('src/components/admin/product-manager.tsx', 'utf8');
if (!pm.includes('isPriceLocked:')) {
    pm = pm.replace(/isActive: p\.isActive,/g, 'isActive: p.isActive,\n                        isPriceLocked: (() => {\n                            try { return JSON.parse(p.specifications || "{}").is_price_locked || false; } catch { return false; }\n                        })(),\n                        specifications: p.specifications || undefined,');
    fs.writeFileSync('src/components/admin/product-manager.tsx', pm, 'utf8');
}

console.log("Types fixed");
