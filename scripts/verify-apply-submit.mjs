// Self-test for the ApplyModal → myhandydash wiring WITHOUT touching the live DB:
// intercepts the POST to applicant-form-submit, asserts the multipart payload
// matches the HandyRecruiterController contract, then stubs {status:1}.
// Usage: node scripts/verify-apply-submit.mjs [url] [outPng]
import { chromium } from "playwright-core";

const URL = process.argv[2] ?? "http://127.0.0.1:3000/careers/open-roles";
const OUT = process.argv[3] ?? "C:\\Users\\HP\\AppData\\Local\\Temp\\opencode\\apply-submit-check.png";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const EXPECT_TEXT = {
  type: "AI and Web Developer Intern",
  fname: "Test",
  lname: "Candidate",
  email: "test@example.com",
  phone: "9999999999",
  exp: "12",
  salary: "50000",
  current_ctc: "40000",
  hear: "LinkedIn",
  location: "Gurugram",
  dob: "1994-09-10",
  gender: "Male",
};

let captured = null;
const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const page = await browser.newPage({ viewport: { width: 1536, height: 864 } });
page.setDefaultTimeout(20000);

await page.route("**/applicant-form-submit", async (route) => {
  const req = route.request();
  const body = req.postDataBuffer()?.toString("utf-8") ?? "";
  captured = {
    url: req.url(),
    method: req.method(),
    contentType: req.headers()["content-type"] ?? "",
    body,
  };
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ status: 1, message: "stubbed thanks" }),
  });
});

// Passive observer for the silent Supabase mirror: let it hit the real
// /api/applications route, just record the outcome (200 = row saved,
// 500 = table missing or insert failed — applicant never sees either).
let mirror = null;
await page.route("**/api/applications", async (route) => {
  const req = route.request();
  mirror = { payload: req.postData() ?? "" };
  const res = await route.fetch();
  mirror.status = res.status;
  return route.fulfill({ response: res });
});

await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForSelector(".or-job-trigger");
await page.locator(".or-job-trigger").first().click();
await page.locator(".or-job-content .or-button", { hasText: "Continue to apply" }).first().click();
await page.waitForSelector(".am-overlay");

// Fill every field (placeholders are unique per input)
await page.getByPlaceholder("Abhishek").fill(EXPECT_TEXT.fname);
await page.getByPlaceholder("Sharma").fill(EXPECT_TEXT.lname);
await page.getByPlaceholder("you@example.com").fill(EXPECT_TEXT.email);
await page.getByPlaceholder("+91 98765 43210").fill(EXPECT_TEXT.phone);
await page.getByPlaceholder("12").fill(EXPECT_TEXT.exp);
await page.getByPlaceholder("50000").fill(EXPECT_TEXT.salary);
await page.getByPlaceholder("40000").fill(EXPECT_TEXT.current_ctc);
await page.getByPlaceholder("LinkedIn, friend, etc.").fill(EXPECT_TEXT.hear);
await page.getByPlaceholder("Gurugram, India").fill(EXPECT_TEXT.location);
await page.locator('.am-form input[type="date"]').fill(EXPECT_TEXT.dob);
await page.locator(".am-form select").selectOption({ label: EXPECT_TEXT.gender });
await page.locator('.am-form input[type="file"]').setInputFiles({
  name: "cv.pdf",
  mimeType: "application/pdf",
  buffer: Buffer.from("%PDF-1.4 stub cv for automated check"),
});

await page.locator(".am-form button[type=submit]").click();
await page.waitForSelector(".am-done");
await page.waitForTimeout(300);

const failures = [];
if (!captured) {
  failures.push("no request to applicant-form-submit was made");
} else {
  if (captured.method !== "POST") failures.push(`method=${captured.method}, want POST`);
  if (!captured.url.startsWith("https://handysolver.myhandydash.com/api/web/v1/handy-recruiters/applicant-form-submit"))
    failures.push(`url=${captured.url}`);
  if (!captured.contentType.includes("multipart/form-data")) failures.push(`content-type=${captured.contentType}`);
  for (const [k, v] of Object.entries(EXPECT_TEXT)) {
    if (k === "type") {
      // jobTitle comes from the first listed role — just require the field present
      if (!captured.body.includes('name="type"')) failures.push("missing field: type");
      continue;
    }
    if (!captured.body.includes(`name="${k}"`)) failures.push(`missing field: ${k}`);
    else if (!captured.body.includes(v)) failures.push(`field ${k} missing value ${v}`);
  }
  if (!captured.body.includes('name="attachment"')) failures.push("missing file part: attachment");
  if (!captured.body.includes('filename="cv.pdf"')) failures.push("file part missing filename cv.pdf");
}
const doneText = await page.locator(".am-done").innerText();
if (!doneText.includes("stubbed thanks")) failures.push("done panel did not show server message");

console.log(JSON.stringify({ failures, mirror, doneText: doneText.slice(0, 120) }, null, 1));
await page.screenshot({ path: OUT });
console.log("screenshot: " + OUT);
await browser.close();

if (failures.length) {
  console.error("APPLY SUBMIT CHECK: FAIL");
  process.exit(2);
}
console.log("APPLY SUBMIT CHECK: PASS");
