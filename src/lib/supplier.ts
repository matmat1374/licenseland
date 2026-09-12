// Supplier integration core
// Supports two modes:
// 1) OUTBOUND: we call the supplier's API/Telegram bot to request license keys
// 2) INBOUND: the supplier pushes license keys to our webhook (/api/supplier/webhook)
//
// Configuration is read from DB Setting table (editable in admin) with env fallbacks.

import { db } from "@/lib/db";
import { calculateSellPrice, loadPricingTiers } from "@/lib/pricing-calculator";
import { sealKey, openKey } from "@/lib/licenses";
import { IrMarketClient } from "@kernel/supplier/provider";
import { CircuitBreaker, systemClock } from "@kernel/supplier/resilience";

// irMarket API base URL — configurable via env for testing/alternative endpoints.
// Declared at top so it's available to all functions below.
const IRMARKET_BASE_URL = process.env.SUPPLIER_API_URL?.replace(/\/api\/buyer\/.*$/, "") ||
  process.env.IRMARKET_BASE_URL ||
  "https://api.irmarket.store";

let _supplierClient: IrMarketClient | null = null;
const globalBreaker = new CircuitBreaker({ failureThreshold: 5, openMs: 30000, clock: systemClock });

async function getSupplierClient(): Promise<IrMarketClient | null> {
  if (_supplierClient) return _supplierClient;
  const key = await getSupplierApiKey();
  if (!key) return null;
  
  _supplierClient = new IrMarketClient({
    baseUrl: IRMARKET_BASE_URL,
    apiKey: key,
    fetchImpl: fetch as any,
    clock: systemClock,
    timeoutMs: 10000,
    attempts: 3,
    log: (ev) => console.log(`[Supplier] ${ev.level}: ${ev.message}`, ev.data),
    breaker: globalBreaker,
  });
  return _supplierClient;
}

// ----------------------------- Config -----------------------------

export interface SupplierConfig {
  enabled: boolean;
  mode: "telegram" | "api" | "manual"; // telegram = send order via bot; api = HTTP call; manual = only log
  telegramBotToken: string;
  telegramSupplierChatId: string;
  apiUrl: string; // supplier's REST endpoint (POST) for requesting keys
  apiKey: string; // bearer/api-key sent to supplier on outbound requests
  webhookSecret: string; // secret the supplier must send on inbound webhook (X-Supplier-Key header)
  lowStockThreshold: number; // auto-request when stock drops below this
  autoRequest: boolean; // automatically send request to supplier on low stock
}

const DEFAULTS: SupplierConfig = {
  enabled: false,
  mode: "telegram",
  telegramBotToken: "",
  telegramSupplierChatId: "",
  apiUrl: "",
  apiKey: "",
  webhookSecret: "",
  lowStockThreshold: 3,
  autoRequest: false,
};

export async function getSupplierConfig(): Promise<SupplierConfig> {
  const rows = await db.setting.findMany({
    where: {
      key: {
        in: [
          "supplier_enabled",
          "supplier_mode",
          "supplier_telegram_bot_token",
          "supplier_telegram_chat_id",
          "supplier_api_url",
          "supplier_api_key",
          "supplier_webhook_secret",
          "supplier_low_stock_threshold",
          "supplier_auto_request",
        ],
      },
    },
  });
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;

  return {
    ...DEFAULTS,
    enabled: map.supplier_enabled === "true",
    mode: (map.supplier_mode as any) || "telegram",
    telegramBotToken: map.supplier_telegram_bot_token || process.env.TELEGRAM_BOT_TOKEN || "",
    telegramSupplierChatId: map.supplier_telegram_chat_id || process.env.TELEGRAM_SUPPLIER_CHAT_ID || "",
    apiUrl: map.supplier_api_url || "",
    apiKey: map.supplier_api_key || "",
    webhookSecret: map.supplier_webhook_secret || "",
    lowStockThreshold: Number(map.supplier_low_stock_threshold) || 3,
    autoRequest: map.supplier_auto_request === "true",
  };
}

export async function setSupplierConfig(cfg: Partial<SupplierConfig>): Promise<void> {
  const entries: { key: string; value: string }[] = [
    { key: "supplier_enabled", value: String(cfg.enabled ?? false) },
    { key: "supplier_mode", value: cfg.mode || "telegram" },
    { key: "supplier_telegram_bot_token", value: cfg.telegramBotToken || "" },
    { key: "supplier_telegram_chat_id", value: cfg.telegramSupplierChatId || "" },
    { key: "supplier_api_url", value: cfg.apiUrl || "" },
    { key: "supplier_api_key", value: cfg.apiKey || "" },
    { key: "supplier_webhook_secret", value: cfg.webhookSecret || "" },
    { key: "supplier_low_stock_threshold", value: String(cfg.lowStockThreshold ?? 3) },
    { key: "supplier_auto_request", value: String(cfg.autoRequest ?? false) },
  ];
  for (const e of entries) {
    await db.setting.upsert({
      where: { key: e.key },
      create: { key: e.key, value: e.value },
      update: { value: e.value },
    });
  }
}

import { randomBytes } from "crypto";

// Generate a random webhook secret if none set
export function generateSecret(): string {
  return "sk_live_" + randomBytes(24).toString("hex");
}

// ----------------------------- Logging -----------------------------

export async function logSupplier(
  supplierOrderId: string | null,
  action: string,
  status: "INFO" | "SUCCESS" | "ERROR",
  payload: any,
  message?: string
) {
  await db.supplierLog.create({
    data: {
      supplierOrderId,
      action,
      status,
      payload: JSON.stringify(payload).slice(0, 4000),
      message: message?.slice(0, 500),
    },
  });
}

// ----------------------------- Outbound: request keys from supplier -----------------------------

export async function requestLicenseFromSupplier(
  productId: string,
  quantity: number,
  requestedById?: string,
  note?: string
): Promise<{ ok: boolean; supplierOrderId?: string; message: string }> {
  const cfg = await getSupplierConfig();
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return { ok: false, message: "محصول یافت نشد" };

  // create supplier order
  const { randomBytes } = await import("crypto");
  const randomPart = randomBytes(4).toString("hex").toUpperCase();
  const datePart = new Date().toISOString().slice(0,10).replace(/-/g,"");
  const code = `SO-${datePart}-${randomPart}`;
  const so = await db.supplierOrder.create({
    data: {
      code,
      productId,
      productTitle: product.title,
      quantity,
      status: "PENDING",
      direction: "OUTBOUND",
      requestedById: requestedById || null,
      note: note || null,
    },
  });

  await logSupplier(so.id, "request_created", "INFO", { productId, quantity, code }, "درخواست ایجاد شد");

  if (!cfg.enabled) {
    await db.supplierOrder.update({ where: { id: so.id }, data: { status: "PENDING" } });
    await logSupplier(so.id, "supplier_disabled", "INFO", {}, "ادغام تأمین‌کننده غیرفعال است — در انتظار فعال‌سازی");
    return { ok: true, supplierOrderId: so.id, message: "درخواست ثبت شد (ادغام غیرفعال — به‌صورت دستی کلیدها را اضافه کنید)" };
  }

  try {
    if (cfg.mode === "telegram") {
      await sendTelegramRequest(cfg, so, product, quantity);
    } else if (cfg.mode === "api") {
      await sendApiRequest(cfg, so, product, quantity);
    } else {
      // manual mode — just record
      await logSupplier(so.id, "manual_mode", "INFO", {}, "حالت دستی: منتظر افزودن کلید توسط ادمین");
      return { ok: true, supplierOrderId: so.id, message: "درخواست ثبت شد (حالت دستی)" };
    }
    await logSupplier(so.id, "request_sent", "SUCCESS", { mode: cfg.mode }, "درخواست به تأمین‌کننده ارسال شد");
    return { ok: true, supplierOrderId: so.id, message: "درخواست به تأمین‌کننده ارسال شد" };
  } catch (e: any) {
    await db.supplierOrder.update({ where: { id: so.id }, data: { status: "FAILED" } });
    await logSupplier(so.id, "request_error", "ERROR", { error: e?.message }, e?.message || "خطا در ارسال درخواست");
    return { ok: false, supplierOrderId: so.id, message: "خطا در ارسال به تأمین‌کننده — درخواست ثبت شد ولی ناموفق بود" };
  }
}

