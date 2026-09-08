const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();

p.product.findMany({where:{id:{in:['cmtc17zb300s9u2ycjtrgxj5w','cmtc17qk0002ju2yccsd4hp2h','cmtc17qkh002lu2ycbhijyjxw']}}})
  .then(r => console.log(r.map(x=>x.title + ' | ' + x.category)))
  .finally(()=>p.$disconnect());
