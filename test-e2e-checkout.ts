async function runTest() {
  const BASE_URL = 'http://localhost:3000';
  console.log('--- Starting E2E Checkout Test ---');

  let product = null;
  try {
    const res = await fetch(`${BASE_URL}/api/products?limit=10`);
    if (!res.ok) throw new Error('Failed to fetch products');
    const data = await res.json();
    product = data.products.find((p: any) => p._stock > 0);
    if (!product) throw new Error('No in-stock products found');
    console.log(`✅ Selected Product: ${product.title} (ID: ${product.id})`);
    console.log(`   Price: ${product.price}, Discount: ${product.discountPrice}`);
  } catch (err: any) {
    console.error('❌ API Error:', err.message);
    process.exit(1);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/checkout/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{
          id: product.id,
          slug: product.slug,
          title: product.title,
          price: product.price, // test reserving price
          quantity: 1
        }],
        customer: { name: 'E2E Tester', phone: '09123456789', email: 'test@licenseland.com' }
      })
    });
    
    const data = await res.json();
    if (res.ok && data.ok) {
      console.log('✅ Checkout Successful!');
      console.log('✅ Payment URL:', data.paymentUrl);
      console.log('✅ Order Code:', data.orderCode);
      console.log('🎉 100% Success Report');
    } else {
      console.error('❌ Checkout Failed:', data.message);
      if (data.debug) console.error('Debug Info:', data.debug);
      process.exit(1);
    }
  } catch (err: any) {
    console.error('❌ Checkout Request Error:', err.message);
    process.exit(1);
  }
}

runTest();
