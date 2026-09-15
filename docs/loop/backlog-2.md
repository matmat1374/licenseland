# Backlog — تکرار ۲ (کشف + اصلاح)

**تاریخ:** ۲۵ شهریور ۱۴۰۵ · **HEAD در شروع:** `e1d3185` · **محورها:** ۱ کیفیت کد/تایپ · ۲ سئو · ۳ هدر امنیتی/CSP · ۴ وزن صفحه
**روش:** اجرای واقعی روی مخزن + پاسخ‌های زندهٔ `liceno.ir` (GET فقط‌خواندنی) + بیلد تولیدی محلی روی پورت ۳۰۱۱.

**برچسب‌ها:** `observed` = مستقیماً در سورس/خروجی · `candidate` = محتمل، بازتولید نشد · `reproduced` = با ورودی واقعی بازتولید شد · `confirmed` = بازتولید + آزمون خلاف‌واقع (حذف علت ⇒ حذف نشانه).

> ⚠️ توجه: صاحب مخزن در جریان این اجرا ۳ کامیت فقط-مستندات زد (۲۳:۱۱–۲۳:۱۲). تغییری در فایل‌های این تکرار ایجاد نکرد.

---

## ۱. کیفیت کد / تایپ

| سنجه | دستور | خروجی | برچسب |
|---|---|---|---|
| تایپ‌چک `src/` | `npm run typecheck:app` | **EXIT 0 — ۰ خطا** (وضعیت نهایی) | observed |
| تایپ‌چک kernel | `npm run typecheck` | **EXIT 0 — ۰ خطا** | observed |
| لینت | `npm run lint` | EXIT 1 — **۲۶۱ مشکل (۲۵۰ خطا، ۱۱ هشدار)**؛ **۰ مورد داخل `src/`** | observed |
| تست‌ها | `npm run test` | **EXIT 0 — ۱۲۵ تست، ۱۲۵ pass، ۰ fail** (بریف ۱۱۶ گفته بود؛ عدد واقعی ۱۲۵ است) | observed |
| CI | — | **وجود ندارد** (`.github/`, `.gitlab-ci.yml`, … هیچ‌کدام) | observed |

**پاسخ صریح به دو پرسش محور ۱:**

1. **آیا تایپ‌چک اپ امروز پاک است؟** بله — ولی **در نخستین اندازه‌گیری نبود**: `npm run typecheck:app` با **EXIT 2 و ۶ خطا** برمی‌گشت، همه در یک فایل تولیدشده:

```
.next/dev/types/validator.ts(728,1): error TS2304: Cannot find name 'rc'.
.next/dev/types/validator.ts(728,4): error TS2304: Cannot find name 'app'.
.next/dev/types/validator.ts(728,8): error TS2304: Cannot find name 'api'.
.next/dev/types/validator.ts(728,12): error TS2304: Cannot find name 'auth'.
.next/dev/types/validator.ts(728,17): error TS2304: Cannot find name 'otp'.
.next/dev/types/validator.ts(728,21): error TS2304: Cannot find name 'route'.
```

**علت (confirmed):** فایل تولیدشدهٔ Next **۱۰۵** بلوک `// Validate` دارد و **دقیقاً یک خط** خراب بود: خط ۷۲۸ به‌جای `// Validate ../../../src/app/api/auth/otp/route.ts` نوشته بود `rc/app/api/auth/otp/route.ts` — یعنی **۲۱ بایتِ ابتدای خط از دست رفته** بود (نشانهٔ نوشتن نیمه‌کاره/همزمان). آن یک خط، ۶ خطای TS2304 می‌سازد.
**آزمون خلاف‌واقع:** `.next/dev` حذف و با یک `next dev` بازتولید شد ⇒ خط ۷۲۸ سالم، `npm run typecheck:app` ⇒ **EXIT 0**. خرابی **بازتولید نشد** ⇒ ایراد سورس نیست.
**نتیجهٔ پایدار:** هیچ خطای تایپی در `src/` وجود ندارد؛ و **`.next/dev/types/**/*.ts` در `include` فایل `tsconfig.json` کامیت شده است**، پس یک نوشتن نیمه‌کاره در آن پوشه می‌تواند دروازه را قرمز کند (بند ۵ پیشنهادها).

