const fs = require('fs');
let c = fs.readFileSync('src/lib/supplier.ts', 'utf8');

c = c.replace(/const slugBase = sp\.id \? \\\\-\\\\ : title;/, "const slugBase = sp.id ? `${sp.id}-${title}` : title;");

fs.writeFileSync('src/lib/supplier.ts', c);
console.log('Fixed slugBase string');
