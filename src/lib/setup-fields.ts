// Setup wizard field definitions — plain shared module (no "use client") so
// BOTH the server page and the client form can import them. Arrays exported
// from a "use client" module become opaque client references on the server
// ("SETUP_FIELDS is not iterable" crash).

export interface SetupField {
  key: string;
  label: string;
  placeholder: string;
  type?: "text" | "password" | "number";
  help: string;
  optional?: boolean;
  ltr?: boolean;
}

// Settings covered by the wizard — stored in the `Setting` table (key/value).
// `base_markup_percent` is a new key introduced for the setup wizard (default 200%).
export const SETUP_FIELDS: SetupField[] = [
  {
    key: "site_name",
    label: "نام برند",
    placeholder: "لایسنس‌لند",
    help: "نام تجاری سایت که در هدر، فوتر و نقشه سایت نمایش داده می‌شود.",
  },
  {
    key: "site_url",
    label: "آدرس دامنه (URL)",
    placeholder: "https://licenseland.ir",
    help: "دامنه اصلی سایت — برای ساخت لینک canonical و متادیتای سئو استفاده می‌شود. معادل NEXTAUTH_URL.",
    ltr: true,
  },
  {
    key: "email",
    label: "ایمیل پشتیبانی",
    placeholder: "support@licenseland.ir",
    help: "ایمیلی که مشتریان برای پشتیبانی از آن استفاده می‌کنند. در فوتر و صفحه تماس نمایش داده می‌شود.",
    ltr: true,
  },
  {
    key: "usd_to_toman_rate",
    label: "نرخ دلار به تومان",
    placeholder: "60000",
    type: "number",
    help: "نرخ تبدیل هر دلار به تومان — برای محاسبه قیمت محصولات وارداتی از تأمین‌کننده. مثلاً ۶۰۰۰۰ یعنی هر دلار ۶۰٬۰۰۰ تومان.",
    ltr: true,
  },
  {
    key: "base_markup_percent",
    label: "درصد حاشیه سود پایه",
    placeholder: "200",
    type: "number",
    help: "درصدی که روی قیمت تمام‌شده اضافه می‌شود تا قیمت نهایی فروش محاسبه شود. پیش‌فرض: ۲۰۰٪ (یعنی قیمت نهایی = ۳ برابر قیمت تمام‌شده).",
    ltr: true,
  },
  {
    key: "supplier_api_key",
    label: "کلید API تأمین‌کننده (irMarket)",
    placeholder: "anb_...",
    type: "password",
    help: "کلید API از پنل irMarket — برای وارد کردن محصولات و خرید خودکار لایسنس. مستندات: api.irmarket.store/buyer/docs",
    ltr: true,
  },
  {
    key: "zarinpal_merchant",
    label: "مرچنت زرین‌پال",
    placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    type: "password",
    help: "کد مرچنت زرین‌پال برای درگاه پرداخت واقعی. در حال حاضر پرداخت در حالت دمو فعال است. این مقدار صرفاً برای نمایش است؛ پرداخت واقعی با متغیر محیطی ZARINPAL_MERCHANT انجام می‌شود.",
    ltr: true,
  },
  {
    key: "supplier_telegram_bot_token",
    label: "توکن بات تلگرام",
    placeholder: "123456789:ABCdef...",
    type: "password",
    help: "برای خودکارسازی تأمین لایسنس و نوتیفیکیشن‌ها (آینده). اختیاری — در صورت تنظیم، سفارش‌های جدید و هشدار موجودی کم از طریق بات اطلاع‌رسانی می‌شود.",
    optional: true,
    ltr: true,
  },
];
