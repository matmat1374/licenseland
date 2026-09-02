/**
 * Safely serialize data for application/ld+json script tags.
 * Replaces '<', '>', and '&' with unicode escapes to prevent </script> tag breakout (XSS).
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
