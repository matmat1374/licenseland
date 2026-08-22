import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupplierConfig, setSupplierConfig, generateSecret } from "@/lib/supplier";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN")
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });
  const cfg = await getSupplierConfig();
  // mask secrets
  return NextResponse.json({
    ok: true,
    config: {
      ...cfg,
      telegramBotToken: cfg.telegramBotToken ? "••••" + cfg.telegramBotToken.slice(-4) : "",
      apiKey: cfg.apiKey ? "••••" + cfg.apiKey.slice(-4) : "",
      webhookSecret: cfg.webhookSecret ? "••••" + cfg.webhookSecret.slice(-4) : "",
    },
  });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN")
    return NextResponse.json({ ok: false, message: "دسترسی غیرمجاز" }, { status: 403 });

  const body = await req.json();

  // if "regenerate_webhook_secret" flag, generate a new secret
  if (body.regenerate_webhook_secret) {
    body.webhookSecret = generateSecret();
  }

  // pull current to keep secrets if masked value sent
  const current = await getSupplierConfig();
  const merged = {
    enabled: body.enabled ?? current.enabled,
    mode: body.mode || current.mode,
    telegramBotToken: body.telegramBotToken && !body.telegramBotToken.startsWith("••••") ? body.telegramBotToken : current.telegramBotToken,
    telegramSupplierChatId: body.telegramSupplierChatId ?? current.telegramSupplierChatId,
    apiUrl: body.apiUrl ?? current.apiUrl,
    apiKey: body.apiKey && !body.apiKey.startsWith("••••") ? body.apiKey : current.apiKey,
    webhookSecret: body.webhookSecret && !body.webhookSecret.startsWith("••••") ? body.webhookSecret : current.webhookSecret,
    lowStockThreshold: Number(body.lowStockThreshold) || current.lowStockThreshold,
    autoRequest: body.autoRequest ?? current.autoRequest,
  };
  await setSupplierConfig(merged);
  return NextResponse.json({ ok: true, message: "تنظیمات ذخیره شد" });
}