2. **آیا `tsconfig.domain.json` هنوز `src/` را کنار می‌گذارد؟** بله — ولی **نه با `exclude`**: کلید `exclude` در آن فایل **وجود ندارد**؛ فقط `include` محدود است:

```json
"include": ["kernel/src/**/*.ts", "kernel/test/**/*.ts"]
```

پوشش `src/` از راه `tsconfig.json` انجام می‌شود (`**/*.ts`, `**/*.tsx` منهای `exclude`: `node_modules, kernel, examples, skills, tests, download`). پس `src/` پوشش دارد و پاک است.

**ترکیب لینت:** ۲۲۳ خطای `@typescript-eslint/no-require-imports` تقریباً همه از `.agents/skills/**/scripts/*.cjs` و اسکریپت‌های scratch ریشهٔ مخزن است، نه کد اپ. ۱۶ `react-hooks/set-state-in-effect` + ۴ `error-boundaries` + ۴ `immutability` داخل کد اپ هستند (pre-existing).

---

## ۲. سئو / یکپارچگی خزش

| سنجه | عدد | شاهد | برچسب |
|---|---|---|---|
| URL در سایت‌مپ | **۷۲۴** (تکراری: ۰) | `curl -s https://liceno.ir/sitemap.xml \| grep -o '<loc>[^<]*</loc>' \| wc -l` | observed |
| تفکیک | ۸ استاتیک + ۳۰ دسته (`?cat=`) + ۶۶۰ محصول + ۲۶ مقاله | `src/app/sitemap.ts:14-44` | observed |
| مسیرهای واقعی | ۳۵ `page.tsx`، ۶۴ `route.ts` | شمارش در `src/app/**` | observed |
| URL مرده (۴۰۴) | **۰** | نگاشت همهٔ URLها به مسیر موجود | observed |
| URL که ۳۰۱ می‌دهد | **۱۸** محصول | کلیدِ `src/data/slug-redirects.json`؛ هر ۱۸ ⇒ HTTP 301 | reproduced |
| از این ۱۸، مقصدشان در سایت‌مپ نیست | **۱۶** | تفاضل مجموعه‌ها | reproduced |
| دسته‌های بی‌محصول | **۲۰ از ۳۰** | `GET /shop?cat=…` ⇒ صفر محصول | reproduced |
| فید ترب | **۶۶۰ آیتم**، ۰ ناهم‌خوانی با سایت‌مپ، **۱۸ آیتم** `page_url`شان ۳۰۱ می‌دهد | `src/app/api/torob/route.ts:13-33` + `src/lib/torob.ts:164-165` | observed |
| ریدایرکت‌ها | ۹۸۲ ورودی ⇒ ۸۰۵ مقصد، **۱۲۳ گروه برخورد** (حداکثر ۵ به یک مقصد) | `src/data/slug-redirects.json` | observed |
| ردیف‌های تکراری فعال | **۸۴ جفت** که هم اسلاگ قدیم و هم جدیدشان هنوز `isActive` است | `prisma/db/custom.db` | observed |

### 🔴 یافتهٔ اصلی: نشت canonical در کل سایت — **اصلاح شد**

`src/app/layout.tsx:54` یک `alternates: { canonical: "/" }` سراسری داشت. Next آن را در **هر مسیری که خودش canonical ندارد** تزریق می‌کند، یعنی آن صفحات به گوگل می‌گویند «من کپی صفحهٔ اصلی هستم».

اندازه‌گیری زندهٔ «قبل» و بیلد محلی «بعد» (دستور `curl … | grep -o '<link rel="canonical" href="[^"]*"'`):

