const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.setting.upsert({
    where: { key: 'usd_to_toman_rate' },
    create: { key: 'usd_to_toman_rate', value: '205000' },
    update: { value: '205000' },
  });
  await prisma.setting.upsert({
    where: { key: 'usd_rate_mode' },
    create: { key: 'usd_rate_mode', value: 'auto' },
    update: { value: 'auto' },
  });
  console.log('Successfully set USD rate to 205,000 in auto mode.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
