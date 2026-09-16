/**
 * Product-page meta hygiene (SEO-05).
 * --------------------------------
 * Before this module the `<meta name="description">` (and the Twitter card
 * description) of every product page was the raw `shortDesc` column. In the
 * live catalogue that value is frequently empty, shorter than the title, or is
 * literally the product name -- so dozens of product URLs shipped a description
 * that was a duplicate of their own <title>, which search engines treat as a
 * missing/duplicate description.
 *
 * `buildProductMetaDescription()` keeps a genuinely informative shortDesc and,
 * ONLY when it is too weak or a duplicate, composes a unique description from
 * the product title plus the site's own approved description copy. Pure
 * functions, no imports -- unit-tested by the kernel suite.
 */

export type ProductMetaInput = {
  title?: string | null;
  shortDesc?: string | null;
};

/** Hard ceiling for a meta description (Google truncates beyond ~160). */
export const META_DESCRIPTION_MAX = 160;

/** Below this length a description is considered uninformative. */
export const MIN_USEFUL_DESCRIPTION = 50;

/** Collapse all whitespace runs and trim. */
export function cleanMetaText(value: string | null | undefined): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

/**
 * True when the raw shortDesc must NOT be used verbatim: it is empty, too
 * short to inform a searcher, or an (near-)duplicate of the product title.
 */
export function isWeakProductDescription(
  shortDesc: string | null | undefined,
  title: string | null | undefined
): boolean {
  const desc = cleanMetaText(shortDesc);
  if (!desc) return true;
  if (desc.length < MIN_USEFUL_DESCRIPTION) return true;
  const t = cleanMetaText(title).toLowerCase();
  const d = desc.toLowerCase();
  if (t && (d === t || d.includes(t) || t.includes(d))) return true;
  return false;
}

/** Trim to `max` characters on a word boundary, appending an ellipsis. */
export function clampMetaDescription(value: string, max: number = META_DESCRIPTION_MAX): string {
  const text = cleanMetaText(value);
  if (max <= 1 || text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const at = cut.lastIndexOf(" ");
  const body = at > max * 0.6 ? cut.slice(0, at) : cut;
  return `${body.trimEnd()}\u2026`;
}

/**
 * Final meta description for a product page. Returns the (cleaned) shortDesc
 * when it is informative, otherwise a unique `title -- siteDescription` pair.
 */
export function buildProductMetaDescription(
  product: ProductMetaInput,
  opts: { siteDescription?: string | null } = {}
): string {
  const title = cleanMetaText(product.title);
  const shortDesc = cleanMetaText(product.shortDesc);
  if (!isWeakProductDescription(shortDesc, title)) {
    return clampMetaDescription(shortDesc);
  }
  const tail = cleanMetaText(opts.siteDescription);
  const composed = title && tail ? `${title} \u2014 ${tail}` : title || tail;
  return clampMetaDescription(composed);
}
