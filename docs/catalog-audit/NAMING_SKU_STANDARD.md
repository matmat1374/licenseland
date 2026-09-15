# استاندارد نام‌گذاری عنوان و الگوی SKU

هدف: **دو محصول با کارکرد متفاوت هرگز عنوان یکسان نگیرند** و کاربر بدون خواندن متن طولانی، تفاوت را بفهمد.

> نام برند **لاتین** می‌ماند («Claude Pro»، «Cursor Pro») چون کاربر با همان عبارت جست‌وجو می‌کند؛ فقط ویژگی‌های تفکیک‌کننده به آن اضافه می‌شوند. همین قاعده در کد (`src/lib/product-naming.ts`) و در جدول ردیابی پیاده شده است.

---

## ۱. الگوی عنوان

```
[برند] [نوع دسترسی] [سهمیه/سطح] ([مدت]) — [گارانتی]
```

| بخش | اجباری؟ | مقادیر مجاز |
|---|---|---|
| برند | ✅ | `Claude Pro`, `ChatGPT`, `Cursor Pro`, `Canva Pro`, … |
| نوع دسترسی | ✅ | اکانت · سیت اشتراکی · API · گیفت‌کارت · شماره مجازی |
| سهمیه/سطح | ✅ برای API و گیفت‌کارت | ۱۰M/۵۰M/۱۰۰M توکن · ۵۰$ · ۲۶۰۰ کردیت · Standard/VIP |
| مدت | ✅ | ۱ روزه · ۳ روزه · ۷ روزه · ۱ ماهه · ۳ ماهه · ۶ ماهه · ۱ ساله |
| گارانتی | ✅ | با گارانتی · بدون گارانتی |

**قواعد:**
1. ترتیب بخش‌ها ثابت است؛ جداکنندهٔ بخش‌ها ` — ` (em-dash) و مدت داخل پرانتز.
2. اگر محصول ماهیت **اکانت** یا **سیت** دارد، کلمهٔ «اکانت» یا «سیت اشتراکی» بیاید (نه «Pro» تنها).
3. برای محصولات API، **همیشه** مقدار سهمیه بیاید؛ بدون سهمیه، عنوان ناقص است.
4. برای گیفت‌کارت، **همیشه** ارزش اسمی ($۱۰، $۵۰ …) بیاید.
5. واژه‌های تبلیغاتی («قانونی و پایدار»، «اختصاصی»، «جدید») جای ویژگی فنی را نمی‌گیرند.
6. عنوان هرگز بیش از ۷۰ کاراکتر نشود (نمایش سالم روی کارت محصول).
7. اگر عنوان فعلی از قبل سهمیه/نوع را دارد، تکرار نمی‌شود (محافظ ضدتکرار در `buildProductTitle`).

## ۲. الگوی SKU

```
BRAND-TYPE-QUOTA-DUR-[TIER]-[NOWAR]
```

| کد | معنا | نمونه |
|---|---|---|
| BRAND | برند | `CLAUDE`, `CHATGPT`, `CURSOR` |
| TYPE | نوع دسترسی | `API` · `SEAT` · `ACC` · `GC` · `VNO` |
| QUOTA | سهمیه | `10M` · `50M` · `50USD` · `2600` |
| DUR | مدت | `1D` · `3D` · `7D` · `1M` · `6M` · `1Y` |
| TIER | سطح (اختیاری) | `STD` · `VIP` · `MEGA` |
| NOWAR | بدون گارانتی (اختیاری) | `NOWAR` |

**SKU باید یکتا باشد.** در صورت برخورد (نسخهٔ تازهٔ تأمین‌کننده)، نسخهٔ قدیمی آرشیو و لینکش ریدایرکت می‌شود؛ SKU جدید ساخته نمی‌شود.

## ۳. اعمال روی پنج لینک نمونه — «قبل ← بعد»

