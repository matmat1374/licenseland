const fs = require('fs');

let content = fs.readFileSync('src/lib/supplier.ts', 'utf8');

const regexToReplace = /if\s*\(features\.length\s*===\s*0\)\s*\{[^}]+\}\s*const\s*description\s*=\s*pickDescription\(sp\)\s*\|\|[^;]+;/g;

const newCode = `if (features.length === 0) {
      if (sp.discount_percent) features.push(\`تخفیف ویژه: \${sp.discount_percent}%\`);
      if (sp.duration_days) features.push(\`مدت زمان: \${sp.duration_days} روز\`);
    }
    const description = pickDescription(sp) || \`## \${title}\\n\\nمحصولی بی‌نظیر برای استفاده شما با بالاترین کیفیت ممکن.\\n\\n### تضمین کیفیت\\nاین محصول به صورت مستقیم تأمین شده و به صورت آنی تحویل داده می‌شود.\`;`;

if (content.match(regexToReplace)) {
    content = content.replace(regexToReplace, newCode);
    fs.writeFileSync('src/lib/supplier.ts', content, 'utf8');
    console.log("Successfully replaced features and description code.");
} else {
    console.log("Regex didn't match. Here is what we searched for:");
    console.log(regexToReplace);
}

