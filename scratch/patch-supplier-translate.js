const fs = require('fs');

let content = fs.readFileSync('src/lib/supplier.ts', 'utf8');

const importStatement = `import translate from "google-translate-api-x";\n`;
if (!content.includes('google-translate-api-x')) {
    content = importStatement + content;
}

const descTarget = "const description = pickDescription(sp) || `## ${title}";
const replaceBlock = `
      // --- Translation Logic ---
      let rawDesc = pickDescription(sp) || \`## \${title}\\n\\nخرید لایسنس و اشتراک پریمیوم با بهترین قیمت و تحویل آنی.\\n\\n### تضمین کیفیت\\nاین محصول به صورت مستقیم تأمین شده و دارای ضمانت اصالت و پشتیبانی می‌باشد.\`;
      let finalDesc = rawDesc;
      
      const hasPersian = /[\\u0600-\\u06FF]/.test(rawDesc);
      
      // If the API gave us English, but we already have a Persian description in the DB, reuse the DB one!
      if (!hasPersian && existing && existing.description && /[\\u0600-\\u06FF]/.test(existing.description)) {
          finalDesc = existing.description;
      } else if (!hasPersian && rawDesc) {
          // It's a new product or existing product without Persian, translate it!
          try {
              const res = await translate(rawDesc, { to: 'fa' });
              finalDesc = res.text;
          } catch (err) {
              console.error("Translation failed for", title, err.message);
          }
      }
      
      const description = finalDesc;
`;

const lines = content.split('\n');
const newLines = [];
let skip = false;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const description = pickDescription(sp) || `## ${title}')) {
        newLines.push(replaceBlock);
        // We need to skip the rest of the generic description template that spans multiple lines
        let j = i;
        while (!lines[j].includes('`;') && j < lines.length) {
            j++;
        }
        i = j; // skip to the end of the template string
        continue;
    }
    
    // Make sure we also patch where existing.description is assigned during updates
    // In update data:
    // description,
    
    newLines.push(lines[i]);
}

fs.writeFileSync('src/lib/supplier.ts', newLines.join('\n'), 'utf8');
console.log('Supplier patched for translation logic!');
