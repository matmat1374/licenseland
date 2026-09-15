# Verify — تکرار ۲ (راستی‌آزمایی)

**تاریخ:** ۲۵ شهریور ۱۴۰۵ · **HEAD:** `eb86c04` (+ تغییرات کارنشدهٔ همین تکرار)
**نقش راستی‌آزما مستقل از اصلاح‌کننده:** هر دو اصلاح توسط یک عامل جداگانه با دستور «تلاش برای رد کردن» بازبینی شد؛ نتیجه در بخش ۵ و ۶.
**محدودهٔ راستی‌آزمایی:** بیلد تولیدی محلی روی `http://localhost:3011` (ساخته‌شده از همین درخت کار) در برابر `https://liceno.ir` (فقط GET).

> ⚠️ **دروازهٔ شاهد بیرونی برآورده نشد و این عمدی است.** طبق `LOOP.md §6` هر اصلاح باید سه شاهد داشته باشد: محلی، بیرونی، ضد‌رگرسیون. شاهد **محلی** و **ضد‌رگرسیون** گرفته شد؛ شاهد **بیرونی** (اثر روی URL عمومی) بدون بیلد مجدد و دیپلوی روی سرور ممکن نیست و دیپلوی طبق `loop-constraints.md` و `docs/safety.md` نیاز به تأیید مالک دارد. پس هر دو اصلاح در وضعیت **«تأییدشدهٔ محلی، اعمال‌نشده در تولید»** هستند.

---

## ۱. دستورهای دروازه (اجرا شده، با کد خروج)

| # | دستور | کد خروج | خلاصهٔ خروجی | وضعیت |
|---|---|---|---|---|
| ۱ | `npm run typecheck:app` | **0** | بدون خطا (۰ خطا در `src/`) | ✅ |
| ۲ | `npm run typecheck` | **0** | بدون خطا (kernel) | ✅ |
| ۳ | `npm run test` | **0** | `# tests 125 / # pass 125 / # fail 0 / # cancelled 0 / # skipped 0` | ✅ |
| ۴ | `npm run build` | **0** | جدول مسیرها چاپ شد؛ هیچ خطای بیلد | ✅ |
| ۵ | `npm run lint` | **1** | `✖ 261 problems (250 errors, 11 warnings)` — **دقیقاً برابر خط پایهٔ قبل از تغییرات** | ✅ بدون پس‌رفت |
| ۶ | `npx eslint <۱۰ فایل تغییریافته>` | **0** | `✖ 1 problem (0 errors, 1 warning)` — همان هشدار از پیش موجود `next-script-for-ga` در `layout.tsx:111` | ✅ |

خروجی دستور ۳ (دم):

```
> node --test kernel/test/*.test.ts
# tests 125
# pass 125
# fail 0
```

خروجی دستور ۶ (دم):

```
C:\Users\matin\Documents\antigravity\licenseland\src\app\layout.tsx
  111:9  warning  Prefer `GoogleTagManager` component from `@next/third-parties/google` …
✖ 1 problem (0 errors, 1 warning)
```

**بدون غیرفعال‌کردن تست:** هیچ تستی skip/disable نشد (ستون `# skipped 0`). هیچ فایل تستی تغییر نکرد (`git diff --stat` هیچ فایل `kernel/` ندارد).

---

## ۲. راستی‌آزمایی اصلاح ۱ (canonical) — شاهد محلی + خلاف‌واقع

روش: یک A/B واقعی؛ «قبل» = پاسخ زندهٔ تولید (بدون اصلاح)، «بعد» = بیلد محلی با اصلاح. دستور:

```bash
for p in / /shop /blog /about /faq /terms /privacy /contact /forgot-password; do
  L=$(curl -s "https://liceno.ir$p"        | grep -o '<link rel="canonical" href="[^"]*"' | head -1)
  M=$(curl -s "http://localhost:3011$p"    | grep -o '<link rel="canonical" href="[^"]*"' | head -1)
  printf "%-18s | %-34s | %s\n" "$p" "$L" "$M"
done
```

| مسیر | LIVE (قبل) | بیلد محلی (بعد) | نتیجه |
|---|---|---|---|
| `/` | `https://liceno.ir` | `https://liceno.ir` | ✅ بدون تغییر (ضد‌رگرسیون) |
| `/shop` | `https://liceno.ir` | `https://liceno.ir/shop` | ✅ اصلاح شد |
| `/blog` | `https://liceno.ir` | `https://liceno.ir/blog` | ✅ |
| `/about` | `https://liceno.ir` | `https://liceno.ir/about` | ✅ |
| `/faq` | `https://liceno.ir` | `https://liceno.ir/faq` | ✅ |
| `/terms` | `https://liceno.ir` | `https://liceno.ir/terms` | ✅ |
| `/privacy` | `https://liceno.ir` | `https://liceno.ir/privacy` | ✅ |
| `/contact` | `https://liceno.ir/contact` | `https://liceno.ir/contact` | ✅ بدون تغییر |
| `/forgot-password` | `https://liceno.ir` | (هیچ) | ✅ صفحه `noindex` است |

