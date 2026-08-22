// ZarinPal payment gateway integration
// Docs: https://docs.zarinpal.com
// If ZARINPAL_MERCHANT is empty -> DEMO mode: simulate successful payment (for testing/preview)

const MERCHANT = process.env.ZARINPAL_MERCHANT || "";
const SANDBOX = process.env.ZARINPAL_SANDBOX === "true";

const BASE = SANDBOX
  ? "https://sandbox.zarinpal.com"
  : "https://api.zarinpal.com";

export const isDemoMode = !MERCHANT;

export interface ZarinPalRequestResult {
  authority: string;
  paymentUrl: string;
}

export interface ZarinPalVerifyResult {
  success: boolean;
  refId?: string;
  message: string;
}

// Create a payment request
export async function zarinpalRequest(
  amount: number, // in Toman (Rial = Toman * 10; ZarinPal accepts Rial)
  description: string,
  callbackUrl: string,
  email?: string,
  mobile?: string
): Promise<{ ok: boolean; data?: ZarinPalRequestResult; error?: string }> {
  // DEMO mode
  if (isDemoMode) {
    const authority = "DEMO" + Math.random().toString(36).slice(2, 12).toUpperCase();
    return {
      ok: true,
      data: {
        authority,
        paymentUrl: `/checkout/demo-pay?Authority=${authority}`,
      },
    };
  }

  try {
    const res = await fetch(`${BASE}/pg/v4/payment/request.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        merchant_id: MERCHANT,
        amount: amount * 10, // convert toman -> rial
        description,
        callback_url: callbackUrl,
        email,
        mobile,
      }),
    });
    const json = await res.json();
    const data = json?.data;
    if (json?.errors && json.errors.length) {
      return { ok: false, error: json.errors[0]?.message || "خطای درگاه پرداخت" };
    }
    if (data?.authority) {
      const gate = SANDBOX
        ? `https://sandbox.zarinpal.com/pg/StartPay/${data.authority}`
        : `https://www.zarinpal.com/pg/StartPay/${data.authority}`;
      return { ok: true, data: { authority: data.authority, paymentUrl: gate } };
    }
    return { ok: false, error: "پاسخ نامعتبر از درگاه" };
  } catch (e) {
    return { ok: false, error: "ارتباط با درگاه برقرار نشد" };
  }
}

// Verify a payment
export async function zarinpalVerify(
  amount: number,
  authority: string
): Promise<ZarinPalVerifyResult> {
  // DEMO mode — always succeed for demo authorities
  if (isDemoMode || authority.startsWith("DEMO")) {
    return {
      success: true,
      refId: "DEMO" + Math.floor(Math.random() * 90000000 + 10000000),
      message: "پرداخت با موفقیت انجام شد (حالت نمایشی)",
    };
  }

  try {
    const res = await fetch(`${BASE}/pg/v4/payment/verify.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        merchant_id: MERCHANT,
        amount: amount * 10,
        authority,
      }),
    });
    const json = await res.json();
    const data = json?.data;
    if (data?.code === 100 || data?.code === 101) {
      return {
        success: true,
        refId: String(data.ref_id || data.reference_id || ""),
        message: "پرداخت با موفقیت تأیید شد",
      };
    }
    return {
      success: false,
      message: json?.errors?.[0]?.message || "پرداخت تأیید نشد",
    };
  } catch (e) {
    return { success: false, message: "ارتباط با درگاه برقرار نشد" };
  }
}

// Map ZarinPal status -> money back if verify failed (unverified transaction)
export async function zarinpalUnverified(): Promise<void> {
  // optional: call /pg/v4/payment/unverified.json
  return;
}
