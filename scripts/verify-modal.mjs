// Measures ApplyModal geometry: overlay top == navbar bottom,
// card centered in [navbar-bottom, viewport-bottom], scroll frozen.
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
await page.evaluate(() => window.scrollTo(0, 550));
await page.waitForTimeout(400);
const scrollBefore = await page.evaluate(() => window.scrollY);

await page.locator(".or-job-trigger").first().click();
await page.locator(".or-job-content .or-button", { hasText: "Continue to apply" }).first().click();
await page.waitForSelector(".am-overlay");
await page.waitForTimeout(400);

const m = await page.evaluate(() => {
  const r = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { top: b.top, bottom: b.bottom, height: b.height, width: b.width };
  };
  return {
    viewport: window.innerHeight,
    scrollY: window.scrollY,
    nav: r(".hn-shell"),
    overlay: r(".am-overlay"),
    card: r(".am-card"),
  };
});

const result = { ...m, scrollBefore };
if (m.overlay && m.nav && m.card) {
  const regionCenter = (m.nav.bottom + m.viewport) / 2;
  const cardCenter = (m.card.top + m.card.bottom) / 2;
  result.checks = {
    overlayTopEqNavBottom: +(m.overlay.top - m.nav.bottom).toFixed(2),
    overlayBottomEqViewport: +(m.overlay.bottom - m.viewport).toFixed(2),
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