نمونه‌های داینامیک (استخراج‌شده از `sitemap.xml` محلی):

| مسیر | بیلد محلی (بعد) |
|---|---|
| `/blog/buy-original-license-guide-2024` | `https://liceno.ir/blog/buy-original-license-guide-2024` ✅ |
| `/product/2162-1500-300-uc` | `https://liceno.ir/product/2162-1500-300-uc` ✅ (همان LIVE) |
| `/shop?cat=ai` و `/shop?search=x` | `https://liceno.ir/shop` ✅ |

**آزمون خلاف‌واقع:** علت، تنها یک خط در `src/app/layout.tsx` بود. با حذف آن، خطای «canonical = صفحهٔ اصلی» روی ۸ مسیر نمونه (۶ تای‌شان ایندکس‌پذیر) و روی مقالهٔ وبلاگ و آدرس‌های `?cat=` از بین رفت. حداقل یک نمونه («LIVE `/shop?cat=ai` → `https://liceno.ir`» در برابر «محلی → `https://liceno.ir/shop`») توسط راستی‌آزمار هم مستقل تأیید شد.
**برچسب: confirmed** (برای این نمونه‌ها؛ پوشش کامل ۷۳۶+۲۶+۳۰ آدرس نمونه‌گیری نشد).

---

## ۳. راستی‌آزمایی اصلاح ۲ (CSP) — شاهد محلی + خلاف‌واقع

### ۳.۱ هدر واقعاً ارسالی

```
$ curl -s -D - -o /dev/null http://localhost:3011/ | grep -i '^content-security-policy:'
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com;
style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:;
connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://analytics.google.com;
frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'
```

این رشته با ارزیابی مستقیم خودِ `next.config.ts` (transpile در حافظه + فراخوانی `headers()` با `NODE_ENV=production`) **بايت‌به‌بايت یکسان** است (۳۷۸ بایت در هر دو). راستی‌آزمار همین برابری را مستقل بازتولید کرد.

### ۳.۲ آزمون خلاف‌واقع (تفاضل مجموعه‌ای روی پاسخ واقعی HTTP)

| | مبدأهای `<script src>` بیرونی | مجاز در `script-src` | مسدود | `connect-src` مسدود | `unsafe-eval` |
|---|---|---|---|---|---|
| **قبل** — `https://liceno.ir/` | `googletagmanager.com` | — | **۱** | **۳** | ندارد |
| **بعد** — بیلد محلی `/` | `googletagmanager.com` | `googletagmanager.com` | **۰** | **۰** | ندارد |

جمع مسدودها: **۴ → ۰**. **برچسب: confirmed.**
**محدودیت صریح:** مرورگر در این نشست در دسترس نبود —

```
> agent.browsers.list()
Browser backend '__no_browser_backend__' is unavailable
```

پس مسدودشدن به‌صورت «تفاضل سیاست در برابر منابع درخواست‌شده» اثبات شد، **نه** با دیدن خطای نقض CSP در کنسول. اگر مالک بخواهد، پس از دیپلوی می‌توان با یک بار باز کردن سایت در مرورگر و نگاه به تب Network (درخواست `gtag/js` باید ۲۰۰ شود) شاهد بیرونی هم گرفت.

### ۳.۳ ضد‌رگرسیون امنیتی

- `'unsafe-eval'` **در تولید اضافه نشد** (تأیید دوباره‌شده با ارزیابی هر دو شاخهٔ کد).
- `git diff next.config.ts` فقط ۳ خط جابه‌جایی است؛ هیچ دایرکتیو دیگری تغییر نکرد.
- راستی‌آزمار بررسی کرد که هیچ منبع مصرفی دیگری (اسکریپت/تصویر/استایل/iframe/media) با سیاست جدید مسدود نشود ⇒ تفاضل تهی.
- راستی‌آزمار تأیید کرد **هیچ CSP دیگری** در `Caddyfile`، `Caddyfile.prod`، `Dockerfile`، `docker-compose.yml` یا اسکریپت‌های دیپلوی وجود ندارد که هدر Next را بازنویسی کند (Caddy فقط هدرهای فهرست‌شدهٔ خودش را می‌نویسد و CSP را دست‌نخورده رد می‌کند؛ شاهد: CSP زندهٔ تولید دقیقاً برابر CSP قدیمی Next است).

