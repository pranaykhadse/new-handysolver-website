// Legacy URL → new route map, applied as permanent (308) redirects via
// next.config.ts. Single source of truth.
//
// BACKGROUND: the live site uses a completely different URL scheme
// (flat .html pages) than this app (clean routes), so EVERY legacy page
// needs an explicit entry here — there is no pattern to automate.
// Inventory source: Google index (site:handysolver.com) + HTTP probing,
// DD-MM-YYYY. No sitemap.xml exists on the live site to cross-check.
//
// HOW TO USE:
// 1. Export Search Console > Pages and compare with this list. Any indexed
//    URL missing here = add it (especially individual blog posts — the new
//    app has no blog, see the /blog.html note).
// 2. Destinations marked VERIFY need a human call on closest-match.
// 3. Alternative with zero deploys: paste these same pairs into Cloudflare
//    Dashboard > Rules > Bulk Redirects (also 301-capable).

export type Redirect = { source: string; destination: string };

export const REDIRECTS: Redirect[] = [
  // Same page, new address.
  { source: "/index.html", destination: "/" },
  // Services listing → homepage solutions section covers it.
  { source: "/services.html", destination: "/" },
  // Placeholder lorem-ipsum page, zero SEO value → homepage.
  { source: "/work.html", destination: "/" },
  // VERIFY: old approach/process page → homepage carries that content.
  { source: "/client.html", destination: "/" },
  // VERIFY: founder stories → closest live page is the team page.
  { source: "/ideology.html", destination: "/team" },
  // VERIFY: asset freebies page, no equivalent → homepage.
  { source: "/resources.html", destination: "/" },
  // VERIFY: single case-study page → work showcase lives on homepage.
  { source: "/teaching-training-development-software.html", destination: "/" },
  // 1:1 page mappings.
  { source: "/gallery.html", destination: "/gallery" },
  { source: "/our-team.html", destination: "/team" },
  { source: "/career.html", destination: "/careers" },
  { source: "/reach-us.html", destination: "/lets-talk" },
  // VERIFY: blog index, but the new app has NO blog. If Search Console shows
  // traffic to /blog.html or individual posts, decide per URL: homepage
  // redirect vs 410 Gone (a sitewide redirect-to-home reads as soft-404).
  { source: "/blog.html", destination: "/" },
];
