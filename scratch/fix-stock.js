const fs = require('fs');
let c = fs.readFileSync('src/lib/supplier.ts', 'utf8');

c = c.replace(
  'fulfillmentMode: "AUTO",\n        },\n      });\n      updated++;',
  'fulfillmentMode: "AUTO",\n          stock: stock > 0 ? stock : 999,\n        },\n      });\n      updated++;'
);

c = c.replace(
  'stock: 0, // we don\'t pre-stock; purchase on-demand',
  'stock: stock > 0 ? stock : 999, // use supplier stock or assume infinite for API products'
);

fs.writeFileSync('src/lib/supplier.ts', c);
console.log('Fixed stock logic in supplier.ts');
