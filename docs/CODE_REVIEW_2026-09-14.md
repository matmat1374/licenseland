# گزارش بازبینی کامل کد — لایسنو (Liceno / licenseland)

**تاریخ:** ۱۴۰۵/۰۶/۲۳ — **بازبین:** Buffy (عامل کدنویسی Freebuff)
**دامنه بازبینی:** خواندن خط‌به‌خط فلوی سفارش، احراز هویت، وفاداری، تامین‌کننده، وب‌هوک، میدل‌ور، صفحه‌های کلاینت + اجرای تست‌ها و پیش‌نمایش زنده (dev server روی پورت ۳۰۰۰).
**تغییری در کد داده نشده است** — این سند فقط یافته‌هاست.

---

## ۱. جمع‌بندی کلی (Executive Summary)

پروژه از نظر معماری در وضعیت خوبی است: تفکیک هسته دامنه (`kernel/` + `src/lib/domain/`) از لایه وب، رمزنگاری کلیدهای لایسنس (`SEALED:`)، رزرو اتمی کلیدها در تراکنش checkout، ماشین حالت سفارش با transition شرطی، دفتر دوطرفه کیف پول و ۱۰۱ تست سبز برای هسته. با این حال، **سه حفره امنیتی بحرانی** و یک سری باگ‌های همروندی (race condition) در سیستم وفاداری و انبار وجود دارد که باید پیش از ادامه فروش واقعی برطرف شوند.

---

## ۲. 🔴 بحرانی (فوراً برطرف شود)

### C1. کد OTP در پاسخ HTTP برگردانده می‌شود = تصاحب کامل حساب‌ها
`src/app/api/auth/otp/request/route.ts` — انتهای هندلر:
```ts
return NextResponse.json({ ok: true, message: `کد تایید ارسال شد`, otp: otp });
```
هر کسی می‌تواند برای **هر شماره‌ای** (از جمله شماره ادمین) درخواست OTP بزند و کد را مستقیم در پاسخ بگیرد؛ سپس با `POST /api/auth/otp` وارد حساب قربانی شود. پیامد: دور زدن کامل احراز هویت، دیدن سفارش‌ها و لایسنس‌های خریده‌شده، و در صورت هدف قراردادن شماره ادمین، دسترسی به پنل (بند C2).
**رفع:** حذف فیلد `otp` از پاسخ. تا وصل شدن کامل SMS، ارسال کد فقط در لاگ سرور.

### C2. ارتقای خودکار ادمین با شماره هاردکد‌شده
`src/app/api/auth/otp/route.ts` — دو مسیر:
```ts
role: phone === "09121145687" ? "ADMIN" : "USER"
// و در شاخه update:
...(phone === "09121145687" ? { role: "ADMIN" } : {})
```
به‌محض اینکه C1 بسته شود این تنها محافظ شماست؛ اما همین الان خطرناک است، چون هر کسی که سیم‌کارت آن شماره را داشته باشد (یا با C1 کد را بگیرد) ادمین می‌شود. توصیه: نقش ادمین فقط از طریق رکورد DB تعیین شود، نه مقایسه شماره در کد؛ و این شرط حداقل پشت فلگ env قرار بگیرد.

### C3. اطلاعات ورود MeliPayamak به‌صورت هاردکد در سورس
`src/lib/sms.ts`:
```ts
process.env.MELIPAYAMAK_USERNAME || "19121145687"
process.env.MELIPAYAMAK_API_KEY || "d07e983e-4f11-43e1-b0a7-ee367824c2f0"
```
این کلید عمومی شده است (سورس در گیت). باید **الان** از پنل ملی‌پیامک ریست شود و مقدار پیش‌فرض حذف گردد. ضمناً پترن‌های موجود در سند onboarding (پسورد root سرور) هم باید چرخش شوند چون در فایل متنی به اشتراک گذاشته شده‌اند.

