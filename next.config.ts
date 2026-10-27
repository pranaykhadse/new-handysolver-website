import type { NextConfig } from "next";
import { REDIRECTS } from "./lib/redirects";

// Content Security Policy. Next.js injects small inline scripts to start the page, so script-src needs
// 'unsafe-inline' until the site moves to per-request nonces. Everything else is limited to the hosts the
// site really talks to: Supabase (photos, CV uploads), the recruitment portal, and the video players
// that testimonials can embed. Production only, because the dev server needs inline eval and websockets.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "media-src 'self' blob: https:",
  "connect-src 'self' https://*.supabase.co https://handysolver.myhandydash.com",
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.loom.com https://fast.wistia.net https://drive.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://handysolver.myhandydash.com",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  // Resize and convert pictures on demand (see lib/image.ts). Supabase holds the uploaded photos.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    qualities: [75],
  },
  // Put the stylesheet in the page itself so the first paint does not wait for separate CSS downloads.
  experimental: { inlineCss: true },
  async headers() {
    return [
      {
        // Pictures that rarely change: let browsers and the CDN keep them for a month.
        source: "/:file(.+\\.(?:webp|png|jpg|jpeg|svg|ico))",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }],
      },
      {
        source: "/legacy/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }],
      },
      {
        source: "/:path*",
        headers: [
          ...(process.env.NODE_ENV === "production" ? [{ key: "Content-Security-Policy", value: CSP }] : []),
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), display-capture=(), geolocation=(), magnetometer=(), microphone=(), midi=(), payment=(), usb=(), interest-cohort=()" },
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
