import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Security headers (H4 fix). CSP note: Next.js injects inline hydration
// scripts/styles, so script-src/style-src need 'unsafe-inline' for now;
// a nonce-based CSP is the follow-up hardening step.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  // Cross-origin isolation hardening (loop iteration 8 / SEC-01): the app opens
  // no popups/OAuth windows and embeds no cross-origin resources, so the
  // strictest values are safe and browser-verified below.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // 'unsafe-inline' is still required for Next's hydration bootstrap; a
      // nonce-based CSP is the next step. 'unsafe-eval' is only needed by the
      // dev server (Fast Refresh), so production runs without it.
      isProd
        ? "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com"
        : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://analytics.google.com",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=15552000; includeSubDomains" }]
    : []),
];

// Static-asset caching (loop iteration 9 / PERF-02). Next.js serves files under
// public/ with `Cache-Control: public, max-age=0` (verified live on
// /slider/brain.png), so every page view re-downloads the hero/slider PNGs
// (~0.3-0.9 MB each). Long-cache the binary asset types only; HTML, API and
// document routes are deliberately NOT matched, so no page becomes stale.
// 7 days (not `immutable`/1 year) because these filenames are stable public
// paths the owner may replace in place; stale-while-revalidate keeps repeat
// visits instant while a swapped file refreshes in the background.
// NOTE: this rule repeats the security headers so it is correct whether Next
// merges every matching rule or applies only the first match. Verified on a
// local prod build (`next start -p 3011`): /slider/brain.png -> `public,
// max-age=604800, stale-while-revalidate=86400` + all security headers, while
// /, /shop and /blog keep their own Cache-Control (no long-cache on HTML).
const staticAssetHeaders = [
  ...securityHeaders,
  {
    key: "Cache-Control",
    value: "public, max-age=604800, stale-while-revalidate=86400",
  },
];

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  // @ts-expect-error Next 15 type compatibility
  eslint: { ignoreDuringBuilds: true },
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*.(png|jpg|jpeg|gif|svg|ico|webp|avif|woff|woff2)",
        headers: staticAssetHeaders,
      },
      { source: "/:path*", headers: securityHeaders },
    ];
  },
};

export default nextConfig;
