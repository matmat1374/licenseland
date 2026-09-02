const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const db = new PrismaClient();

async function run() {
    let c = fs.readFileSync('src/lib/supplier.ts', 'utf8');
    c = c.replace(
        "const cleanFeatures = features.filter(f => !f.includes('$') && !f.toLowerCase().includes('usd'));",
        "const cleanFeatures = features.filter(f => !f.includes('$') && !f.toLowerCase().includes('usd')).map(f => f.replace(/true عدد/g, 'در انبار').replace(/موجود: در انبار/g, 'موجودی: تضمین شده'));"
    );
    const titlePatch = `
    let title = pickTitle(sp);
    if (/\\bCP\\b/.test(title) && /^\\d/.test(title)) title = "Call of Duty Mobile - " + title;
    else if (/\\bUC\\b/.test(title) && /^\\d/.test(title)) title = "PUBG Mobile - " + title;
    title = title.replace(/Call of Duty Mobile/i, 'کالاف دیوتی موبایل');
    title = title.replace(/PUBG Mobile/i, 'پابجی موبایل');
    title = title.replace(/CP/g, 'سی‌پی');
    title = title.replace(/UC/g, 'یوسی');
    title = title.replace(/PlayStation Network Card \\(US\\) - PSN Card/i, 'گیفت کارت پلی استیشن آمریکا -');
    title = title.replace(/Telegram Stars/i, 'استارز تلگرام');
    title = title.replace(/Spotify Premium/i, 'اسپاتیفای پریمیوم');
    title = title.replace(/Netflix/i, 'نتفلیکس');
    title = title.replace(/Coursera Premium/i, 'اکانت کورسرا پریمیوم');
    title = title.replace(/Hotmail\\/Outlook Mail/i, 'ایمیل هات‌میل / اوت‌لوک');
    title = title.replace(/Instagram Followers/i, 'فالوور اینستاگرام');
    title = title.replace(/Apple Card/i, 'گیفت کارت اپل');
    `;
    
    c = c.replace(/let title = pickTitle\(sp\);[\s\S]*?else if \(\/\\bUC\\b\/\.test\(title\) && \/\^\\d\/\.test\(title\)\) title = "PUBG Mobile - " \+ title;/, titlePatch);
    fs.writeFileSync('src/lib/supplier.ts', c, 'utf8');
    
    const products = await db.product.findMany();
    let count = 0;
    for (const p of products) {
        let newFeatures = p.features.replace(/true عدد/g, 'در انبار').replace(/موجود: در انبار/g, 'موجودی: تضمین شده');
        let newTitle = p.title;
        newTitle = newTitle.replace(/Call of Duty Mobile/i, 'کالاف دیوتی موبایل');
        newTitle = newTitle.replace(/PUBG Mobile/i, 'پابجی موبایل');
        newTitle = newTitle.replace(/\bCP\b/g, 'سی‌پی');
        newTitle = newTitle.replace(/\bUC\b/g, 'یوسی');
        newTitle = newTitle.replace(/PlayStation Network Card \(US\) - PSN Card/i, 'گیفت کارت پلی استیشن آمریکا -');
        newTitle = newTitle.replace(/Telegram Stars/i, 'استارز تلگرام');
        newTitle = newTitle.replace(/Spotify Premium/i, 'اسپاتیفای پریمیوم');
        newTitle = newTitle.replace(/Netflix/i, 'نتفلیکس');
        newTitle = newTitle.replace(/Coursera Premium/i, 'اکانت کورسرا پریمیوم');
        newTitle = newTitle.replace(/Hotmail\/Outlook Mail/i, 'ایمیل هات‌میل / اوت‌لوک');
        newTitle = newTitle.replace(/Instagram Followers/i, 'فالوور اینستاگرام');
        newTitle = newTitle.replace(/Apple Card/i, 'گیفت کارت اپل');
        
        if (newFeatures !== p.features || newTitle !== p.title) {
            await db.product.update({
                where: { id: p.id },
                data: { features: newFeatures, title: newTitle }
            });
            count++;
        }
    }
    console.log("Updated " + count + " products.");
}

run().catch(console.error).finally(() => db.$disconnect());
