/**
 * Torob (ترب) integration helpers.
 * --------------------------------
 * Torob's crawler reads the **no-JavaScript** version of a product page and looks
 * for plain meta tags (their support message, 2026-09-15):
 *
 *   product_id · product_name · og:image · product_price ·
 *   product_old_price · availability (instock|outofstock) · guarantee
 *
 * The same values feed the JSON feed at /api/torob so the crawler and the API
 * never disagree. Pure functions only — unit-tested by the kernel suite.
 */

export type TorobProductLike = {
  id: string;
  title: string;
  slug?: string | null;
  price?: number | null;
  discountPrice?: number | null;
  isActive?: boolean | null;
  stock?: number | null;
  _stock?: number | null;
  _effectivePrice?: number | null;
  fulfillmentMode?: string | null;
  image?: string | null;
  shortDesc?: string | null;
  features?: unknown;
};

export type TorobAvailability = "instock" | "outofstock";

/** True when the product can actually be bought right now. */
export function isPurchasable(p: TorobProductLike): boolean {
  if (p.isActive === false) return false;
  const stock = p._stock ?? p.stock ?? 0;
  return Number(stock) > 0;
}

export function torobAvailability(p: TorobProductLike): TorobAvailability {
  return isPurchasable(p) ? "instock" : "outofstock";
}

/**
 * Current selling price and, only when a real discount exists, the price before
 * it. Torob shows the struck-through price, so a fake "old price" would be a
 * misleading claim — we emit it only when discountPrice < price.
 */
export function torobPrices(p: TorobProductLike): { price: number | null; oldPrice: number | null } {
  const list = Number(p.price ?? 0);
  const discounted = p.discountPrice != null ? Number(p.discountPrice) : null;
  const effective = p._effectivePrice != null ? Number(p._effectivePrice) : (discounted ?? list);
  const price = Number.isFinite(effective) && effective > 0 ? Math.round(effective) : null;
  if (price == null) return { price: null, oldPrice: null };
  const oldPrice = discounted != null && discounted > 0 && list > discounted ? Math.round(list) : null;
  return { price, oldPrice };
}