async function sendTelegramRequest(cfg: SupplierConfig, so: any, product: any, quantity: number) {
  if (!cfg.telegramBotToken || !cfg.telegramSupplierChatId)
    throw new Error("توکن بات یا چت‌آیدی تأمین‌کننده تنظیم نشده");

  const text = [
    "🔔 *درخواست تأمین لایسنس جدید*",
    "",
    `📦 محصول: *${product.title}*`,
    `🔢 تعداد درخواستی: *${quantity}*`,
    `🏷️ کد درخواست: \`${so.code}\``,
    `🆔 شناسه: \`${so.id}\``,
    "",
    "لطفاً کلیدهای لایسنس را از طریق وب‌هوک ارسال کنید:",
    "`POST /api/supplier/webhook`",
    "با هدر `X-Supplier-Key` و بدنه:",
    "```json",
    JSON.stringify({ supplierOrderId: so.id, productId: product.id, keys: [{ key: "XXX-XXX", note: "اختیاری" }] }, null, 2),
    "```",
  ].join("\n");

  const res = await fetch(
    `https://api.telegram.org/bot${cfg.telegramBotToken}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: cfg.telegramSupplierChatId,
        text,
        parse_mode: "Markdown",
      }),
    }
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Telegram API error: ${res.status} ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  await db.supplierOrder.update({
    where: { id: so.id },
    data: { supplierRef: String(data?.result?.message_id || "") },
  });
}

async function sendApiRequest(cfg: SupplierConfig, so: any, product: any, quantity: number) {
  if (!cfg.apiUrl) throw new Error("آدرس API تأمین‌کننده تنظیم نشده");

  const res = await fetch(cfg.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
      "X-Supplier-Key": cfg.apiKey,
    },
    body: JSON.stringify({
      supplierOrderId: so.id,
      productId: product.id,
      productTitle: product.title,
      quantity,
      callbackUrl: `${process.env.NEXTAUTH_URL || ""}/api/supplier/webhook`,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Supplier API error: ${res.status} ${t.slice(0, 200)}`);
  }
  const data = await res.json().catch(() => ({}));
  if (data?.supplierRef) {
    await db.supplierOrder.update({ where: { id: so.id }, data: { supplierRef: String(data.supplierRef) } });
  }
}

// ----------------------------- Inbound: webhook receiver -----------------------------
// Called by /api/supplier/webhook when supplier pushes license keys.
export async function receiveSupplierKeys(
  supplierOrderId: string | null,
  productId: string,
  keys: { key: string; note?: string }[],
  rawPayload: any
): Promise<{ ok: boolean; added: number; message: string }> {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return { ok: false, added: 0, message: "محصول یافت نشد" };

  let so: any = null;
  if (supplierOrderId) {
    so = await db.supplierOrder.findUnique({ where: { id: supplierOrderId } });
  }
  // if no supplierOrder, create an INBOUND one to track
  if (!so) {
    const { randomBytes } = await import("crypto");
    const randomPart = randomBytes(4).toString("hex").toUpperCase();
    const datePart = new Date().toISOString().slice(0,10).replace(/-/g,"");
    const code = `SO-${datePart}-${randomPart}`;
    so = await db.supplierOrder.create({
      data: {
        code,
        productId,
        productTitle: product.title,
        quantity: keys.length,
        status: "PENDING",
        direction: "INBOUND",
        note: "تحویل از وب‌هوک تأمین‌کننده",
      },
    });
  }

  let added = 0;
  for (const k of keys) {
    if (!k.key || !k.key.trim()) continue;
    const plaintext = k.key.trim();
    // avoid duplicates — compare by opening existing keys of this product
    // (stored keys are sealed, so a plaintext equality query would never match)
    const existing = await db.licenseKey.findMany({
      where: { productId },
      select: { key: true },
    });
    const dup = existing.some((row) => {
      try {
        return openKey(productId, row.key) === plaintext;
      } catch {
        return false;
      }
    });
    if (dup) continue;
    await db.licenseKey.create({
      data: {
        productId,
        key: sealKey(productId, plaintext),
        note: k.note || null,
        status: "AVAILABLE",
        source: "supplier_api",
        supplierOrderId: so.id,
      },
    });
    added++;
  }

  // refresh product stock
  const available = await db.licenseKey.count({ where: { productId, status: "AVAILABLE" } });
  await db.product.update({ where: { id: productId }, data: { stock: available } });

  // mark supplier order fulfilled
  await db.supplierOrder.update({
    where: { id: so.id },
    data: { status: "FULFILLED", fulfilledAt: new Date() },
  });

  await logSupplier(so.id, "keys_received", "SUCCESS", { added, total: keys.length, rawPayload }, `${added} کلید دریافت و به انبار اضافه شد`);

  return { ok: true, added, message: `${added} کلید لایسنس به انبار اضافه شد` };
}

// ----------------------------- Auto low-stock check -----------------------------

export async function checkLowStockAndNotify(): Promise<{ checked: number; requested: number }> {
  const cfg = await getSupplierConfig();
  if (!cfg.autoRequest) return { checked: 0, requested: 0 };

  const threshold = cfg.lowStockThreshold;
  const products = await db.product.findMany({ where: { isActive: true } });
  let requested = 0;
  for (const p of products) {
    const available = await db.licenseKey.count({ where: { productId: p.id, status: "AVAILABLE" } });
    if (available <= threshold) {
      const pending = await db.supplierOrder.findFirst({
        where: { productId: p.id, status: "PENDING", direction: "OUTBOUND" },
      });
      if (!pending) {
        const qty = Math.max(5, threshold * 2);
        await requestLicenseFromSupplier(p.id, qty, undefined, `سفارش خودکار - موجودی کم (${available})`);
        requested++;
      }
    }
  }
  return { checked: products.length, requested };
}

// ----------------------------- Import products from supplier API -----------------------------
// Supports irMarket API (https://api.irmarket.store) and generic JSON APIs.
// irMarket products have: id, name, retail_usd, price_usd, discount_percent, etc.
// Prices are in USD → converted to Toman using USD_TO_TOMAN rate, then markup applied.

export interface SupplierProduct {
  id?: number | string;
  title?: string;
  name?: string;
  slug?: string;
  price?: number;
  basePrice?: number;
  cost?: number;
  price_usd?: number;
  retail_usd?: number;
  discount_percent?: number;
  description?: string;
  shortDesc?: string;
  features?: string[] | string;
  category?: string;
  brand?: string;
  duration?: string;
  duration_days?: number;
  tags?: string;
  image?: string;
  imageUrl?: string;
  images?: string[];
  stock?: number | boolean;
  in_stock?: number | boolean;
  pricing_unit?: string;
  min_qty?: number;
  max_qty?: number;
  requires_email?: boolean;
  requires_link?: boolean;
  [key: string]: any;
}

// USD to Toman conversion rate (configurable in admin settings, default ~60000)

export function isVpnProduct(text: string): boolean {
  return /vpn|nordvpn|expressvpn|surfshark|hma|hidemyass|hide\s*my\s*ass|ipvanish|cyberghost|protonvpn|mullvad|windscribe|tunnelbear|purevpn|adguard\s*vpn|pia\s*vpn|v2ray|shadowsocks|wireguard|openvpn|outline|warp|psiphon|فیلترشکن|وی\s*پی\s*ان/i.test(text);
}

export async function fetchLiveUsdtRate(): Promise<number | null> {
  try {
    const res = await fetch("https://api.nobitex.ir/market/stats?srcCurrency=usdt&dstCurrency=rls", {
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      const rls = Number(data?.stats?.["usdt-rls"]?.latest);
      let rate = Math.round(rls / 10);
      if (!rate || isNaN(rate) || rate < 100000 || rate > 500000 || rate === 95000) {
        rate = 220000;
      }
      if (rate > 50000 && rate < 1000000) {
        await db.setting.upsert({
          where: { key: "usd_to_toman_rate_auto" },
          create: { key: "usd_to_toman_rate_auto", value: String(rate) },
          update: { value: String(rate) },
        });
        return rate;
      }
    }
  } catch (e) {}

  try {
    const res = await fetch("https://api.wallex.ir/v1/markets", {
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      let rate = Math.round(Number(data?.result?.symbols?.USDTTMN?.stats?.lastPrice));
      if (!rate || isNaN(rate) || rate < 100000 || rate > 500000 || rate === 95000) {
        rate = 220000;
      }
      if (rate > 50000 && rate < 1000000) {
        await db.setting.upsert({
          where: { key: "usd_to_toman_rate_auto" },
          create: { key: "usd_to_toman_rate_auto", value: String(rate) },
          update: { value: String(rate) },
        });
        return rate;
      }
    }
  } catch (e) {}

  const s = await db.setting.findUnique({ where: { key: "usd_to_toman_rate_auto" } }).catch(() => null);
  return Number(s?.value) || null;
}

export async function getUsdToTomanRate(): Promise<number> {
  try {
    const { fetchLiveUsdtRate } = await import('./live-repricer');
    const liveRate = await fetchLiveUsdtRate();
    if (liveRate && liveRate > 40000) return liveRate;
  } catch (e) {
    console.error('Failed to get live rate:', e);
  }
  
  const s = await db.setting.findUnique({ where: { key: 'usd_to_toman_rate' } }).catch(() => null);
  return Number(s?.value) || 220000;
}


// Get supplier API key from DB settings (falls back to env)
export async function getSupplierApiKey(): Promise<string> {
  const s = await db.setting.findUnique({ where: { key: "supplier_api_key" } }).catch(() => null);
  return s?.value || process.env.SUPPLIER_API_KEY || "";
}

function pickPriceUSD(p: SupplierProduct): number | null {
  // irMarket: price_usd is what we pay; retail_usd is public price
  const v: any = p.price_usd ?? p.retail_usd ?? p.price ?? p.basePrice ?? p.cost;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^\d.]/g, ""));
    if (!isNaN(n) && n > 0) return n;
  }
  return null;
}

function pickTitle(p: SupplierProduct): string {
  let title = (p.title || p.name || "").toString().trim();
  if (/^(Openai|ChatGPT|Claude|Telegram|WhatsApp|Google|Apple|Discord)\s*—/i.test(title) && !title.includes("شماره مجازی")) {
    title = `شماره مجازی وریفای ${title} (دریافت پیامک)`;
  }
  return title;
}

function pickDescription(p: SupplierProduct): string {
  return (p.description || p.shortDesc || p.short_description || p.desc || "").toString();
}

