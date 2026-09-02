const { PrismaClient } = require('@prisma/client');
const translate = require('google-translate-api-x');
const db = new PrismaClient();

async function delay(ms) {
    return new Promise(res => setTimeout(res, ms));
}

async function run() {
    const products = await db.product.findMany();
    let count = 0;
    
    for (const p of products) {
        if (!p.description) continue;
        
        const hasPersian = /[\u0600-\u06FF]/.test(p.description);
        
        if (!hasPersian) {
            try {
                // Translate the text
                const res = await translate(p.description, { to: 'fa' });
                const translated = res.text;
                
                await db.product.update({
                    where: { id: p.id },
                    data: { description: translated }
                });
                
                count++;
                console.log(`Translated [${p.id}]: ${p.title}`);
                
                // Add a small delay to avoid Google Translate rate limits
                await delay(200); 
            } catch (err) {
                console.error(`Failed to translate [${p.id}]:`, err.message);
                await delay(2000); // Wait longer on error
            }
        }
    }
    
    console.log(`Successfully translated ${count} product descriptions.`);
}

run().catch(console.error);
