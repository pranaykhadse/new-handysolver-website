// Canonical public URL of the website, used by sitemap.xml and robots.txt.
// IMPORTANT: set NEXT_PUBLIC_SITE_URL to the production domain in every
// deploy environment. Do NOT reuse NEXT_PUBLIC_BASE_URL here — it points at
// localhost during local dev, which must never leak into the sitemap.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://handysolver.com"
).replace(/\/$/, "");
