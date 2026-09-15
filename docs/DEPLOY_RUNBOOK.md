# رانبوک دیپلوی — کاتالوگ، ترب و اصلاح ریشه‌ای

**وضعیت:** آماده اجرا · **نیازمند:** تأیید صریح مالک
**پیش‌نیاز تأییدشده:** ۱۲۵/۱۲۵ تست سبز · `typecheck` پاک · بیلد پروداکشن موفق (۵۴/۵۴ صفحه) · dry-run دیپلوی سالم (۳۵۵ فایل)

---

## ۰. خلاصهٔ آنچه منتشر می‌شود

| # | مجموعه | فایل‌های کلیدی |
|---|--------|----------------|
| ۱ | **پاک‌سازی و استاندارد کاتالوگ** | `docs/catalog-audit/slug-redirects.proposed.json` → `src/data/slug-redirects.json`، اجرای `catalog-dedup-apply.mjs`، `backfill-dedup-keys.mjs` |
| ۲ | **یکپارچه‌سازی ترب** | `src/lib/torob.ts`، `src/app/api/torob/route.ts`، `src/app/product/[slug]/page.tsx`، `src/app/robots.ts`، `public/og-default.png` |
| ۳ | **اصلاح ریشه‌ای کد** | `src/lib/product-naming.ts`، `src/lib/supplier.ts` (عنوان + کلید ضدتکرار + تعمیر mojibake) |

---

## ۱. پیش از دیپلوی (۵ دقیقه)

```bash
# الف) بکاپ دیتابیس پروداکشن
ssh root@109.122.254.151 "cp /var/www/licenseland/prisma/db/custom.db /var/www/licenseland/prisma/db/custom.db.pre-dedup-$(date +%F)"

# ب) اطمینان از تمیز بودن مخزن محلی
git status --short          # باید خالی باشد

# ج) تأیید سلامت فعلی سایت (نقطهٔ مرجع)
curl -s -o /dev/null -w "home:%{http_code}\n" https://liceno.ir/
curl -s https://liceno.ir/api/health
```

## ۲. گام‌های دیپلوی

```bash
# گام ۱ — اعمال مهاجرت کاتالوگ روی دیتابیس پروداکشن (dry-run اول)
node scripts/catalog-dedup-apply.mjs --db "<DATABASE_URL پروداکشن>"

# گام ۲ — اجرای واقعی
node scripts/catalog-dedup-apply.mjs --db "<DATABASE_URL پروداکشن>" --apply

# گام ۳ — پر کردن کلید ضدتکرار روی محصولات موجود
node scripts/backfill-dedup-keys.mjs --db "<DATABASE_URL پروداکشن>" --apply

# گام ۴ — باندل + آپلود + بیلد روی سرور + ریلود (طبق قوانین پروژه)
node scripts/deploy.mjs
```

> `deploy.mjs` خودش بعد از بیلد، `pm2 reload` می‌زند و چک سلامت انجام می‌دهد.
> اگر می‌خواهید کد و داده جدا منتشر شوند، ابتدا گام ۴ (کد) و بعد گام ۱–۳ (داده) را اجرا کنید — کد جدید با دادهٔ قدیمی هم سازگار است.

## ۳. راستی‌آزمایی پس از دیپلوی

```bash
# الف) پنج لینک نمونه باید عنوان یکتا و متاتگ ترب داشته باشند
for u in 2421-claude-pro-۳-روزه 4623-claude-pro-۱-روزه 2879-claude-pro-۱-ماهه 2379-claude-pro-۱-ماهه 2992-claude-pro-۱-ماهه; do
  echo "== $u"; curl -s "https://liceno.ir/product/$u" | grep -o 'name="product_name" content="[^"]*"'
done

# ب) ریدایرکت‌ها (باید ۳۰۱ بدهد)
curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" "https://liceno.ir/product/2020-claude-pro-۱-روزه"

# ج) فید ترب
curl -s "https://liceno.ir/api/torob?format=object" | head -c 400

# د) جست‌وجوی فروشگاه: نباید دو عنوان یکسان با کارکرد متفاوت بماند
curl -s "https://liceno.ir/shop?search=claude" | grep -c "Claude Pro ("

# ه) سلامت کلی
curl -s https://liceno.ir/api/health && curl -s -o /dev/null -w "home:%{http_code}\n" https://liceno.ir/
```

**معیارهای پذیرش:**

| سنجه | مقدار انتظار |
|---|---|
| هر پنج لینک نمونه | ۲۰۰ + عنوان یکتا |
| متاتگ‌های ترب | `product_id`, `product_name`, `product_price`, `availability`, `guarantee` حاضر؛ `og:image` مطلق |
| ریدایرکت تکراری‌ها | ۳۰۱ به محصول هم‌کارکرد |
| `grep -c "Claude Pro ("` در جست‌وجو | ۰ |
| `/api/torob` | ۷۰۰+ آیتم، همه با `image_link` و `availability` |
| سفارش‌ها/لایسنس‌ها | دست‌نخورده (هیچ ردیفی حذف نشده) |

## ۴. بازگردانی (اگر لازم شد)

```bash
# داده
ssh root@109.122.254.151 "cp /var/www/licenseland/prisma/db/custom.db.pre-dedup-* /var/www/licenseland/prisma/db/custom.db"
ssh root@109.122.254.151 "cd /var/www/licenseland && pm2 reload licenseland"

# کد
git revert --no-edit <commit>      # کامیت‌ها به‌ترتیب در git log موجودند
node scripts/deploy.mjs
```

زمان بازگردانی تقریبی: ۳ دقیقه (داده) + ۴ دقیقه (بیلد و ریلود).

## ۵. پس از دیپلوی (کارهای مالک)

1. **فهرست ۴۱ مورد «بررسی دستی»** در `product-registry.csv` را بازبینی کنید (فیلتر `title_confidence = پایین`).
2. **به ترب ارسال کنید:** سایت‌مپ `https://liceno.ir/sitemap.xml` و فید `https://liceno.ir/api/torob` — و درخواست مستندات API برای تأیید قالب خروجی.
3. **تصاویر محصول:** کاتالوگ تقریباً بدون عکس است (۱ از ۱٬۰۴۹). مهم‌ترین اقدام برای نتیجهٔ بهتر در ترب.
4. **بازبینی هفتگی:** `node scripts/catalog-audit-registry.cjs` و بررسی ستون `issue_type` — هر ردیف جدید یعنی نشتی در فرایند.

## ۶. ریسک‌ها و کاهش آن‌ها

| ریسک | کاهش |
|---|---|
| حذف اشتباه محصول | هیچ ردیفی حذف نمی‌شود؛ فقط `isActive=false` + ریدایرکت. اعتبارسنجی پیش از نوشتن اجباری است. |
| شکستن سئو | اسلاگ مبنا ثابت می‌ماند و ۲۰۳ ریدایرکت ۳۰۱ اضافه می‌شود. |
| گم شدن سابقهٔ سفارش | `OrderItem.productId` دست‌نخورده؛ محصولات آرشیوی همچنان در صفحهٔ سفارش کار می‌کنند. |
| شکست بیلد روی سرور | بیلد پروداکشن محلی از قبل موفق شده؛ `deploy.mjs` در صورت خطا متوقف می‌شود. |
| ادغام ناخواسته | کلید هویت = نام نرمال‌شدهٔ تأمین‌کننده؛ ادغام فقط در گروه هویت یکسان و با تأیید هم‌کارکرد بودن مقصد. |
