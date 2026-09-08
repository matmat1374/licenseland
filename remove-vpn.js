const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  const vpnKeywords = ['vpn', 'nord', 'surfshark', 'expressvpn'];
  const products = await db.product.findMany();
  
  let deletedCount = 0;
  for (const p of products) {
    const text = (p.title + ' ' + (p.description||'') + ' ' + p.slug).toLowerCase();
    if (vpnKeywords.some(k => text.includes(k))) {
      await db.product.delete({ where: { id: p.id } });
      console.log('Deleted VPN product:', p.title);
      deletedCount++;
    }
  }
  
  const articles = await db.article.findMany();
  for (const a of articles) {
    const text = (a.title + ' ' + (a.content||'') + ' ' + a.slug).toLowerCase();
    if (vpnKeywords.some(k => text.includes(k))) {
      await db.article.delete({ where: { id: a.id } });
      console.log('Deleted VPN article:', a.title);
    }
  }
  
  console.log('Cleaned up ' + deletedCount + ' VPN products.');
}
main().catch(console.error).finally(() => db.$disconnect());
