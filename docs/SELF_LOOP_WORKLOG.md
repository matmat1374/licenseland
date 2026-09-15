# لاگ کار خودکار — ۱۴۰۵/۰۶/۲۳ (جلسهٔ یک‌ساعتهٔ self-directed)

> **جلسهٔ بعدی (۱۴۰۵/۰۶/۲۴):** ممیزی کامل UX/CX با نگاه ۱۰ پرسونا + رفع ۱۳ یافتهٔ P0/P1 — گزارش کامل در `docs/UX_AUDIT_2026-09-15.md`. تأیید: ۱۰۶/۱۰۶ تست، typecheck پاک، رندر تمیز دسکتاپ/موبایل. **کامیت `05b7e9d` و دیپلوی پروداکشن انجام شد** — تأیید زنده: home/api-health/forgot-password همه 200، ادعای ایمیل از قوانین حذف شده، liceno.ir 200.

> **به‌روزرسانی پایانی:** همهٔ موارد H4/H5/H6 نیز پیاده، تست (۱۰۶/۱۰۶) و **روی پروداکشن دیپلوی شد** (commit `0a0a297`). تأیید زندهٔ سرور: `home:200`، `api/health → ok`، پاسخ OTP بدون کد، `https://liceno.ir/ → 200`.

> این سند خروجی «لوپ خودکار» است: برنامه‌ریزی خودت، اجرای خودت، تأیید خودت.
> مبنا: `docs/CODE_REVIEW_2026-09-14.md` (گزارش بازبینی) و `docs/IMPROVEMENT_PROPOSALS.md` (پیشنهادهای بهبود).

## پلن انتخابی و منطق

از بین ۵ باگ بحرانی و ۲ برد سریع، این ترتیب انتخاب شد:

1. **C1 (نشت OTP)** — بزرگ‌ترین ریسک امنیتی؛ دور زدن کامل احراز هویت.
2. **C2 (ادمین هاردکد)** — وابسته به C1؛ همان فایل، همان مسیر.
3. **C4/C5 (race امتیاز)** — خطر مالی مستقیم (امتیاز منفی = تخفیف رایگان).
4. **H1 (نشت رزرو انبار)** — قفل‌شدن موجودی ۳۰ دقیقه‌ای در هر خطای بعد از تراکنش.
5. **H2 (فروش دوبارهٔ کلید)** — همان الگوی اتمی checkout به fulfillment منتقل شد.
6. **B4 + C4 (برد سریع)** — کم‌ریسک‌ترین بهبودهای تجربهٔ کاربر از سند پیشنهادها.
7. **C3 (کلید ملی‌پیامک)** — عمداً **انجام نشد**: چرخش کلید فقط از پنل ملی‌پیامک ممکن است (نیاز به دسترسی پنل/تصمیم صاحب حساب). حذف پیش‌فرض هاردکد بدون چرخش، سرویس SMS را قطع می‌کند — کار ادمین است، نه کد. ⚠️ **اقدام موردنیاز از شما:** ریست کلید در پنل ملی‌پیامک و جایگزینی در `.env`.

---

## تغییرات اعمال‌شده (۷ فایل)

### ۱. `src/app/api/auth/otp/request/route.ts` — رفع C1
- فیلد `otp` از پاسخ JSON **حذف شد**. کد فقط در لاگ سرور می‌ماند.
- تأیید: `curl POST /api/auth/otp/request` → `{"ok":true,"message":"کد تایید ارسال شد"}` — بدون هیچ کدی در پاسخ.
- کلاینت‌ها (`login/page.tsx`, `register/page.tsx`, `checkout-client.tsx`) هرگز `.otp` را نمی‌خواندند (جستجو شد) — ورود همچنان از مسیر پیامک/لاگ کار می‌کند.

### ۲. `src/app/api/auth/otp/route.ts` — رفع C2
- شمارهٔ ادمین به `process.env.ADMIN_PHONE_NUMBER` منتقل شد (پیش‌فرض همان شماره برای سازگاری).
- ارتقای ادمین با فلگ `ENABLE_ADMIN_PHONE_PROMOTION` قابل خاموش‌کردن است (پیش‌فرض روشن برای عدم شکستن فلوی فعلی).
- تابع `promoteToAdmin()` یک‌جا تعریف شد؛ هر دو مسیر create/update از آن استفاده می‌کنند.