| مسیر | LIVE (قبل) | بیلد محلی (بعد) |
|---|---|---|
| `/` | `https://liceno.ir` | `https://liceno.ir` ✅ بدون تغییر |
| `/shop` | `https://liceno.ir` ❌ | `https://liceno.ir/shop` ✅ |
| `/blog` | `https://liceno.ir` ❌ | `https://liceno.ir/blog` ✅ |
| `/about` | `https://liceno.ir` ❌ | `https://liceno.ir/about` ✅ |
| `/faq` | `https://liceno.ir` ❌ | `https://liceno.ir/faq` ✅ |
| `/terms` | `https://liceno.ir` ❌ | `https://liceno.ir/terms` ✅ |
| `/privacy` | `https://liceno.ir` ❌ | `https://liceno.ir/privacy` ✅ |
| `/forgot-password` | `https://liceno.ir` ❌ | (هیچ — صفحه `noindex` است) |
| `/contact` | `https://liceno.ir/contact` | `https://liceno.ir/contact` ✅ بدون تغییر |
| `/blog/buy-original-license-guide-2024` | `https://liceno.ir` ❌ | `https://liceno.ir/blog/…` ✅ |
| `/product/2162-1500-300-uc` | `https://liceno.ir/product/…` | `https://liceno.ir/product/…` ✅ بدون تغییر |
| `/shop?cat=ai` | `https://liceno.ir` ❌ | `https://liceno.ir/shop` |
| `/shop?search=x` | `https://liceno.ir` ❌ | `https://liceno.ir/shop` |

**دامنهٔ آسیب:** ۶ صفحهٔ ایندکس‌پذیر + **۲۶ مقالهٔ وبلاگ** + ۳۰ آدرس `?cat=` (و چند صفحهٔ noindex).

### دیگر یافته‌های سئو

- **عنوان تکراری `/contact`:** `تماس با ما | لایسنو | لایسنو` — چون `src/app/contact/layout.tsx:5` خودش `| لایسنو` دارد و `src/app/layout.tsx:23` قالب `%s | لایسنو` را هم اعمال می‌کند. **اصلاح نشد** (خارج از دو اصلاح این تکرار؛ پیشنهاد رتبهٔ ۷).
- **۵ صفحه با عنوان پیش‌فرض یکسان** (`/cart`, `/checkout`, `/checkout/demo-pay`, `/login`, `/register` هیچ `metadata` ندارند ⇒ عنوان ریشه). چون noindex/مسدودند، اثر کم.
- **robots.txt:** هیچ URL سایت‌مپ مسدود نیست؛ `/api/torob` عمداً مجاز است (`src/app/robots.ts:4-16`).
- **ریز‌نکتهٔ middleware:** ریدایرکت اسلاگ‌ها فقط برای مسیر **percent-encoded** فعال می‌شود؛ همان آدرس با UTF-8 خام ۲۰۰ می‌گیرد (خزنده‌ها انکود می‌کنند، پس روی خزش اثر عملی ندارد — ولی یک ناهم‌راستایی واقعی است).

---

## ۳. هدرهای امنیتی / CSP

**تنها منبع حقیقت:** `next.config.ts:8-36` (تابع `headers()` در `:44-48`). `src/middleware.ts` هیچ CSP نمی‌دهد؛ `Caddyfile` و `Caddyfile.prod` هم CSP ندارند.

### ✅ تصحیح ادعای تکرار ۱ (با شاهد)

