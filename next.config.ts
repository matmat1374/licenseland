import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Note: don't set output: "standalone" — the deploy platform handles this itself.
  // Setting it can cause "deployment failed" on platforms like space-z.ai.
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
