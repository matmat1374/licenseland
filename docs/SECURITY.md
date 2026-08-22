# فاز ۵ — مدل تهدید و سخت‌سازی

**هدف یک‌خطی:** مشخص کردن این‌که پول و راز از کدام مسیرها می‌تواند خارج شود و در هر مسیر چه کنترلی وجود دارد.

## ۵.۰ حادثه فعال — پیش از هر کار دیگری

| # | یافته | وضعیت | اقدام الزامی |
|---|---|---|---|
| ۱ | توکن GitHub (`ghp_…`) در گفتگوی متنی ارسال شد | **افشاشده** | ابطال فوری در GitHub → Settings → Developer settings → Personal access tokens → Revoke. این توکن در هیچ جای این تحویل ذخیره یا استفاده نشده است. |
| ۲ | `.env` (۵۲۸ بایت) در ریپوی عمومی | **افشاشده** | هر کلید داخل آن (درگاه، NextAuth secret، API تامین‌کننده) را باطل و دوباره صادر کنید |
| ۳ | `db/custom.db` (۳۴۴ KB) در ریپوی عمومی | **افشاشده** | همه لایسنس‌های داخل آن سوخته‌اند؛ همه رمز/توکن کاربران باید باطل شود |

دستور پاک‌سازی تاریخچه (روی ماشین خودتان، پس از تهیه پشتیبان):

```bash
git clone --mirror https://github.com/matmat1374/licenseland licenseland-mirror
cd licenseland-mirror
git filter-repo --invert-paths --path .env --path db/custom.db
git push --force --all && git push --force --tags
```

> توجه: پاک‌سازی تاریخچه تنها انتشار را متوقف می‌کند. رازی که یک‌بار عمومی شده، فقط با **باطل‌سازی** بی‌ارزش می‌شود.

## ۵.۱ جدول STRIDE

| دارایی | تهدید (STRIDE) | اثر کسب‌وکاری | کنترل | وضعیت در این تحویل |
|---|---|---|---|---|
| کلید `X-API-Key` تامین‌کننده | Information Disclosure | خرج شدن موجودی USD توسط مهاجم | فقط ENV، فقط سرورساید، `assertServerSide()`، `redact()` روی همه لاگ‌ها | پیاده + تست |
| کیف پول کاربر | Tampering / Elevation | خلق پول از هوا | دفتر دوطرفه فقط-الحاقی، مانده محاسباتی، `assertBalanced` | پیاده + تست |
| لایسنس فروشته‌شده | Information Disclosure | دزدی موجودی قابل فروش | AES-256-GCM + Envelope Key + AAD=orderId + `keyVersion` | پیاده + تست |
| وب‌هوک تامین‌کننده | Spoofing | تحویل جعلی / تغییر وضعیت سفارش | `verifyWebhookSignature` با `timingSafeEqual` + کنترل طول | پیاده + تست |
| Callback درگاه | Spoofing / Replay | دوبار شارژ شدن | Verify سرورساید + `runOnce` + `txId` پایدار | هسته آماده؛ اداپتر درگاه نیاز به کلید دارد |
| پنل ادمین | Elevation of Privilege | تغییر قاعده قیمت → فروش زیر قیمت | RBAC + TOTP اجباری + `audit_logs` + هشدار حاشیه منفی | `assessMargin` پیاده؛ RBAC/2FA نیازمند لایه وب |
| لاگ‌ها | Information Disclosure | افشای راز در سرویس لاگ ثالث | `SENSITIVE_KEY_PATTERN` + `SUPPLIER_KEY_PATTERN` + `maskSecret` | پیاده + تست |
| سفارش دیگران | IDOR | دیدن لایسنس دیگران | اجبار `ownerUserId` در هر Query + AAD متصل به سفارش | نیازمند لایه وب |
| درخواست به تامین‌کننده | DoS متقابل | بلاک شدن حساب (429) | Circuit Breaker + Retry کرانمند + Timeout | پیاده + تست |

## ۵.۲ نگاشت OWASP Top 10 (وضعیت واقعی)

| رده | وضعیت | شاهد / کمبود |
|---|---|---|
| A01 Broken Access Control | ناقص | هسته مرز دامنه دارد؛ RBAC در لایه وب هنوز پیاده نشده |
| A02 Cryptographic Failures | پوشش‌داده‌شده (دامنه) | `licenseVault.ts` + ۳۲ تست امنیتی |
| A03 Injection | ناقص | Prisma پارامتریک است، ولی اعتبارسنجی Zod در مرز هنوز اعمال نشده |
| A04 Insecure Design | جزئی | ماشین حالت + Idempotency + Saga جبرانی پیاده |
| A05 Security Misconfiguration | **نقض‌شده** | `.env` و دیتابیس در ریپوی عمومی |
| A06 Vulnerable Components | نامعلوم | `npm audit` اجرا نشد (بدون شبکه)؛ `z-ai-web-dev-sdk@0.0.18` مشکوک |
| A07 Auth Failures | ناقص | 2FA، Lockout و Rate Limit هنوز نیست |
| A08 Data Integrity | جزئی | امضای وب‌هوک + digest اسنپشات |
| A09 Logging Failures | جزئی | `AuditRecord` و لاگ پاک‌سازی‌شده پیاده؛ جدول تغییرناپذیر نیاز به مهاجرت دارد |
| A10 SSRF | ناقص | فقط `baseUrl` ثابت از ENV فراخوانی می‌شود؛ ولی مسیر آپلود/پروکسی تصویر باید مرور شود |

**ASVS L2:** ادعای پوشش ۱۰۰٪ **مطرح نمی‌شود**. نگاشت کامل ASVS نیازمند لایه وب (نشست، CSP، CSRF، مدیریت کاربر) است که در این تحویل پیاده نشده است.

## ۵.۳ هدرهای امنیتی الزامی پیش از Go-Live

| هدر | مقدار |
|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `Content-Security-Policy` | با nonce؛ بدون `unsafe-inline` و `unsafe-eval` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | غیرفعال‌سازی دوربین/میکروفون/مکان |
| کوکی نشست | `HttpOnly; Secure; SameSite=Lax`؛ برای ادمین عمر کوتاه‌تر |

## ۵.۴ عملیات

- پشتیبان روزانه دیتابیس + تست بازیابی ماهانه (پشتیبان بدون تست بازیابی = پشتیبان موهوم).
- کلید Vault جدا از پشتیبان دیتابیس نگهداری شود.
- دسترسی حداقلی: کاربر دیتابیس برنامه نباید `SUPERUSER` باشد.
- چرخش کلید: تامین‌کننده و درگاه هر ۹۰ روز؛ Vault با `keyVersion` جدید بدون توقف سرویس.
