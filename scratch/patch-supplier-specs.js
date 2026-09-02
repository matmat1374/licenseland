const fs = require('fs');

let c = fs.readFileSync('src/lib/supplier.ts', 'utf8');

c = c.replace(/if \(oldSpecs\.is_price_locked\) \{/, `if (oldSpecs.custom_markup !== undefined) {
                  specs.custom_markup = oldSpecs.custom_markup;
              }
              if (oldSpecs.is_price_locked) {`);

fs.writeFileSync('src/lib/supplier.ts', c);
console.log('Supplier specs patched!');
