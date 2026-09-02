const fs = require('fs');
let c = fs.readFileSync('src/components/admin/product-form.tsx', 'utf8');

c = c.replace(/customMarkup: \(\(\) => {[\s\S]*?}\)\(\),/, `customMarkup: (() => {
        try { return JSON.parse(initial?.specifications || "{}").custom_markup?.toString() || ""; } catch { return ""; }
      })(),
      torobUrl: (() => {
        try { return JSON.parse(initial?.specifications || "{}").torob_url || ""; } catch { return ""; }
      })(),
      torobUndercut: (() => {
        try { return JSON.parse(initial?.specifications || "{}").torob_undercut?.toString() || "5"; } catch { return "5"; }
      })(),
      torobFloor: (() => {
        try { return JSON.parse(initial?.specifications || "{}").torob_floor?.toString() || "15"; } catch { return "15"; }
      })(),`);

fs.writeFileSync('src/components/admin/product-form.tsx', c);
console.log('Patched initialization');
