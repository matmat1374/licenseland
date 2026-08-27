// Supplier integration core
// Supports two modes:
// 1) OUTBOUND: we call the supplier's API/Telegram bot to request license keys
// 2) INBOUND: the supplier pushes license keys to our webhook (/api/supplier/webhook)
//
// Configuration is read from DB Setting table (editable in admin) with env fallbacks.

import { db } from "@/lib/db";
import { computeQuote } from "@kernel/pricing/engine";
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
  stock?: number;
  in_stock?: number;
  pricing_unit?: string;
  min_qty?: number;
  max_qty?: number;
  requires_email?: boolean;
  requires_link?: boolean;
  [key: string]: any;
}

// USD to Toman conversion rate (configurable in admin settings, default ~60000)
export async function getUsdToTomanRate(): Promise<number> {
  const s = await db.setting.findUnique({ where: { key: "usd_to_toman_rate" } }).catch(() => null);
  return Number(s?.value) || 60000;
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
  return (p.title || p.name || "").toString().trim();
}

function pickDescription(p: SupplierProduct): string {
  return (p.description || p.shortDesc || p.short_description || p.desc || "").toString();
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

// Categorize products based on name/brand
function categorizeProduct(p: SupplierProduct): { slug: string; name: string } {
  const title = pickTitle(p).toLowerCase();
  const cat = (p.category || "").toString().toLowerCase();
  if (cat) return { slug: cat, name: cat };
  if (/chatgpt|claude|gemini|midjourney|perplexity|copilot|ai |gpt|dall-e|leonardo|grammarly/.test(title))
    return { slug: "ai", name: "هوش مصنوعی" };
  if (/spotify|netflix|youtube|disney|apple\s*music|soundcloud/.test(title))
    return { slug: "streaming", name: "استریم و موسیقی" };
  if (/vpn|nord|express|surfshark|kaspersky|malware|antivirus|security/.test(title))
    return { slug: "security", name: "امنیت" };
  if (/steam|playstation|xbox|game/.test(title))
    return { slug: "gaming", name: "بازی" };
  if (/capcut|adobe|photoshop|premiere|canva|filmora|camtasia|figma|design/.test(title))
    return { slug: "design", name: "طراحی و ویرایش" };
  return { slug: "software", name: "نرم‌افزار" };
}

export async function importProductsFromSupplier(
  apiUrl?: string,
  apiKey?: string,
  markupPercent = 200
): Promise<{ ok: boolean; imported: number; updated: number; skipped: number; message: string; details: string[] }> {
  // irMarket default: if no URL, use irMarket products endpoint.
  // SUPPLIER_API_URL may be a bare host ("https://api.irmarket.store") — the
  // products endpoint is host + /api/buyer/products (per the OpenAPI spec).
  const key = apiKey || (await getSupplierApiKey());
  let url = apiUrl || process.env.SUPPLIER_API_URL || "https://api.irmarket.store";
  if (!/\/api(\/|$)/.test(url)) url = url.replace(/\/+$/, "") + "/api/buyer/products";

  const markup = markupPercent > 0 ? markupPercent : Number(process.env.SUPPLIER_MARKUP_PERCENT) || 200;
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

    // Exclude products our checkout cannot fulfill (per irMarket OpenAPI):
    //  - SMM services (pricing_unit='per_1000') are quoted per 1000 but ordered
    //    in raw units and need a target link/comments we never collect
    //  - requires_password / required_inputs products need credentials we never collect
    const requiredInputs: string[] = Array.isArray(sp.required_inputs) ? sp.required_inputs : [];
    if (sp.pricing_unit === "per_1000" || sp.requires_link || sp.requires_comments || sp.requires_password || requiredInputs.length > 0) {
      skipped++;
      const why = sp.pricing_unit === "per_1000" ? "سرویس SMM" : sp.requires_link ? "نیازمند لینک" : sp.requires_password ? "نیازمند رمز" : "ورودی خاص";
      details.push(`رد شد (غیرقابل فروش خودکار): ${title} — ${why}`);
      continue;
    }

    // Convert USD → Toman using kernel pricing engine (NOT inline formula)
    // Kernel: computeQuote(config, input) — single source of truth for money math
    const supplierCostUsdCents = Math.round(priceUSD * 100); // USD to cents
    const markupBps = markup * 100; // percent → basis points (200% = 20000 bps)
    const quote = computeQuote(
      {
        expectedCurrency: "IRT" as const,
        global: {
          version: "v1",
          markupBps,
          addAbsMinor: 0,
          minMarginAbsMinor: 0,
          floorMinor: null,
          capMinor: null,
          taxBps: 0,
          rounding: { mode: "nearest" as const, unitMinor: 1000 },
        },
        categoryRules: {},
        productOverrides: {},
        scheduled: [],
        fxMaxAgeSeconds: 900,
      },
      {
        productId: sp.id ? String(sp.id) : slugifyFa(title),
        supplierCostUsdCents,
        fx: {
          irtMinorPerUsd: usdRate,
          source: "manual",
          capturedAtIso: new Date().toISOString(),
          bufferBps: 0,
        },
        nowIso: new Date().toISOString(),
      }
    );

    if (quote.status !== "ok") {
      skipped++;
      details.push(`رد شد: ${title} — quote blocked: ${quote.reason}`);
      continue;
    }
    const sellPriceToman = quote.grossMinor; // integer minor units

    // Use supplier product id in slug to avoid collisions
    const slugBase = sp.id ? `${sp.id}-${title}` : title;
    const slug = slugifyFa(slugBase);
    if (!slug) { skipped++; continue; }

    const features: string[] = Array.isArray(sp.features) ? sp.features : (sp.features ? String(sp.features).split("\n").filter(Boolean) : []);
    // Build features from irMarket fields
    if (features.length === 0) {
      if (sp.retail_usd && sp.price_usd) features.push(`قیمت عمومی: $${sp.retail_usd}`);
      if (sp.discount_percent) features.push(`تخفیف ویژه: ${sp.discount_percent}٪`);
      if (sp.duration_days) features.push(`مدت: ${sp.duration_days} روز`);
      if (sp.in_stock !== undefined) features.push(`موجود: ${sp.in_stock} عدد`);
    }
    const description = pickDescription(sp) || `## ${title}\n\nمحصول اوریجینال با تحویل آنی.\n\n### مشخصات\n- قیمت پایه: $${priceUSD}\n- نرخ تبدیل: ${usdRate.toLocaleString("fa-IR")} تومان به ازای هر دلار\n- حاشیه: ${markup}٪`;

    const { slug: catSlug, name: catName } = categorizeProduct(sp);
    const brand = sp.brand ? String(sp.brand) : null;
    const duration = sp.duration ? String(sp.duration) : (sp.duration_days ? `${sp.duration_days} روز` : null);
    const tags = sp.tags ? String(sp.tags) : (sp.requires_email ? "requires_email" : null);

    // ensure category exists
    const existingCat = await db.category.findUnique({ where: { slug: catSlug } }).catch(() => null);
    if (!existingCat) {
      await db.category.create({
        data: { name: catName, slug: catSlug, description: catName, icon: "Package", color: "from-emerald-500 to-teal-600", sortOrder: 99 },
      }).catch(() => {});
    }

    // upsert product by slug
    const existing = await db.product.findUnique({ where: { slug } });
    const stock = typeof sp.in_stock === "number" ? sp.in_stock : (typeof sp.stock === "number" ? sp.stock : 0);
    if (existing) {
      await db.product.update({
        where: { id: existing.id },
        data: {
          title,
          shortDesc: sp.shortDesc ? String(sp.shortDesc) : existing.shortDesc,
          description,
          features: JSON.stringify(features),
          price: sellPriceToman,
          duration: duration || existing.duration,
          brand,
          tags,
          image: sp.image || sp.imageUrl || sp.images?.[0] || existing.image,
          isActive: true,
          // store supplier product id in specifications for purchasing
          specifications: JSON.stringify({ supplier_product_id: sp.id, price_usd: priceUSD, pricing_unit: sp.pricing_unit, requires_email: sp.requires_email, requires_link: sp.requires_link }),
          fulfillmentMode: "AUTO",
        },
      });
      updated++;
      details.push(`به‌روز شد: ${title} — ${sellPriceToman.toLocaleString("fa-IR")} ت ($${priceUSD} × ${usdRate.toLocaleString("fa-IR")} × ${(100+markup)/100})`);
    } else {
      await db.product.create({
        data: {
          title, slug,
          shortDesc: sp.shortDesc ? String(sp.shortDesc) : title,
          description,
          features: JSON.stringify(features),
          price: sellPriceToman,
          duration,
          category: catSlug,
          brand, tags,
          image: sp.image || sp.imageUrl || sp.images?.[0] || null,
          isActive: true,
          stock: 0, // we don't pre-stock; purchase on-demand
          rating: 5, reviewCount: 0, salesCount: 0,
          specifications: JSON.stringify({ supplier_product_id: sp.id, price_usd: priceUSD, pricing_unit: sp.pricing_unit, requires_email: sp.requires_email, requires_link: sp.requires_link }),
          fulfillmentMode: "AUTO",
        },
      });
      imported++;
      details.push(`اضافه شد: ${title} — ${sellPriceToman.toLocaleString("fa-IR")} ت ($${priceUSD} × ${usdRate.toLocaleString("fa-IR")} × ${(100+markup)/100})`);
    }
  }

  return {
    ok: true, imported, updated, skipped,
    message: `${imported} محصول جدید، ${updated} به‌روز شد، ${skipped} رد شد | نرخ: ۱$ = ${usdRate.toLocaleString("fa-IR")} ت | حاشیه: ${markup}٪`,
    details: details.slice(0, 50),
  };
}