### C4. رقابت (Race) در مصرف امتیاز — امکان منفی‌شدن `totalPoints`
`src/lib/loyalty.ts → redeemPoints()` ابتدا `findUnique` می‌خواند، سپس `decrement` می‌زند. دو checkout همزمان هر دو از چک `totalPoints < pointsToRedeem` رد می‌شوند و هر دو خرج می‌کنند → `totalPoints` منفی می‌شود و «پول واقعی» به‌صورت تخفیف خارج می‌شود.
**رفع:** بجای خواندن + چک + decrement، از یک `updateMany` شرطی استفاده شود:
```ts
const res = await db.userLoyalty.updateMany({
  where: { userId, totalPoints: { gte: pointsToRedeem } },
  data: { totalPoints: { decrement: pointsToRedeem } },
});
if (res.count === 0) throw new Error("Insufficient points");
```
(همین الگویی که در رزرو کلیدها در checkout استفاده شده — الگوی H2 — باید اینجا هم اعمال شود.)

### C5. رقابت در `earnPoints` — گم‌شدن آپدیت (Lost Update) روی `totalSpent` و tier
`src/lib/loyalty.ts → earnPoints()` مقدار جدید را با خواندن + جمع محلی می‌نویسد:
```ts
const newTotalSpent = loyalty.totalSpent + orderAmount;
...
data: { totalSpent: newTotalSpent, tier: newTier, ... }
```
دو سفارش همزمان → یکی از دو مبلغ بازنویسی و گم می‌شود؛ tier هم ممکن است غلط بماند. ریدایرکت کاربر به صفحه سفارش بلافاصله بعد از پرداخت یعنی در عمل این مسیر اغلب همزمان رخ می‌دهد (تأیید callback + رفرش کاربر).
**رفع:** `totalSpent: { increment: orderAmount }` و تعیین tier در یک قدم بعدی/تراکنش، یا `updateMany` شرطی مشابه C4.

---

## ۳. 🟠 مهم (بالاترین اولویت بعد از بخش ۲)

### H1. نشت رزرو انبار در مسیرهای خطای پس از تراکنش — `create`
`src/app/api/checkout/create/route.ts`: سفارش + رزرو کلیدها داخل `db.$transaction` ساخته می‌شود، اما بعد از آن:
- اگر `redeemPoints` پرتاب کند (مثلاً باگ C4 یا خطای DB)، دستور `catch` بیرونی فقط پاسخ خطا می‌دهد — **کلیدهای RESERVED و سفارش PENDING آزاد نمی‌شوند** (تا ۳۰ دقیقه بعد، انبار قفل است).
- اگر `db.order.update(... zarinpalAuthority ...)` یا هر کوئری بعدی پرتاب کند، همان وضعیت.

مسیر `!zres.ok` تمیزکاری دارد، ولی مسیر استثنا ندارد. **رفع:** در `catch` بیرونی، اگر `order` ساخته شده بود، `releaseReservedKeys` + `status=FAILED` (و در صورت لزوم، برگرداندن امتیاز) اجرا شود.

### H2. claim بدون گارد شرطی در fulfillment (مسیر MANUAL)
`src/lib/order-fulfillment.ts` — شاخه انبار داخلی:
```ts
const candidates = await tx.licenseKey.findMany({
  where: { productId: item.productId, status: "AVAILABLE" }, ...
});
for (const c of candidates) {
  await tx.licenseKey.update({ where: { id: c.id }, data: { status: "SOLD", ... } });
}
```
برخلاف رزروِ checkout که با `updateMany` شرطی (`where: { id, status: "AVAILABLE", orderItemId: null }`) رخ می‌دهد، اینجا update بدون شرط status است → دو فراخوانی همزمان (مثلاً retry ادمین + callback) می‌توانند **یک کلید را دو بار بفروشند**. همچنین اگر `candidates.length < item.quantity` باشد هیچ چکی نیست و `salesCount` با `item.quantity` ولی stock با `soldCount` کمتر زیاد می‌شود → ناهمگامی آمار.
**رفع:** همان الگوی `updateMany` شرطی checkout + چک کفایت تعداد + وحدت `salesCount` با کلیدهای واقعاً فروخته‌شده.

