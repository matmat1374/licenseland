const fs = require('fs');

let c = fs.readFileSync('src/lib/supplier.ts', 'utf8');

// 1. Update Draft by Default for new products
c = c.replace(/isActive: true,\s*\/\/ store supplier product id/, `isActive: false, // Draft by default for new API products
            // store supplier product id`);

// 2. Update Pricing Logic
const pricingBlock = `
      // --- Dynamic Tiered Pricing & Custom Markup ---
      let specsToParse: any = {};
      if (existingProd && existingProd.specifications) {
         try { specsToParse = JSON.parse(existingProd.specifications); } catch(e){}
      }
      
      let dynamicMarkupPercent = 50; // default for >= $50
      if (priceUSD < 1) dynamicMarkupPercent = 200;
      else if (priceUSD < 10) dynamicMarkupPercent = 150;
      else if (priceUSD < 20) dynamicMarkupPercent = 100;
      else if (priceUSD < 50) dynamicMarkupPercent = 80;

      // Override with custom markup if admin set one
      if (specsToParse.custom_markup !== undefined && specsToParse.custom_markup !== null) {
          dynamicMarkupPercent = Number(specsToParse.custom_markup);
      }

      const markupBps = dynamicMarkupPercent * 100; // percent to basis points
`;

// In the current file, we have:
// const markupBps = dynamicMarkup * 100; // percent to basis points
// I need to replace the old pricing block with the new one.
// Let's replace the whole old block.

c = c.replace(/\/\/ --- Dynamic Tiered Markup ---[\s\S]*?const markupBps =.*?;/m, pricingBlock);

fs.writeFileSync('src/lib/supplier.ts', c);
console.log('Supplier logic patched!');
