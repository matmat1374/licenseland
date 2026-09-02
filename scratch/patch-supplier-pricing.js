const fs = require('fs');

let c = fs.readFileSync('src/lib/supplier.ts', 'utf8');

// 1. Dynamic Markup
const dynamicMarkupCode = `
    // --- Dynamic Tiered Markup ---
    let dynamicMarkup = markup;
    if (priceUSD >= 200) dynamicMarkup = 10;
    else if (priceUSD >= 100) dynamicMarkup = 15;
    else if (priceUSD >= 50) dynamicMarkup = 25;
    else if (priceUSD >= 20) dynamicMarkup = 40;
    else if (priceUSD >= 10) dynamicMarkup = 60;
    else if (priceUSD >= 5) dynamicMarkup = 100;
    const markupBps = dynamicMarkup * 100; // percent → basis points
`;

c = c.replace('const markupBps = markup * 100; // percent → basis points (200% = 20000 bps)', dynamicMarkupCode);

// 2. Price Lock Logic
const lockLogic = `
      // Preserve specs and check price lock
      let specs: any = { supplier_product_id: sp.id, price_usd: priceUSD, pricing_unit: sp.pricing_unit, requires_email: sp.requires_email, requires_link: sp.requires_link };
      let finalPrice = sellPriceToman;
      if (existing && existing.specifications) {
         try {
            const oldSpecs = JSON.parse(existing.specifications);
            if (oldSpecs.is_price_locked) {
                specs.is_price_locked = true;
                finalPrice = existing.price; // Keep the admin's custom price!
            }
         } catch(e){}
      }
`;

c = c.replace('const stock = typeof sp.in_stock === "number" ? sp.in_stock : (typeof sp.stock === "number" ? sp.stock : 0);', lockLogic + '\n      const stock = typeof sp.in_stock === "number" ? sp.in_stock : (typeof sp.stock === "number" ? sp.stock : 0);');

// Replace `price: sellPriceToman` with `price: finalPrice` in update block
c = c.replace(/price: sellPriceToman,/g, 'price: finalPrice,');
// Replace specifications logic in update and create
c = c.replace(/specifications: JSON.stringify\(\{ supplier_product_id: sp\.id, price_usd: priceUSD, pricing_unit: sp\.pricing_unit, requires_email: sp\.requires_email, requires_link: sp\.requires_link \}\),/g, 'specifications: JSON.stringify(specs),');

fs.writeFileSync('src/lib/supplier.ts', c, 'utf8');
console.log("supplier.ts pricing patched");
