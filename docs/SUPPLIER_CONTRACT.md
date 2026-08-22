# فاز ۱ — قرارداد API تامین‌کننده (irMarket Buyer API)

**هدف یک‌خطی:** استخراج قرارداد واقعی تامین‌کننده و ساخت Adapter تایپ‌دار که هیچ فیلد فرض‌نشده‌ای را قبول نکند.

**منبع تایید:** `https://api.irmarket.store/openapi.json` (دریافت‌شده ۲۰۲۶-۰۸-۱۹).
`/buyer/docs` و `/buyer/swagger` هر دو با **504 CRAWL_LIVECRAWL_TIMEOUT** پاسخ ندادند؛ مسیر متعارف `openapi.json` جواب داد.

> **سطح تایید:** همه ردیف‌ها `DOCS-ONLY` هستند. هیچ پاسخ زنده‌ای مشاهده نشده، چون این محیط شبکه ندارد و کلید هم (به‌درستی) در اختیار من نیست. برای ارتقا به `OBSERVED` اسکریپت `scripts/probe-supplier.mjs` را روی ماشین خودتان اجرا کنید؛ خروجی آن Fixture واقعی می‌سازد و باید همین جدول را به‌روز کند.

## ۱.۱ احراز هویت و محدودیت‌ها

| مورد | مقدار | تاییدشده؟ | منبع |
|---|---|---|---|
| هدر احراز هویت | `X-API-Key: anb_…` (توصیه‌شده) | DOCS-ONLY | openapi.json |
| جایگزین | `?key=…` در Query String | DOCS-ONLY | openapi.json |
| Rate Limit | ۱۲۰ درخواست در دقیقه | DOCS-ONLY | openapi.json |
| مدل پرداخت | کیف پول **پیش‌پرداخت USD**؛ شارژ از طریق ربات تلگرام (USDT یا ریال) | DOCS-ONLY | openapi.json |
| Idempotency | `idempotency_key` در بدنه خرید، حداکثر ۶۴ کاراکتر | DOCS-ONLY | openapi.json |
| امضای وب‌هوک | `X-Signature = HMAC-SHA256(secret, rawBody)` | DOCS-ONLY | openapi.json |

## ۱.۲ اندپوینت / ورودی / خروجی

| اندپوینت | ورودی | خروجی کلیدی | تاییدشده؟ | منبع |
|---|---|---|---|---|
| `GET /api/buyer/products` | — | `id, name, price_usd, retail_usd, discount_percent, savings_usd, stock, pricing_unit, price_per_1000_usd, min_qty, max_qty, requires_email\|link\|comments, required_inputs` | DOCS-ONLY | openapi.json |
| `GET /api/buyer/balance` | — | `balance_usd` | DOCS-ONLY | openapi.json |
| `GET /api/buyer/me` | — | `discount_percent`, `special_rate_products` | DOCS-ONLY | openapi.json |
| `POST /api/buyer/purchase` | `product_id, quantity, idempotency_key, link?, comments?, customer_email?, extras?` | `success, order_id, status, quantity, total_usd, accounts[], refunded` | DOCS-ONLY | openapi.json |
| `GET /api/buyer/orders/{id}` | `id` | همان + `start_count, remains, progress_percent` | DOCS-ONLY | openapi.json |
| `POST /api/buyer/webhook` | `event="order.updated"` + `X-Signature` | هر پاسخ 2xx کافی است | DOCS-ONLY | openapi.json |

## ۱.۳ کدهای خطا → خطای دامنه

| HTTP | معنی مستند | کد دامنه | Retry؟ |
|---|---|---|---|
| 401 | کلید نامعتبر/باطل | `auth_failed` | خیر |
| 402 | موجودی کیف پول USD کافی نیست | `supplier_balance_empty` | خیر |
| 404 | محصول/سفارش ناشناس | `not_found` | خیر |
| 409 | موجودی کافی نیست | `out_of_stock` | خیر |
| 400 | تعداد خارج از بازه یا ورودی الزامی غایب | `invalid_request` | خیر |
| 429 | عبور از ۱۲۰ req/min | `rate_limited` | بله |
| ≥500 | خطای سرور تامین‌کننده | `supplier_unavailable` | بله |
| سایر | خارج از قرارداد | `unexpected_status` | خیر |

