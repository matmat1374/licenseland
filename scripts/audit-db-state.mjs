import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

await db.siteContent.upsert({
  where: { key: "banner1_product_ids" },
  update: { value: "cmtc17zb300s9u2ycjtrgxj5w,cmtc17qk0002ju2yccsd4hp2h,cmtc17qkh002lu2ycbhijyjxw" },
  create: { key: "banner1_product_ids", value: "cmtc17zb300s9u2ycjtrgxj5w,cmtc17qk0002ju2yccsd4hp2h,cmtc17qkh002lu2ycbhijyjxw" },
});

await db.siteContent.upsert({
  where: { key: "banner2_product_ids" },
  update: { value: "cmtc17qw4003pu2ycb0tvoqhn,cmtc17qdb001vu2yc3sey01rs,cmtc17qkh002lu2ycbhijyjxw" },
  create: { key: "banner2_product_ids", value: "cmtc17qw4003pu2ycb0tvoqhn,cmtc17qdb001vu2yc3sey01rs,cmtc17qkh002lu2ycbhijyjxw" },
});

console.log("Banner product IDs successfully configured!");
await db.$disconnect();

