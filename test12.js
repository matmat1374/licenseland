const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();
p.product.findFirst({}).then(r => console.log('Keys:', Object.keys(r))).finally(()=>p.$disconnect());
