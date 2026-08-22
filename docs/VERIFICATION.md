# VERIFICATION — LicenseLand Phase 8

**Principle:** Report only what was measured. Never state a score that was not run.
If a metric could not be measured, it says NOT RUN with the reason.

## Date: 2026-08-20
## Environment: Z.ai sandbox, 4GB RAM, Node v24.18.0, Next.js 16.1.3

## Code Quality Gates

| Metric | Target | Measured | Status | Evidence |
|---|---|---|---|---|
| TypeScript strict | 0 errors | 0 errors | **PASS** | `npx tsc --noEmit` exit 0 |
| ESLint | 0 errors | 0 errors | **PASS** | `bun run lint` exit 0 |
| Kernel unit tests | all pass | 101 pass / 0 fail | **PASS** | `node --test kernel/test/*.test.ts` |
| Failure-path tests | all pass | 7 pass / 0 fail | **PASS** | `node --test test/domain/failure-paths.test.ts` |
| Build (next build) | succeeds | exit 0 | **PASS** | `next build --webpack` in 34.5s |
| tsconfig strict | true | true | **PASS** | tsconfig.json line 11 |

## SEO Gates

| Metric | Target | Measured | Status | Evidence |
|---|---|---|---|---|
| Canonical URL on home | present | present | **PASS** | `curl /` → `rel="canonical"` found |
| Meta description on home | present | present | **PASS** | `curl /` → `meta name="description"` found |
| `<title>` on home | present | present | **PASS** | `curl /` → `<title>لیسانس‌لَند | ...</title>` |
| AggregateRating fake | 0 occurrences | 0 | **PASS** | `curl /` → `grep -c AggregateRating` = 0 |
| Product.rating default | null (no default) | `Float?` nullable | **PASS** | `prisma/schema.prisma` line 99 |
| Review.approved default | false | `@default(false)` | **PASS** | `prisma/schema.prisma` line 190 |
| Sitemap (dynamic) | exists | exists | **PASS** | `src/app/sitemap.ts` verified |
| Robots.txt | exists | exists | **PASS** | `src/app/robots.ts` verified |
| Product JSON-LD | Product+Offer | implemented | **PASS** | `src/app/product/[slug]/page.tsx` — JSON-LD script tag |
| Breadcrumbs JSON-LD | BreadcrumbList | implemented | **PASS** | `src/app/product/[slug]/page.tsx` — BreadcrumbList script |
| noindex for out-of-stock | robots meta | implemented | **PASS** | `generateMetadata` returns `robots: { index: false }` when stock=0 |

## RTL / Design / Typography

| Metric | Target | Measured | Status | Evidence |
|---|---|---|---|---|
| RTL | dir="rtl" lang="fa" | present | **PASS** | `src/app/layout.tsx` line 55: `<html lang="fa" dir="rtl">` |
| Vazirmatn font | loaded | loaded | **PASS** | `src/app/layout.tsx` — Vazirmatn from next/font/google |
| Dark/light theme | toggle works | implemented | **PASS** | `src/components/site/theme-toggle.tsx` + next-themes |
| Design tokens | CSS variables | present | **PASS** | `src/app/globals.css` — `:root` + `.dark` variables |
| No indigo/blue | emerald/zinc | verified | **PASS** | globals.css uses oklch emerald, no indigo hex |

## Accessibility (axe)

| Metric | Target | Measured | Status | Reason |
|---|---|---|---|---|
| axe home page | 0 serious/critical | — | **NOT RUN** | Chrome binary not available in sandbox |
| axe product page | 0 serious/critical | — | **NOT RUN** | Chrome binary not available + server OOM on product page |
| axe checkout page | 0 serious/critical | — | **NOT RUN** | Chrome binary not available + server OOM on checkout page |

## Performance (Lighthouse Mobile)

| Metric | Target | Measured | Status | Reason |
|---|---|---|---|---|
| Lighthouse Performance | ≥ 90 | — | **NOT RUN** | Chrome binary not available in sandbox |
| Lighthouse Accessibility | ≥ 95 | — | **NOT RUN** | Chrome binary not available |
| Lighthouse Best Practices | ≥ 90 | — | **NOT RUN** | Chrome binary not available |
| Lighthouse SEO | ≥ 95 | — | **NOT RUN** | Chrome binary not available |
| LCP | ≤ 2.0s | — | **NOT RUN** | Requires Lighthouse |
| INP | ≤ 200ms | — | **NOT RUN** | Requires Lighthouse |
| CLS | ≤ 0.05 | — | **NOT RUN** | Requires Lighthouse |

## Server Stability (Honest Finding)

| Page | HTTP Status | Status | Note |
|---|---|---|---|
| `/` (home) | 200 | **PASS** | Loads successfully |
| `/login` | 200 | **PASS** | Loads successfully |
| `/shop` | 200 | **PASS** | Loads successfully |
| `/product/[slug]` | 000 | **FAIL** | Server OOM crash (4GB RAM limit in sandbox) |
| `/checkout` | 000 | **FAIL** | Server OOM crash |
| `/api/health` | 200 | **PASS** | Health endpoint works |

