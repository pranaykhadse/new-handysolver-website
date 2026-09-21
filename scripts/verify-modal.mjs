// Verifies the ApplyModal geometry on /careers/open-roles:
//  - overlay top edge == navbar bottom edge (viewport-relative, any scroll)
//  - card exactly centered between navbar bottom and viewport bottom
//  - background scroll frozen while open
// Usage: node scripts/verify-modal.mjs [url] [outPng]
import { chromium } from "playwright-core";

const URL = process.argv[2] ?? "http://127.0.0.1:3000/careers/open-roles";
const OUT = process.argv[3] ?? "C:\\Users\\HP\\AppData\\Local\\Temp\\opencode\\modal-check.png";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const page = await browser.newPage({ viewport: { width: 1536, height: 864 } });
page.setDefaultTimeout(20000);

await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForSelector(".or-job-trigger");

// Simulate "opened with this scroll": scroll mid-page first
await page.evaluate(() => window.scrollTo(0, 550));
await page.waitForTimeout(400);
const scrollBefore = await page.evaluate(() => window.scrollY);

// Expand first role, then open the apply modal
await page.locator(".or-job-trigger").first().click();
const applyBtn = page.locator(".or-job-content .or-button", { hasText: "Continue to apply" }).first();
await applyBtn.waitFor({ state: "visible" });
await applyBtn.click();
await page.waitForSelector(".am-overlay");
await page.waitForTimeout(400);

const m = await page.evaluate(() => {
  const r = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { top: b.top, bottom: b.bottom, left: b.left, right: b.right, height: b.height, width: b.width };
  };
  const overlay = r(".am-overlay");
  const card = r(".am-card");
  const nav = r(".hn-shell");
  const cs = getComputedStyle(document.documentElement);
  return {
    viewport: window.innerHeight,
    scrollY: window.scrollY,
    htmlOverflow: cs.overflow,
    nav, overlay, card,
  };
});

const result = { ...m, scrollBefore };
if (m.overlay && m.nav && m.card) {
  const regionTop = m.nav.bottom;
  const regionBottom = m.viewport;
  const regionCenter = (regionTop + regionBottom) / 2;
  const cardCenter = (m.card.top + m.card.bottom) / 2;
  result.checks = {
    overlayTopEqNavBottom: +(m.overlay.top - regionTop).toFixed(2),
    overlayBottomEqViewport: +(m.overlay.bottom - regionBottom).toFixed(2),
    cardCenterOffset: +(cardCenter - regionCenter).toFixed(2),
    scrollFrozen: m.scrollY === scrollBefore,
  };
}
console.log(JSON.stringify(result, null, 1));
await page.screenshot({ path: OUT });
console.log("screenshot: " + OUT);
await browser.close();

const c = result.checks;
if (!c || Math.abs(c.overlayTopEqNavBottom) > 1 || Math.abs(c.overlayBottomEqViewport) > 1 || Math.abs(c.cardCenterOffset) > 2 || !c.scrollFrozen) {
  console.error("GEOMETRY CHECK: FAIL");
  process.exit(2);
}
console.log("GEOMETRY CHECK: PASS");
