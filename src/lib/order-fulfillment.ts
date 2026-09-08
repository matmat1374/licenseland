import { db } from "./db";
import { purchaseFromSupplier } from "./supplier";
import { sealKey } from "./licenses";
import { sendOrderFulfillmentEmail } from "./email";

/** Check whether orders require manual admin approval before dispatching licenses. */
export async function shouldRequireAdminApproval(): Promise<boolean> {
  try {
    const row = await db.setting.findUnique({
      where: { key: "require_admin_order_approval" },
    });
    if (row?.value) {
      return row.value === "true";
    }
  } catch {}
  // Default to true (safe for test and early launch phases)
  return true;
}

/**
 * Perform full fulfillment of a paid order:
 * 1. Claims or converts RESERVED keys to SOLD.
 * 2. Decrements product stock.
 * 3. Triggers supplier API if it is an automated supplier product.
 * 4. Sets OrderItem.fulfillmentStatus = "FULFILLED".
 * 5. Dispatches customer email with license keys and exact activation instructions.
 */
export async function fulfillAndDeliverOrder(orderId: string): Promise<{ ok: boolean; message: string }> {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
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

    if (order.status !== "PAID") {
      return { ok: false, message: "تنها سفارش‌های پرداخت‌شده قابل صدور لایسنس هستند" };
    }

    for (const item of order.items) {
      let isSupplierProduct = false;
      try {
        const specs = JSON.parse(item.product.specifications || "{}");
        isSupplierProduct = !!specs.supplier_product_id;
      } catch {}

      if (isSupplierProduct) {
        // Auto-fulfill from external supplier API (irMarket)
        const result = await purchaseFromSupplier(
          item.productId,
          item.quantity,
          order.guestEmail || undefined,
          `${order.code}-${item.id}`
        );

        if (result.orderId) {
          await db.orderItem.update({
            where: { id: item.id },
            data: {
              supplierOrderId: `irm:${result.orderId}`,
              fulfillmentStatus: result.ok ? "FULFILLED" : "PENDING_MANUAL",
            },
          });
        }

        if (result.ok && result.accounts && result.accounts.length > 0) {
          for (const account of result.accounts) {
            await db.licenseKey.create({
              data: {
                productId: item.productId,
                key: sealKey(item.productId, account),
                note: `سفارش ${order.code} | تأمین‌کننده: irMarket #${result.orderId || ""}`,
                status: "SOLD",
                source: "supplier_api",
                orderItemId: item.id,
                soldAt: new Date(),
              },
            });
          }
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
