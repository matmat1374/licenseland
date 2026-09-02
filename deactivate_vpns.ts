import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const keywords = [
  "vpn", "nordvpn", "expressvpn", "surfshark", "hma", "hidemyass", "hide my ass", 
  "ipvanish", "cyberghost", "protonvpn", "mullvad", "windscribe", "tunnelbear", 
  "purevpn", "adguard vpn", "pia vpn", "v2ray", "shadowsocks", "wireguard", 
  "openvpn", "outline", "warp", "psiphon", "فیلترشکن", "وی پی ان", "ویپیان"
];

async function main() {
  const products = await prisma.product.findMany();
  let deactivatedCount = 0;

  for (const product of products) {
    const textToSearch = [
      product.title,
      product.slug,
      product.brand,
      product.tags,
      product.category,
      product.description
    ].filter(Boolean).join(" ").toLowerCase();

    const isMatch = keywords.some(kw => textToSearch.includes(kw.toLowerCase()));
    
    if (isMatch) {
      const dataToUpdate: any = { isActive: false };
      // Check if isHidden exists in the product model by looking at Prisma generated types or just try
      // We will blindly attempt to update isHidden if it exists in the schema, but typically we can just set it.
      // Let's check if 'isHidden' is a property on the product object returned by Prisma.
      if ('isHidden' in product) {
        dataToUpdate.isHidden = true;
      } else {
         // let's just try to add it anyway, or look at the schema. The prompt says "and isHidden: true if applicable"
         // meaning if it's in the schema. We'll rely on the `in` check.
      }
      
      // Let's just catch the error if isHidden isn't valid, wait, no, Prisma types will error if we pass invalid fields unless we use any.
      try {
        await prisma.product.update({
          where: { id: product.id },
          data: { ...dataToUpdate, isHidden: true }
        });
      } catch (e) {
        await prisma.product.update({
          where: { id: product.id },
          data: { isActive: false }
        });
      }
      deactivatedCount++;
    }
  }

  console.log(`Deactivated ${deactivatedCount} products.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
