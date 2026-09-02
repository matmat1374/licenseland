const fs = require('fs');
let c = fs.readFileSync('src/lib/repricer.ts', 'utf8');

const oldLine44 = "const res = await fetch(\\`https://api.torob.com/v4/base-product/details/?prk=\\${prk}\\`, {";
const newLine44 = "const res = await fetch('https://api.torob.com/v4/base-product/details/?prk=' + prk, {";
c = c.replace(oldLine44, newLine44);

const oldLine89 = "details.push(\\`ربات قیمت‌شکن: \\${p.name} -> \\${finalPriceToman.toLocaleString(\"fa-IR\")} تومان (کمترین قیمت ترب: \\${minCompetitorPrice.toLocaleString(\"fa-IR\")})\\`);";
const newLine89 = "details.push('ربات قیمت‌شکن: ' + p.name + ' -> ' + finalPriceToman.toLocaleString(\"fa-IR\") + ' تومان (کمترین قیمت ترب: ' + minCompetitorPrice.toLocaleString(\"fa-IR\") + ')');";
c = c.replace(oldLine89, newLine89);

fs.writeFileSync('src/lib/repricer.ts', c);
console.log('Fixed repricer!');