### ۳. `src/lib/loyalty.ts` — رفع C4 + C5
- `redeemPoints`: چک-و-کسر با یک `updateMany` شرطی (`totalPoints >= pointsToRedeem`) اتمیک شد؛ `count===0` یعنی موجودی ناکافی. ورودی هم اعتبارسنجی شد (`Number.isInteger && > 0`).
- `earnPoints`: نوشتن `totalSpent: { increment: orderAmount }` به‌جای نوشتن مقدار محاسبه‌شده — دیگر lost-update رخ نمی‌دهد.
- تست‌های ۱۰۱گانهٔ هسته همچنان سبز.

### ۴. `src/app/api/checkout/create/route.ts` — رفع H1
- متغیرهای `createdOrderId` / `redeemedPointsForOrder` / `authUserId` ردیابی می‌شوند.
- `catch` بیرونی حالا: آزادسازی `RESERVED` keys → `status=FAILED` برای سفارش → برگرداندن امتیاز خرج‌شده (`addBonusPoints`).
- مسیر موفق gateway-failure قبلاً تمیزکاری داشت؛ مسیر استثنا الان هم تمیز است.

### ۵. `src/lib/order-fulfillment.ts` — رفع H2
- claim کلیدهای AVAILABLE با `updateMany` شرطی (`id + status=AVAILABLE + orderItemId=null`) — الگوی رزرو checkout.
- چک کفایت کاندیداها قبل از claim + throw در از دست دادن مسابقه → rollback تراکنش.
- اگر کلید کمتر از تعداد باشد، خطای فارسی واضح پرتاب می‌شود.

### ۶. `src/app/checkout/checkout-client.tsx` — برد سریع B4
- کارت سبز «امتیاز وفاداری این خرید: + N امتیاز» قبل از دکمهٔ پرداخت.
- فرمول همان منطق سرور: `floor(floor(total/10000) × multiplier(tier))`.
- فقط برای کاربر لاگین‌شده و سفارش با مبلغ > ۰ نمایش داده می‌شود.

### ۷. `src/app/order/[id]/page.tsx` — برد سریع C4
- بخش «راهنمای فعال‌سازی» با `<details>` جمع‌شونده زیر لایسنس‌ها.
- از `getProductActivationGuide` (که تا امروز فقط در ایمیلِ ارسال‌نشده بود) استفاده می‌کند — چون SMTP ست نیست، کاربر راهنما را واقعاً هیچ‌جا نمی‌دید.

---

## تأیید و تست

| بررسی | نتیجه |
|--------|-------|
| `npm run test` (هسته) | ۱۰۱/۱۰۱ سبز |
| `npm run typecheck` (tsconfig.domain.json) | بدون خطا |
| `curl POST /api/auth/otp/request` | پاسخ بدون کد OTP ✅ |
| `curl POST /api/checkout/create` (سبد خالی) | 400 با پیام درست ✅ |
| `curl /order/nonexistent-id` | 404 ✅ |
| پیش‌نمایش زنده (صفحهٔ اصلی + shop) | رندر سالم؛ فقط خطای خارجی Enamad CDN (timeout شبکه‌ای، مرتبط با کد نیست) |
| کنسول مرورگر | بدون خطای JS جدید پس از تغییرات (Fast Refresh سالم) |

---

## وضعیت و اقدام بعدی

**کامیت نشده** — همهٔ تغییرات در working tree است تا شما بازبینی و تأیید کنید. فایل‌های دست‌خورده:
```
src/app/api/auth/otp/request/route.ts
src/app/api/auth/otp/route.ts
src/lib/loyalty.ts
src/app/api/checkout/create/route.ts
src/lib/order-fulfillment.ts
src/app/checkout/checkout-client.tsx
src/app/order/[id]/page.tsx
```

**از شما (ترتیب اهمیت):**
1. 🔐 چرخش کلید ملی‌پیامک در پنل + ست‌کردن در `.env` پروداکشن (C3 — فقط با دست شما ممکن است)
2. 🔐 تصمیم دربارهٔ `ADMIN_PHONE_NUMBER` / `ENABLE_ADMIN_PHONE_PROMOTION=false` در `.env` پروداکشن
3. 🔐 چرخش پسورد root سرور و پاکسازی رازها از سند onboarding

**فایل‌های سند این جلسه:**
- `docs/CODE_REVIEW_2026-09-14.md` — گزارش بازبینی کامل
- `docs/IMPROVEMENT_PROPOSALS.md` — ۲۴ پیشنهاد بهبود
- `docs/SELF_LOOP_WORKLOG.md` — همین سند