هدر **واقعی تولید** (اندازه‌گیری خودم: `curl -s -D - -o /dev/null https://liceno.ir/`):

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'
```

پس **`unsafe-eval` در تولید وجود ندارد** و کامیت `d316379` **واقعاً اعمال شده است** — نیمهٔ «unsafe-eval» ادعای `backlog-1` باطل است. آن مشاهدهٔ قبلی از یک **بیلد محلی کهنه** می‌آمد: `.next/routes-manifest.json` هدر را **در زمان بیلد** پخت می‌کند، پس `next start` بدون بیلد مجدد همان سیاست قدیمی را سرو می‌کند. نیمهٔ `unsafe-inline` ادعا **هنوز درست است**.

### 🔴 یافتهٔ اصلی: سیاست CSP خودِ آنالیتیکس سایت را می‌بندد — **اصلاح شد**

اپ خودش GA را بارگذاری می‌کند (`src/app/layout.tsx:112-115` تگ `googletagmanager`، و `src/lib/gtag.ts` رویدادهای `select_item`/`view_item` را می‌فرستد که در `product-card.tsx:15` و `product-view-tracker.tsx:4` استفاده می‌شوند) — ولی سیاست اجازهٔ هیچ‌کدام را نمی‌داد.

تفاضل مجموعه‌ای «درخواست‌شده در برابر مجاز» روی پاسخ واقعی HTTP:

| | مبدأهای `<script src>` بیرونی | مجاز در `script-src` | **مسدود** | مبدأهای `connect-src` مسدود |
|---|---|---|---|---|
| قبل (زندهٔ liceno.ir) | `https://www.googletagmanager.com` | — | **`googletagmanager.com`** | **۳ مورد** (google-analytics، region1، analytics) |
| بعد (بیلد محلی با کانفیگ اصلاح‌شده) | `https://www.googletagmanager.com` | `https://www.googletagmanager.com` | **۰** | **۰** |

برچسب: **confirmed** (خلاف‌واقع: حذف علت ⇒ حذف نشانه). محدودیت: مرورگر در این نشست در دسترس نبود (`Browser backend '__no_browser_backend__' is unavailable`)، پس مسدودسازی به‌صورت تفاضل سیاست/درخواست اثبات شد، نه با دیدن خطای کنسول.

### اسکریپت‌های inline و امکان حذف `unsafe-inline`

| محل | چیست | مانع حذف `unsafe-inline`؟ |
|---|---|---|
| `src/app/layout.tsx:112-115` | لودر بیرونی GA | نه |
| `src/app/layout.tsx:116-128` | بوت‌استرپ inline گتگ (اجرا می‌شود) | **بله** |
| `src/components/site/footer.tsx:186-190` | نشان enamad با `onerror` inline | **بله** |
| ۵ فایل `public/brand/*.html` و `public/slides/liceno-pitch.html` | صفحات استاتیک با اسکریپت inline | **بله** |
| JSON-LD در `layout.tsx`, `blog/[slug]`, `contact/layout`, `product/[slug]`, `shop/page` | داده، نه کد | نه |

**nonce در هیچ‌جا وصل نشده است** (صفر نتیجهٔ `nonce` در `src/`)، و `next.config.ts` هم نمی‌تواند nonce هر-درخواست بدهد؛ نیاز به تولید nonce در `middleware.ts` و انتقال CSP از `next.config` به middleware دارد.

**حداقل سیاست هدف (پیشنهاد، اجرا نشد):**
`script-src 'self' 'unsafe-inline' https://www.googletagmanager.com` و `connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://analytics.google.com`
و گام سخت‌گیرانه‌تر: `script-src 'self' 'nonce-{NONCE}' 'strict-dynamic' https://www.googletagmanager.com; script-src-attr 'none'`.

### سایر هدرها و پرچم‌ها

| هدر | مقدار | پرچم |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | ✅ |
| `X-Frame-Options` | `DENY` | ⚠️ `Caddyfile.prod:23` آن را با `SAMEORIGIN` بازنویسی می‌کند (دو منبع حقیقت) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | ✅ |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | ⚠️ `payment/usb/serial` غایب |
| `Strict-Transport-Security` | `max-age=15552000; includeSubDomains` | ⚠️ Caddy نسخهٔ ۲ساله+preload می‌دهد |
| `X-Powered-By` | `Next.js` | ⚠️ حذف نشده (`poweredByHeader: false` ندارد) |
| `img-src` | `… https:` | ⚠️ سهل‌گیرانه‌ترین دایرکتیو (اجازهٔ هر https) |