export function localizeProduct(name: string, category: string, sp?: any): { title: string; shortDesc: string; description: string } {
  let shortDesc = name.trim();
  if (sp && (sp.name || sp.title)) {
    shortDesc = (sp.name || sp.title).toString().trim();
  }
  let t = (sp?.name || sp?.title || name).toString().trim();

  // Helper for Persian numbers
  const normalizePersianNumbers = (str: string) => {
    return str.replace(/0/g, '۰').replace(/1/g, '۱').replace(/2/g, '۲').replace(/3/g, '۳')
              .replace(/4/g, '۴').replace(/5/g, '۵').replace(/6/g, '۶').replace(/7/g, '۷')
              .replace(/8/g, '۸').replace(/9/g, '۹');
  };

  // Specific check: Product 364 (Gemini AI Pro 18 Month)
  if (sp?.id == 364 || (/gemini/i.test(t) && /18\s*month/i.test(t))) {
    const title = "Gemini AI Pro (۱۸ ماهه)";
    const description = `## Gemini AI Pro (۱۸ ماهه)\n\nاشتراک رسمی و قانونی Gemini AI Pro گوگل به همراه ۵ ترابایت فضای ابری Google One با فعال‌سازی آنی.\n\n### مشخصات و امکانات\n- **سرویس:** Google Gemini AI Pro + 5TB Cloud Storage\n- **مدت اشتراک:** ۱۸ ماهه\n- **تحویل:** فوری پس از پرداخت\n- فعال‌سازی مستقیم روی اکانت جیمیل شخصی بدون نیاز به کارت بانکی\n- دسترسی کامل به پیشرفته‌ترین مدل هوش مصنوعی گوگل (Gemini 1.5 Pro / Ultra)\n- ۵ ترابایت فضای ابری جهت استفاده در Google Drive، Photos و Gmail\n- گارانتی و ضمانت اصالت و سلامت فعال‌سازی\n- پشتیبانی ۲۴ ساعته\n`;
    return { title, shortDesc, description };
  }

  // SMM Services
  if (sp && sp.category === 'سرویس های SMM') {
    const finalTitle = name.trim();
    return {
      title: finalTitle,
      shortDesc,
      description: `## ${finalTitle}\n\nسرویس شبکه‌های اجتماعی اوریجینال با تحویل خودکار و پشتیبانی ۲۴ ساعته.\n\n### مشخصات\n- **نام اصلی:** ${shortDesc}\n- تحویل سریع پس از پرداخت\n- پشتیبانی فعال\n`
    };
  }

  // Virtual Numbers
  const isVirtualNumber = /^(Openai|ChatGPT|Claude|Telegram|WhatsApp|Google|Apple|Discord)\s*—/i.test(t) || t.includes("شماره مجازی") || t.includes("شماره") || category === "virtual-numbers";
  if (isVirtualNumber) {
    let brand = "OpenAI";
    let country = "";
    const match = t.match(/^(Openai|ChatGPT|Claude|Telegram|WhatsApp|Google|Apple|Discord)\s*—\s*(.*)$/i);
    if (match) {
      brand = match[1];
      country = match[2].trim();
    } else {
      const matchBrand = t.match(/(Openai|ChatGPT|Claude|Telegram|WhatsApp|Google|Apple|Discord)/i);
      brand = matchBrand ? matchBrand[1] : (t.toLowerCase().includes("chatgpt") ? "ChatGPT" : "OpenAI");
      country = t.replace(/(Openai|ChatGPT|Claude|Telegram|WhatsApp|Google|Apple|Discord|شماره مجازی وریفای|شماره مجازی|شماره|دریافت پیامک|\(|\)|—|-)/ig, "").trim();
    }
    
    let brandFa = brand;
    if (/openai|chatgpt/i.test(brand)) brandFa = "چت‌جی‌پی‌تی OpenAI";
    else if (/claude/i.test(brand)) brandFa = "کلود Claude";
    else if (/apple/i.test(brand)) brandFa = "اپل Apple";
    else if (/telegram/i.test(brand)) brandFa = "تلگرام Telegram";
    
    const title = `شماره مجازی فعالسازی ${brandFa} (${country})`;
    const description = `> ⚠️ **توجه مهم — این محصول شماره مجازی است، نه اکانت یا اشتراک:**\n> این سرویس صرفاً یک **شماره تلفن موقت** جهت دریافت پیامک کد تایید (SMS OTP) برای ساخت یا فعالسازی حساب کاربری در ${brand} است.\n\n## ${title}\n\nشماره مجازی معتبر جهت وریفای سرویس.\n\n### مشخصات\n- **نام اصلی و فنی:** ${shortDesc}\n- دریافت آنی پیامک\n- اختصاصی و امن\n- گارانتی فعال‌سازی\n`;
    return { title, shortDesc, description };
  }

  // Clean raw supplier artifacts: warranty notes, emojis, internal codes
  let cleanName = t;
  cleanName = cleanName.replace(/\s*[\-\|—]?\s*(full\s+warranty|warranty\s*\d*[hd]?|w\d+[mhd]?|no\s+warranty|with\s+warranty|guaranteed?)\b/ig, '');
  cleanName = cleanName.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
  cleanName = cleanName.replace(/\s*[\-\|]\s*antigravity/ig, '');
  cleanName = cleanName.replace(/\[(slot|private|shared)\]/ig, '');

  // Extract duration
  let durationFa = '';
  if (/\b18\s*(months?|m)\b/i.test(cleanName)) { durationFa = '۱۸ ماهه'; cleanName = cleanName.replace(/\b18\s*(months?|m)\b/ig, ''); }
  else if (/\b12\s*(months?|m)\b|\b1\s*(year|y)\b/i.test(cleanName)) { durationFa = '۱ ساله'; cleanName = cleanName.replace(/\b12\s*(months?|m)\b|\b1\s*(year|y)\b/ig, ''); }
  else if (/\b6\s*(months?|m)\b/i.test(cleanName)) { durationFa = '۶ ماهه'; cleanName = cleanName.replace(/\b6\s*(months?|m)\b/ig, ''); }
  else if (/\b3\s*(months?|m)\b/i.test(cleanName)) { durationFa = '۳ ماهه'; cleanName = cleanName.replace(/\b3\s*(months?|m)\b/ig, ''); }
  else if (/\b2\s*(months?|m)\b/i.test(cleanName)) { durationFa = '۲ ماهه'; cleanName = cleanName.replace(/\b2\s*(months?|m)\b/ig, ''); }
  else if (/\b1\s*(month|m)\b/i.test(cleanName)) { durationFa = '۱ ماهه'; cleanName = cleanName.replace(/\b1\s*(month|m)\b/ig, ''); }
  else if (/\b(1|one)\s*days?\b|\b24h\b/i.test(cleanName)) { durationFa = '۱ روزه'; cleanName = cleanName.replace(/\b(1|one)\s*days?\b|\b24h\b/ig, ''); }
  else if (/\b(\d+)\s*days?\b/i.test(cleanName)) {
    const dMatch = cleanName.match(/\b(\d+)\s*days?\b/i);
    if (dMatch) { durationFa = normalizePersianNumbers(dMatch[1]) + ' روزه'; cleanName = cleanName.replace(/\b(\d+)\s*days?\b/ig, ''); }
  }

  // Clean trailing/leading delimiters
  cleanName = cleanName.replace(/[\-\|—:]+\s*$/g, '').replace(/^\s*[\-\|—:]+/g, '').replace(/\s{2,}/g, ' ').trim();

  // Well-known product brand cleanings
  let finalTitle = cleanName;
  if (/chatgpt plus/i.test(t)) {
    finalTitle = "ChatGPT Plus";
  } else if (/claude/i.test(t) && !/otp|virtual/i.test(t)) {
    if (/team/i.test(t)) finalTitle = "Claude Team";
    else finalTitle = "Claude Pro";
  } else if (/midjourney/i.test(t)) {
    if (/standard/i.test(t)) finalTitle = "Midjourney Standard";
    else if (/pro/i.test(t)) finalTitle = "Midjourney Pro";
    else if (/mega/i.test(t)) finalTitle = "Midjourney Mega";
    else finalTitle = "Midjourney";
  } else if (/canva pro/i.test(t)) {
    finalTitle = "Canva Pro";
  } else if (/spotify/i.test(t)) {
    finalTitle = "Spotify Premium";
  } else if (/netflix/i.test(t)) {
    finalTitle = "Netflix 4K Ultra HD";
  } else if (/youtube premium/i.test(t)) {
    finalTitle = "YouTube Premium";
  } else if (/discord nitro/i.test(t)) {
    finalTitle = "Discord Nitro";
  } else if (/cursor/i.test(t)) {
    if (/cursor pro/i.test(t)) finalTitle = "Cursor Pro";
  } else if (/windsurf/i.test(t)) {
    if (/windsurf pro/i.test(t)) finalTitle = "Windsurf Pro";
  } else if (/adobe/i.test(t)) {
    if (/creative cloud/i.test(t)) finalTitle = "Adobe Creative Cloud Pro";
    else if (/express/i.test(t)) finalTitle = "Adobe Express";
  }

  if (durationFa && !finalTitle.includes(durationFa)) {
    finalTitle = `${finalTitle} (${durationFa})`;
  }

  finalTitle = finalTitle.replace(/\s{2,}/g, ' ').trim();

  const description = `## ${finalTitle}\n\nمحصول اوریجینال و قانونی با تحویل آنی و پشتیبانی ۲۴ ساعته.\n\n### مشخصات\n- **نام اصلی و فنی:** ${shortDesc}\n- ضمانت اصالت و سلامت فعال‌سازی\n- خرید امن و تحویل فوری پس از پرداخت\n- پشتیبانی فعال\n`;

  return { title: finalTitle, shortDesc, description };
}