### H3. کش‌های in-memory در فرآیند تکی = شکستن OTP/Rate-limit در چند ورکر
`OTP_CACHE`، `rateLimit`، `checkoutRateMap`، `phoneBuckets/ipBuckets` همه `Map` در حافظه‌اند. با PM2 در حالت `cluster` یا رستارت وسط فلوی لاگین:
- کد در ورکر A تولید و در ورکر B verify می‌شود → لاگین ناموفق تصادفی.
- سقف‌های نرخ‌گذاری بین ورکرها تجمیع نمی‌شوند (۴ برابر شدن سقف مؤثر).
- `checkoutRateMap` و `rateLimit` فایل `otp/request` هیچ پاکسازی‌ای ندارند → نشت حافظه آرام.
**رفع:** مهاجرت به کش مشترک (SQLite جدول ساده با TTL یا Redis) یا حداقل تضمین fork-mode تک‌ورکری + پاکسازی دوره‌ای (الگوی cleanup که `otp/route.ts` دارد به دو فایل دیگر هم اضافه شود).

### H4. verify رکورد Payment نمی‌سازد و audit درگاه ندارد
`src/app/api/checkout/verify/route.ts` مستقیماً `zarinpalVerify` را صدا می‌زند؛ مدل‌های `Payment`، `SupplierCall` و `IdempotencyKey` هسته در فلوی اصلی استفاده نمی‌شوند. اگر ZarinPal پاسخ غیرمنتظره بدهد یا dispute پیش بیاید، هیچ رکورد `rawResponse` برای ردیابی ندارید (فقط `zarinpalRefId` روی Order).
**رفع:** در verify یک رکورد `Payment` با `rawResponse` و `verifiedAt` ذخیره شود (مدل از قبل آماده است).

### H5. کاربر در verify منتظر fulfillment واقعی می‌ماند
`fulfillAndDeliverOrder(order.id)` با `await` قبل از redirect اجرا می‌شود؛ خرید محصولات AUTO یعنی درخواست HTTP به irMarket (timeout 10s × 3 attempt × هر آیتم). کاربر پشت لودر می‌ماند و کندی تامین‌کننده = تایم‌اوت درگاه. مدل `Job` هسته دقیقاً برای همین ساخته شده ولی بلااستفاده است.
**رفع:** پس از transition به PAID، یک Job صف شود و worker پردازش کند؛ صفحه سفارش وضعیت را live نشان دهد (همین حالا `WAITING_APPROVAL` را دارد).

### H6. هیچ مسیر ریفاند/برگشت امتیازی وجود ندارد
- `Refund` مدل هسته بلااستفاده؛ `PointEvent.type` مقدار `REFUND` دارد ولی هیچ‌جا تولید نمی‌شود.
- وب‌هوک `failed` از irMarket فقط `fulfillmentStatus=FAILED` می‌گذارد و پیام «نیازمند جبران یا بازگشت وجه است» را لاگ می‌کند — پول کاربر و امتیازش معلق می‌ماند و پردازش آن کاملاً دستی است.
- اگر ادمین بعداً دستی لایسنس دهد، امتیاز دستی هم باید دستی اضافه شود (`addBonusPoints`).
**رفع حداقلی:** در webhook failed: ریفاند خودکار به کیف پول (`refundWallet` آماده است) + `PointEvent` از نوع REFUND + تیکت خودکار (تیکت در 402/409 هست، در failed وب‌هوک نیست).

---

## ۴. 🟡 متوسط

