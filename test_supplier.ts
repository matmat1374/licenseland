import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const s = await prisma.setting.findUnique({ where: { key: "supplier_api_key" } });
  const key = s?.value || process.env.SUPPLIER_API_KEY || "";
  const url = "https://api.irmarket.store/api/buyer/products";

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": key,
    },
  });
  const data = await res.json();
  const products = Array.isArray(data) ? data : data.products || data.data || data.items || [];
  
  const p2143 = products.find((p: any) => p.id === 2143 || p.id === "2143");
  console.log("Supplier Product 2143:", p2143);

  const p3656 = products.find((p: any) => p.id === 3656 || p.id === "3656");
  console.log("Supplier Product 3656:", p3656);

}
main().finally(() => prisma.$disconnect());
