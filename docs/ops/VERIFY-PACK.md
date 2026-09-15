# بستهٔ راستی‌آزمایی — جریان خرید و تحویل

هدف: با شاهد قابل‌نمایش ثابت شود هر سفارش در جدول‌ها ثبت شده و ایمیل‌هایش وضعیت مشخص دارند.

## ۱. کوئری‌های دستی (SQLite)

**الف) آیا هر سفارش مسیر کامل را طی کرده؟**

```sql
SELECT o.code, o.status, o.fulfillmentStage,
       (SELECT COUNT(*) FROM OrderStatusEvent e WHERE e.orderId=o.id) AS events,
       (SELECT COUNT(*) FROM EmailLog m WHERE m.orderId=o.id) AS emails,
       (SELECT trackingCode FROM Shipment s WHERE s.orderId=o.id) AS tracking
FROM "Order" o ORDER BY o.createdAt DESC LIMIT 20;
```

**ب) سفارش‌های پرداخت‌شده‌ای که خریداری نشده‌اند (نشتی عملیاتی):**

```sql
SELECT code, status, fulfillmentStage FROM "Order"
WHERE status='PAID' AND fulfillmentStage IN ('NONE','PURCHASING');
```

**ج) ایمیل‌های ناموفق یا معلق:**

```sql
SELECT event, "to", status, attempts, error FROM EmailLog
WHERE status IN ('FAILED','QUEUED') ORDER BY createdAt DESC;
```

**د) سفارش‌های ارسال‌شده بدون کد رهگیری:**

```sql
SELECT o.code FROM "Order" o LEFT JOIN Shipment s ON s.orderId=o.id
WHERE o.fulfillmentStage IN ('SHIPPED','DELIVERED')
  AND (s.trackingCode IS NULL OR s.trackingCode='');
```

## ۲. اجرای سریع از خط فرمان

```bash
cd /var/www/licenseland
DATABASE_URL="file:/var/www/licenseland/prisma/db/custom.db" \
  node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.\$queryRawUnsafe('SELECT code,status,fulfillmentStage FROM \"Order\" ORDER BY createdAt DESC LIMIT 10').then(r=>{console.table(r);return p.\$disconnect()})"
```

## ۳. چک‌لیست پذیرش

- [ ] هر سفارش PAID حداکثر ۱۵ دقیقه بعد `PURCHASING`/`PURCHASED` شده است.
- [ ] هر سفارش PURCHASED یک رکورد `SupplierOrder` با شناسهٔ تأمین‌کننده دارد.
- [ ] هر سفارش SHIPPED کد رهگیری و حامل دارد.
- [ ] هر سفارش DELIVERED ایمیل تحویل با وضعیت `SENT` دارد.
- [ ] هیچ `EmailLog` با وضعیت `FAILED` بدون پیگیری نمانده.
- [ ] انتقال نامعتبر وضعیت رد می‌شود (تست منفی).
- [ ] کاربر عادی به مسیرهای ادمین دسترسی ندارد (۴۰۱/۴۰۳).

## ۴. نتیجهٔ مورد انتظار

| سنجه | مقدار سالم |
|---|---|
| رویدادهای هر سفارش کامل | ≥ ۵ |
| ایمیل‌های هر سفارش کامل | ۵ (ثبت، پرداخت، تأمین، ارسال، تحویل) |
| سفارش PAID بدون خرید | ۰ |
| ایمیل FAILED | ۰ |
