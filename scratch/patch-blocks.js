const fs = require('fs');

let c = fs.readFileSync('src/lib/supplier.ts', 'utf8');

c = c.replace(/if \(existingProd\) \{[\s\S]*?else \{[\s\S]*?fulfillmentMode: "AUTO",\n\s*\}\n\s*\}/, `if (existingProd) {
      await db.product.update({
        where: { id: existingProd.id },
        data: {
          title,
          shortDesc: sp.shortDesc ? String(sp.shortDesc) : existingProd.shortDesc,
          description,
          features: JSON.stringify(features),
          price: finalPrice,
          duration: duration || existingProd.duration,
          brand,
          tags,
          image: sp.image || sp.imageUrl || sp.images?.[0] || existingProd.image,
          specifications: JSON.stringify(specs),
          fulfillmentMode: "AUTO",
        },
      });
    } else {
      await db.product.create({
        data: {
          title,
          slug,
          shortDesc: sp.shortDesc ? String(sp.shortDesc) : title,
          description,
          features: JSON.stringify(features),
          price: finalPrice,
          category: catSlug,
          brand, tags,
          image: sp.image || sp.imageUrl || sp.images?.[0] || null,
          isActive: false,
          stock: 0, // we don't pre-stock; purchase on-demand
          rating: 5, reviewCount: 0, salesCount: 0,
          specifications: JSON.stringify(specs),
          fulfillmentMode: "AUTO",
        }
      });
    }`);

fs.writeFileSync('src/lib/supplier.ts', c);
console.log('Fixed blocks!');
