# دفترچهٔ سفارش‌ها — راهنمای استفاده

**فایل‌ها:** `order-ledger.csv` (ستون‌ها + ۳ ردیف نمونه)

## راه‌اندازی در Google Sheets (یک‌بار، ۲ دقیقه)
1. فایل CSV را در Sheets باز کنید (File → Import → Upload).
2. سطر اول را به‌عنوان هدر نگه دارید.
3. برای ستون‌های لیستی، Data → Data validation اضافه کنید:
   - `payment_status`: PENDING, PAID, FAILED, CANCELLED, PENDING_SUPPORT
   - `fulfillment_stage`: NONE, PURCHASING, PURCHASED, READY_TO_SHIP, SHIPPED, DELIVERED, RETURNED
   - `email_status`: SENT, QUEUED, FAILED, SKIPPED
4. در ستون `margin` فرمول بگذارید: `=(J2-K2*<نرخ دلار>)/J2` (نرخ دلار را در یک سلول جدا نگه دارید).
5. برای `due_at` قالب تاریخ شمسی و Conditional formatting قرمز برای تاریخ گذشته.

## در Excel
همان مراحل با Data → Data Validation و فرمول مشابه.

## ستون‌ها
- `order_code`
- `customer_name`
- `customer_phone`
- `items`
- `payment_status`
- `fulfillment_stage`
- `supplier_order_code`
- `supplier_ref`
- `cost_usd`
- `sell_total`
- `margin`
- `carrier`
- `tracking_code`
- `owner`
- `next_action`
- `due_at`
- `last_email`
- `email_status`
- `notes`

## قاعدهٔ استفاده
هر روز صبح: ردیف‌هایی که `due_at` آن‌ها گذشته را از فهرست SOP (§۶) پیگیری کنید.
