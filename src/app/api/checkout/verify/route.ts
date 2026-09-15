import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { zarinpalVerify } from "@/lib/zarinpal";
import { getBaseUrl } from "@/lib/url";
import { purchaseFromSupplier } from "@/lib/supplier";
import { signOrderAccessToken } from "@/lib/order-access";
import { sealKey } from "@/lib/licenses";
import { transitionOrder } from "@/lib/domain/orders";
import { topUpWallet, chargeWallet } from "@/lib/domain/wallet";
import { shouldRequireAdminApproval, enqueueFulfillment, fulfillAndDeliverOrder } from "@/lib/order-fulfillment";

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
    return NextResponse.redirect(new URL(`/order/${order.id}?paid=1&cc=1&token=${t}`, base));
  }

  const verify = await zarinpalVerify(order.total, authority);

  if (!verify.success) {
    await db.payment.updateMany({
      where: { authority },
      data: { status: "failed", rawResponse: JSON.stringify({ status, message: verify.message }) },
    }).catch(() => {});
    await releaseReservedKeys(order.id);
    await transitionOrder({ orderId: order.id, from: "awaiting_payment", event: "cancelled" }).catch(() => {});
    return NextResponse.redirect(new URL(`/order/${order.id}?failed=1&token=${signOrderAccessToken(order.id)}`, base));
  }

  const isDemoAuthority = authority.startsWith("DEMO");

  await db.payment.updateMany({
    where: { authority },
    data: {
      status: "verified",
      refId: verify.refId || null,
      verifiedAt: new Date(),
      rawResponse: JSON.stringify({ status, refId: verify.refId, message: verify.message, demo: isDemoAuthority }),
    },
  }).catch(() => {});

  // H4 fix: persist a Payment record for every verify outcome so gateway
  // disputes have an audit trail (model existed but was never written).
  try {
    const existingPayment = await db.payment.findFirst({ where: { authority } });
    if (!existingPayment) {
      await db.payment.create({
        data: {
          orderId: order.id,
          gateway: "zarinpal",
          authority,
          amountMinor: order.total,
          status: "pending",
          rawResponse: JSON.stringify({ status, verified: false }),
        }
      });
    }
  } catch (e) {
    console.error("[payment] Failed to create Payment record:", e);
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
    return NextResponse.redirect(new URL(`/order/${order.id}?paid=1&cc=1&token=${t}`, base));
  }

  // discount code count increment
  if (order.discountCode) {
    await db.discountCode
      .update({ where: { code: order.discountCode }, data: { usedCount: { increment: 1 } } })
      .catch(() => {});
  }

  // Check admin manual approval policy
  const requireApproval = await shouldRequireAdminApproval(order.id);
  if (requireApproval) {
    // Hold fulfillment: keep keys safely RESERVED, mark items as WAITING_APPROVAL
    await db.orderItem.updateMany({
      where: { orderId: order.id },
      data: { fulfillmentStatus: "WAITING_APPROVAL" },
    });
    console.log(`[fulfillment] Order ${order.code} paid successfully, awaiting admin approval.`);
  } else {
    // H5 fix: enqueue instead of awaiting — the customer must not wait on the
    // supplier HTTP call inside the payment callback. Worker drains the queue.
    try {
      await enqueueFulfillment(order.id);
    } catch (e) {
      console.error("[fulfillment] Failed to enqueue job, running inline fallback:", e);
      await fulfillAndDeliverOrder(order.id).catch(() => {});
    }
  }

  // Earn points
  if (order.userId && order.total > 0) {
    try {
      const { earnPoints } = await import("@/lib/loyalty");
      await earnPoints(order.userId, order.id, order.total);
    } catch (e) {
      console.error("[loyalty] Failed to earn points:", e);
    }
  }

  const token = signOrderAccessToken(order.id);
  // cc=1: the order page clears the persisted cart client-side — previously the
  // cart survived a successful purchase and risked a duplicate charge next time.
  return NextResponse.redirect(new URL(`/order/${order.id}?paid=1&cc=1&token=${token}`, base));
}

async function releaseReservedKeys(orderId: string) {
  // conditional updateMany is atomic: only RESERVED rows flip back to AVAILABLE
  await db.licenseKey.updateMany({
    where: { orderItem: { orderId }, status: "RESERVED" },
    data: { status: "AVAILABLE", orderItemId: null },
  });
}
