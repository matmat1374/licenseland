import fs from 'fs';

const BASE_URL = 'http://localhost:3000';
const report = [];

async function log(msg) {
  console.log(msg);
  report.push(msg);
}

async function testPage(path, expectedStrings) {
  try {
    const res = await fetch(`${BASE_URL}${path}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    let passed = true;
    for (const str of expectedStrings) {
      if (!text.includes(str)) {
        await log(`❌ Page ${path}: Missing expected string "${str}"`);
        passed = false;
      }
    }
    if (passed) await log(`✅ Page ${path}: Loaded successfully with all expected strings.`);
    return text;
  } catch (err) {
    await log(`❌ Page ${path}: Failed to load - ${err.message}`);
    return null;
  }
}

async function run() {
  await log('--- STARTING E2E SIMULATION ---');
  
  // 1. Home Page
  await log('\n1. Testing Home Page (/)');
  const homeHtml = await testPage('/', ['WELCOME', 'هوش مصنوعی']);
  // Check Marquee
  if (homeHtml && homeHtml.includes('marquee') || homeHtml.includes('animate-marquee')) {
    await log('✅ Marquee slider found.');
  } else {
    await log('❌ Marquee slider not found or not using expected classes.');
  }

  // 2. Shop Page
  await log('\n2. Testing Shop Page (/shop)');
  await testPage('/shop', ['جستجو', 'قیمت']);

  // 3. Product Page
  await log('\n3. Testing Product Page (/product/chatgpt)');
  await testPage('/product/chatgpt', ['افزودن به سبد خرید', 'خرید فوری']);

  // 4. Cart & APIs
  await log('\n4. Testing Cart and APIs');
  // We can try to fetch the cart API if it exists, or just simulate it.
  
  // 5. Checkout
  await log('\n5. Testing Checkout Page (/checkout)');
  await testPage('/checkout', ['شماره تماس']);
  
  // 6. Login
  await log('\n6. Testing Login Page (/login)');
  await testPage('/login', ['ورود', 'ثبت']);
  
  await log('\n--- END OF SIMULATION ---');
  fs.writeFileSync('scratch/e2e-report.txt', report.join('\n'));
}

run();