| # | یافته | فایل | توضیح |
|---|-------|------|-------|
| M1 | `zarinpalUnverified()` خالی است | `src/lib/zarinpal.ts` | پرداخت‌های نیمه‌کاره هرگز از لیست ZarinPal پاک نمی‌شوند؛ سفارش PENDING تا TTL | 
| M2 | TOCTOU کد تخفیف | `create` → `verify` | `usedCount` در verify زیاد می‌شود؛ بین create و verify می‌توان کد را بی‌نهایت بار رزرو کرد؛ منقضی‌شدن بین دو مرحله هم چک نمی‌شود |
| M3 | `generateOrderCode` بدون retry | `src/lib/queries.ts` | تصادم ۴ بایت تصادفی نادر ولی ممکن؛ برخورد با unique → 500 بدون retry |
| M4 | `decorate` با `price=0` | `src/lib/queries.ts` | `_discountPercent` → NaN/∞ اگر `p.price === 0` (داده خراب از سینک) |
| M5 | fallback پرفروش‌ها فیلترها را نادیده می‌گیرد | `getProducts` | اگر `featured` کمتر از حداقل باشد، محصول خارج از جستجو/دسته برمی‌گرداند |
| M6 | `buildSearchCondition` برای کوئری کوتاه | `src/lib/queries.ts` | شرط `tl.includes(lower)` برای ۲ حرف، ده‌ها مترادف × ۶ فیلد OR روی SQLite → کندی جستجو |
| M7 | `checkLowStockAndNotify` برای AUTO | `src/lib/supplier.ts` | موجودی AUTO را با `LicenseKey` می‌سنجد (همیشه ۰) → در صورت فعال‌شدن `autoRequest`، اسپم درخواست تلگرامی برای همه محصولات AUTO |
| M8 | دو نویسنده stock | `receiveSupplierKeys` در برابر سینک ۱۵ دقیقه‌ای | webhook کلیدها `product.stock` را بازنویسی می‌کند و سینک بعدی دوباره از irMarket — سوسو زدن موجودی |
| M9 | URL ایمیل هاردکد | `src/lib/email.ts` | `https://liceno.ir/order/...` — روی staging تست ایمیل به پروداکشن لینک می‌دهد |
| M10 | برگه‌های آماری داشبورد | `src/app/dashboard/page.tsx` | `PENDING_SUPPORT`/`SUPPLIER_OUT_OF_STOCK` پول‌داران در `totalSpent` حساب نمی‌شوند (سفارش PAID نیست ولی پول گرفته شده) |
| M11 | امتیاز برای سفارشِ بعداً خراب | `verify` | امتیاز بلافاصله بعد از پرداخت صادر می‌شود؛ اگر fulfillment شکست بخورد یا ریفاند شود، امتیاز پس گرفته نمی‌شود (به H6 مرتبط) |
| M12 | `AuditLog` برای اکشن‌های ادمین ثبت نمی‌شود | `admin/users/[id]/points` و بقیه | هسته AuditLog آماده است ولی فقط transitionOrder آن را پر می‌کند؛ اهدا/کسر امتیاز ادمین بدون رد | 
| M13 | درخواست‌های ورکر سینک بدون لاگ ساخت‌یافته | `instrumentation.ts` | `importProductsFromSupplier` هنگام بوت هم اجرا می‌شود؛ اگر supplier پایین باشد، استارتاپ کند/خطادار می‌شود — بررسی شود که try/catch بلاک‌کننده نباشد |

---

## ۵. 🔵 جزئی / بهداشت کد

1. **پوشش typecheck ناقص** — `npm run typecheck` فقط `tsconfig.domain.json` (هسته) را چک می‌کند؛ کد `src/` (فروشگاه، ادمین، APIها) در هیچ verify/typecheck رسمی نیست. build هم با `eslint.ignoreDuringBuilds` و بدون ts-check رد می‌شود (`1afaf4f`، `763b2a0`). یعنی خطای تایپ در UI تا لحظه اجرا دیده نمی‌شود.
2. **تست‌ها فقط هسته را پوشش می‌دهند** — `src/lib/loyalty.ts`، `checkout/create`، `order-fulfillment` هیچ تستی ندارند؛ دقیقاً جاهایی که باگ‌های C4/C5/H2 پیدا شد.
3. **دو واحد پول در کدبیس** — `Order.total` تومان ساده است ولی `PriceSnapshot.sellMinor` minor-unit؛ و `costMinor: Math.round(specs.price_usd * 100)` در create — «سنت دلار» در فیلدی که اسمش minor تومانی است. برای گزارش سود (UNIT_ECONOMICS) باید یکجا یکسان شود.
4. **مودل‌های مرده** — `Job`, `IdempotencyKey`, `SupplierCall`, `CryptoPayment`, `Refund`, `SeoMeta` ساخته شده‌اند ولی فلوی اصلی استفاده‌شان نمی‌کند؛ یا به کار گرفته شوند یا حذف تا گیج‌کننده نباشند.
5. **CSP جلوی GTM را گرفته** — در پیش‌نمایش زنده: `Refused to load the script 'https://www.googletagmanager.com/...'` — آنالیتیکس الان کار نمی‌کند؛ یا دامنه به CSP اضافه شود یا اسکریپت حذف شود.
6. **نشت جزئی UX**: دکمه «افزودن» روی کارت‌های ناموجود در برخی لیست‌ها همچنان فعال است (کارت‌های out-of-stock انتهای لیست در `/shop`) — چک شود `ProductCard` هم `_stock` را رعایت کند.
7. **میدل‌ور deprecated** — Next 16 خودش هشدار می‌دهد: `The "middleware" file convention is deprecated. Please use "proxy" instead.` (سند onboarding هم تایید کرده).
8. **`getLoyalty` ساختن-on-read** — هر بازدید داشبورد برای کاربر جدید رکورد می‌سازد؛ بی‌ضرر ولی تراکنش اضافه؛ مسیر create در شرط مسابقه P2002 می‌دهد که getLoyalty هندل نمی‌کند.
9. **کد تکراری تشخیص محصول تامین‌کننده** — `JSON.parse(specifications).supplier_product_id` حداقل در ۳ فایل کپی شده؛ یک تابع مشترک بشود.

