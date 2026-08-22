# راهنمای ادغام هسته دامنه در ریپوی موجود

**هدف یک‌خطی:** منتقل کردن این بسته به `github.com/matmat1374/licenseland` بدون تخریب قابلیت‌های موجود.

## ۰. چرا من خودم این کار را نکردم

محیط اجرای من شبکه خروجی ندارد: `curl: (6) Could not resolve host: github.com`. پس نه clone، نه `npm ci`، نه push. توکنی که دادید **استفاده نشد** و باید ابطال شود.

## ۱. ترتیب اجباری — امنیت اول

```bash
# 1) توکن GitHub را الان ابطال کنید:
#    github.com/settings/tokens  ->  Revoke

# 2) رازهای ترک‌شده را از تاریخچه حذف کنید
git clone https://github.com/matmat1374/licenseland.git
cd licenseland
cp .env .env.local.backup            # پشتیبان خارج از گیت
pip install git-filter-repo
git filter-repo --invert-paths --path .env --path db/custom.db
printf '.env\n.env.*\n!.env.example\ndb/*.db\n' >> .gitignore
git add .gitignore && git commit -m "chore(security): stop tracking secrets and local db"
git push --force-with-lease origin main   # تنها مورد مجاز force

# 3) هر کلیدی که در .env قدیمی بود را باطل و دوباره صادر کنید
```

توجه: `git filter-repo` تاریخچه را بازنویسی می‌کند. اگر مشارکت‌کننده دیگری دارید، باید دوباره clone کند. در ضمن حذف از تاریخچه **راز را امن نمی‌کند**؛ فقط انتشار مجدد را متوقف می‌کند. چرخش کلید اجباری است.

## ۲. قرار دادن هسته دامنه

```bash
git checkout -b feat/domain-kernel
mkdir -p src/domain
# محتوای src/ این بسته را در src/domain/ قرار دهید
cp -r <kernel>/src/*        src/domain/
cp -r <kernel>/test         test/domain
cp -r <kernel>/docs         docs
cp <kernel>/INTEGRATION.md <kernel>/GO_LIVE_CHECKLIST.md <kernel>/CHANGELOG.md .
cp <kernel>/.env.example .env.example
cp <kernel>/.github/workflows/ci.yml .github/workflows/ci.yml
cp <kernel>/scripts/probe-supplier.mjs scripts/probe-supplier.mjs
```

افزودن اسکریپت‌ها به `package.json` ریپو (الان هیچ اسکریپت تست یا typecheck وجود ندارد — ردیف A6 ممیزی):

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "node --test test/domain/*.test.ts",
    "coverage": "node --test --experimental-test-coverage test/domain/*.test.ts",
    "e2e": "playwright test",
    "verify": "npm run typecheck && npm run lint && npm run coverage && npm run build",
    "supplier:probe": "node scripts/probe-supplier.mjs"
  }
}
```

هشدار: ریپو `typescript ^5` دارد و این کد با `strict: true` نوشته شده. اگر `tsconfig.json` فعلی ریپو `strict` نیست، اول این را درست کنید و خطاها را بشمارید — این عدد مبنای واقعی بدهی فنی شماست.

## ۳. مهاجرت‌های مورد نیاز (برگشت‌پذیر)

ترتیب پیشنهادی، هر کدام یک مهاجرت جداگانه با `down` مشخص:

| # | جدول | وابسته به | ریسک |
|---|---|---|---|
| ۱ | `pricing_rules`، `price_snapshots` | — | کم |
| ۲ | `wallet_accounts`، `wallet_ledger` | کاربران | متوسط |
| ۳ | `idempotency_keys` | — | کم |
| ۴ | `supplier_calls`، `webhooks`، `jobs` | — | کم |
| ۵ | `payments`، `crypto_payments`، `refunds` | سفارش‌ها | متوسط |
| ۶ | `audit_logs`، `tickets`، `seo_meta` | — | کم |
| ۷ | رمزنگاری `LicenseKey.key` → ستون‌های Vault | لایسنس‌ها | **بالا** |
| ۸ | SQLite → PostgreSQL | همه | **بالا** |

مهاجرت ۷ باید دومرحله‌ای باشد: اول ستون‌های جدید را اضافه کنید و بنویسید (dual-write)، سپس پس از اطمینان از رمزگشایی موفق، ستون متن ساده را حذف کنید. هرگز در یک مرحله نه.

## ۴. نقطه اتصال کد (مرزها)

| مرز | مسئولیت لایه وب | مسئولیت هسته |
|---|---|---|
| نمایش قیمت | فراخوانی `computeQuote` و فقط فرمت‌کردن | محاسبه کامل قیمت |
| ثبت سفارش | تولید `idempotencyKey` پایدار | `runOnce` + `createPriceSnapshot` |
| Callback درگاه | Verify سرورساید | `applyTransition` + `runOnce` |
| تحویل | نمایش کنترل‌شده و لاگ بازبینی | `fulfillOrder` + `sealLicense` |
| وب‌هوک | خواندن raw body پیش از parse | `verifyWebhookSignature` |

قاعده مرز: لایه وب **هرگز** محاسبه پولی انجام نمی‌دهد. اگر در یک کامپوننت React ضرب یا تقسیم مبلغ دیدید، این یک باگ است.

## ۵. تأیید قرارداد تامین‌کننده (اجباری پیش از فروش)

```bash
export SUPPLIER_API_KEY='...'      # فقط در این شل؛ در فایل ننویسید
npm run supplier:probe
```

خروجی را در `test/fixtures/supplier/` ببینید، PII را پاک کنید، و ستون «تاییدشده؟» در `docs/SUPPLIER_CONTRACT.md` را از `DOCS-ONLY` به `OBSERVED` تغییر دهید. هر فیلدی که در پاسخ واقعی نبود، از کد حذف شود.

## ۶. اجرای اسکن‌های مبنا که من نتوانستم اجرا کنم

```bash
npm ci
npx tsc --noEmit                              # شمارش خطای تایپ مبنا
npm run lint                                  # ESLint
npm audit --audit-level=high                  # CVE
npx gitleaks detect --source . --log-opts=--all   # راز در تاریخچه
npm run build && npx next start &
npx lighthouse http://localhost:3000/ --preset=desktop --form-factor=mobile
npx @axe-core/cli http://localhost:3000/
```

هر عددی که گرفتید را در `docs/VERIFICATION.md` جای ردیف‌های `NOT RUN` بنویسید. تا آن لحظه دروازه‌های فاز ۶–۹ برآورده نشده محسوب می‌شوند.

## ۷. انتطام گیت

- هر فاز یک شاخه: `feat/domain-kernel`، `feat/pricing-admin`، `feat/payments`، `chore/security-hardening`، ...
- Conventional Commits و پیام انگلیسی.
- Branch Protection روی `main`: CI اجباری، بدون force-push (تنها استثنا: همان purge مرحله ۱).
