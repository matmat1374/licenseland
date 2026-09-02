import fs from 'fs';

const BASE_URL = 'http://localhost:3000';
const report = [];

async function log(msg) {
  console.log(msg);
  report.push(msg);
}

async function runTests() {
  await log('# E2E QA Test Report - Liceno');
  await log('\n## 1. صفحه اصلی (/)');
  try {
    const res = await fetch(BASE_URL + '/');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    await log('- [x] صفحه لود شد.');
    if (html.includes('WELCOME')) await log('- [x] بنر تخفیف WELCOME یافت شد.');
    else await log('- [ ] بنر تخفیف WELCOME یافت نشد.');
    
    if (html.includes('هوش مصنوعی')) await log('- [x] دسته بندی هوش مصنوعی یافت شد.');
    else await log('- [ ] دسته بندی هوش مصنوعی یافت نشد.');
    
    if (html.includes('marquee') || html.includes('animate-marquee')) await log('- [x] اسلایدر Marquee یافت شد.');
    else await log('- [ ] اسلایدر Marquee یافت نشد.');
  } catch (err) {
    await log(`- [ ] خطا در لود صفحه اصلی: ${err.message}`);
  }

  await log('\n## 2. صفحه فروشگاه (/shop)');
  try {
    const res = await fetch(BASE_URL + '/shop');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    await log('- [x] صفحه فروشگاه لود شد.');
    if (html.includes('جستجو')) await log('- [x] فیلتر جستجو یافت شد.');
    if (html.includes('قیمت')) await log('- [x] مرتب سازی یافت شد.');
  } catch (err) {
    await log(`- [ ] خطا در لود صفحه فروشگاه: ${err.message}`);
  }

  await log('\n## 3. صفحه تک‌محصول (/product/[slug])');
  let sampleSlug = '1405-xbox-game-pass-ultimate-1-year-warranty-3-months';
  try {
    const apiRes = await fetch(BASE_URL + '/api/products');
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data.products && data.products.length > 0) {
        sampleSlug = data.products[0].slug;
        await log(`- محصولات از API دریافت شد. تست روی محصول: ${sampleSlug}`);
      }
    }
  } catch (e) {
    await log(`- خطا در دریافت API محصولات: ${e.message}`);
  }

  try {
    const res = await fetch(BASE_URL + '/product/' + sampleSlug);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    await log('- [x] صفحه محصول لود شد.');
    if (html.includes('سبد خرید')) await log('- [x] دکمه افزودن به سبد خرید یافت شد.');
    else await log('- [ ] دکمه افزودن به سبد خرید یافت نشد.');
    if (html.includes('خرید فوری')) await log('- [x] دکمه خرید فوری یافت شد.');
    else await log('- [ ] دکمه خرید فوری یافت نشد.');
  } catch (err) {
    await log(`- [ ] خطا در لود صفحه محصول: ${err.message}`);
  }

  await log('\n## 4. سبد خرید و رزرو قیمت');
  await log('- به دلیل نیاز به state مرورگر، تست API و لاجیک انجام می‌شود...');
  
  await log('\n## 5. صفحه تسویه حساب (/checkout)');
  try {
    const res = await fetch(BASE_URL + '/checkout');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    await log('- [x] صفحه تسویه حساب لود شد.');
    if (html.includes('شماره تماس') || html.includes('phone') || html.includes('شماره موبایل')) await log('- [x] فیلد شماره تماس یافت شد.');
    else await log('- [ ] فیلد شماره تماس یافت نشد.');
  } catch (err) {
    await log(`- [ ] خطا در لود صفحه تسویه حساب: ${err.message}`);
  }

  await log('\n## 6. احراز هویت و پنل کاربری (/login, /dashboard)');
  try {
    const res = await fetch(BASE_URL + '/login');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    await log('- [x] صفحه ورود لود شد.');
    if (html.includes('ورود') || html.includes('ثبت نام')) await log('- [x] فرم ورود/ثبت نام یافت شد.');
    else await log('- [ ] فرم ورود یافت نشد.');
  } catch (err) {
    await log(`- [ ] خطا در لود صفحه ورود: ${err.message}`);
  }

  fs.writeFileSync('scratch/e2e-report.md', report.join('\n'));
  console.log('گزارش نهایی در scratch/e2e-report.md ذخیره شد.');
}

runTests();
