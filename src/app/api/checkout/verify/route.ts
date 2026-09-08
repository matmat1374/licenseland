import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { zarinpalVerify } from "@/lib/zarinpal";
import { getBaseUrl } from "@/lib/url";
import { purchaseFromSupplier } from "@/lib/supplier";
import { signOrderAccessToken } from "@/lib/order-access";
import { sealKey } from "@/lib/licenses";
import { transitionOrder } from "@/lib/domain/orders";
import { topUpWallet, chargeWallet } from "@/lib/domain/wallet";
import { shouldRequireAdminApproval, fulfillAndDeliverOrder } from "@/lib/order-fulfillment";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const authority = searchParams.get("Authority") || "";
  const status = searchParams.get("Status") || "";
  const base = getBaseUrl(req);

  if (!authority) {
    return NextResponse.redirect(new URL("/checkout?failed=1", base));
  }

  const order = await db.order.findFirst({ where: { zarinpalAuthority: authority } });

  if (!order) {
    return NextResponse.redirect(new URL("/checkout?failed=1", base));
  }

  // user cancelled — applies to demo AND real gateways (C3 fix: previously demo
  // authorities skipped cancellation and were marked PAID anyway)
  if (status !== "OK") {
    await releaseReservedKeys(order.id);
    await transitionOrder({ orderId: order.id, from: "awaiting_payment", event: "cancelled" }).catch(() => {});
    return NextResponse.redirect(new URL(`/checkout?failed=cancel`, base));
  }

  // already processed (idempotency fast-path)
  if (order.status === "PAID") {
    const t = signOrderAccessToken(order.id);
    return NextResponse.redirect(new URL(`/order/${order.id}?paid=1&token=${t}`, base));
  }

  const verify = await zarinpalVerify(order.total, authority);

  if (!verify.success) {
    await releaseReservedKeys(order.id);
    await transitionOrder({ orderId: order.id, from: "awaiting_payment", event: "cancelled" }).catch(() => {});
    return NextResponse.redirect(new URL(`/order/${order.id}?failed=1&token=${signOrderAccessToken(order.id)}`, base));
  }

  // Double-entry accounting: Gateway top-up -> User wallet -> Revenue charge
  try {
    await topUpWallet({
      userId: order.userId,
      amountMinor: order.total,
      txId: `zarinpal-${authority}`,
      reason: "zarinpal_deposit",
    });
    await chargeWallet({
      userId: order.userId,
      amountMinor: order.total,
      orderId: order.id,
    });
  } catch (e) {
    console.error("[wallet] Failed to charge wallet:", e);
    // Even if wallet accounting fails, we must give them their order, so log and continue
  }

  // Atomically claim the PAID transition using State Machine
  try {
    await transitionOrder({
      orderId: order.id,
      from: "awaiting_payment",
      event: "payment_verified",
      extraData: { zarinpalRefId: verify.refId || null, paidAt: new Date() }
    });
  } catch (e) {
    // Concurrent request already processed this order
    const t = signOrderAccessToken(order.id);
    return NextResponse.redirect(new URL(`/order/${order.id}?paid=1&token=${t}`, base));
  }

  // discount code count increment
  if (order.discountCode) {
    await db.discountCode
      .update({ where: { code: order.discountCode }, data: { usedCount: { increment: 1 } } })
      .catch(() => {});
  }

  // Check admin manual approval policy
  const requireApproval = await shouldRequireAdminApproval();
  if (requireApproval) {
    // Hold fulfillment: keep keys safely RESERVED, mark items as WAITING_APPROVAL
    await db.orderItem.updateMany({
      where: { orderId: order.id },
      data: { fulfillmentStatus: "WAITING_APPROVAL" },
    });
    console.log(`[fulfillment] Order ${order.code} paid successfully, awaiting admin approval.`);
  } else {
    // Auto-pilot: instant automatic fulfillment and email delivery
    await fulfillAndDeliverOrder(order.id);
  }

  const token = signOrderAccessToken(order.id);
  return NextResponse.redirect(new URL(`/order/${order.id}?paid=1&token=${token}`, base));
}

async function releaseReservedKeys(orderId: string) {
  // conditional updateMany is atomic: only RESERVED rows flip back to AVAILABLE
  await db.licenseKey.updateMany({
    where: { orderItem: { orderId }, status: "RESERVED" },
    data: { status: "AVAILABLE", orderItemId: null },
  });
}
