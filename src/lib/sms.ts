export async function sendOtpSms(phone: string, code: string) {
  const apiKey = process.env.MELIPAYAMAK_API_KEY;
  if (!apiKey) {
    console.warn("MeliPayamak API key is not set, skipping SMS.");
    return;
  }

  try {
    const res = await fetch("https://console.melipayamak.com/api/send/otp/" + apiKey, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to: phone, text: code }),
    });

    if (!res.ok) {
      console.error("MeliPayamak API error:", res.status, await res.text());
    } else {
      console.log(`SMS OTP sent successfully to ${phone}`);
    }
  } catch (error) {
    console.error("Failed to send OTP via MeliPayamak:", error);
  }
}