function featureLines(p: TorobProductLike): string[] {
  const raw = p.features;
  if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === "string");
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((x): x is string => typeof x === "string");
    } catch {
      return raw.split("\n").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

/**
 * Guarantee text — emitted **only when it can be sourced honestly**:
 *   - an explicit "بدون گارانتی / no warranty" suppresses the tag entirely;
 *   - otherwise the first warranty-ish feature line is used;
 *   - if nothing states a guarantee, no tag is emitted (never invent one).
 */
export function torobGuarantee(p: TorobProductLike): string | null {
  const haystack = [p.title, p.shortDesc, ...featureLines(p)].join(" ");
  if (/بدون\s*گارانتی|no\s*warranty|without\s*warranty/i.test(haystack)) return null;
  const line = featureLines(p).find((l) => /(گارانتی|ضمانت|warranty)/i.test(l));
  if (line) return line.replace(/^[-•*\s]+/, "").trim().slice(0, 80);
  if (/(گارانتی|ضمانت)/.test(haystack)) return "گارانتی اصالت و فعال‌سازی";
  return null;
}

/** Absolute URL for images that were stored as a path. */
export function toAbsoluteUrl(url: string | null | undefined, baseUrl: string): string | null {
  if (!url) return null;
  const u = String(url).trim();
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  return `${baseUrl.replace(/\/+$/, "")}/${u.replace(/^\/+/, "")}`;
}

/**
 * Brand-level images shipped with the site. The catalogue currently has almost no
 * per-product photos (1 of 1049 rows has an `image`), so the crawler needs a
 * stable, honest fallback: a brand card rather than a made-up product photo.
 */
const BRAND_IMAGES: Array<{ re: RegExp; path: string }> = [
  { re: /claude/i, path: "/products-3d/claude.jpg" },
  { re: /chatgpt|openai|\bgpt\b/i, path: "/products-3d/chatgpt.jpg" },
  { re: /cursor/i, path: "/products-3d/cursor.jpg" },
  { re: /gemini/i, path: "/products-3d/gemini.jpg" },
  { re: /youtube/i, path: "/products-3d/youtube.jpg" },
  { re: /telegram|t\.me/i, path: "/products-3d/telegram.jpg" },
  { re: /tiktok/i, path: "/products-3d/tiktok.jpg" },
  { re: /capcut/i, path: "/products-3d/capcut.jpg" },
  { re: /discord|nitro/i, path: "/products-3d/discord.jpg" },
  { re: /spotify/i, path: "/products-3d/spotify.jpg" },
  { re: /duolingo/i, path: "/products-3d/duolingo.jpg" },
  { re: /linkedin/i, path: "/products-3d/linkedin.jpg" },
  { re: /instagram/i, path: "/products-3d/instagram.jpg" },
  { re: /notion/i, path: "/products-3d/notion.jpg" },
  { re: /canva/i, path: "/products-3d/canva.jpg" },
  { re: /figma/i, path: "/products-3d/figma.jpg" },
  { re: /adobe|photoshop/i, path: "/products-3d/adobe.jpg" },
  { re: /microsoft|office|windows|azure/i, path: "/products-3d/microsoft.jpg" },
  { re: /apple|icloud/i, path: "/products-3d/apple.jpg" },
];

/** Product photo → brand card → site default. Never returns null. */
export function resolveTorobImage(p: TorobProductLike, baseUrl: string): string {
  const own = toAbsoluteUrl(p.image, baseUrl);
  if (own) return own;
  const haystack = `${p.title || ""} ${p.shortDesc || ""}`;
  const brand = BRAND_IMAGES.find((b) => b.re.test(haystack));
  return toAbsoluteUrl(brand ? brand.path : "/og-default.png", baseUrl)!;
}

export function torobPageUrl(slug: string | null | undefined, baseUrl: string): string | null {
  if (!slug) return null;
  return `${baseUrl.replace(/\/+$/, "")}/product/${slug}`;
}

/**
 * The `<meta name="...">` tags Torob asks for. Returned as a plain object so it
 * can be handed straight to Next's `metadata.other`.
 */
export function buildTorobMetaTags(p: TorobProductLike, baseUrl: string): Record<string, string> {
  const { price, oldPrice } = torobPrices(p);
  const tags: Record<string, string> = {
    product_id: String(p.id),
    product_name: String(p.title || "").trim(),
    availability: torobAvailability(p),
  };
  if (price != null) tags.product_price = String(price);
  if (oldPrice != null) tags.product_old_price = String(oldPrice);
  const guarantee = torobGuarantee(p);
  if (guarantee) tags.guarantee = guarantee;
  // NOTE: og:image is intentionally NOT emitted here — it belongs in
  // openGraph.images so Next renders it as <meta property="og:image">, which is
  // the form Torob reads. Both point at resolveTorobImage().
  return tags;
}

/** One item of the JSON feed served at /api/torob. */
export function buildTorobFeedItem(p: TorobProductLike, baseUrl: string) {
  const { price, oldPrice } = torobPrices(p);
  const pageUrl = torobPageUrl(p.slug, baseUrl);
  const item: Record<string, unknown> = {
    product_id: String(p.id),
    product_name: String(p.title || "").trim(),
    page_url: pageUrl,
    price,
    availability: torobAvailability(p),
  };
  if (oldPrice != null) item.old_price = oldPrice;
  const image = resolveTorobImage(p, baseUrl);
  if (image) item.image_link = image;
  const guarantee = torobGuarantee(p);
  if (guarantee) item.guarantee = guarantee;
  return item;
}

/** Only products Torob should ever see: live listings. */
export function isTorobEligible(p: TorobProductLike): boolean {
  return p.isActive !== false && Boolean(p.title);
}