function slugifyFa(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export const CATEGORIES_META: Record<string, string> = {
  ai: "هوش مصنوعی",
  "virtual-numbers": "شماره مجازی و OTP",
  "dev-tools": "ابزارهای توسعه و برنامه‌نویسی",
  design: "طراحی و گرافیک",
  streaming: "استریم و سرگرمی",
  gaming: "گیمینگ و گیفت‌کارت",
  productivity: "نرم‌افزار و بهره‌وری",
  social: "شبکه‌های اجتماعی",
};

export const STANDARD_CATEGORIES = [
  {
    name: "هوش مصنوعی",
    slug: "ai",
    description: "اشتراک و اکانت قانونی ChatGPT، Claude، Midjourney و هوش‌های مصنوعی پیشرفته",
    icon: "Sparkles",
    color: "from-emerald-500 to-teal-600",
    sortOrder: 1,
  },
  {
    name: "شماره مجازی و OTP",
    slug: "virtual-numbers",
    description: "شماره‌های مجازی اختصاصی جهت دریافت پیامک تایید تلگرام، OpenAI، Claude و سرویس‌های خارجی",
    icon: "Smartphone",
    color: "from-teal-500 to-cyan-600",
    sortOrder: 2,
  },
  {
    name: "ابزارهای توسعه و برنامه‌نویسی",
    slug: "dev-tools",
    description: "Cursor Pro، Windsurf، GitHub Copilot و انواع توکن و کردیت API",
    icon: "Code2",
    color: "from-blue-500 to-indigo-600",
    sortOrder: 3,
  },
  {
    name: "طراحی و گرافیک",
    slug: "design",
    description: "لایسنس و اشتراک Canva Pro، Adobe Creative Cloud، Figma و ابزارهای ویدیویی",
    icon: "PenTool",
    color: "from-purple-500 to-pink-600",
    sortOrder: 4,
  },
  {
    name: "استریم و سرگرمی",
    slug: "streaming",
    description: "اکانت پریمیوم Spotify، Netflix، YouTube Premium و سرویس‌های فیلم و موسیقی",
    icon: "Play",
    color: "from-rose-500 to-pink-600",
    sortOrder: 5,
  },
  {
    name: "گیمینگ و گیفت‌کارت",
    slug: "gaming",
    description: "Discord Nitro، گیفت‌کارت PSN، Google Play، PUBG UC و CoD CP",
    icon: "Gamepad2",
    color: "from-violet-500 to-fuchsia-600",
    sortOrder: 6,
  },
  {
    name: "نرم‌افزار و بهره‌وری",
    slug: "productivity",
    description: "لایسنس آفیس ۳۶۵، ویندوز، گرامرلی، نوشن و ابزارهای سازمانی",
    icon: "LayoutGrid",
    color: "from-amber-500 to-orange-600",
    sortOrder: 7,
  },
  {
    name: "شبکه‌های اجتماعی",
    slug: "social",
    description: "تلگرام استارز، تلگرام پریمیوم، ممبر و خدمات شبکه‌های اجتماعی",
    icon: "Share2",
    color: "from-sky-500 to-blue-600",
    sortOrder: 8,
  },
];

export interface ProductRankingInfo {
  sortOrder: number;
  bestseller: boolean;
  featured: boolean;
  salesCount: number;
}

export function getProductRankingInfo(p: SupplierProduct, title: string, catSlug: string): ProductRankingInfo {
  const t = (title || "").toLowerCase();
  const rawTitle = (p.title || p.name || "").toLowerCase();
  const comb = `${t} ${rawTitle}`;

  // Top Priority Bestsellers & Featured per Category
  if (catSlug === "ai") {
    if (/chatgpt|gpt[- ]?plus|gpt[- ]?4/i.test(comb)) {
      return { sortOrder: 1, bestseller: true, featured: true, salesCount: 480 };
    }
    if (/claude/i.test(comb) && !/otp|virtual/i.test(comb)) {
      return { sortOrder: 2, bestseller: true, featured: true, salesCount: 420 };
    }
    if (/midjourney|میدجرنی/i.test(comb)) {
      return { sortOrder: 3, bestseller: true, featured: true, salesCount: 390 };
    }
    if (/perplexity|پرپلکسیتی/i.test(comb)) {
      return { sortOrder: 4, bestseller: true, featured: true, salesCount: 310 };
    }
    if (/runway|kling|luma/i.test(comb)) {
      return { sortOrder: 5, bestseller: false, featured: true, salesCount: 260 };
    }
    if (/veo|elevenlabs/i.test(comb)) {
      return { sortOrder: 6, bestseller: false, featured: true, salesCount: 240 };
    }
    if (/gemini|جمینی|جمنای/i.test(comb)) {
      return { sortOrder: 3, bestseller: true, featured: true, salesCount: 395 };
    }
    if (/grok/i.test(comb)) {
      return { sortOrder: 7, bestseller: false, featured: true, salesCount: 210 };
    }
  }

  if (catSlug === "virtual-numbers") {
    if (/telegram|تلگرام/i.test(comb)) {
      return { sortOrder: 1, bestseller: true, featured: true, salesCount: 520 };
    }
    if (/openai|chatgpt/i.test(comb)) {
      return { sortOrder: 2, bestseller: true, featured: true, salesCount: 490 };
    }
    if (/claude/i.test(comb)) {
      return { sortOrder: 3, bestseller: true, featured: true, salesCount: 360 };
    }
    if (/whatsapp|apple|google/i.test(comb)) {
      return { sortOrder: 4, bestseller: false, featured: true, salesCount: 280 };
    }
  }

  if (catSlug === "dev-tools") {
    if (/cursor/i.test(comb)) {
      return { sortOrder: 1, bestseller: true, featured: true, salesCount: 450 };
    }
    if (/windsurf/i.test(comb)) {
      return { sortOrder: 2, bestseller: true, featured: true, salesCount: 380 };
    }
    if (/copilot/i.test(comb)) {
      return { sortOrder: 3, bestseller: true, featured: true, salesCount: 340 };
    }
    if (/api.*(openai|claude|codex)|token.*claude/i.test(comb)) {
      return { sortOrder: 4, bestseller: true, featured: true, salesCount: 310 };
    }
    if (/lovable|lovabe|supabase|railway/i.test(comb)) {
      return { sortOrder: 5, bestseller: false, featured: true, salesCount: 230 };
    }
  }

  if (catSlug === "design") {
    if (/canva|کنوا|کانوا/i.test(comb)) {
      return { sortOrder: 1, bestseller: true, featured: true, salesCount: 510 };
    }
    if (/adobe|creative cloud|photoshop|illustrator/i.test(comb)) {
      return { sortOrder: 2, bestseller: true, featured: true, salesCount: 430 };
    }
    if (/figma|فیگما/i.test(comb)) {
      return { sortOrder: 3, bestseller: true, featured: true, salesCount: 350 };
    }
    if (/capcut|کپ‌کات/i.test(comb)) {
      return { sortOrder: 4, bestseller: true, featured: true, salesCount: 320 };
    }
    if (/freepik|envato/i.test(comb)) {
      return { sortOrder: 5, bestseller: false, featured: true, salesCount: 240 };
    }
  }

  if (catSlug === "streaming") {
    if (/spotify|اسپاتیفای/i.test(comb)) {
      return { sortOrder: 1, bestseller: true, featured: true, salesCount: 540 };
    }
    if (/netflix|نتفلیکس/i.test(comb)) {
      return { sortOrder: 2, bestseller: true, featured: true, salesCount: 510 };
    }
    if (/youtube/i.test(comb)) {
      return { sortOrder: 3, bestseller: true, featured: true, salesCount: 460 };
    }
    if (/apple music|disney/i.test(comb)) {
      return { sortOrder: 4, bestseller: false, featured: true, salesCount: 260 };
    }
  }

  if (catSlug === "gaming") {
    if (/discord nitro|nitro/i.test(comb)) {
      return { sortOrder: 1, bestseller: true, featured: true, salesCount: 490 };
    }
    if (/playstation|psn/i.test(comb)) {
      return { sortOrder: 2, bestseller: true, featured: true, salesCount: 380 };
    }
    if (/google play/i.test(comb)) {
      return { sortOrder: 3, bestseller: true, featured: true, salesCount: 340 };
    }
    if (/pubg|\buc\b/i.test(comb)) {
      return { sortOrder: 4, bestseller: true, featured: true, salesCount: 320 };
    }
    if (/\bcp\b|call of duty/i.test(comb)) {
      return { sortOrder: 5, bestseller: true, featured: true, salesCount: 290 };
    }
  }

  if (catSlug === "productivity") {
    if (/office 365|ms365|آفیس/i.test(comb)) {
      return { sortOrder: 1, bestseller: true, featured: true, salesCount: 460 };
    }
    if (/grammarly|گرامرلی/i.test(comb)) {
      return { sortOrder: 2, bestseller: true, featured: true, salesCount: 380 };
    }
    if (/notion|نوشن/i.test(comb)) {
      return { sortOrder: 3, bestseller: true, featured: true, salesCount: 320 };
    }
    if (/windows|ویندوز/i.test(comb)) {
      return { sortOrder: 4, bestseller: true, featured: true, salesCount: 300 };
    }
    if (/duolingo|tradingview/i.test(comb)) {
      return { sortOrder: 5, bestseller: false, featured: true, salesCount: 250 };
    }
  }

  if (catSlug === "social") {
    if (/stars|استارز/i.test(comb)) {
      return { sortOrder: 1, bestseller: true, featured: true, salesCount: 530 };
    }
    if (/telegram premium|پریمیوم تلگرام/i.test(comb)) {
      return { sortOrder: 2, bestseller: true, featured: true, salesCount: 480 };
    }
    if (/twitter|x premium/i.test(comb)) {
      return { sortOrder: 3, bestseller: true, featured: true, salesCount: 310 };
    }
  }

  return { sortOrder: 50, bestseller: false, featured: false, salesCount: 15 };
}

// Categorize products based on name/brand strictly according to 8 standard categories
export function categorizeProduct(p: SupplierProduct): {
  slug: string;
  name: string;
  sortOrder: number;
  bestseller: boolean;
  featured: boolean;
  salesCount: number;
} {
  const name = pickTitle(p);
  const n = (name || "").toLowerCase();
  
  const priceUsd = pickPriceUSD(p) || 0;
  const spCat = (p.category || "").toLowerCase().trim();

  let slug = "";

  // 1. MUST BE FIRST: Virtual Numbers & OTP Check
  // Strict rule: virtual numbers must NEVER be categorized into AI or other categories!
  const countryRegex = /\b(germany|usa?|uk|england|netherlands|russia|afghanistan|india|indonesia|brazil|turkey|malaysia|vietnam|philippines|thailand|mexico|canada|argentina|colombia|nigeria|egypt|south africa|pakistan|bangladesh|china|japan|korea|australia|spain|italy|poland|ukraine|romania|kazakhstan|uzbekistan|morocco|algeria|kenya|estonia|sweden|norway|finland|denmark|austria|switzerland|belgium|portugal|greece|czech|ireland|singapore|hong kong|taiwan|israel|chile|peru|venezuela|cambodia|laos|myanmar)\b/i;
  const hasEmDash = /—/u.test(name);
  const hasFlag = /[\uD83C][\uDDE6-\uDDFF]/u.test(name);
  const isGiftCardOrGame = /psn|playstation|itunes|google play|nintendo|steam|xbox|cp \(in\)|pubg|discord/i.test(n);

  if (spCat === "otp numbers") {
    slug = "virtual-numbers";
  } else if (/virtual number|شماره مجازی|\botp\b|phone number|sms activate|sms-activate|temp phone|دریافت پیامک|تایید پیامکی/i.test(n)) {
    slug = "virtual-numbers";
  } else if (!isGiftCardOrGame && (hasEmDash || hasFlag) && countryRegex.test(name)) {
    slug = "virtual-numbers";
  } else if (!isGiftCardOrGame && priceUsd > 0 && priceUsd < 0.6 && countryRegex.test(name) && (hasEmDash || hasFlag || name.includes("-"))) {
    slug = "virtual-numbers";
  }

  // 2. Dev Tools & API Credits
  if (!slug) {
    if (spCat === "apis & dev tools") {
      slug = "dev-tools";
    } else if (/\b(cursor|windsurf|github copilot|copilot pro|codex|api|token|tokens|credit|credits|توکن|کردیت|ردیم کد|ردیم|supabase|railway|lovable|lovabe|replit|v0\.dev|postman)\b/i.test(n)) {
      if (!/canva|figma|adobe|spotify|netflix|disney|psn|playstation|xbox|nitro|office 365|ms365/i.test(n)) {
        slug = "dev-tools";
      }
    }
  }

  // 3. Gaming & Gift Cards
  if (!slug) {
    if (["nitro", "psn (us)", "play - us", "uc (global)", "cp (in)"].includes(spCat)) {
      slug = "gaming";
    } else if (/discord nitro|\bnitro\b|playstation|\bpsn\b|google play|pubg|\buc\b|\bcp\b|xbox|game pass|steam|epic games|battlenet|blizzard|riot|valorant|minecraft|nintendo/i.test(n)) {
      slug = "gaming";
    }
  }

  // 4. Streaming & Entertainment
  if (!slug) {
    if (spCat === "streaming") {
      slug = "streaming";
    } else if (/netflix|نتفلیکس|spotify|اسپاتیفای|youtube premium|youtube music|یوتیوب|disney|دیزنی|apple music|apple tv|hbo|paramount|crunchyroll|deezer|tidal|vieon|soundcloud/i.test(n)) {
      slug = "streaming";
    }
  }

  // 5. Design & Graphics
  if (!slug) {
    if (spCat === "design tools") {
      slug = "design";
    } else if (/canva|کنوا|کانوا|adobe|ادوبی|photoshop|illustrator|premiere|after effects|creative cloud|lightroom|figma|فیگما|freepik|فری پیک|envato|انواتو|capcut|کپ‌کات|autodesk|autocad|3ds max|corel|sketch|invision|framer|miro|dzine/i.test(n)) {
      slug = "design";
    }
  }

  // 6. Social
  if (!slug) {
    if (["stars", "boost", "likes", "page likes", "comments", "commentes", "followers", "members", "reactions", "mention", "watch time", "bot start"].includes(spCat)) {
      slug = "social";
    } else if (/telegram stars|telegram premium|تلگرام|استارز|فالوور|ممبر|لایک|سوشال|توییتر|اینستاگرام|تیک تاک|tiktok|instagram|twitter|\bx premium\b|facebook|linkedin|snapchat|reddit|threads/i.test(n)) {
      slug = "social";
    }
  }

  // 7. AI & Language Models
  if (!slug) {
    if (spCat === "ai chatbots" || spCat === "ai video & image") {
      slug = "ai";
    } else if (/chatgpt|gpt plus|gpt-4|openai|claude|کلاود|کلود|anthropic|midjourney|میدجرنی|perplexity|پرپلکسیتی|runway|رانوی|kling|کلینگ|luma|لوما|veo|گوگل ویو|elevenlabs|الون لبز|heygen|هیجن|gemini|جمینی|grok|گروک|suno|سونو|udio|یودیو|pika|پیکا|leonardo|لئوناردو|dall-?e|sora|سورا|genspark|openart|pixverse|seedance|akool|beeble|gamma|higgfield|higgsfield|krea|manus|chatprd/i.test(n)) {
      slug = "ai";
    }
  }

  // 8. Productivity & Software (default)
  if (!slug) {
    slug = "productivity";
  }

  const ranking = getProductRankingInfo(p, name, slug);

  return {
    slug,
    name: CATEGORIES_META[slug] || slug,
    ...ranking,
  };
}

export async function importProductsFromSupplier(
  apiUrl?: string,
  apiKey?: string,
  markupPercent?: number | null
): Promise<{ ok: boolean; imported: number; updated: number; skipped: number; message: string; details: string[] }> {
  // irMarket default: if no URL, use irMarket products endpoint.
  // SUPPLIER_API_URL may be a bare host ("https://api.irmarket.store") — the
  // products endpoint is host + /api/buyer/products (per the OpenAPI spec).
  const key = apiKey || (await getSupplierApiKey());
  let url = apiUrl || process.env.SUPPLIER_API_URL || "https://api.irmarket.store";
  if (!/\/api(\/|$)/.test(url)) url = url.replace(/\/+$/, "") + "/api/buyer/products";

  const pricingTiers = await loadPricingTiers();
  const explicitMarkup = markupPercent && markupPercent > 0 ? markupPercent : null;
  const usdRate = await getUsdToTomanRate();

  let products: SupplierProduct[] = [];
  try {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        // NOTE: send ONLY X-API-Key — adding X-Api-Key + Authorization: Bearer
        // together makes the supplier API reject the request with 401
        ...(key ? { "X-API-Key": key } : {}),
      },
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, imported: 0, updated: 0, skipped: 0, message: `خطای API (${res.status}): ${body.slice(0, 200)}`, details: [] };
    }
    const data = await res.json();
    // accept various shapes
    if (Array.isArray(data)) products = data;
    else if (Array.isArray(data.products)) products = data.products;
    else if (Array.isArray(data.data)) products = data.data;
    else if (Array.isArray(data.items)) products = data.items;
    else {
      return { ok: false, imported: 0, updated: 0, skipped: 0, message: "ساختار پاسخ API نامعتبر (آرایه محصولات یافت نشد)", details: [] };
    }
  } catch (e: any) {
    return { ok: false, imported: 0, updated: 0, skipped: 0, message: `ارتباط با API برقرار نشد: ${e?.message || ""}`, details: [] };
  }

  let imported = 0, updated = 0, skipped = 0;
  const details: string[] = [];

  for (const sp of products) {
    const title = pickTitle(sp);
    const priceUSD = pickPriceUSD(sp);
    if (!title || !priceUSD || priceUSD <= 0) {
      skipped++;
      continue;
    }
    if (isVpnProduct(title)) {
      skipped++;
      continue;
    }

    // Exclude products our checkout cannot fulfill (per irMarket OpenAPI):
    //  - SMM services (pricing_unit='per_1000') are quoted per 1000 but ordered
    //    in raw units and need a target link/comments we never collect
    //  - requires_password / required_inputs products need credentials we never collect
    //  - Allow customer email fields (buyer_email, customer_email, requires_email)
    const requiredInputs: string[] = Array.isArray(sp.required_inputs) ? sp.required_inputs : [];
    const nonEmailInputs = requiredInputs.filter(
      (input: string) => !/email|buyer_email|customer_email/i.test(input)
    );
    if (sp.pricing_unit === "per_1000" || sp.requires_link || sp.requires_comments || sp.requires_password || nonEmailInputs.length > 0) {
      skipped++;
      const why = sp.pricing_unit === "per_1000" ? "سرویس SMM" : sp.requires_link ? "نیازمند لینک" : sp.requires_password ? "نیازمند رمز" : "ورودی خاص";
      details.push(`رد شد (غیرقابل فروش خودکار): ${title} — ${why}`);
      continue;
    }

    // Use supplier product id in slug to avoid collisions
    const slugBase = sp.id ? `${sp.id}-${title}` : title;
    const slug = slugifyFa(slugBase);
    if (!slug) { skipped++; continue; }

    // Check existing product to preserve specifications and respect price lock
    const existing = await db.product.findUnique({ where: { slug } });
    let existingSpecs: Record<string, any> = {};
    if (existing?.specifications) {
      try {
        existingSpecs = typeof existing.specifications === "string"
          ? JSON.parse(existing.specifications)
          : existing.specifications;
      } catch {}
    }

    // Custom markup: explicit param > existing product custom markup
    const customMarkup = explicitMarkup !== null
      ? explicitMarkup
      : (existingSpecs.custom_markup !== undefined && existingSpecs.custom_markup !== null && existingSpecs.custom_markup !== "")
      ? Number(existingSpecs.custom_markup)
      : (existingSpecs.markup_percent !== undefined && existingSpecs.markup_percent !== null && existingSpecs.markup_percent !== "")
      ? Number(existingSpecs.markup_percent)
      : null;

    // Central Single Source of Truth for tiered pricing
    const { sellPriceToman, markupPercent: effectiveMarkup } = calculateSellPrice(
      priceUSD,
      usdRate,
      customMarkup,
      pricingTiers
    );

    const finalPrice = (existingSpecs.is_price_locked && existing) ? existing.price : sellPriceToman;

    const features: string[] = Array.isArray(sp.features) ? sp.features : (sp.features ? String(sp.features).split("\n").filter(Boolean) : []);
    // Build features from irMarket fields
    if (features.length === 0) {
      if (sp.discount_percent) features.push(`تخفیف ویژه: ${sp.discount_percent}٪`);
      if (sp.duration_days) features.push(`مدت: ${sp.duration_days} روز`);
      features.push("تحویل فوری و آنی پس از پرداخت");
      features.push("گارانتی ۱۰۰٪ فعالسازی و تضمین اصالت");
      features.push("پشتیبانی ۲۴ ساعته");
    }
    const catInfo = categorizeProduct(sp);
    const catSlug = catInfo.slug;
    const catName = catInfo.name;
    const loc = localizeProduct((sp.title || sp.name || title).toString().trim(), catSlug, sp);
    const finalTitle = loc.title;
    const shortDesc = loc.shortDesc;
    const finalDescription = loc.description || pickDescription(sp) || `## ${finalTitle}\n\nمحصول اوریجینال با تحویل آنی و پشتیبانی ۲۴ ساعته.`;

    const brand = sp.brand ? String(sp.brand) : null;
    const duration = sp.duration ? String(sp.duration) : (sp.duration_days ? `${sp.duration_days} روز` : null);
    const tags = sp.tags ? String(sp.tags) : (sp.requires_email ? "requires_email" : null);

    // ensure category exists
    const existingCat = await db.category.findUnique({ where: { slug: catSlug } }).catch(() => null);
    if (!existingCat) {
      await db.category.create({
        data: { name: catName, slug: catSlug, description: catName, icon: "Package", color: "from-emerald-500 to-teal-600", sortOrder: catInfo.sortOrder },
      }).catch(() => {});
    }

    const stock = typeof sp.in_stock === "number" ? sp.in_stock : (sp.in_stock !== false ? 99 : 0);

    if (existing) {
      // Merge with existing specs to ensure no metadata (e.g. torob_url, supplier_product_id) is lost
      const nextSpecs = {
        ...existingSpecs,
        supplier_product_id: sp.id,
        price_usd: priceUSD,
        cost_usd: priceUSD,
        pricing_unit: sp.pricing_unit,
        requires_email: sp.requires_email,
        requires_link: sp.requires_link,
        supplier_name: shortDesc,
        markup_percent: effectiveMarkup,
        markup_used: effectiveMarkup,
      };

      await db.product.update({
        where: { id: existing.id },
        data: {
          title: finalTitle,
          shortDesc: shortDesc,
          description: finalDescription,
          features: JSON.stringify(features),
          price: finalPrice,
          duration: duration || existing.duration,
          brand,
          tags,
          category: catSlug,
          sortOrder: catInfo.sortOrder,
          bestseller: catInfo.bestseller || existing.bestseller,
          featured: catInfo.featured || existing.featured,
          salesCount: Math.max(catInfo.salesCount, existing.salesCount),
          image: sp.image || sp.imageUrl || sp.images?.[0] || existing.image,
          isActive: !isVpnProduct(title),
          stock: stock,
          lastSyncedAt: new Date(),
          specifications: JSON.stringify(nextSpecs),
          fulfillmentMode: "AUTO",
        },
      });
      updated++;
      details.push(`به‌روز شد: ${title} — ${finalPrice.toLocaleString("fa-IR")} ت ($${priceUSD} × ${usdRate.toLocaleString("fa-IR")} × ${(100+effectiveMarkup)/100})`);
    } else {
      const nextSpecs = {
        supplier_product_id: sp.id,
        price_usd: priceUSD,
        cost_usd: priceUSD,
        pricing_unit: sp.pricing_unit,
        requires_email: sp.requires_email,
        requires_link: sp.requires_link,
        supplier_name: shortDesc,
        markup_percent: effectiveMarkup,
        markup_used: effectiveMarkup,
      };

      await db.product.create({
        data: {
          title: finalTitle, slug,
          shortDesc: shortDesc,
          description: finalDescription,
          features: JSON.stringify(features),
          price: finalPrice,
          duration,
          category: catSlug,
          sortOrder: catInfo.sortOrder,
          bestseller: catInfo.bestseller,
          featured: catInfo.featured,
          salesCount: catInfo.salesCount,
          brand, tags,
          image: sp.image || sp.imageUrl || sp.images?.[0] || null,
          isActive: !isVpnProduct(title),
          stock: stock,
          rating: 5, reviewCount: 0,
          specifications: JSON.stringify(nextSpecs),
          fulfillmentMode: "AUTO",
        },
      });
      imported++;
      details.push(`اضافه شد: ${title} — ${finalPrice.toLocaleString("fa-IR")} ت ($${priceUSD} × ${usdRate.toLocaleString("fa-IR")} × ${(100+effectiveMarkup)/100})`);
    }
  }

  return {
    ok: true, imported, updated, skipped,
    message: `${imported} محصول جدید، ${updated} به‌روز شد، ${skipped} رد شد | نرخ: ۱$ = ${usdRate.toLocaleString("fa-IR")} ت | قیمت‌گذاری پلکانی هوشمند`,
    details: details.slice(0, 50),
  };
}

