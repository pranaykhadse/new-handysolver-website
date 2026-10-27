// Canonical public URL of the website, used by sitemap.xml, robots.txt, canonical links and share cards.
// Set NEXT_PUBLIC_SITE_URL to the production domain in every deploy environment. Do NOT reuse
// NEXT_PUBLIC_BASE_URL here: it points at localhost during local dev, which must never leak into the sitemap.
// A preview address (*.vercel.app) is ignored so the live site never names itself after a preview deploy.
const PRODUCTION_URL = "https://handysolver.com";
const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const SITE_URL = (
  configured && !/\.vercel\.app\b/i.test(configured) ? configured : PRODUCTION_URL
).replace(/\/$/, "");