---

## ۶. ✅ نقاط قوت (که حفظشان کنید)

- **رزرو اتمی کلیدها** در checkout با `updateMany` شرطی + rollback تراکنش (الگوی درست — فقط باید به fulfillment هم سرایت کند → H2).
- **ماشین حالت سفارش** با `updateMany` شرطی (`from` state) → جلوی پردازش دوباره callback همزمان را می‌گیرد؛ فست‌پث `PAID` هم دارد.
- **توکن دسترسی مهمان** به سفارش با HMAC + `timingSafeEqual` (`src/lib/order-access.ts`) — رفع درستِ لوگ قبلی نشت لایسنس.
- **رمزنگاری کلیدها** با AAD به productId (`SEALED:`) → کلید یک محصول روی محصول دیگر قابل استفاده مجدد نیست؛ batch-read تاب‌آور (`openKeys`).
- **دفتر دوطرفه** با `assertBalanced`، txId ایدمپوتنت و چک موجودی قبل از بدهکار — و تست‌های واقعی برای آن.
- **demo-pay به‌درستی درگاه بسته**: در پروداکشن بدون مرچنت، create با ۵۰۳ می‌شکند نه اینکه بی‌سروصدا دمو شود.
- **محافظت OTP**: حذف پسورد ثابت 123456 (C2 fix قبلی)، rate limit موبایل+IP، پسورد سشن یک‌بارمصرف — ساختار درست است (فقط خروجی OTP فعلاً لو می‌رود → C1).
- **۱۰۱ تست سبز** روی هسته (پرایسینگ، والت، رزرو، وب‌هوک).
- پیش‌نمایش زنده: صفحه اصلی و `/shop` بدون خطای کنسول رندر می‌شوند (فقط همان خطای CSP بند ۵-۵)؛ HMR و سشن فچ سالم.

---

## ۷. اولویت‌بندی اقدام (پیشنهادی)

| اولویت | اقدام | تقریب زمان |
|--------|-------|-----------|
| ۱ (امروز) | حذف `otp` از پاسخ API + چرخش کلید ملی‌پیامک + چرخش پسورد root | ۳۰ دقیقه |
| ۲ | رفع race امتیاز: `redeemPoints`/`earnPoints` با update شرطی (C4/C5) | ۱ ساعت |
| ۳ | پاکسازی رزرو در catch بیرونی create (H1) + گارد شرطی claim در fulfillment (H2) | ۲ ساعت |
| ۴ | ثبت رکورد `Payment` در verify (H4) + صف `Job` برای fulfillment (H5) | نیم روز |
| ۵ | ریفاند خودکار وب‌هوک failed + PointEvent REFUND (H6) | نیم روز |
| ۶ | تست واحد برای loyalty/checkout + اضافه‌کردن typecheck کل `src/` به verify | ۱ روز |
| ۷ | مهاجرت middleware→proxy، کش مشترک OTP/rate-limit، پاکسازی مودل‌های مرده | بر اساس فرصت |

---

*این گزارش بر اساس وضعیت worktree در شاخه `main` (۱۲۱ فایل تغییر کرده/جدید، بدون کامیت) تهیه شده است. هیچ فایلی تغییر نکرده و dev server روی پورت ۳۰۰0 برای بازبینی زنده بالا مانده است.*
