const fs = require('fs');
let c = fs.readFileSync('src/lib/supplier.ts', 'utf8');

c = c.replace(/fulfillmentMode: "AUTO",/g, 'fulfillmentMode: "AUTO",\n          stock: stock > 0 ? stock : 999,');

fs.writeFileSync('src/lib/supplier.ts', c);
console.log('Fixed stock!');
