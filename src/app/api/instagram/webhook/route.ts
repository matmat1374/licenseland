import { NextResponse } from "next/server";
import crypto from "crypto";

const INSTAGRAM_BOT_URL = process.env.INSTAGRAM_BOT_URL || "http://localhost:8001";
const META_WEBHOOK_VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || "liceno_verify_token_stub";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === META_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: Request) {
  // Add signature verification stub here
  const body = await req.json();
  
  if (body.object === "instagram") {
    for (const entry of body.entry) {
      for (const messaging of entry.messaging) {
        if (messaging.message) {
          try {
            await fetch(`${INSTAGRAM_BOT_URL}/dm-webhook`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                message: messaging.message.text,
                sender_id: messaging.sender.id
              })
            });
          } catch (error) {
            console.error("Webhook processing error:", error);
          }
        }
      }
    }
    return NextResponse.json({ success: true });
  }
  return new NextResponse("Not Found", { status: 404 });
}
