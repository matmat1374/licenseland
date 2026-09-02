const fs = require('fs');
let c = fs.readFileSync('src/lib/repricer.ts', 'utf8');

c = c.replace('import { getUsdtRate } from "./queries";', 'import { getUsdToTomanRate } from "./supplier";');
c = c.replace('getUsdtRate()', 'getUsdToTomanRate()');
c = c.replace('p.name', 'p.title');

fs.writeFileSync('src/lib/repricer.ts', c);
console.log('Fixed TS errors!');
