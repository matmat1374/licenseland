const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();
p.product.findFirst({where:{slug:{contains:'3656'}}})
  .then(r => console.log('PRISMA_RESULT:', JSON.stringify(r, null, 2)))
  .catch(console.error)
  .finally(()=>p.$disconnect());
