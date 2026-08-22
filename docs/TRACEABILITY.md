# ماتریس ردیابی (Traceability Matrix)

نگاشت نیاز دستور کار → کد → تست → شاهد. ستون وضعیت فقط سه مقدار دارد: DONE / PARTIAL / NOT DONE.

## فاز ۳ — موتور قیمت‌گذاری

| نیاز | کد | تست | وضعیت |
|---|---|---|---|
| ترتیب Product Override ← Category ← Global | `pricing/engine.ts: resolveEffectiveRule` | `pricing.test.ts` «تعارض قواعد» | DONE |
| کف سود مطلق | `engine.ts` گام `min_margin` | `pricing.test.ts` `min_margin_enforced` | DONE |
| Floor / Cap | `engine.ts` گام‌های floor/cap | `pricing.test.ts` floor/cap + `cap_below_min_margin` | DONE |
| مالیات | `engine.ts: netToGross` | `pricing.test.ts` تست مالیات ۹۰۰bps | DONE |
| رند کردن up/nearest/psychological | `pricing/rounding.ts` | `rounding.test.ts` + مرزها | DONE |
| قاعده زمان‌بندی‌شده (روز/ساعت/انقضا) | `engine.ts: findActiveScheduledRule`، `weekdayInZone` | `pricing.test.ts` کمپین‌ها | DONE |
| قیمت صفر / غیرعددی / ارز غیرمنتطره | `engine.ts` دلایل `BlockedReason` | `pricing.test.ts`، `supplierContract.test.ts` | DONE |
| تغییر قیمت میان چرخه | `pricing/snapshot.ts: verifySnapshot` | `pricing.test.ts` تست mid-cycle | DONE |
| اسنپشات تغییرناپذیر | `snapshot.ts: createPriceSnapshot` | `pricing.test.ts` qty=3 | DONE |
| هشدار حاشیه منفی | `pricing/policy.ts: assessMargin` | `pricing.test.ts` `negative` | DONE |
| Dry-Run کل کاتالوگ | `policy.ts: summarizeAssessments` | `pricing.test.ts` summarize | PARTIAL — منطق هست، UI نیست |
| تاریخچه نسخه قاعده | فیلد `version` در قاعده + اسنپشات | ثبت نسخه در تست اسنپشات | PARTIAL — جدول و UI نیست |
| پوشش شاخه‌ای ۱۰۰٪ Pricing | — | — | DONE — `docs/evidence/test-run.txt` |
| Bulk Edit قواعد | — | — | NOT DONE — لایه ادمین |

## فاز ۴ — تجارت، پرداخت، تحویل

| نیاز | کد | تست | وضعیت |
|---|---|---|---|
| ماشین حالت سفارش با گذار لاگ‌شده | `orders/stateMachine.ts` | `orders.test.ts` | DONE |
| ممنوعیت خروج از حالت نهایی | `TERMINAL_STATES`، `isTerminal` | `orders.test.ts` | DONE |
| Idempotency در ثبت سفارش/Verify/خرید | `idempotency/store.ts: runOnce` | `orders.test.ts`، `fulfillment.test.ts` | DONE |
| تشخیص تعارض انگشت‌نگاری درخواست | `IdempotencyConflictError` | `orders.test.ts` | DONE |
| دفترداری دوطرفه | `wallet/ledger.ts: assertBalanced` | `wallet.test.ts` | DONE |
| مانده محاسباتی (نه فیلد) | `InMemoryLedger.balance` | `wallet.test.ts` | DONE |
| منع مانده منفی | `insufficient_funds` | `wallet.test.ts` | DONE |
| جبران خطا: ریفاند + تیکت + Dead-Letter | `fulfillment/saga.ts` | `fulfillment.test.ts` | DONE |
| Vault لایسنس AES-256-GCM | `security/licenseVault.ts` | `security.test.ts` | DONE |
| امضای وب‌هوک | `verifyWebhookSignature` | `security.test.ts` | DONE |
| قفل هم‌روندی برداشت | قرارداد `InMemoryLedger` | — | PARTIAL — نیازمند `SELECT FOR UPDATE` در PostgreSQL |
| درگاه ایرانی Request→Verify→Reconcile | — | — | NOT DONE — مرچنت و مجوز نداریم (STOP-AND-ASK) |
| کریپتو USDT-TRC20 | — | — | NOT DONE — پروایدر/والت نداریم |
| ارسال ایمیل/فاکتور | پورت `notifier` | `fulfillment.test.ts` با دابل تست | PARTIAL — پیاده‌سازی واقعی نیست |

## فاز ۱ و ۵ — تامین‌کننده و امنیت

| نیاز | کد | تست | وضعیت |
|---|---|---|---|
| اینترفیس `SupplierProvider` | `supplier/provider.ts` | `supplierClient.test.ts` | DONE |
| Retry + Backoff + Jitter | `supplier/resilience.ts: retry` | `resilience.test.ts` | DONE |
| Circuit Breaker | `resilience.ts: CircuitBreaker` | `resilience.test.ts` | DONE |
| Timeout | `resilience.ts: withTimeout` | `resilience.test.ts` | DONE |
| لاگ بدون افشای کلید | `shared/redact.ts` | `security.test.ts` | DONE |
| منع فراخوانی سمت کلاینت | `assertServerSide` | `supplierClient.test.ts` | DONE |
| منع Mock در Production | `mockProvider.ts` گارد `NODE_ENV` | `supplierClient.test.ts` | DONE |
| نگاشت خطای HTTP → دامنه | `mapHttpStatusToError` | `supplierClient.test.ts` | DONE |
| رد فیلد مشاهده‌نشده | `contract.ts` گاردها | `supplierContract.test.ts` | DONE |
| Fixture از پاسخ واقعی | `scripts/probe-supplier.mjs` | — | NOT DONE — کلید و شبکه نداریم |
| STRIDE + نگاشت OWASP | `docs/SECURITY.md` | — | PARTIAL — دامنه پوشش‌داده، لایه وب خیر |
| 2FA / RBAC / CSP / HSTS / Rate Limit | — | — | NOT DONE — لایه وب |
| CI با اسکن راز و وابستگی | `.github/workflows/ci.yml` | — | PARTIAL — نوشته شده، اجرا نشده |

## فازهای ۶، ۷، ۹ — وضعیت صریح

| نیاز | وضعیت | دلیل |
|---|---|---|
| Design System، RTL-first، WCAG 2.2 AA | NOT DONE | هیچ کد UI تحویل نشده |
| داشبورد KPI ادمین | NOT DONE | متریک‌ها در `docs/UNIT_ECONOMICS.md` تعریف شده‌اند |
| سئوی فنی، داده ساخت‌یافته، CWV | NOT DONE | نیازمند لایه وب |
| Docker Compose، Nginx/Caddy، systemd | NOT DONE | نیازمند ریپوی کامل |
| Wizard راه‌اندازی در پنل | NOT DONE | لایه ادمین |
| `.env.example` کامل | DONE | فایل در ریشه بسته |
| مدل واحد اقتصاد و نقطه سربه‌سر | DONE | `docs/UNIT_ECONOMICS.md` (پارامتریک) |
| Go-Live Checklist | DONE | `GO_LIVE_CHECKLIST.md` |
| نقشه راه ۳۰/۶۰/۹۰ | DONE | `docs/ROADMAP-30-60-90.md` |
