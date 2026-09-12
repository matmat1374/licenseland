import { db } from "./db";
import { purchaseFromSupplier } from "./supplier";
import { sealKey } from "./licenses";
import { sendOrderFulfillmentEmail } from "./email";

/** Check whether orders require manual admin approval before dispatching licenses. */
export async function shouldRequireAdminApproval(orderId?: string): Promise<boolean> {
  try {
    const row = await db.setting.findUnique({
      where: { key: "require_admin_order_approval" },
    });
    // Only require approval if explicitly configured as "true" in settings
    if (!row || row.value !== "true") {
      return false;
    }
    return true;
  } catch {
    // Default to false (safe for automated delivery without blocking)
    return false;
  }
}

/**
 * Perform full fulfillment of a paid order:
 * 1. Claims or converts RESERVED keys to SOLD.
 * 2. Decrements product stock.
 * 3. Triggers supplier API if it is an automated supplier product.
 * 4. Records SupplierOrder and SupplierLog with request/response metadata.
 * 5. Handles 402 (insufficient balance) and 409 (out of stock) gracefully with critical alerts.
 * 6. Sets OrderItem.fulfillmentStatus appropriately.
 * 7. Dispatches customer email with license keys and exact activation instructions.
 */
export async function fulfillAndDeliverOrder(orderId: string): Promise<{ ok: boolean; message: string }> {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: {
          include: {
            product: true,
            licenses: true,
          },
        },
      },
    });

    if (!order) {
      return { ok: false, message: "سفارش یافت نشد" };
    }

    if (order.status !== "PAID" && order.status !== "PROCESSING") {
      return { ok: false, message: "تنها سفارش‌های پرداخت‌شده قابل صدور لایسنس هستند" };
    }

    for (const item of order.items) {
      let isSupplierProduct = item.product.fulfillmentMode === "AUTO";
      try {
        const specs = JSON.parse(item.product.specifications || "{}");
        if (specs.supplier_product_id) {
          isSupplierProduct = true;
        }
      } catch {}

      if (isSupplierProduct) {
        // Auto-fulfill from external supplier API (irMarket)
        const startTime = Date.now();
        const idempotencyKey = `LL-${order.code}-${item.id}`;
        const customerEmail = order.guestEmail || order.user?.email || undefined;

        const result = await purchaseFromSupplier(
          item.productId,
          item.quantity,
          customerEmail,
          idempotencyKey
        );

        const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
        const supplierOrderCode = `SO-${Date.now().toString().slice(-6)}-${randomSuffix}`;
        const soStatus = result.status === "delivered"
          ? "FULFILLED"
          : result.status === "processing"
          ? "PENDING"
          : "FAILED";

        // 1. Create and store record in SupplierOrder
        const supplierOrder = await db.supplierOrder.create({
          data: {
            code: supplierOrderCode,
            productId: item.productId,
            productTitle: item.productTitle,
            quantity: item.quantity,
            status: soStatus,
            direction: "OUTBOUND",
            supplierRef: result.orderId ? String(result.orderId) : null,
            costUsd: typeof result.costUsd === "number" ? result.costUsd : null,
            orderItemId: item.id,
            note: `سفارش فروشگاه: ${order.code} | کاربر: ${customerEmail || "مهمان"}`,
            fulfilledAt: result.status === "delivered" ? new Date() : null,
          },
        });

        // Link OrderItem to supplierOrder
        await db.orderItem.update({
          where: { id: item.id },
          data: {
            supplierOrderId: result.orderId ? `irm:${result.orderId}` : supplierOrder.id,
          },
        });

        // 2. Record detailed log in SupplierLog
        const logAction = result.status === "delivered"
          ? "keys_received"
          : result.status === "processing"
          ? "request_processing"
          : result.httpStatus === 402 || result.errorCode === "supplier_balance_empty"
          ? "error_402_insufficient_balance"
          : result.httpStatus === 409 || result.errorCode === "out_of_stock"
          ? "error_409_out_of_stock"
          : "request_error";

        const logStatus: "INFO" | "SUCCESS" | "ERROR" = result.status === "delivered"
          ? "SUCCESS"
          : result.status === "processing"
          ? "INFO"
          : "ERROR";

        await db.supplierLog.create({
          data: {
            supplierOrderId: supplierOrder.id,
            action: logAction,
            status: logStatus,
            payload: JSON.stringify({
              method: "POST",
              endpoint: "/api/buyer/purchase",
              request: result.requestPayload,
              response: result.responsePayload,
              durationMs: Date.now() - startTime,
              timestamp: new Date().toISOString(),
            }).slice(0, 4000),
            message: result.message?.slice(0, 500),
          },
        });

        // 3. Handle Supplier Errors (402, 409) or Success / Processing
        if (result.httpStatus === 402 || result.errorCode === "supplier_balance_empty") {
          // Insufficient supplier wallet balance
          await db.orderItem.update({
            where: { id: item.id },
            data: { fulfillmentStatus: "PENDING_SUPPORT" },
          });
          await db.order.update({
            where: { id: order.id },
            data: { status: "PENDING_SUPPORT" },
          });
          // Log critical alert and create high priority ticket for admin
          await db.supplierLog.create({
            data: {
              supplierOrderId: supplierOrder.id,
              action: "CRITICAL_SUPPLIER_BALANCE_EMPTY",
              status: "ERROR",
              payload: JSON.stringify({
                alert: "CRITICAL",
                orderCode: order.code,
                productTitle: item.productTitle,
                costUsd: result.costUsd,
                message: "موجودی کیف پول دلاری در irMarket تمام شده است! سفارش متوقف شد.",
              }),
              message: `هشدار بحرانی: موجودی دلاری تامین‌کننده برای سفارش ${order.code} ناکافی است.`,
            },
          });
          await db.ticket.create({
            data: {
              orderId: order.id,
              userId: order.userId || null,
              subject: `[بحرانی] خطای موجودی دلاری تامین‌کننده (402) در سفارش ${order.code}`,
              body: `سفارش ${order.code} به دلیل کسری موجودی در کیف پول irMarket تامین نشد. هزینه سفارش: ${result.costUsd || "نامشخص"} دلار. لطفا بلافاصله حساب تامین‌کننده را شارژ نمایید.`,
              status: "open",
              priority: "urgent",
            },
          }).catch(() => {});
        } else if (result.httpStatus === 409 || result.errorCode === "out_of_stock") {
          // Supplier product out of stock
          await db.orderItem.update({
            where: { id: item.id },
            data: { fulfillmentStatus: "SUPPLIER_OUT_OF_STOCK" },
          });
          await db.order.update({
            where: { id: order.id },
            data: { status: "SUPPLIER_OUT_OF_STOCK" },
          });
          // Log critical alert
          await db.supplierLog.create({
            data: {
              supplierOrderId: supplierOrder.id,
              action: "CRITICAL_SUPPLIER_OUT_OF_STOCK",
              status: "ERROR",
              payload: JSON.stringify({
                alert: "CRITICAL",
                orderCode: order.code,
                productTitle: item.productTitle,
                message: "محصول نزد تامین‌کننده irMarket ناموجود است!",
              }),
              message: `هشدار بحرانی: محصول ${item.productTitle} نزد تامین‌کننده ناموجود است.`,
            },
          });
          await db.ticket.create({
            data: {
              orderId: order.id,
              userId: order.userId || null,
              subject: `[ناموجود] محصول ${item.productTitle} در سفارش ${order.code} ناموجود است`,
              body: `محصول ${item.productTitle} در سفارش ${order.code} با خطای عدم موجودی انبار تامین‌کننده (409) مواجه شد.`,
              status: "open",
              priority: "urgent",
            },
          }).catch(() => {});
        } else if (result.status === "delivered" && result.accounts && result.accounts.length > 0) {
          // Success: seal keys and store in LicenseKey
          for (const account of result.accounts) {
            await db.licenseKey.create({
              data: {
                productId: item.productId,
                key: sealKey(item.productId, account),
                note: `سفارش ${order.code} | تأمین‌کننده: irMarket #${result.orderId || ""}`,
                status: "SOLD",
                source: "supplier_api",
                orderItemId: item.id,
                supplierOrderId: supplierOrder.id,
                soldAt: new Date(),
              },
            });
          }
          await db.orderItem.update({
            where: { id: item.id },
            data: { fulfillmentStatus: "FULFILLED" },
          });
        } else if (result.status === "processing") {
          // Still processing at supplier: wait for webhook
          await db.orderItem.update({
            where: { id: item.id },
            data: { fulfillmentStatus: "PROCESSING_BY_SUPPLIER" },
          });
        } else {
          // Unknown error: mark as pending manual
          await db.orderItem.update({
            where: { id: item.id },
            data: { fulfillmentStatus: "PENDING_MANUAL" },
          });
        }
      } else {
        // Internal digital warehouse inventory
        await db.$transaction(async (tx) => {
          // If keys were already RESERVED for this item, mark them SOLD
          const reservedKeys = await tx.licenseKey.findMany({
            where: { orderItemId: item.id, status: "RESERVED" },
          });

          if (reservedKeys.length > 0) {
            await tx.licenseKey.updateMany({
              where: { orderItemId: item.id, status: "RESERVED" },
              data: { status: "SOLD", soldAt: new Date() },
            });
          } else {
            // Otherwise claim fresh AVAILABLE keys
            const candidates = await tx.licenseKey.findMany({
              where: { productId: item.productId, status: "AVAILABLE" },
              take: item.quantity,
              select: { id: true },
            });

            for (const c of candidates) {
              await tx.licenseKey.update({
                where: { id: c.id },
                data: {
                  status: "SOLD",
                  orderItemId: item.id,
                  soldAt: new Date(),
                },
              });
            }
          }

          const soldCount = await tx.licenseKey.count({
            where: { orderItemId: item.id, status: "SOLD" },
          });

          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { decrement: soldCount },
              salesCount: { increment: item.quantity },
            },
          });

          await tx.orderItem.update({
            where: { id: item.id },
            data: { fulfillmentStatus: "FULFILLED" },
          });
        });
      }
    }

    // Trigger transactional email with delivered keys & exact instructions
    sendOrderFulfillmentEmail(order.id).catch((err) => {
      console.error("[email] Error sending fulfillment email:", err);
    });

    return { ok: true, message: "لایسنس‌ها با موفقیت صادر و به ایمیل کاربر ارسال شدند." };
  } catch (error: any) {
    console.error("[fulfillment] Error fulfilling order:", error);
    return { ok: false, message: error?.message || "خطا در فرآیند صدور لایسنس" };
  }
}
