# State

## 2026-09-15 — Loop iteration 2: SEO canonical + CSP/GA (see docs/loop/backlog-2.md)
Measured axes 1–4 with real commands (no assumptions): type safety, SEO/crawl integrity, security headers/CSP, storefront weight. Artifacts: docs/loop/backlog-2.md (human), docs/loop/backlog-2.json (machine, raw measurements), docs/loop/verify-2.md.
TWO FIXES APPLIED (uncommitted working tree; NOT deployed — deploy needs owner approval):
- FIX 1 (SEO, highest impact): `src/app/layout.tsx:54` had a site-wide `alternates: { canonical: "/" }` that Next merged into EVERY route without its own canonical — so `/shop`, `/blog`, `/about`, `/faq`, `/terms`, `/privacy`, all 26 `/blog/<slug>` articles and all 30 `/shop?cat=` URLs told Google they were duplicates of the homepage. Removed the global default; added explicit self-canonicals to `/` (src/app/page.tsx), /shop, /blog, /blog/[slug], /about, /faq, /terms, /privacy. Verified by curl on a local prod build across 13 URL shapes; `/` and `/contact` and `/product/<slug>` byte-identical to live (zero regression).
- FIX 2 (CSP): the deployed policy `script-src 'self' 'unsafe-inline'` + `connect-src 'self'` blocked the site's OWN Google Analytics — the gtag.js loader at src/app/layout.tsx:112-115 and every GA4 beacon from src/lib/gtag.ts (used by product-card.tsx:15 / product-view-tracker.tsx:4). Added `https://www.googletagmanager.com` to script-src and the 3 GA hosts to connect-src in next.config.ts. Set-difference of requested-vs-allowed origins went from 4 blocked to 0. Narrow allowlist widening to origins the app already requests; no unsafe-* token added.
CORRECTION of backlog-1: its claim that production still sends `script-src … 'unsafe-eval'` is WRONG. My own `curl -s -D - https://liceno.ir/` shows `script-src 'self' 'unsafe-inline'` — commit d316379 IS live. The earlier reading came from a STALE LOCAL build (`.next/routes-manifest.json` bakes headers at build time, so `next start` without a rebuild keeps serving the old policy).
AXIS 1 RESULT: `npm run typecheck:app` is CLEAN (exit 0) and `src/` has 0 errors. The first measurement was RED (exit 2, 6× TS2304) from ONE corrupt line in the generated `.next/dev/types/validator.ts:728` (a 21-byte prefix loss); regenerating the artifact cleared it and the corruption did NOT reproduce ⇒ torn write, not a source defect. `tsconfig.domain.json` still covers kernel only (no `exclude` key; excluded by omission). `npm run lint` = 261 problems (250 errors/11 warnings) but 0 inside `src/` (mostly .agents/skills + scratch .cjs). `npm run test` = 125/125 pass. There is NO CI in the repo.
NOT DONE / NEEDS OWNER: nothing deployed; no data/auth/schema touched. Open for iteration 3: /shop?cat= canonical-vs-sitemap contradiction (30 URLs), 3 never-read serialized fields (91KB of /shop payload), lucide-react barrel (188KB gz on every route), sitemap hygiene (18 URLs that 301 + 20 zero-product categories), add CI.

## 2026-09-15 — Catalog definition audit (docs/catalog-audit/)
Full-catalog audit (1049 products) at owner request (5 sample Claude Pro links + /shop?search=claude).
Findings: 539 products (51%) affected — 138 true-duplicate groups (341 products), 7 misleading-title groups (44), 22 similar-title families (329).
Root causes — OUR side: (M1) `localizeProduct()` in src/lib/supplier.ts collapses every Claude variant to "Claude Pro" and appends only duration, dropping quota/tier/access-type; (M2) sync matches only by `supplier_product_id`, so a re-listed supplier ID creates a brand-new product; (M3) exact-string matching misses brand aliases ("Openai" vs "ChatGPT"); (M4) shortDesc is raw English supplier text; (M5) no pre-publish QA gate; (M6) fake stock=99.
Root causes — SUPPLIER side: (S1) re-listing under new IDs (2814→3265→3328); (S2) terse English names, no structured fields; (S3) one name ("Claude Pro") for API credit, Premium seat and trial account; (S4) silent price changes; (S5) ambiguous warranty wording.
Delivered (DRAFT — no live data changed): docs/catalog-audit/{CATALOG_AUDIT_REPORT.html, product-registry.csv (537 rows), ROOT_CAUSE.md, NAMING_SKU_STANDARD.md, MERGE_PLAN.md, SUPPLIER_INFO_REQUEST_TEMPLATE.md, SOP_QA_CHECKLIST.md, slug-redirects.proposed.json (+187)}; scripts/catalog-audit-registry.cjs; scripts/catalog-dedup-apply.mjs.
Registry hardening: merges now happen ONLY inside a supplier-identity group (same normalized supplier name). Title-only matches are renamed, never merged. The generator validates before writing: every merge must have a same-function, same-group target and every group must keep exactly one base — current output: 138 groups, 203 merges, 138 bases, 0 validation problems.
End-to-end verification on a staging DB (`audit-test.db`) with the app running (DATABASE_URL override): all five audited links render unique self-explaining titles; 4 duplicate slugs return 301 to a same-function base; `/shop?search=claude` shows 0 legacy ambiguous names; every absorbed active product has a working redirect (0 orphans); description headings synced with the new titles (0/12 stale). 84 archived, 83 renamed, 44 reactivated, redirects 777→980, ZERO rows deleted.
CODE FIX (draft, tested, NOT deployed): new `src/lib/product-naming.ts` (parseAttributes/buildProductTitle/buildSku/buildDedupKey) + `kernel/test/productNaming.test.ts` (10 tests; suite now 116/116 green, typecheck clean). `localizeProduct()` in src/lib/supplier.ts now keeps access-type + quota in the title (only 29 of 1049 names change; unknown access type and virtual numbers are left untouched).
SIDE BUG FOUND & FIXED: part of src/lib/supplier.ts was stored as Windows-1252 mojibake ("Ø´Ù…Ø§Ø±Ù‡" instead of "شماره مجازی"), so Persian regexes there never matched and every string it produced was written to the catalogue corrupted. Repaired 853 strings with scripts/fix-mojibake.mjs; 0 mojibake chars left, ASCII-only diff proves no code line changed.
Remaining to finish the wiring: add dedup_key to nextSpecs at the 3 product-create sites + extend the existing-product lookup + one-time backfill (see docs/catalog-audit/CODE_FIX.md §7).
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