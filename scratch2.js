const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const s = await p.setting.findUnique({where:{key:'supplier_api_key'}});
  const res = await fetch('https://api.irmarket.store/api/buyer/products', {headers:{'X-API-Key': s.value}});
  const data = await res.json();
  const item = (data.products || data).find(x => String(x.id) === '3656' || x.name?.includes('3656') || x.title?.includes('3656'));
  console.log('SUPPLIER RAW ITEM:', JSON.stringify(item, null, 2));
})().catch(console.error).finally(()=>p.$disconnect());
