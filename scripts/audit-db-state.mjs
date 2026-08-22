import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const orders = await db.order.findMany({
  select: { id: true, code: true, status: true, total: true, zarinpalAuthority: true, paidAt: true, createdAt: true },
  orderBy: { createdAt: "asc" },
});
console.log("=== ORDERS ===");
for (const o of orders) console.log(JSON.stringify(o));
const keys = await db.licenseKey.groupBy({ by: ["status"], _count: true });
console.log("=== LICENSE STATUS COUNTS ===", JSON.stringify(keys));
const office = await db.product.findUnique({ where: { slug: "office-365-5-devices" }, select: { stock: true, salesCount: true } });
console.log("=== OFFICE PRODUCT ===", JSON.stringify(office));
const soldKeys = await db.licenseKey.findFirst({ where: { status: "SOLD" }, select: { id: true, productId: true, orderItemId: true, key: true, source: true } });
console.log("=== SAMPLE SOLD KEY ===", JSON.stringify(soldKeys));
const dc = await db.discountCode.findMany({ select: { code: true, usedCount: true, maxUses: true } });
console.log("=== DISCOUNTS ===", JSON.stringify(dc));
await db.$disconnect();
