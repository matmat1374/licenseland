const fs = require('fs');
let c = fs.readFileSync('src/components/admin/product-form.tsx', 'utf8');

c = c.replace(/if \(formData\.customMarkup\) {[\s\S]*?}/, `if (formData.customMarkup) {
        specs.custom_markup = Number(formData.customMarkup);
      }
      if (formData.torobUrl) {
        specs.torob_url = formData.torobUrl;
      }
      if (formData.torobUndercut) {
        specs.torob_undercut = Number(formData.torobUndercut);
      }
      if (formData.torobFloor) {
        specs.torob_floor = Number(formData.torobFloor);
      }`);

fs.writeFileSync('src/components/admin/product-form.tsx', c);
console.log('Patched submit');
