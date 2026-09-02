const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 

async function check() { 
    const prods = await prisma.product.findMany(); 
    let bad = 0; 
    for(const p of prods){ 
        const specs = JSON.parse(p.specifications || '{}'); 
        const features = p.features; 
        let isBad = false;
        if(!specs.usd_rate_used || !specs.markup_used || !specs.last_synced) isBad = true; 
        if(features && (features.includes('true') || features.includes('false') || features.includes('$') || features.includes('موجود: در انبار') || features.includes('موجود: تضمین شده'))) isBad = true; 
        if (isBad) bad++;
    } 
    console.log(bad + ' bad products found'); 
} 

check().finally(() => prisma.$disconnect());
