import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const keywords = ['ChatGPT', 'Claude', 'Gemini', 'Midjourney', 'Cursor', 'Canva', 'Spotify', 'Xbox', 'Notion', 'Windows', 'Office', 'JetBrains', 'Grammarly', 'Copilot', 'Adobe', 'Kaspersky', 'Netflix', 'Figma', 'Slack', 'Discord', 'Docker', 'NordVPN'];
  
  const allProducts = await prisma.product.findMany();
  
  const toUpdate = allProducts.filter(p => {
    return keywords.some(k => p.title.toLowerCase().includes(k.toLowerCase()) || p.slug.toLowerCase().includes(k.toLowerCase()));
  });

  console.log(`Found ${toUpdate.length} products to update`);

  let count = 0;
  for (const p of toUpdate) {
    await prisma.product.update({
      where: { id: p.id },
      data: {
        featured: true,
        bestseller: true,
        isActive: true,
      }
    });
    count++;
    if (count >= 20) break; // at least 15-20, let's just do up to 20 or all
  }

  console.log(`Updated ${count} products.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
