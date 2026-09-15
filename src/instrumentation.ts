export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && !process.env.NEXT_PHASE?.includes('build')) {
    console.log('Starting background cron for sync-products every 15 minutes');

    // H5 fix: fulfillment job worker — drains the Job queue every 30s.
    // Self-scheduling to avoid overlapping runs when a batch takes long.
    let fulfillmentWorkerRunning = false;
    setInterval(async () => {
      if (fulfillmentWorkerRunning) return;
      fulfillmentWorkerRunning = true;
      try {
        const { processFulfillmentJobs } = await import('@/lib/order-fulfillment');
        const processed = await processFulfillmentJobs(5);
        if (processed > 0) console.log(`[job-worker] processed ${processed} fulfillment job(s)`);
      } catch (err) {
        console.error('[job-worker] fulfillment worker failed (non-fatal):', err);
      } finally {
        fulfillmentWorkerRunning = false;
      }
    }, 30 * 1000);
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


  // Email queue worker — drains queued transactional emails with retry/backoff.
  let emailWorkerRunning = false;
  setInterval(async () => {
    if (emailWorkerRunning) return;
    emailWorkerRunning = true;
    try {
      const { processEmailQueue } = await import('@/lib/email-infra');
      const r = await processEmailQueue(10);
      if (r.sent || r.failed || r.skipped) console.log('[email-worker]', JSON.stringify(r));
    } catch (err) {
      console.error('[email-worker] failed:', err);
    } finally {
      emailWorkerRunning = false;
    }
  }, 60 * 1000);
}
}
