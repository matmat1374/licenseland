import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Phase 1: Cleaning "اشتراک و لایسنس قانونی" titles ---');
  const badProducts = await prisma.product.findMany({
    where: {
      title: {
        startsWith: 'اشتراک و لایسنس قانونی'
      }
    }
  });

  console.log(`Found ${badProducts.length} products with bad titles.`);

  for (const p of badProducts) {
    let newTitle = p.title;
    
    // Attempt to infer from slug or description
    if (p.slug.toLowerCase().includes('chatgpt') || p.title.toLowerCase().includes('chatgpt')) {
      newTitle = 'اکانت اختصاصی ChatGPT Plus (۱ ماهه)';
    } else {
      newTitle = p.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    console.log(`- Updating: [${p.id}] "${p.title}" -> "${newTitle}"`);
    await prisma.product.update({
      where: { id: p.id },
      data: { title: newTitle }
    });
  }

  console.log('\n--- Phase 2: Updating Virtual Number (price ~ 159,000) products ---');
  // Usually around 150k - 165k
  const virtualNumbers = await prisma.product.findMany({
    where: {
      price: {
        gte: 155000,
        lte: 165000
      }
    }
  });
  
  // Need to be more precise: is it actually virtual numbers?
  console.log(`Found ${virtualNumbers.length} products around 159k price.`);
  
  for (const p of virtualNumbers) {
    if (p.slug.toLowerCase().includes('number') || p.title.includes('شماره') || p.title.includes('اشتراک') || p.slug.toLowerCase().includes('chatgpt')) {
      // Extract country if possible, or just default to USA/etc based on title or slug
      let country = 'آمریکا';
      if (p.title.includes('انگلیس') || p.slug.includes('uk')) country = 'انگلیس';
      else if (p.title.includes('هلند') || p.slug.includes('nl') || p.slug.includes('netherland')) country = 'هلند';
      else if (p.title.includes('استونی') || p.slug.includes('estonia')) country = 'استونی';
      else if (p.title.includes('آلمان') || p.slug.includes('germany') || p.slug.includes('de')) country = 'آلمان';
      
      const newTitle = `شماره مجازی ChatGPT — ${country}`;
      const newDesc = 'شماره اختصاصی جهت دریافت پیامک فعال‌سازی و ثبت‌نام';
      
      console.log(`- Updating VN: [${p.id}] "${p.title}" -> "${newTitle}"`);
      await prisma.product.update({
        where: { id: p.id },
        data: { 
          title: newTitle,
          shortDesc: newDesc
        }
      });
    }
  }

  console.log('\n--- Phase 3: Verifying output ---');
  
  // 1. Verify no 'اشتراک و لایسنس قانونی' remaining
  const remainingBad = await prisma.product.count({
    where: { title: { startsWith: 'اشتراک و لایسنس قانونی' } }
  });
  console.log(`Remaining "اشتراک و لایسنس قانونی" titles: ${remainingBad}`);

  // 2. First 5 products (assuming sorted by something like ID or sales or whatever "صفحه اصلی / فروشگاه" uses)
  // We'll check standard order (createdAt desc or just normal)
  console.log('\nFirst 5 products stock:');
  const first5 = await prisma.product.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
  for (const p of first5) {
    console.log(`  - [${p.id}] ${p.title}: stock=${p.stock}`);
  }

  console.log('\nLast 5 products stock:');
  const last5 = await prisma.product.findMany({ take: 5, orderBy: { createdAt: 'asc' } });
  for (const p of last5) {
    console.log(`  - [${p.id}] ${p.title}: stock=${p.stock}`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