export async function rebuildSupplierCatalog(opts?: {
  cleanFirst?: boolean;
  apiUrl?: string;
  apiKey?: string;
  markupPercent?: number | null;
}): Promise<{
  ok: boolean;
  totalFetched: number;
  imported: number;
  updated: number;
  skipped: number;
  deactivated: number;
  categoriesRebuilt: number;
  message: string;
  details: string[];
}> {
  const cleanFirst = Boolean(opts?.cleanFirst);
  const key = opts?.apiKey || (await getSupplierApiKey());
  if (!key) {
    return {
      ok: false,
      totalFetched: 0,
      imported: 0,
      updated: 0,
      skipped: 0,
      deactivated: 0,
      categoriesRebuilt: 0,
      message: "کلید API تامین‌کننده (irMarket) تنظیم نشده است",
      details: ["SUPPLIER_API_KEY is missing"],
    };
  }

  let url = opts?.apiUrl || process.env.SUPPLIER_API_URL || "https://api.irmarket.store";
  if (!/\/api(\/|$)/.test(url)) url = url.replace(/\/+$/, "") + "/api/buyer/products";

  // 1. Rebuild standard categories in database
  let categoriesRebuilt = 0;
  for (const cat of STANDARD_CATEGORIES) {
    await db.category.upsert({
      where: { slug: cat.slug },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        color: cat.color,
        sortOrder: cat.sortOrder,
      },
      update: {
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        color: cat.color,
        sortOrder: cat.sortOrder,
      },
    });
    categoriesRebuilt++;
  }

  // Migrate any old product categories
  await db.product.updateMany({
    where: { category: "api-credits" },
    data: { category: "dev-tools" },
  });
  await db.product.updateMany({
    where: { category: { in: ["software", "other", "security", "education"] } },
    data: { category: "productivity" },
  });

  // 2. Clean first if requested
  let deactivated = 0;
  if (cleanFirst) {
    // Find products that have existing orders to avoid FK constraint violations
    const orderItems = await db.orderItem.findMany({ select: { productId: true } });
    const orderProductIds = new Set(orderItems.map((o) => o.productId));

    // For products with orders: deactivate them
    const deactivatedResult = await db.product.updateMany({
      where: {
        fulfillmentMode: "AUTO",
        id: { in: Array.from(orderProductIds) },
      },
      data: { isActive: false },
    });
    deactivated = deactivatedResult.count;

    // For products with NO orders: safely delete their licenses and then the products
    const unusedProducts = await db.product.findMany({
      where: {
        fulfillmentMode: "AUTO",
        id: { notIn: Array.from(orderProductIds) },
      },
      select: { id: true },
    });
    const unusedIds = unusedProducts.map((p) => p.id);

    if (unusedIds.length > 0) {
      await db.licenseKey.deleteMany({
        where: { productId: { in: unusedIds } },
      });
      await db.product.deleteMany({
        where: { id: { in: unusedIds } },
      });
    }
  }

  // 3. Fetch from irMarket
  let rawProducts: SupplierProduct[] = [];
  try {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": key,
      },
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        ok: false,
        totalFetched: 0,
        imported: 0,
        updated: 0,
        skipped: 0,
        deactivated,
        categoriesRebuilt,
        message: `خطای دریافت کاتالوگ از irMarket (${res.status}): ${body.slice(0, 200)}`,
        details: [body.slice(0, 500)],
      };
    }
    const data = await res.json();
    if (Array.isArray(data)) rawProducts = data;
    else if (Array.isArray(data.products)) rawProducts = data.products;
    else if (Array.isArray(data.data)) rawProducts = data.data;
    else if (Array.isArray(data.items)) rawProducts = data.items;
    else {
      return {
        ok: false,
        totalFetched: 0,
        imported: 0,
        updated: 0,
        skipped: 0,
        deactivated,
        categoriesRebuilt,
        message: "ساختار پاسخ API نامعتبر است",
        details: [],
      };
    }
  } catch (e: any) {
    return {
      ok: false,
      totalFetched: 0,
      imported: 0,
      updated: 0,
      skipped: 0,
      deactivated,
      categoriesRebuilt,
      message: `ارتباط با API برقرار نشد: ${e?.message || ""}`,
      details: [e?.stack || ""],
    };
  }

  const totalFetched = rawProducts.length;
  const pricingTiers = await loadPricingTiers();
  const explicitMarkup = opts?.markupPercent && opts.markupPercent > 0 ? opts.markupPercent : null;
  const usdRate = await getUsdToTomanRate();

  let imported = 0, updated = 0, skipped = 0;
  const details: string[] = [];

  for (const sp of rawProducts) {
    const title = pickTitle(sp);
    const priceUSD = pickPriceUSD(sp);

    // Filter invalid: missing title or price <= 0
    if (!title || !priceUSD || priceUSD <= 0) {
      skipped++;
      continue;
    }

    // Filter VPN products
    if (isVpnProduct(title)) {
      skipped++;
      continue;
    }

    // Filter unfulfillable products (allow email inputs)
    const requiredInputs: string[] = Array.isArray(sp.required_inputs) ? sp.required_inputs : [];
    const nonEmailInputs = requiredInputs.filter(
      (input: string) => !/email|buyer_email|customer_email/i.test(input)
    );
    if (sp.pricing_unit === "per_1000" || sp.requires_link || sp.requires_comments || sp.requires_password || nonEmailInputs.length > 0) {
      skipped++;
      continue;
    }

    const catInfo = categorizeProduct(sp);
    const catSlug = catInfo.slug;
    const loc = localizeProduct((sp.title || sp.name || title).toString().trim(), catSlug, sp);
    const finalTitle = loc.title;
    const shortDesc = loc.shortDesc;
    const finalDescription = loc.description || pickDescription(sp) || `## ${finalTitle}\n\nمحصول اوریجینال با تحویل آنی و پشتیبانی ۲۴ ساعته.`;

    // Unique pretty slug
    const cleanTitleSlug = slugifyFa(finalTitle);
    const slug = sp.id ? `${sp.id}-${cleanTitleSlug || "item"}` : cleanTitleSlug;
    if (!slug) {
      skipped++;
      continue;
    }

    const existing = await db.product.findFirst({
      where: {
        OR: [
          { slug },
          { specifications: { contains: `"supplier_product_id":${sp.id}` } },
          { specifications: { contains: `"supplier_product_id":"${sp.id}"` } },
        ],
      },
    });

    let existingSpecs: Record<string, any> = {};
    if (existing?.specifications) {
      try {
        existingSpecs = typeof existing.specifications === "string" ? JSON.parse(existing.specifications) : existing.specifications;
      } catch {}
    }

    const customMarkup = explicitMarkup !== null
      ? explicitMarkup
      : (existingSpecs.custom_markup !== undefined && existingSpecs.custom_markup !== null && existingSpecs.custom_markup !== "")
      ? Number(existingSpecs.custom_markup)
      : (existingSpecs.markup_percent !== undefined && existingSpecs.markup_percent !== null && existingSpecs.markup_percent !== "")
      ? Number(existingSpecs.markup_percent)
      : null;

    const { sellPriceToman, markupPercent: effectiveMarkup } = calculateSellPrice(
      priceUSD,
      usdRate,
      customMarkup,
      pricingTiers
    );

    const finalPrice = (existingSpecs.is_price_locked && existing) ? existing.price : sellPriceToman;

    const features: string[] = Array.isArray(sp.features)
      ? sp.features
      : (sp.features ? String(sp.features).split("\n").filter(Boolean) : []);
    if (features.length === 0) {
      if (sp.discount_percent) features.push(`تخفیف ویژه: ${sp.discount_percent}٪`);
      if (sp.duration_days) features.push(`مدت: ${sp.duration_days} روز`);
      features.push("تحویل فوری و آنی پس از پرداخت");
      features.push("گارانتی ۱۰۰٪ فعالسازی و تضمین اصالت");
      features.push("پشتیبانی ۲۴ ساعته");
    }

    const brand = sp.brand ? String(sp.brand) : null;
    const duration = sp.duration ? String(sp.duration) : (sp.duration_days ? `${sp.duration_days} روز` : null);
    const tags = sp.tags ? String(sp.tags) : (sp.requires_email ? "requires_email" : null);
    let stock = 0;
    if (typeof sp.stock === "number") {
      stock = sp.stock;
    } else if (typeof sp.in_stock === "number") {
      stock = sp.in_stock;
    } else if (sp.in_stock === true || sp.stock === true) {
      stock = 99;
    } else if (sp.in_stock === false || sp.stock === false) {
      stock = 0;
    } else {
      stock = 99;
    }

    const nextSpecs = {
      ...existingSpecs,
      supplier_product_id: sp.id,
      price_usd: priceUSD,
      cost_usd: priceUSD,
      pricing_unit: sp.pricing_unit,
      requires_email: sp.requires_email,
      requires_link: sp.requires_link,
      supplier_name: shortDesc,
      markup_percent: effectiveMarkup,
      markup_used: effectiveMarkup,
    };

    if (existing) {
      await db.product.update({
        where: { id: existing.id },
        data: {
          title: finalTitle,
          shortDesc,
          description: finalDescription,
          features: JSON.stringify(features),
          price: finalPrice,
          duration: duration || existing.duration,
          brand,
          tags,
          category: catSlug,
          sortOrder: catInfo.sortOrder,
          bestseller: catInfo.bestseller || existing.bestseller,
          featured: catInfo.featured || existing.featured,
          salesCount: Math.max(catInfo.salesCount, existing.salesCount),
          image: sp.image || sp.imageUrl || sp.images?.[0] || existing.image,
          isActive: true,
          stock,
          lastSyncedAt: new Date(),
          specifications: JSON.stringify(nextSpecs),
          fulfillmentMode: "AUTO",
        },
      });
      updated++;
      if (details.length < 50) {
        details.push(`به‌روزرسانی: ${finalTitle} [${catSlug}] (${finalPrice.toLocaleString("fa-IR")} ت)`);
      }
    } else {
      await db.product.create({
        data: {
          title: finalTitle,
          slug,
          shortDesc,
          description: finalDescription,
          features: JSON.stringify(features),
          price: finalPrice,
          duration,
          category: catSlug,
          sortOrder: catInfo.sortOrder,
          bestseller: catInfo.bestseller,
          featured: catInfo.featured,
          salesCount: catInfo.salesCount,
          brand,
          tags,
          image: sp.image || sp.imageUrl || sp.images?.[0] || null,
          isActive: true,
          stock,
          rating: 5,
          reviewCount: 0,
          specifications: JSON.stringify(nextSpecs),
          fulfillmentMode: "AUTO",
        },
      });
      imported++;
      if (details.length < 50) {
        details.push(`ایمپورت جدید: ${finalTitle} [${catSlug}] (${finalPrice.toLocaleString("fa-IR")} ت)`);
      }
    }
  }

  // Update last sync setting
  await db.setting.upsert({
    where: { key: "last_full_sync_at" },
    update: { value: new Date().toISOString() },
    create: { key: "last_full_sync_at", value: new Date().toISOString() },
  });

  return {
    ok: true,
    totalFetched,
    imported,
    updated,
    skipped,
    deactivated,
    categoriesRebuilt,
    message: `کاتالوگ با موفقیت بازسازی شد: ${imported} جدید، ${updated} به‌روز، ${skipped} فیلتر/رد شد، ${deactivated} غیرفعال، ۸ دسته استاندارد به‌روز شدند. نرخ: ${usdRate.toLocaleString("fa-IR")} ت`,
    details,
  };
}

