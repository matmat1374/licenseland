const fs = require('fs');
let c = fs.readFileSync('src/lib/supplier.ts', 'utf8');

// 1. Draft Mode for NEW products (in create block)
c = c.replace(/image: sp\.image \|\| sp\.imageUrl \|\| sp\.images\?\.\[0\] \|\| null,\n\s*isActive: true,/, 'image: sp.image || sp.imageUrl || sp.images?.[0] || null,\n          isActive: false,');

// 2. Custom Markup logic + Tiered defaults
const tieredMarkup = `
    // --- Dynamic Tiered Markup ---
    let dynamicMarkup = markup;
    if (priceUSD < 1) dynamicMarkup = 200;
    else if (priceUSD < 10) dynamicMarkup = 150;
    else if (priceUSD < 20) dynamicMarkup = 100;
    else if (priceUSD < 50) dynamicMarkup = 80;
    else dynamicMarkup = 50;

    let specsToParse: any = {};
    if (existingProd && existingProd.specifications) {
       try { specsToParse = JSON.parse(existingProd.specifications); } catch(e){}
    }

    if (specsToParse.custom_markup !== undefined && specsToParse.custom_markup !== null) {
        dynamicMarkup = Number(specsToParse.custom_markup);
    }

    const markupBps = dynamicMarkup * 100; // percent to basis points
`;
c = c.replace(/\/\/ --- Dynamic Tiered Markup ---[\s\S]*?const markupBps = .*?;/, tieredMarkup);

// 3. Preserve custom_markup when updating specifications
c = c.replace(/if \(oldSpecs\.is_price_locked\) \{/, `if (oldSpecs.custom_markup !== undefined) {
                  specs.custom_markup = oldSpecs.custom_markup;
              }
              if (oldSpecs.is_price_locked) {`);

fs.writeFileSync('src/lib/supplier.ts', c);
console.log('Supplier final patched!');