---

## ۴. وزن فروشگاه

| آدرس | HTML خام | gzip | brotli | `<script>` | استایل‌شیت | `<img>` | فلایت inline | بزرگ‌ترین بلاب |
|---|---|---|---|---|---|---|---|---|
| `/` زنده | **۳۵۳٬۸۹۴ B** | ۴۰٬۱۲۶ | ۲۵٬۲۴۳ | ۳۳ (۲۴ بیرونی) | ۲ | ۷ | ۱۴۱٬۰۱۳ B | ۹۳٬۵۴۸ B |
| `/shop` زنده | **۷۱۷٬۵۷۰ B** | ۴۵٬۴۲۱ | ۲۸٬۳۴۱ | ۲۹ (۲۲ بیرونی) | ۲ | ۲ | ۲۱۵٬۳۰۷ B | ۲۱۵٬۳۲۷ B |
| `/` بیلد محلی | ۳۴۹٬۴۹۲ B | — | — | ۳۳ | ۲ | ۷ | ۱۴۱٬۰۱۳ B | ۹۳٬۵۴۸ B |
| `/shop` بیلد محلی | ۷۱۱٬۶۰۰ B | — | — | ۲۹ | ۲ | ۲ | ۲۰۸٬۸۸۴ B | ۲۰۸٬۹۰۴ B |

**تصحیح فرض بریف:** هیچ `<script type="application/json">` وجود ندارد؛ Next 16 فلایت RSC را به‌صورت اسکریپت‌های inline `self.__next_f.push(...)` می‌ریزد. JS ارجاع‌شده: `/` ⇒ ۲۳ فایل، ۱٬۷۵۴٬۴۶۲ بایت خام (۵۱۰٬۳۶۹ gz)؛ `/shop` ⇒ ۲۱ فایل، ۱٬۷۰۸٬۰۸۱ بایت خام (۴۹۶٬۵۱۶ gz). یعنی وزن واقعی روی سیم را **JS** می‌سازد، نه HTML (HTML با gzip به ۶–۱۱٪ می‌رسد).

### بزرگ‌ترین سودهای قابل‌حذف (رتبه‌بندی)

| # | مورد | محل | بایت قابل‌حذف | زحمت | ریسک |
|---|---|---|---|---|---|
| ۱ | **بشکهٔ `lucide-react`** (`import * as LucideIcons`) کل ۱٬۵۶۹ آیکون را می‌فرستد | `header.tsx:33` (:131)، `footer.tsx:18` (:111)، `mobile-menu.tsx:11` (:100)، `shop/page.tsx:6` | **۷۲۶٬۶۰۲ خام / ۱۸۸٬۰۹۹ gz** روی **هر** صفحهٔ فروشگاه | کم–متوسط | متوسط (آیکون‌ها از دادهٔ دسته‌ها به‌صورت داینامیک خوانده می‌شوند ⇒ رجیستری ثابت می‌تواند آیکون ناشناخته را اشتباه نشان دهد) |
| ۲ | **گرید ۱۰۰ محصولی بدون صفحه‌بندی** | `src/app/shop/page.tsx:30` (`limit: 100`) | ≈ **۴۶۰٬۰۰۰ خام** (کوتاه‌کردن به ۲۴ ⇒ −۳۳۶٬۹۱۶ اندازه‌گیری‌شده، ≈−۲۰٬۸۰۰ gz) | یک عدد | **بالا** — UI صفحه‌بندی وجود ندارد، پس کاهش یعنی پنهان‌شدن محصول (تصمیم درآمدی؛ نیاز به تأیید مالک) |
| ۳ | **۳ فیلد سریالایزشده‌ای که `ProductCard` نمی‌خواند** (`description`, `features`, `specifications`) | `src/lib/queries.ts:179-189` بدون `select` | ۹۱٬۰۷۹ روی `/shop` (۴۸٪ فلایت) و ۵۱٬۳۲۴ روی `/` (۴۱٪) | کم–متوسط | کم |
| ۴ | `BrandMarquee` صفحهٔ اصلی (۱۶ برند × ۴ تکرار) | صفحهٔ اصلی | ۷۷٬۴۵۹ خام (۲۲٪ HTML صفحه) | متوسط | کم (تکرار برای لوپ CSS لازم است) |
| ۵ | `TabbedProductCatalog` هر ۶ تب را سریالایز می‌کند (۴۶ از ۵۶ محصول رندر نمی‌شوند) | صفحهٔ اصلی | ≈۷۴٬۰۰۰ | متوسط | متوسط |