## ۱.۴ تناقض‌های قرارداد که باید علنی شوند

| # | تناقض | اثر کسب‌وکاری | تصمیم اعمال‌شده |
|---|---|---|---|
| ۱ | تامین‌کننده **USD** می‌گیرد، فروشگاه **تومان** می‌فروشد | هر جهش دلار، حاشیه را بی‌صدا منفی می‌کند | قیمت‌گذاری از `supplierCostUsdCents` + `FxQuote` با `capturedAtIso` و `bufferBps`؛ نرخ کهنه = بلوکه شدن فروش (`stale_fx_rate`) |
| ۲ | کیف پول **پیش‌پرداخت** است و شارژ آن **دستی/تلگرامی** | فروش موفق ولی تحویل ناموفق با کد 402 | تشخیص `supplier_balance_empty` + تیکت High + هشدار کف موجودی؛ سرمایه در گردش در `docs/UNIT_ECONOMICS.md` |
| ۳ | `pricing_unit=per_1000` برای SMM ولی سفارش به واحد خام | فروش زیر قیمت در تعداد کسری | `supplierCostUsdCents` با `Math.ceil` |
| ۴ | تحویل ممکن است `processing` بماند (پرکردن جزئی) | سفارش نه delivered نه failed | حالت `pending` در Saga + Poller + `remains/progress_percent` |
| ۵ | Secret وب‌هوک «یک‌بار» نشان داده می‌شود و با ثبت مجدد **می‌چرخد** | وب‌هوک‌های معتبر بی‌صدا رد می‌شوند | STOP-AND-ASK #۹؛ نگه‌داشتن دو Secret فعال هنگام چرخش |
| ۶ | `retail_usd` و `discount_percent` قیمت پیشنهادی تامین‌کننده‌اند | لنگر قیمتی اشتباه | قیمت فروش **فقط** از `price_usd` + قواعد شما؛ `retail_usd` فقط برای گزارش |

## ۱.۵ فایل‌های تحویل این فاز

| فایل | توضیح |
|---|---|
| `src/supplier/contract.ts` | تایپ‌ها + Parser سخت‌گیر + `usdToCents` با ریاضی رشته‌ای (بدون float) + اعتبارسنجی پیش‌پرواز |
| `src/supplier/provider.ts` | اینترفیس `SupplierProvider` + کلاینت سرورساید + نگاشت خطا + لاگ پاک‌سازی‌شده |
| `src/supplier/resilience.ts` | Retry با Exponential Backoff + Jitter، Circuit Breaker، Timeout |
| `src/supplier/mockProvider.ts` | پرووایدر Mock برای CI؛ در `NODE_ENV=production` خطا می‌دهد |
| `scripts/probe-supplier.mjs` | ضبط Fixture واقعی روی ماشین شما با کلید ENV و ماسک‌کردن راز |

## ۱.۶ دروازه فاز ۱

| متریک | هدف | مقدار واقعی | وضعیت |
|---|---|---|---|
| قرارداد مستند شد | بله | بله (openapi.json) | PASS |
| Adapter تایپ‌دار + Retry + Breaker + Timeout | بله | بله | PASS |
| تست قرارداد | دارد | ۳۹ تست روی contract/provider/mock | PASS |
| Fixture از پاسخ **واقعی** | بله | خیر — بدون شبکه/کلید | **FAIL — برآورده نشد** |
| Mock فقط در تست | بله | بله (گارد Production) | PASS |

**شرط ورود به فاز بعد:** اجرای `npm run supplier:probe` روی ماشین شما و به‌روزرسانی ستون «تاییدشده؟» به `OBSERVED`.