---

## ۴. محافظت از دارایی‌هایی که نباید تغییر کنند

| مورد | قبل | بعد | نتیجه |
|---|---|---|---|
| `.env` | `049066a9219c4f6ab22800e12352a736` | `049066a9219c4f6ab22800e12352a736` | ✅ دست‌نخورده (با اینکه `npm run build` اسکریپت `ensure-env.mjs` را اجرا می‌کند، چون همهٔ کلیدها موجود بودند هیچ نوشتنی رخ نداد) |
| فایل‌های scratch مالک (`q-*.mjs`, `*.log`) | ۲۳۰ فایل بی‌ردیابی | هیچ‌کدام تغییر نکرد/حذف نشد | ✅ |
| `deploy_bundle.tar.gz` | از قبل modified | همان | ✅ دست نخورد (تغییر از قبل از این اجرا بود) |
| دیپلوی/SSH/اسکریپت دیپلوی | — | هیچ‌کدام اجرا نشد | ✅ |
| اسکیما/دادهٔ زنده | — | هیچ تغییری | ✅ |

تنها فایل تولیدشده‌ای که بیلد تغییر داد `next-env.d.ts` بود (`next dev` نسخهٔ `.next/dev/types/...` و `next build` نسخهٔ `.next/types/...` را می‌نویسد). چون به هیچ‌یک از دو اصلاح مربوط نیست، **به HEAD بازگردانده شد** و بلافاصله `npm run typecheck:app` دوباره اجرا شد ⇒ **EXIT 0**. (این فایل با هر بیلد/دِو بعدی دوباره جابه‌جا می‌شود.)

---

## ۵. راستی‌آزمایی مستقل (نقش راستی‌آزما، تلاش برای رد کردن)

یک عامل مستقل با دستور صریح «تأیید نکن، رد کن» هر دو اصلاح را آزمود. نتیجه:

### اصلاح ۱ (canonical) — **PASS-WITH-CAVEATS**
تلاش‌های رد کردن و نتیجه:
- «آیا جایی مانده که canonical برابر صفحهٔ اصلی باشد؟» ⇒ **رد نشد** (`[SURVIVED]`): ۳ نمونه از هر شکل URL + همهٔ مسیرهای خاص آزموده شد؛ هیچ مسیر غیرصفحهٔ‌اصلی چنین canonical نمی‌دهد. اثبات ساختاری هم: `grep -rn canonical src/app` نشان می‌دهد canonical فقط در ۱۰ فایل و به‌صورت خودارجاع تعریف می‌شود و ریشه دیگر `alternates` ندارد.
- «آیا صفحه‌ای بی‌canonical مانده که ایندکس‌پذیر باشد؟» ⇒ **رد نشد**: تنها `/forgot-password` بی‌canonical است و `noindex, follow` است.
- «آیا هد صفحهٔ اصلی رگرسیون دارد؟» ⇒ **رد نشد**: ۱۸ تگ متادیتا (title، description، robots، og:*، twitter:*، هر دو JSON-LD) بین LIVE و محلی **صفر تفاوت**؛ تفاوت‌های باقی‌ماندهٔ هد فقط هش‌های بیلد/چانک و `next-size-adjust` بود.
- «آیا `/contact` و `/product/<slug>` تغییر کرده‌اند؟» ⇒ **رد نشد**: بایت‌به‌بایت یکسان با LIVE.
- **ضد‌شاهد یافته‌شده (پذیرفته‌شده، اصلاح نشد):** ۳۰ آدرس `?cat=` اکنون canonical به `/shop` می‌دهند در حالی که `sitemap.ts:25-30` همان ۳۰ آدرس را تبلیغ می‌کند ⇒ **تناقض canonical و سایت‌مپ** (یافتهٔ باز شمارهٔ ۱).
- **نکتهٔ دوم:** `/cart`, `/checkout`, `/login`, `/register` متای `index, follow` دارند ولی هیچ canonical ندارند و فقط با `robots.txt` مسدود شده‌اند (تناقض meta-robots با robots.txt، از پیش موجود). راستی‌آزمار تصریح کرد که این اصلاح وضعیت را **بهتر** کرد (canonical غلطِ صفحهٔ اصلی برداشته شد).

