const fs = require('fs');
let c = fs.readFileSync('src/lib/supplier.ts', 'utf8');

c = c.replace('isActive: false, // Draft by default for new API products\n              // store supplier product id', 'isActive: existingProd.isActive,\n            // store supplier product id');

c = c.replace(/image: sp\.image \|\| sp\.imageUrl \|\| sp\.images\?\.\[0\] \|\| null,\n\s*isActive: true,/, 'image: sp.image || sp.imageUrl || sp.images?.[0] || null,\n            isActive: false,');

fs.writeFileSync('src/lib/supplier.ts', c);
console.log('Fixed draft logic!');