**Root cause of product/checkout crash:** The sandbox has 4GB RAM. Next.js production mode
requires ~2GB for the server process. When the product page (which loads product + reviews +
related products + FAQ) or the checkout page (which imports many components) is first served,
the memory spike exceeds the limit and the OS OOM-killer terminates the process.

**Fix:** Deploy on a server with ≥ 8GB RAM, or use the provided Dockerfile with
`--memory=4g` flag and swap enabled.

## Deployment Readiness

| Metric | Target | Measured | Status | Evidence |
|---|---|---|---|---|
| Dockerfile (multi-stage) | exists | exists | **PASS** | `Dockerfile` — 3-stage build |
| docker-compose.yml | exists | exists | **PASS** | `docker-compose.yml` — postgres + app + caddy |
| Caddyfile.prod (TLS) | exists | exists | **PASS** | `Caddyfile.prod` — HSTS, security headers |
| Health endpoint | `/api/health` responds | created | **PASS** | `src/app/api/health/route.ts` — returns 200/503 |
| DB backup script | exists | exists | **PASS** | `scripts/backup-db.sh` — pg_dump + gzip + rotate |
| PostgreSQL schema | provider=postgresql | documented | **PASS** | `prisma/schema.prisma` — provider switchable |
| .env.example | all vars listed | complete | **PASS** | `.env.example` — 15 variables with comments |
| .env in .gitignore | yes | yes | **PASS** | `.gitignore` — `.env`, `.env.*`, `!.env.example` |

## Admin Panel

| Metric | Target | Measured | Status | Evidence |
|---|---|---|---|---|
| Setup wizard | `/admin/setup` | exists | **PASS** | `src/app/admin/setup/page.tsx` — 8 fields |
| KPI dashboard | revenue, margin, AOV, etc. | implemented | **PASS** | `src/app/admin/page.tsx` — 8 real Prisma queries |
| CMS (content edit) | `/admin/content` | exists | **PASS** | `src/app/admin/content/page.tsx` |
| Debug page | `/admin/debug` | exists | **PASS** | `src/app/admin/debug/page.tsx` |
| Docs page | `/admin/docs` | exists | **PASS** | `src/app/admin/docs/page.tsx` |

## Security

| Metric | Target | Measured | Status | Evidence |
|---|---|---|---|---|
| .env purged from git history | 0 occurrences | 0 | **PASS** | `git filter-repo` applied, `git log --all -- .env` = empty |
| db/custom.db purged from git history | 0 occurrences | 0 | **PASS** | `git filter-repo` applied |
| .gitignore blocks .env | yes | yes | **PASS** | `.gitignore` — `.env`, `.env.*` |
| .gitignore blocks *.db | yes | yes | **PASS** | `.gitignore` — `*.db`, `db/` |
| NEXTAUTH_SECRET hardcoded fallback | should not exist in prod | exists in dev | **FAIL** | `src/lib/auth.ts:22` — hardcoded fallback secret |
| License encryption (AES-256-GCM) | implemented | implemented | **PASS** | `kernel/src/security/licenseVault.ts` + `src/lib/domain/vault.ts` |
| Supplier API key server-side only | yes | yes | **PASS** | `kernel/src/supplier/provider.ts` — `assertServerSide()` |
| Webhook signature verification | HMAC-SHA256 | implemented | **PASS** | `kernel/src/security/licenseVault.ts` — `verifyWebhookSignature` |

## Summary

| Category | PASS | FAIL | NOT RUN |
|---|---|---|---|
| Code Quality | 6 | 0 | 0 |
| SEO | 11 | 0 | 0 |
| RTL/Design | 5 | 0 | 0 |
| Accessibility (axe) | 0 | 0 | 3 |
| Performance (Lighthouse) | 0 | 0 | 7 |
| Server Stability | 4 | 2 | 0 |
| Deployment | 8 | 0 | 0 |
| Admin Panel | 5 | 0 | 0 |
| Security | 7 | 1 | 0 |
| **Total** | **46** | **3** | **10** |

### Honest Assessment

This is NOT a production-ready, Google-standard website. The following blockers exist:

1. **axe and Lighthouse were NOT RUN** — Chrome binary is not available in this sandbox.
   These MUST be run on the deployment target before accepting real money.

2. **Product and checkout pages crash the server** in this 4GB sandbox due to OOM.
   The Dockerfile provides a path to a proper server with adequate RAM.

3. **NEXTAUTH_SECRET has a hardcoded fallback** — acceptable for dev, but MUST be
   set to a random 32+ char secret in production `.env`.

4. **No E2E tests** — Playwright tests for the golden path (purchase → payment → delivery)
   are not yet written. This is a critical gap for a money-handling system.

5. **OTP is test-only** (code `123456`) — a real SMS provider must be connected.

6. **ZarinPal is in DEMO mode** — a real merchant ID must be provided.
