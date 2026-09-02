const fs = require('fs');
let c = fs.readFileSync('src/components/admin/product-form.tsx', 'utf8');

c = c.replace(/if \(data\.customMarkup\) sp\.custom_markup = Number\(data\.customMarkup\);\s*else delete sp\.custom_markup;\s*return sp;/, `if (data.customMarkup) sp.custom_markup = Number(data.customMarkup);
        else delete sp.custom_markup;
        if (data.torobUrl) sp.torob_url = data.torobUrl;
        else delete sp.torob_url;
        if (data.torobUndercut) sp.torob_undercut = Number(data.torobUndercut);
        if (data.torobFloor) sp.torob_floor = Number(data.torobFloor);
        return JSON.stringify(sp);`);

c = c.replace(/return \{ is_price_locked: data\.isPriceLocked \};/, 'return JSON.stringify({ is_price_locked: data.isPriceLocked });');

fs.writeFileSync('src/components/admin/product-form.tsx', c);
console.log('Fixed submit logic');
