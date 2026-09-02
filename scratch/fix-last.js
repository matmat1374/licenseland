const fs = require('fs');
let c = fs.readFileSync('src/lib/supplier.ts', 'utf8');

c = c.replace(/const slugCheck = slugifyFa\(sp\.id \? [^\)]+\);/, "const slugCheck = slugifyFa(sp.id ? `${sp.id}-${title}` : title);");
fs.writeFileSync('src/lib/supplier.ts', c);
console.log('Fixed properly!');
