export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && !process.env.NEXT_PHASE?.includes('build')) {
    console.log('Starting background cron for sync-products every 15 minutes');
    setInterval(async () => {
      console.log('Running scheduled background sync-products...');
      
      // 1. Live reprice
      try {
        const { repriceAllProductsWithLiveRate } = await import('@/lib/live-repricer');
        const liveRes = await repriceAllProductsWithLiveRate();
        console.log('Live reprice result:', liveRes);
      } catch (err) {
        console.error('Live reprice failed (non-fatal):', err);
      }

      // 2. Import from supplier
      try {
        const { importProductsFromSupplier } = await import('@/lib/supplier');
        const importRes = await importProductsFromSupplier();
        console.log('Import result:', importRes);
      } catch (err) {
        console.error('Supplier import failed (non-fatal):', err);
      }

      // 3. Torob repricer
      try {
        const { runTorobRepricer } = await import('@/lib/repricer');
        const torobRes = await runTorobRepricer();
        console.log('Torob repricer result:', torobRes);
      } catch (err) {
        console.error('Torob repricer failed (non-fatal):', err);
      }
    }, 15 * 60 * 1000);

  }
}
