const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function run() {
  const products = await db.product.findMany();
  let c = 0;
  for (const p of products) {
    let raw = p.features;
    let changed = false;
    
    // Some features might be plain text instead of JSON array
    let arr = [];
    try {
      arr = JSON.parse(raw);
      if (!Array.isArray(arr)) arr = [String(arr)];
    } catch(e) {
      if (raw) arr = raw.split('\n');
    }

    const filtered = arr.filter(f => !String(f).includes('$') && !String(f).includes('U,UOU') && !String(f).toLowerCase().includes('usd') && !String(f).includes('قیمت عمومی'));

    if (filtered.length !== arr.length) {
      await db.product.update({
        where: { id: p.id },
        data: { features: JSON.stringify(filtered) }
      });
      c++;
    }
  }
  console.log('Fixed USD in features for: ' + c);
}
run();
