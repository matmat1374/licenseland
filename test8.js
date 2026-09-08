const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();
p.product.findMany({where:{title:{contains:'Telegram'}}}).then(r => console.log(r.map(x=>x.title + ' -> ' + x.category))).finally(()=>p.$disconnect());
