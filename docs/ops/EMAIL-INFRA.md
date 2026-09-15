# طرح زیرساخت ایمیل سفارش‌ها — لیسنو

**هدف:** هر رویداد سفارش ایمیل خودش را داشته باشد و «آیا به مشتری خبر دادیم؟» با یک کوئری پاسخ بگیرد.

## ۱. ارائه‌دهنده

| گزینه | پیکربندی | یادداشت |
|---|---|---|
| **Postmark** (پیشنهاد اول) | `EMAIL_PROVIDER=postmark` + `POSTMARK_TOKEN` | بهترین تحویل تراکنشی و لاگ |
| SendGrid | `EMAIL_PROVIDER=sendgrid` + `SENDGRID_API_KEY` | جایگزین |
| Mailgun | `EMAIL_PROVIDER=mailgun` + `MAILGUN_API_KEY` + `MAILGUN_DOMAIN` | جایگزین |
| SMTP | `EMAIL_PROVIDER=smtp` + `SMTP_HOST/PORT/USER/PASS` | سرور اختصاصی |

`EMAIL_FROM` = «لیسنو <no-reply@liceno.ir>»

> اگر هیچ‌کدام تنظیم نشود، پیام **رندر و ذخیره** می‌شود اما وضعیت `SKIPPED` می‌ماند — هرگز «ارسال‌شده» ثبت نمی‌کنیم چون واقعاً ارسال نشده است.

## ۲. احراز دامنه (DNS)

| رکورد | نام | مقدار | کاربرد |
|---|---|---|---|
| SPF | `@` | `v=spf1 include:<provider-spf> -all` | جلوگیری از جعل فرستنده |
| DKIM | `<selector>._domainkey` | کلید عمومی ارائه‌دهنده | امضای پیام |
| DMARC | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:dmarc@liceno.ir; adkim=s; aspf=s` | سیاست و گزارش |
| Return-Path | `bounces` | مقدار ارائه‌دهنده | برگشتی‌ها |

**ترتیب اجرا:** DKIM → SPF → DMARC با `p=none` یک هفته → سپس `p=quarantine`.

## ۳. قالب‌ها و تریگرها

| رویداد | تریگر | محتوا |
|---|---|---|
| `order_created` | ایجاد سفارش در checkout | ثبت سفارش + لینک پرداخت |
| `payment_confirmed` | `status` → PAID | تأیید پرداخت |
| `supplier_purchased` | `stage` → PURCHASED | در حال آماده‌سازی |
| `shipped` | ثبت ارسال | کد رهگیری + حامل |
| `delivered` | `stage` → DELIVERED | تشکر |
| `followup` | ۷ روز پس از تحویل / دستی | نظرسنجی |

هر قالب فارسی و RTL است و نسخهٔ متنی هم دارد.

## ۴. صف و تلاش مجدد

- **جدول واحد:** `EmailLog` هم صف است و هم لاگ (`QUEUED → SENT | FAILED | SKIPPED`).
- **پردازش:** worker هر ۶۰ ثانیه صف را تخلیه می‌کند (`src/instrumentation.ts`).
- **Backoff نمایی:** ۱ → ۵ → ۱۵ → ۶۰ → ۳۶۰ دقیقه (۵ تلاش).
- **Dead-letter:** پس از تلاش پنجم → `FAILED` و ماندن در جدول برای پیگیری انسانی.
- هیچ خطای ایمیلی جریان سفارش را متوقف نمی‌کند (enqueue داخل try/catch).

## ۵. مانیتورینگ

| سنجه | آستانهٔ هشدار |
|---|---|
| ردیف `FAILED` | > ۰ → بررسی روزانه |
| ردیف `QUEUED` قدیمی‌تر از ۱ ساعت | > ۰ → هشدار |
| نسبت `SKIPPED` | > ۰ → ارائه‌دهنده پیکربندی نشده |

## ۶. راه‌اندازی (گام‌به‌گام)

1. حساب تراکنشی بسازید و دامنهٔ `liceno.ir` را اضافه کنید.
2. رکوردهای DKIM/SPF را در DNS دامنه ثبت کنید و در پنل ارائه‌دهنده Verify بزنید.
3. `EMAIL_PROVIDER` و توکن را در `.env` سرور بگذارید.
4. `pm2 reload licenseland` تا worker با تنظیمات جدید بالا بیاید.
5. یک سفارش آزمایشی بسازید و `EmailLog` را ببینید: باید `SENT` شود.
6. DMARC را یک هفته بعد از `p=none` به `p=quarantine` ارتقا دهید.