// ----------------------------- Purchase from supplier (auto-fulfill) -----------------------------
// When a customer pays, we buy from irMarket and deliver the accounts as license keys.

export async function purchaseFromSupplier(
  productId: string,
  quantity: number,
  customerEmail?: string,
  idempotencyKey?: string
): Promise<{ ok: boolean; accounts?: string[]; orderId?: number; message: string }> {
  const client = await getSupplierClient();
  if (!client) return { ok: false, message: "کلید API تأمین‌کننده تنظیم نشده" };

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return { ok: false, message: "محصول یافت نشد" };

  // get supplier product id from specifications
  let supplierProductId: number | undefined;
  let requiresPassword = false;
  try {
    const specs = JSON.parse(product.specifications || "{}");
    supplierProductId = Number(specs.supplier_product_id);
    requiresPassword = !!specs.requires_password;
  } catch {}
  if (!supplierProductId) return { ok: false, message: "شناسه محصول تأمین‌کننده یافت نشد" };
  if (requiresPassword)
    return { ok: false, message: "این محصول نیازمند رمز مشتری است و فعلاً قابل فروش خودکار نیست" };

  try {
    const result = await client.purchase({
      productId: supplierProductId,
      quantity,
      idempotencyKey: idempotencyKey || `LL-${Date.now()}`,
      customerEmail,
    });

    // status can be 'processing' (still fulfilling) — poll the order a few
    // times before giving up, per the API docs
    let status = result.status;
    let accounts: string[] = [...result.accounts];
    const orderId = result.orderId;

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
      return { ok: true, accounts, orderId, message: `خرید موفق — ${accounts.length} اکانت تحویل شد` };
    }
    if (status === "processing") {
      return { ok: false, orderId, message: `سفارش ${orderId} نزد تأمین‌کننده در حال پردازش است — کلیدها بعداً از طریق وب‌هوک تحویل داده می‌شود` };
    }
    return { ok: false, orderId, message: `تحویل ناموفق بود (وضعیت: ${status})` };
  } catch (e: any) {
    return { ok: false, message: `ارتباط با تأمین‌کننده: ${e?.message || "خطای نامشخص"}` };
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