**سایر:** صفر مورد `next/dynamic` در کل `src/` (هیچ کامپوننت کلاینتی code-split نمی‌شود). وابستگی‌های بی‌استفاده: `@mdxeditor/editor`, `react-syntax-highlighter`, `@tanstack/react-table`, `embla-carousel-react`. کامپوننت مرده: `src/components/site/category-product-row.tsx` (هیچ‌جا import نمی‌شود) که خودش بشکهٔ lucide دارد.

---

## پنج مورد برتر (اولویت برای تکرار ۳)

| # | محور | مورد | اثر | زحمت |
|---|---|---|---|---|
| ۱ | سئو | تصمیم واحد دربارهٔ `?cat=`: الان canonical به `/shop` می‌رود ولی سایت‌مپ همان ۳۰ آدرس را تبلیغ می‌کند (۲۰ تای‌شان صفر محصول) — راستی‌آزمار مستقل هم همین تناقض را تأیید کرد | متوسط | کم |
| ۲ | سرعت | حذف ۳ فیلد بی‌مصرف از کوئری‌های لیستی با `select` صریح | بالا | کم–متوسط |
| ۳ | سرعت | جایگزینی ۳ بشکهٔ lucide با رجیستری ثابت + فالبک | بالا | متوسط |
| ۴ | سئو | پسوند دوبرابر برند در عنوان‌ها (`/contact` و مقاله‌های وبلاگ: `… | لایسنو | لایسنو`) | متوسط | کم |
| ۵ | تست | نبود CI + شکنندگی دروازهٔ `typecheck:app` روی آرتیفکت تولیدشدهٔ `.next/dev/types` | متوسط | کم (نیاز به تأیید مالک — پیکربندی زیرساخت) |

### یافتهٔ تازه‌ای که راستی‌آزمار مستقل کشف کرد (نیاز به تأیید مالک)

**`/order/*` روی بیلد درخت جاری + DB محلی ⇒ HTTP 500.** علت: ستون `Order.fulfillmentStage` (افزودهٔ کامیت `e1d3185`) در `prisma/db/custom.db` وجود ندارد؛ `audit-test.db` همان کوئری را بی‌خطا اجرا می‌کند و تولید `/order/1` را `404` می‌دهد (نه `500`) ⇒ **شکاف مهاجرت DB محلی است، نه ایراد کد، و نه ناشی از دو اصلاح این تکرار.** چون تغییر اسکیما/داده است، طبق بریف **اجرا نشد** و فقط به‌عنوان پیشنهاد ثبت می‌شود.

## آنچه این تکرار اصلاح **نکرد** (آگاهانه)

- دو موردی که داده/اسکیما/دسترسی‌ها را تغییر می‌دهند (صریحاً در بریف ممنوع شده‌اند): بازنشانی ردیف‌های تکراری فعال و بک‌فیل `dedup_key` — به تکرارهای بعد منتقل شد.
- کاهش `limit: 100` فروشگاه: رفتار-شکننده (پنهان‌شدن محصول) ⇒ پیشنهاد، نه اصلاح.
- هر چیزی که نیاز به دیپلوی پروداکشن دارد: **انجام نشد** (دروازهٔ انسانی).
