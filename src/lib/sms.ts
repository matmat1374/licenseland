import { db } from "@/lib/db";

export async function sendOtpSms(phone: string, code: string): Promise<boolean> {
  let dbSettings: Record<string, string> = {};
  try {
    const rows = await db.setting.findMany({
      where: {
        key: {
          in: [
            "melipayamak_username",
            "melipayamak_api_key",
            "melipayamak_from",
            "melipayamak_pattern_id",
          ],
        },
      },
    });
    for (const r of rows) {
      dbSettings[r.key] = r.value;
    }
  } catch (err) {
    console.error("Failed to load SMS settings from db:", err);
  }

  const username =
    dbSettings["melipayamak_username"] ||
    process.env.MELIPAYAMAK_USERNAME ||
    "";

  const password =
    dbSettings["melipayamak_api_key"] ||
    process.env.MELIPAYAMAK_PASSWORD ||
    process.env.MELIPAYAMAK_API_KEY ||
    "";

  const from =
    dbSettings["melipayamak_from"] ||
    process.env.MELIPAYAMAK_FROM ||
    "";

  const patternId = (
    dbSettings["melipayamak_pattern_id"] ||
    process.env.MELIPAYAMAK_PATTERN_ID ||
    ""
  ).trim();

  if (!username || !password) {
    console.warn("MeliPayamak credentials are not set, skipping SMS.");
    return false;
  }

  try {
    let url: string;
    let payload: Record<string, any>;

    if (patternId) {
      url = "https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber";
      const numericBodyId = Number(patternId);
      payload = {
        username,
        password,
        text: code,
        to: phone,
        bodyId: isNaN(numericBodyId) ? patternId : numericBodyId,
      };
    } else {
      url = "https://rest.payamak-panel.com/api/SendSMS/SendSMS";
      const text = `لایسنو\nکد تایید شما: ${code}`;
      payload = {
        username,
        password,
        to: phone,
        from,
        text,
        isFlash: false,
      };
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || (data && data.RetStatus !== 1)) {
      console.error("MeliPayamak API error:", res.status, data);
      return false;
    }
    console.log(`SMS OTP sent successfully to ${phone}, Value: ${data?.Value}`);
    return true;
  } catch (error) {
    console.error("Failed to send OTP via MeliPayamak:", error);
    return false;
  }
}
