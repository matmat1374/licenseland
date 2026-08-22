import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Security headers (H4 fix). CSP note: Next.js injects inline hydration
// scripts/styles, so script-src/style-src need 'unsafe-inline' for now;
// a nonce-based CSP is the follow-up hardening step.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
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

const nextConfig: NextConfig = {
  // Note: don't set output: "standalone" — the deploy platform handles this itself.
  // Setting it can cause "deployment failed" on platforms like space-z.ai.
  // H1 fix: type errors must fail the build. The previous ignoreBuildErrors:true
  // hid real compile errors (e.g. kernel BigInt target mismatch) from CI.
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
    ];
  },
};

export default nextConfig;
