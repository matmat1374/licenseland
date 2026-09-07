import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany();
  
  const report: any = {
    categoriesStats: [],
    samples: {},
  };
  
  for (const cat of categories) {
    const products = await prisma.product.findMany({
      where: { category: cat.slug },
      select: {
        title: true,
        shortDesc: true,
        price: true,
        stock: true,
      }
    });
    
    const count = products.length;
    const inStock = products.filter(p => p.stock > 0).length;
    const prices = products.map(p => p.price);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;
    const avgPrice = prices.length ? Math.round(prices.reduce((a,b)=>a+b,0) / prices.length) : 0;
    
    report.categoriesStats.push({
      slug: cat.slug,
      name: cat.name,
      totalProducts: count,
      inStock,
      minPrice,
      maxPrice,
      avgPrice,
    });
    
    // 15 samples
    report.samples[cat.slug] = products.slice(0, 15);
  }
  
  // Write to a json for analysis later
  fs.writeFileSync("scripts/audit-output.json", JSON.stringify(report, null, 2));
  console.log("Audit data written to scripts/audit-output.json");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
