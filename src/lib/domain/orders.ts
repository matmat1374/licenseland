// Domain adapter: order state machine + audit logging
import { applyTransition, type OrderState, type OrderEvent, type AuditRecord } from "@kernel/orders/stateMachine";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export { applyTransition };
export type { OrderState, OrderEvent, AuditRecord };

export async function transitionOrder(args: {
  orderId: string;
  from: OrderState;
  event: OrderEvent;
  actor?: string;
  extraData?: any; // For paidAt, zarinpalRefId etc
}): Promise<{ to: OrderState; audit: AuditRecord }> {
  const result = applyTransition({
    orderId: args.orderId,
    from: args.from,
    event: args.event,
    atIso: new Date().toISOString(),
    actor: args.actor || "system",
  });
  
  function toDbStatus(s: OrderState): string {
    if (s === "awaiting_payment" || s === "created") return "PENDING";
    if (s === "paid" || s === "delivered" || s === "provisioning") return "PAID";
    if (s === "supplier_failed" || s === "out_of_stock") return "FAILED";
    return s.toUpperCase();
  }

  // Atomic update: only transition if the DB state still matches `args.from`
  const claimed = await db.order.updateMany({
    where: { id: args.orderId, status: toDbStatus(args.from) },
    data: { status: toDbStatus(result.to), ...args.extraData },
  });

  if (claimed.count === 0) {
    throw new Error(`State transition failed: Order ${args.orderId} is no longer in state ${args.from}`);
  }

  await db.auditLog.create({
    data: {
      action: `order.${args.event}`,
      entityType: "Order",
      entityId: args.orderId,
      oldValue: JSON.stringify({ state: args.from }),
      newValue: JSON.stringify({ state: result.to }),
    },
  });
  
  logger.info("order.transition", { orderId: args.orderId, from: args.from, to: result.to, event: args.event });
  return result;
}
