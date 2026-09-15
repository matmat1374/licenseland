# State

## 2026-09-15 — UX/CX audit + P0/P1 fixes (see docs/UX_AUDIT_2026-09-15.md)
Full-site UX audit as 10 personas (code + live prod GET tests). Report: docs/UX_AUDIT_2026-09-15.md (27 findings). NOT yet committed/deployed.
P0 trust fixes (all done): order page no longer claims email delivery (3 spots); FAQ + Terms delivery promises corrected; PROCESSING/PENDING_SUPPORT added to dashboard STATUS_MAP (were shown as "در انتظار پرداخت"!); new /forgot-password page (login link was 404); SMS failure now returns honest 503 in prod (dev keeps console-OTP flow); 6 dead AI-advisor links replaced with stable /shop?search= links.
P1 checkout-path fixes (all done): cart cleared after payment via ?cc=1 + ClearCartOnSuccess (sessionStorage snapshot preserves a NEW cart built in another tab); coupon field added to checkout + ?coupon= passthrough (previously only /cart could apply codes); price-asc/desc sorts on _effectivePrice not raw price; cart header counter toFa (was toToman → "۳,۰۰۰ مورد"); AUTO stock shows "موجود — تحویل آنی" + _stockIsApprox (no more fake ۹۹ number).
Verified: 106/106 kernel tests, typecheck clean, all pages 200 on dev server, home + forgot-password render clean in preview, no console errors from changes.
Known out-of-scope (owner decisions documented in audit): 749-product supplier dedup (up to 5 dupes per offering), /shop pagination (100 cap), customer ticket system (Ticket model unused by UI), support phone = admin personal number, hardcoded STATS, live-sales-toast data source.

## 2026-09-14 — Self-directed loop (see docs/SELF_LOOP_WORKLOG.md)
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