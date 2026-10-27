import type { NextConfig } from "next";
import { REDIRECTS } from "./lib/redirects";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Canonical host consolidation FIRST: www → apex, so every www hit
      // (including deep legacy URLs) lands on one host before path rules run.
      // If Search Console shows www — not apex — as the primary indexed host,
      // flip this direction instead of deleting it.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.handysolver.com" }],
        destination: "https://handysolver.com/:path*",
        permanent: true,
      },
      // Legacy page map from lib/redirects.ts — passes link equity (308).
      ...REDIRECTS.map((r) => ({ ...r, permanent: true })),
    ];
  },
};

export default nextConfig;
