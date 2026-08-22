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
}): Promise<{ to: OrderState; audit: AuditRecord }> {
  const result = applyTransition({
    orderId: args.orderId,
    from: args.from,
    event: args.event,
    atIso: new Date().toISOString(),
    actor: args.actor || "system",
  });
  await db.auditLog.create({
    data: {
      action: `order.${args.event}`,
      entityType: "Order",
      entityId: args.orderId,
      oldValue: JSON.stringify({ state: args.from }),
      newValue: JSON.stringify({ state: result.to }),
    },
  });
  await db.order.update({
    where: { id: args.orderId },
    data: { status: result.to.toUpperCase() },
  });
  logger.info("order.transition", { orderId: args.orderId, from: args.from, to: result.to, event: args.event });
  return result;
}