| # | slug | عنوان فعلی | عنوان پیشنهادی | SKU |
|---|---|---|---|---|
| ۱ | `2421-claude-pro-۳-روزه` | `Claude Pro (۳ روزه)` | **Claude Pro API — ۱۰۰M توکن (۳ روزه) — با گارانتی** | `CLAUDE-API-100M-3D` |
| ۲ | `4623-claude-pro-۱-روزه` | `Claude Pro (۱ روزه)` | **Claude Pro API — ۵۰M توکن (۱ روزه) — با گارانتی** | `CLAUDE-API-50M-1D` |
| ۳ | `2879-claude-pro-۱-ماهه` | `Claude Pro (۱ ماهه)` | **Claude Pro سیت اشتراکی (۱ ماهه)** | `CLAUDE-SEAT-1M` |
| ۴ | `2379-claude-pro-۱-ماهه` | `اکانت کلود پرو اختصاصی (Claude Pro AI)` | **Claude Pro API — ۵۰$ (۱ ماهه) — با گارانتی** | `CLAUDE-API-50USD-1M` |
| ۵ | `2992-claude-pro-۱-ماهه` | `اکانت کلود پرو ۱ ماهه (Claude Pro AI) \| قانونی و پایدار` | **Claude Pro اکانت (۱ ماهه) — بدون گارانتی** | `CLAUDE-ACC-1M-NOWAR` |

**نتیجه:** پنج محصولی که پیش‌تر همه «Claude Pro …» بودند، اکنون پنج عنوان یکتا دارند و از ۵۹۰٬۰۰۰ تا ۲۶٬۲۴۳٬۰۰۰ تومان، اختلاف کارکردشان از خود عنوان خوانده می‌شود.

### نمونه‌های بیشتر از رجیستری

| عنوان فعلی | عنوان پیشنهادی | SKU |
|---|---|---|
| `API Claude Standard 200M Token 1 Day – full warranty` | Claude Pro API — ۲۰۰M توکن (۱ روزه) — با گارانتی | `CLAUDE-API-200M-1D-STD` |
| `API Claude VIP High Stable 15M Token 1 Day` | Claude Pro API — ۱۵M توکن (۱ روزه) — با گارانتی | `CLAUDE-API-15M-1D-VIP` |
| `API Cursor Pro 2600 Credits 1 month full warranty` | Cursor Pro API — ۲۶۰۰ کردیت (۱ ماهه) — با گارانتی | `CURSOR-API-2600-1M` |
| `Google Play Gift Card (US) - US $10 Gift Card Code` | Google Play گیفت‌کارت ۱۰$ | `GPLAY-GC-10USD` |
| `YOUTUBE PREMIUM SLOT 6 MONTHS full warranty` | YouTube Premium سیت اشتراکی (۶ ماهه) — با گارانتی | `YOUTUBE-SEAT-6M` |

## ۴. نقشهٔ برند → برچسب و کد

| برند | برچسب عنوان | کد SKU |
|---|---|---|
| Claude | Claude Pro | `CLAUDE` |
| ChatGPT / OpenAI | ChatGPT | `CHATGPT` |
| Cursor | Cursor Pro | `CURSOR` |
| Windsurf | Windsurf Pro | `WINDSURF` |
| Gemini | Gemini AI Pro | `GEMINI` |
| Canva | Canva Pro | `CANVA` |
| Spotify | Spotify Premium | `SPOTIFY` |
| Netflix | Netflix 4K Ultra HD | `NETFLIX` |
| YouTube | YouTube Premium | `YOUTUBE` |
| Adobe | Adobe Creative Cloud Pro | `ADOBE` |
| Google Play | Google Play | `GPLAY` |
| iTunes | iTunes Gift Card | `ITUNES` |

## ۵. کجا اعمال می‌شود؟

| لایه | کار |
|---|---|
| `src/lib/product-naming.ts` | توابع خالص `parseAttributes` / `buildProductTitle` / `buildSku` / `buildDedupKey` |
| `src/lib/supplier.ts` → `localizeProduct()` | فراخوانی `buildProductTitle` روی نام تأمین‌کننده (اصلاح M1) |
| `kernel/test/productNaming.test.ts` | ۱۰ تست تضمین یکتایی عنوان و درستی کلید |
| `scripts/catalog-audit-registry.cjs` | تولید «عنوان پیشنهادی» و SKU برای ۱۰۴۹ محصول موجود |
| فیلد `specifications` محصول | ذخیرهٔ SKU و کلید ضدتکرار برای اعتبارسنجی خودکار |
| `SOP_QA_CHECKLIST.md` | جلوگیری از انتشار عنوان تکراری |
