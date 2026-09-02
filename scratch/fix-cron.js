const fs = require('fs');
let c = fs.readFileSync('src/app/api/cron/sync-products/route.ts', 'utf8');

c = c.replace(/message: result\.message \+ .*?\),/, "message: result.message + (repricerResult.repricedCount > 0 ? ` (و ${repricerResult.repricedCount} قیمت توسط ربات ترب بروز شد)` : ''),");

fs.writeFileSync('src/app/api/cron/sync-products/route.ts', c);
console.log('Fixed cron!');
