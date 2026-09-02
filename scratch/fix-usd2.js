const fs = require('fs');

let content = fs.readFileSync('src/lib/supplier.ts', 'utf8');

const startStr = 'if (features.length === 0) {';
const endStr = '`;';

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr, startIdx) + endStr.length;

const newCode = `if (features.length === 0) {
      if (sp.discount_percent) features.push(\`تخفیف ویژه: \${sp.discount_percent}%\`);
      if (sp.duration_days) features.push(\`مدت زمان: \${sp.duration_days} روز\`);
    }
    const description = pickDescription(sp) || \`## \${title}\\n\\nمحصولی بی‌نظیر برای استفاده شما با بالاترین کیفیت ممکن.\\n\\n### تضمین کیفیت\\nاین محصول به صورت مستقیم تأمین شده و به صورت آنی تحویل داده می‌شود.\`;`;

if (startIdx !== -1 && endIdx !== -1) {
    content = content.substring(0, startIdx) + newCode + content.substring(endIdx);
    fs.writeFileSync('src/lib/supplier.ts', content, 'utf8');
    console.log("Successfully replaced!");
} else {
    console.log("Not found!");
}