### اصلاح ۲ (CSP) — **PASS-WITH-CAVEATS**
هیچ ضد‌شاهدی که اصلاح را بشکند پیدا نشد: `[SURVIVED]` در همهٔ ۵ آزمون (تفاوت دقیقاً همان دو دایرکتیو؛ تولید دارای GTM و بدون `unsafe-eval`؛ دِو دارای `unsafe-eval`؛ هدر سرور بايت‌به‌بايت برابر ارزیابی فایل؛ هیچ CSP بازنویس‌کنندهٔ دیگری وجود ندارد؛ هیچ منبعی هنوز مسدود نیست).
شرط‌ها: (الف) تا بیلد+دیپلوی مجدد روی تولید **هیچ اثری ندارد** (هدر در `.next/routes-manifest.json` پخته می‌شود)؛ (ب) `Caddyfile.prod:25` مستقل از این موضوع `X-Frame-Options` را به `SAMEORIGIN` تغییر می‌دهد (یافتهٔ باز، از پیش ثبت‌شده).

---

## ۶. یافته‌های تازه‌ای که راستی‌آزمار کشف کرد (اصلاح نکردیم — خارج از دو اصلاح این تکرار)

| # | یافته | شاهد | اهمیت |
|---|---|---|---|
| ۱ | **`/order/*` در بیلد درخت جاری روی DB محلی ۵۰۰ می‌دهد** — ستون `Order.fulfillmentStage` در `prisma/db/custom.db` نیست (افزودهٔ کامیت `e1d3185`). `audit-test.db` همان کوئری را بی‌خطا اجرا می‌کند ⇒ **شکاف مهاجرت DB محلی، نه ایراد کد**. تولید `/order/1` را `404` می‌دهد (نه `500`) که نشان می‌دهد DB تولید مهاجرت شده است. | `The column main.Order.fulfillmentStage does not exist in the current database.` | **بالا** — اما تغییر اسکیما است ⇒ **نیاز به تأیید مالک** (طبق بریف ممنوع) |
| ۲ | **پسوند دوبرابر برند در عنوان مقاله‌ها** — `/blog/best-ai-coding-assistants-2026` ⇒ `… (۲۰۲۶) \| لایسنو \| لایسنو`. همان ریشهٔ `/contact`: مقدار `seoTitle` خودش برند دارد و `layout.tsx:23` قالب `%s \| لایسنو` را هم اعمال می‌کند. روی LIVE هم هست. | `curl … \| grep '<title>'` | متوسط — اصلاح کم‌هزینه در تکرار ۳ |
| ۳ | تناقض سایت‌مپ/کانونیکال برای ۳۰ آدرس `?cat=` | بخش ۵ | متوسط |
| ۴ | `Caddyfile.prod:25` مقدار `X-Frame-Options` را از `DENY` به `SAMEORIGIN` تغییر می‌دهد و HSTS/Permissions-Policy را هم متفاوت تنظیم می‌کند (دو منبع حقیقت) | `Caddyfile.prod:20-29` در برابر `next.config.ts:10,12,35` | کم (کاهش دفاع لایه‌ای) |
| ۵ | canonical صفحهٔ اصلی `https://liceno.ir` (بدون اسلش پایانی) در برابر `https://liceno.ir/` در سایت‌مپ | مقایسهٔ دو خروجی | کم |

---

## ۷. آنچه راستی‌آزمایی **نکرد** (صریح)

1. **اثر روی تولید:** هیچ دیپلویی انجام نشد ⇒ هر دو اصلاح در تولید هنوز اعمال نشده‌اند و اثرشان دیده نشده است.
2. **شاهد مرورگری:** مرورگر در دسترس نبود ⇒ پذیرش واقعی بِیکن‌های GA4 دیده نشد.
3. **پوشش کامل:** از ۷۹۲+ آدرس سایت‌مپ، ۳ نمونه از هر شکل آزموده شد، نه همه.
4. **nginx تولید:** پیکربندی nginx در مخزن نیست؛ فقط از برابر بودن هدر زنده با CSP نکست استنتاج شد که nginx آن را بازنویسی نمی‌کند.
5. **پیکربندی بهینهٔ `limit: 100` فروشگاه / وزن صفحه:** اندازه‌گیری شد ولی اصلاحی در این محور انجام نشد (رفتار-شکننده ⇒ پیشنهاد).

**جمع‌بندی راستی‌آزما:** هر دو اصلاح PASS-WITH-CAVEATS؛ هیچ شاهدی که خودِ اصلاح را باطل کند یافت نشد؛ دو مورد باز (تناقض `?cat=` با سایت‌مپ، و بی‌اثری تا دیپلوی) به مالک گزارش می‌شود.