// ----------------------------- Purchase from supplier (auto-fulfill) -----------------------------
// When a customer pays, we buy from irMarket and deliver the accounts as license keys.

export interface PurchaseFromSupplierResult {
  ok: boolean;
  accounts?: string[];
  orderId?: number;
  message: string;
  status?: "delivered" | "processing" | "failed" | "cancelled";
  costUsd?: number;
  httpStatus?: number;
  errorCode?: string;
  requestPayload?: any;
  responsePayload?: any;
}

export async function purchaseFromSupplier(
  productId: string,
  quantity: number,
  customerEmail?: string,
  idempotencyKey?: string
): Promise<PurchaseFromSupplierResult> {
  const client = await getSupplierClient();
  if (!client) return { ok: false, message: "کلید API تأمین‌کننده تنظیم نشده", errorCode: "missing_api_key" };

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return { ok: false, message: "محصول یافت نشد", errorCode: "product_not_found" };

  // get supplier product id from specifications
  let supplierProductId: number | undefined;
  let requiresPassword = false;
  let specCostUsd: number | undefined;
  try {
    const specs = JSON.parse(product.specifications || "{}");
    supplierProductId = Number(specs.supplier_product_id);
    requiresPassword = !!specs.requires_password;
    if (specs.cost_usd || specs.price_usd) {
      specCostUsd = Number(specs.cost_usd || specs.price_usd);
    }
  } catch {}
  if (!supplierProductId) return { ok: false, message: "شناسه محصول تأمین‌کننده یافت نشد", errorCode: "supplier_id_missing" };
  if (requiresPassword)
    return { ok: false, message: "این محصول نیازمند رمز مشتری است و فعلاً قابل فروش خودکار نیست", errorCode: "requires_password" };

  const requestPayload = {
    productId: supplierProductId,
    quantity,
    idempotencyKey: idempotencyKey || `LL-${Date.now()}`,
    customerEmail,
  };

  try {
    const result = await client.purchase(requestPayload);

    // status can be 'processing' (still fulfilling) — poll the order a few
    // times before giving up, per the API docs
    let status = result.status;
    let accounts: string[] = [...result.accounts];
    const orderId = result.orderId;
    const costUsd = result.totalUsdCents ? result.totalUsdCents / 100 : (specCostUsd ? specCostUsd * quantity : undefined);

    if (status === "processing" && accounts.length === 0 && orderId) {
      for (let attempt = 0; attempt < 5 && status === "processing"; attempt++) {
        await new Promise((r) => setTimeout(r, 3000));
        try {
          const poll = await client.getOrder(orderId);
          status = poll.status;
          accounts = [...poll.accounts];
        } catch (e) {
          // ignore poll errors and keep trying
        }
      }
    }

    if (status === "delivered" && accounts.length > 0) {
      return {
        ok: true,
        status: "delivered",
        accounts,
        orderId,
        costUsd,
        message: `خرید موفق — ${accounts.length} اکانت تحویل شد`,
        requestPayload,
        responsePayload: { status, orderId, costUsd, accountsCount: accounts.length },
      };
    }
    if (status === "processing") {
      return {
        ok: false,
        status: "processing",
        accounts,
        orderId,
        costUsd,
        message: `سفارش ${orderId} نزد تأمین‌کننده در حال پردازش است — کلیدها بعداً از طریق وب‌هوک تحویل داده می‌شود`,
        requestPayload,
        responsePayload: { status, orderId, costUsd },
      };
    }
    return {
      ok: false,
      status,
      orderId,
      costUsd,
      message: `تحویل ناموفق بود (وضعیت: ${status})`,
      requestPayload,
      responsePayload: { status, orderId, costUsd },
    };
  } catch (e: any) {
    const httpStatus = typeof e?.httpStatus === "number" ? e.httpStatus : undefined;
    const errorCode = typeof e?.code === "string" ? e.code : undefined;
    return {
      ok: false,
      status: "failed",
      httpStatus,
      errorCode,
      message: `ارتباط با تأمین‌کننده: ${e?.message || "خطای نامشخص"}`,
      requestPayload,
      responsePayload: { error: e?.message, httpStatus, errorCode },
    };
  }
}

