# LicenseLand — بازار لایسنس دیجیتال

پلتفرم کامل فروش لایسنس دیجیتال با Next.js 16، Prisma، ZarinPal و irMarket API.

## ساختار پروژه

```
src/
├── app/                    # Next.js App Router
│   ├── (storefront)/       # صفحات فروشگاه
│   │   ├── page.tsx        # صفحه اصلی
│   │   ├── shop/           # فروشگاه + فیلتر
│   │   ├── product/[slug]/ # جزئیات محصول
│   │   ├── cart/           # سبد خرید
│   │   ├── checkout/       # تسویه حساب + زرین‌پال
│   │   └── order/[id]/     # تأیید سفارش + تحویل لایسنس
│   ├── login/             # ورود با OTP
│   ├── register/          # ثبت‌نام با OTP
│   ├── dashboard/         # پنل کاربر (سفارش‌ها، لایسنس‌ها، پروفایل)
│   ├── admin/             # پنل مدیریت
│   │   ├── products/      # CRUD محصولات
│   │   ├── licenses/      # مدیریت لایسنس‌ها
│   │   ├── orders/        # مدیریت سفارش‌ها
│   │   ├── content/       # CMS محتوا
│   │   ├── supplier/      # اتصال irMarket
│   │   ├── articles/     # وبلاگ
│   │   ├── discounts/    # کدهای تخفیف
│   │   ├── settings/     # تنظیمات
│   │   ├── debug/        # دیباگ
│   │   └── docs/         # راهنما
│   ├── blog/             # وبلاگ عمومی
│   └── api/              # API routes
│       ├── auth/         # NextAuth + OTP
│       ├── checkout/     # زرین‌پال
│       ├── admin/        # APIهای ادمین
│       └── supplier/     # irMarket API
├── components/
│   ├── ui/               # shadcn/ui components
│   └── site/             # کامپوننت‌های سایت
├── lib/                  # utilities
│   ├── auth.ts           # NextAuth config
│   ├── db.ts             # Prisma client
│   ├── supplier.ts       # irMarket integration
│   ├── zarinpal.ts       # ZarinPal gateway
│   └── content.ts        # CMS helper
├── store/                # Zustand (cart)
└── middleware.ts         # (removed - using server-side auth)

prisma/
└── schema.prisma         # User, Product, Order, LicenseKey, etc.

scripts/
├── ensure-env.mjs        # .env auto-creation
└── warm-start.sh         # pre-warm routes (anti-OOM)
```

## تکنولوژی‌ها

- **Framework:** Next.js 16 (App Router, Webpack)
- **Language:** TypeScript 5
- **Database:** Prisma ORM + SQLite
- **Auth:** NextAuth.js v4 (OTP-based)
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Payment:** ZarinPal (demo mode)
- **Supplier API:** irMarket (https://api.irmarket.store)

## ورود ادمین (تستی)

- شماره: `09100000000`
- کد OTP: `123456`

## نکات مهم برای Review

1. **production mode:** سرور در production اجرا می‌شود (next build + next start) چون sandbox محدودیت حافظه دارد.
2. **pre-warm:** اسکریپت `warm-start.sh` همه مسیرها را pre-compile می‌کند تا OOM جلوگیری شود.
3. **OTP تستی:** کد `123456` همیشه کار می‌کند. در production واقعی، به سرویس پیامک وصل شود.
4. **irMarket:** کلید API در پنل ادمین ← تنظیمات قرار می‌گیرد (نه در .env).
5. **زرین‌پال:** حالت دemo فعال است. برای واقعی، `ZARINPAL_MERCHANT` در .env.
