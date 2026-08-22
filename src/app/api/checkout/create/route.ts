import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { zarinpalRequest, isDemoMode } from "@/lib/zarinpal";
import { generateOrderCode } from "@/lib/queries";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getBaseUrl } from "@/lib/url";
import { applyDiscount } from "@/lib/format";

interface CreateItem {
  id: string;
  slug: string;
  title: string;
  price: number;
  quantity: number;
  duration?: string | null;
}

/** Release reservations held by stale PENDING orders (H3 fix). 30 minutes. */
const RESERVATION_TTL_MS = 30 * 60 * 1000;

async function expireStaleReservations() {
  const cutoff = new Date(Date.now() - RESERVATION_TTL_MS);
  const stale = await db.order.findMany({
    where: { status: "PENDING", createdAt: { lt: cutoff } },
    select: { id: true },
    take: 50,
  });
  for (const o of stale) {
    await db.$transaction(async (tx) => {
      await tx.licenseKey.updateMany({
        where: { orderItem: { orderId: o.id }, status: "RESERVED" },
        data: { status: "AVAILABLE", orderItemId: null },
      });
      await tx.order.update({ where: { id: o.id }, data: { status: "CANCELLED" } });
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items: CreateItem[] = body.items || [];
    const customer = body.customer || {};
    const couponCode = body.coupon as string | undefined;

    if (!Array.isArray(items) || items.length === 0)
      return NextResponse.json({ ok: false, message: "سبد خرید خالی است" }, { status: 400 });
    if (items.length > 20)
      return NextResponse.json({ ok: false, message: "تعداد اقلام بیش از حد مجاز است" }, { status: 400 });
    for (const it of items) {
      if (!Number.isInteger(it.quantity) || it.quantity < 1 || it.quantity > 10) {
        return NextResponse.json({ ok: false, message: `تعداد نامعتبر برای «${it.title}» (۱ تا ۱۰)` }, { status: 400 });
      }
    }

    // auth
    const session = await getServerSession(authOptions);

    await expireStaleReservations();

    // fetch products & validate
    const productIds = items.map((i) => i.id);
    const products = await db.product.findMany({ where: { id: { in: productIds }, isActive: true } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    for (const it of items) {
      const p = productMap.get(it.id);
      if (!p) return NextResponse.json({ ok: false, message: "محصول یافت نشد" }, { status: 400 });
      const expected = p.discountPrice ?? p.price;
      if (expected !== it.price) {
        return NextResponse.json({ ok: false, message: `قیمت محصول «${p.title}» تغییر کرده است` }, { status: 400 });
      }
      // check if product is from supplier (auto-fulfill) — these don't need pre-stocked keys
      let isSupplierProduct = false;
      try {
        const specs = JSON.parse(p.specifications || "{}");
        isSupplierProduct = !!specs.supplier_product_id;
      } catch {}
      // check stock only for non-supplier products
      if (!isSupplierProduct) {
        const available = await db.licenseKey.count({ where: { productId: p.id, status: "AVAILABLE" } });
        if (available < it.quantity) {
          return NextResponse.json({ ok: false, message: `موجودی «${p.title}» کافی نیست (${available} عدد باقی مانده)` }, { status: 400 });
        }
      }
      subtotal += expected * it.quantity;
    }

    // discount
    let discount = 0;
    if (couponCode) {
      const discountCodeRec = await db.discountCode.findUnique({ where: { code: couponCode } });
      if (!discountCodeRec || !discountCodeRec.isActive) {
        return NextResponse.json({ ok: false, message: "کد تخفیف نامعتبر است" }, { status: 400 });
      }
      if (discountCodeRec.expiresAt && discountCodeRec.expiresAt < new Date()) {
        return NextResponse.json({ ok: false, message: "کد تخفیف منقضی شده است" }, { status: 400 });
      }
      if (discountCodeRec.maxUses > 0 && discountCodeRec.usedCount >= discountCodeRec.maxUses) {
        return NextResponse.json({ ok: false, message: "سقف استفاده از کد تخفیف تکمیل شده است" }, { status: 400 });
      }
      const r = applyDiscount(subtotal, { type: discountCodeRec.type as any, value: discountCodeRec.value });
      discount = r.discount;
    }
    const total = Math.max(0, subtotal - discount);

    if (total <= 0) {
      return NextResponse.json({ ok: false, message: "مبلغ سفارش نامعتبر است" }, { status: 400 });
    }

    // C4 fix: in production an unconfigured gateway must fail loudly,
    // not silently switch to demo payments.
    if (isDemoMode && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { ok: false, message: "درگاه پرداخت پیکربندی نشده است — لطفاً بعداً تلاش کنید" },
        { status: 503 }
      );
    }

    const orderCode = await generateOrderCode();
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

    // create order + items + reserve keys in ONE transaction with a
    // conditional claim per key (H2 fix: two buyers can never reserve the same key)
    const order = await db.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          code: orderCode,
          userId: session?.user?.id || null,
          guestEmail: customer.email || null,
          guestName: customer.name || null,
          guestPhone: customer.phone || null,
          status: "PENDING",
          total,
          discount,
          discountCode: couponCode || null,
          ip,
        },
      });

      for (const it of items) {
        const p = productMap.get(it.id)!;
        const item = await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: p.id,
            productTitle: p.title,
            productSlug: p.slug,
            price: it.price,
            quantity: it.quantity,
            duration: it.duration || p.duration || null,
          },
        });

        let isSupplierProduct = false;
        try {
          const specs = JSON.parse(p.specifications || "{}");
          isSupplierProduct = !!specs.supplier_product_id;
        } catch {}
        if (isSupplierProduct) continue;

        // atomic reservation: select candidates, then claim each with a
        // status-guarded update; any lost race throws and rolls back the order
        const candidates = await tx.licenseKey.findMany({
          where: { productId: p.id, status: "AVAILABLE" },
          take: it.quantity,
          select: { id: true },
        });
        if (candidates.length < it.quantity) {
          throw new Error(`موجودی «${p.title}» کافی نیست`);
        }
        for (const k of candidates) {
          const claim = await tx.licenseKey.updateMany({
            where: { id: k.id, status: "AVAILABLE", orderItemId: null },
            data: { status: "RESERVED", orderItemId: item.id },
          });
          if (claim.count !== 1) {
            throw new Error(`موجودی «${p.title}» به‌تازگی تغییر کرد`);
          }
        }
      }

      return order;
    });

    // zarinpal request (network call — kept OUTSIDE the transaction)
    const callbackUrl = `${getBaseUrl(req)}/api/checkout/verify`;
    const description = `سفارش ${orderCode} - ${items.length} محصول | لیسانس‌لَند`;
    const zres = await zarinpalRequest(total, description, callbackUrl, customer.email, customer.phone);

    if (!zres.ok || !zres.data) {
      // release reserved keys
      await db.licenseKey.updateMany({ where: { orderItem: { orderId: order.id } }, data: { status: "AVAILABLE", orderItemId: null } });
      await db.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
      return NextResponse.json({ ok: false, message: zres.error || "خطا در درگاه پرداخت" }, { status: 500 });
    }

    await db.order.update({ where: { id: order.id }, data: { zarinpalAuthority: zres.data.authority } });

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      orderCode,
      paymentUrl: zres.data.paymentUrl,
      demo: isDemoMode,
    });
  } catch (e: any) {
    // reservation races surface as user-friendly messages, not 500s
    if (e?.message?.includes("موجودی")) {
      return NextResponse.json({ ok: false, message: e.message }, { status: 409 });
    }
    console.error("checkout create error", e);
    return NextResponse.json({ ok: false, message: "خطای سرور" }, { status: 500 });
  }
}
