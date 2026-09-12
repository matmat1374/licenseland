const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const products = await prisma.product.findMany({
    where: { OR: [
      { specifications: { contains: '"supplier_product_id":364' } },
      { specifications: { contains: '"supplier_product_id": 364' } }
    ]}
  });
  
  if (products.length === 0) {
    console.log("Product not found in local DB.");
    return;
  }
  
  const p = products[0];
  console.log("Found product:", p.slug, p.specifications);
  
  let specs = JSON.parse(p.specifications || "{}");
  if (!specs.requires_email) {
    specs.requires_email = true;
    await prisma.product.update({
      where: { id: p.id },
      data: { specifications: JSON.stringify(specs) }
    });
    console.log("Updated requires_email to true locally.");
  } else {
    console.log("requires_email is already true locally.");
  }
}
check().finally(() => prisma.$disconnect());
