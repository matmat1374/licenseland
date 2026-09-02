const fs = require('fs');
let c = fs.readFileSync('src/components/site/product-card.tsx', 'utf8');
c = c.replace(/icon=\{product\.image \? undefined : <Icon className="h-full w-full" \/>\}/g, 'icon={undefined}');
fs.writeFileSync('src/components/site/product-card.tsx', c);
console.log('patched');
