# State

## 2026-09-15 — Catalog definition audit (docs/catalog-audit/)
Full-catalog audit (1049 products) at owner request (5 sample Claude Pro links + /shop?search=claude).
Findings: 537 products (51%) affected — 138 true-duplicate groups (341 products), 7 misleading-title groups (44), 21 similar-title families (327).
Root causes — OUR side: (M1) `localizeProduct()` in src/lib/supplier.ts collapses every Claude variant to "Claude Pro" and appends only duration, dropping quota/tier/access-type; (M2) sync matches only by `supplier_product_id`, so a re-listed supplier ID creates a brand-new product; (M3) exact-string matching misses brand aliases ("Openai" vs "ChatGPT"); (M4) shortDesc is raw English supplier text; (M5) no pre-publish QA gate; (M6) fake stock=99.
Root causes — SUPPLIER side: (S1) re-listing under new IDs (2814→3265→3328); (S2) terse English names, no structured fields; (S3) one name ("Claude Pro") for API credit, Premium seat and trial account; (S4) silent price changes; (S5) ambiguous warranty wording.
Delivered (DRAFT — no live data changed): docs/catalog-audit/{CATALOG_AUDIT_REPORT.html, product-registry.csv (537 rows), ROOT_CAUSE.md, NAMING_SKU_STANDARD.md, MERGE_PLAN.md, SUPPLIER_INFO_REQUEST_TEMPLATE.md, SOP_QA_CHECKLIST.md, slug-redirects.proposed.json (+187)}; scripts/catalog-audit-registry.cjs; scripts/catalog-dedup-apply.mjs.
Verified on a DB COPY (`audit-test.db`, produced by `--db ... --apply`): 0 active true-dup groups remain, 1 edge case left for manual review (Genspark Plus), 86 archived, 75 renamed, redirects 777→964, ZERO rows deleted, order/license rows untouched.
NOT applied to production — needs explicit owner approval per the brief's out-of-scope list.

## 2026-09-15 â€” UX/CX audit + P0/P1 fixes (see docs/UX_AUDIT_2026-09-15.md)
Full-site UX audit as 10 personas (code + live prod GET tests). Report: docs/UX_AUDIT_2026-09-15.md (27 findings).
COMMITTED (05b7e9d) and DEPLOYED to production (bundle deploy + build + pm2 reload). Live checks: home 200, /api/health ok, /forgot-password 200 (public), /terms 200 with zero false-email claims, liceno.ir 200. Backup of previous live files at /root/backups/ux_prev_*.tgz on server.
P0 trust fixes (all done): order page no longer claims email delivery (3 spots); FAQ + Terms delivery promises corrected; PROCESSING/PENDING_SUPPORT added to dashboard STATUS_MAP (were shown as "Ø¯Ø± Ø§Ù†ØªØ¸Ø§Ø± Ù¾Ø±Ø¯Ø§Ø®Øª"!); new /forgot-password page (login link was 404); SMS failure now returns honest 503 in prod (dev keeps console-OTP flow); 6 dead AI-advisor links replaced with stable /shop?search= links.
P1 checkout-path fixes (all done): cart cleared after payment via ?cc=1 + ClearCartOnSuccess (sessionStorage snapshot preserves a NEW cart built in another tab); coupon field added to checkout + ?coupon= passthrough (previously only /cart could apply codes); price-asc/desc sorts on _effectivePrice not raw price; cart header counter toFa (was toToman â†’ "Û³,Û°Û°Û° Ù…ÙˆØ±Ø¯"); AUTO stock shows "Ù…ÙˆØ¬ÙˆØ¯ â€” ØªØ­ÙˆÛŒÙ„ Ø¢Ù†ÛŒ" + _stockIsApprox (no more fake Û¹Û¹ number).
Verified: 106/106 kernel tests, typecheck clean, all pages 200 on dev server, home + forgot-password render clean in preview, no console errors from changes.
Known out-of-scope (owner decisions documented in audit): 749-product supplier dedup (up to 5 dupes per offering), /shop pagination (100 cap), customer ticket system (Ticket model unused by UI), support phone = admin personal number, hardcoded STATS, live-sales-toast data source.

## 2026-09-14 â€” Self-directed loop (see docs/SELF_LOOP_WORKLOG.md)
All review fixes DEPLOYED to production (commit 0a0a297, pm2 reload done, live checks green):
- C1: OTP no longer returned in HTTP response (only server log).
- C2: admin promotion gated behind ADMIN_PHONE_NUMBER + ENABLE_ADMIN_PHONE_PROMOTION env.
- C4/C5: loyalty redeem/earn now atomic; pure math in src/lib/loyalty-math.ts with unit tests.
- H1: checkout create outer catch releases reserved keys + refunds points.
- H2: fulfillment manual claim uses conditional atomic updateMany (no double-sell).
- H4: verify persists Payment record (authority-keyed upsert, verified/failed states).
- H5: fulfillment enqueued as Job, worker in instrumentation drains with backoff + dead-letter ticket.
- H6: supplier webhook failure auto-refunds wallet + claws back points + urgent ticket.
- UX: earned-points preview in checkout, activation guides on order page.
Verified: 106/106 kernel tests, typecheck clean; production curl checks: home 200, /api/health ok, OTP response has no code, liceno.ir 200.
Still pending (owner actions): rotate MeliPayamak key, rotate root password, decide ENABLE_ADMIN_PHONE_PROMOTION.

## Previous state
Gamification & Loyalty System implemented.
Prisma schema updated with UserLoyalty, PointEvent, UserBadge.
Local DB pushed.
Loyalty library `src/lib/loyalty.ts` created.
Checkout verification and creation APIs updated for earning and redeeming points.
Profile and Admin APIs created for points management.

Deployment instructions:
1. SSH into 109.122.254.151
2. Pull the latest code or use scp to copy `prisma/schema.prisma`, `src/lib/loyalty.ts`, `src/app/api/checkout/create/route.ts`, `src/app/api/checkout/verify/route.ts`, `src/app/api/profile/loyalty/route.ts`, `src/app/api/admin/users/[id]/points/route.ts`.
3. Run `npx prisma db push`
4. Run `npm run build`
5. Restart PM2: `pm2 restart all`