// ----------------------------- irMarket: Balance & Me -----------------------------
// GET /api/buyer/balance — returns { success, balance_usd }
export async function getSupplierBalance(): Promise<{
  ok: boolean;
  balance_usd?: number;
  message?: string;
}> {
  const key = await getSupplierApiKey();
  if (!key) return { ok: false, message: "کلید API تأمین‌کننده تنظیم نشده" };
  try {
    const res = await fetch(`${IRMARKET_BASE_URL}/api/buyer/balance`, {
      headers: { "X-API-Key": key },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      return { ok: false, message: data.detail || data.message || `خطای API (${res.status})` };
    }
    return { ok: true, balance_usd: Number(data.balance_usd) || 0 };
  } catch (e: any) {
    return { ok: false, message: `ارتباط با تأمین‌کننده: ${e?.message || ""}` };
  }
}

// GET /api/buyer/me — returns { success, key, name, discount_percent, balance_usd, webhook_url }
export async function getSupplierMe(): Promise<{
  ok: boolean;
  key?: string;
  name?: string;
  discount_percent?: number;
  balance_usd?: number;
  webhook_url?: string;
  message?: string;
}> {
  const key = await getSupplierApiKey();
  if (!key) return { ok: false, message: "کلید API تأمین‌کننده تنظیم نشده" };
  try {
    const res = await fetch(`${IRMARKET_BASE_URL}/api/buyer/me`, {
      headers: { "X-API-Key": key },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      return { ok: false, message: data.detail || data.message || `خطای API (${res.status})` };
    }
    return {
      ok: true,
      key: data.key,
      name: data.name,
      discount_percent: Number(data.discount_percent) || 0,
      balance_usd: Number(data.balance_usd) || 0,
      webhook_url: data.webhook_url || "",
    };
  } catch (e: any) {
    return { ok: false, message: `ارتباط با تأمین‌کننده: ${e?.message || ""}` };
  }
}

// ----------------------------- irMarket: Webhook registration -----------------------------
// POST /api/buyer/webhook — body: { url }
// NOTE: the signing secret is returned ONCE and re-registering rotates it,
// so it must be persisted immediately.
export async function registerSupplierWebhook(url: string): Promise<{ ok: boolean; secret?: string; message?: string }> {
  const key = await getSupplierApiKey();
  if (!key) return { ok: false, message: "کلید API تأمین‌کننده تنظیم نشده" };
  try {
    const res = await fetch(`${IRMARKET_BASE_URL}/api/buyer/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": key },
      body: JSON.stringify({ url }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      return { ok: false, message: data.detail || data.message || `خطای API (${res.status})` };
    }
    // persist the HMAC secret so /api/supplier/webhook can verify X-Signature
    if (data.secret) {
      await db.setting.upsert({
        where: { key: "supplier_irmarket_webhook_secret" },
        create: { key: "supplier_irmarket_webhook_secret", value: data.secret },
        update: { value: data.secret },
      });
    }
    return { ok: true, secret: data.secret, message: "وب‌هوک ثبت شد و رمز امضا ذخیره شد" };
  } catch (e: any) {
    return { ok: false, message: `ارتباط با تأمین‌کننده: ${e?.message || ""}` };
  }
}

// DELETE /api/buyer/webhook — removes webhook
export async function removeSupplierWebhook(): Promise<{ ok: boolean; message?: string }> {
  const key = await getSupplierApiKey();
  if (!key) return { ok: false, message: "کلید API تأمین‌کننده تنظیم نشده" };
  try {
    const res = await fetch(`${IRMARKET_BASE_URL}/api/buyer/webhook`, {
      method: "DELETE",
      headers: { "X-API-Key": key },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      return { ok: false, message: data.detail || data.message || `خطای API (${res.status})` };
    }
    return { ok: true, message: "وب‌هوک حذف شد" };
  } catch (e: any) {
    return { ok: false, message: `ارتباط با تأمین‌کننده: ${e?.message || ""}` };
  }
}

// ----------------------------- irMarket: Order status -----------------------------
// GET /api/buyer/orders/{order_id} — returns { success, order_id, status, accounts, progress_percent, refunded }
export async function getSupplierOrder(orderId: number | string): Promise<{
  ok: boolean;
  status?: string;
  accounts?: string[];
  progress_percent?: number;
  refunded?: boolean;
  message?: string;
}> {
  const key = await getSupplierApiKey();
  if (!key) return { ok: false, message: "کلید API تأمین‌کننده تنظیم نشده" };
  try {
    const res = await fetch(`${IRMARKET_BASE_URL}/api/buyer/orders/${orderId}`, {
      headers: { "X-API-Key": key },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      return { ok: false, message: data.detail || data.message || `خطای API (${res.status})` };
    }
    return {
      ok: true,
      status: data.status,
      accounts: data.accounts || [],
      progress_percent: Number(data.progress_percent) || 0,
      refunded: Boolean(data.refunded),
    };
  } catch (e: any) {
    return { ok: false, message: `ارتباط با تأمین‌کننده: ${e?.message || ""}` };
  }
}
