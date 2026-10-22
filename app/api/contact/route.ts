import nodemailer from "nodemailer";

const SMTP_USER = process.env.SMTP_USER ?? "";
const SMTP_PASS = process.env.SMTP_PASS ?? "";
const CONTACT_TO = process.env.CONTACT_TO ?? "connect@handysolver.com";

const TOPICS = ["Connect our systems", "Build something custom", "Automate the busywork", "Still figuring it out"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Light in-memory limit per visitor. It resets when the server restarts, which is enough to stop casual flooding.
const recent = new Map<string, number[]>();
function tooMany(ip: string): boolean {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter(t => now - t < 60 * 60 * 1000);
  const blocked = hits.length >= 5;
  if (!blocked) hits.push(now);
  recent.set(ip, hits);
  return blocked;
}

const oneLine = (value: unknown, max: number) =>
  String(value ?? "").replace(/[\r\n\t]+/g, " ").trim().slice(0, max);

function fail(error: string, status: number) {
  return Response.json({ error }, { status });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) return fail("Not allowed.", 403);

  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return fail("That did not look right. Please try again.", 400);
  }

  // Real visitors never see this hidden field, so anything in it means a bot.
  if (typeof data.website === "string" && data.website.trim() !== "") return Response.json({ ok: true });

  const name = oneLine(data.name, 100);
  const email = oneLine(data.email, 200);
  const company = oneLine(data.company, 150);
  const topic = oneLine(data.topic, 60);
  const message = String(data.message ?? "").replace(/\r\n/g, "\n").trim().slice(0, 1800);

  if (!name) return fail("Please tell us your name.", 400);
  if (!EMAIL_PATTERN.test(email)) return fail("Please enter a valid email address so we can reply.", 400);
  if (!message) return fail("Please add a short message.", 400);
  if (!TOPICS.includes(topic)) return fail("Please pick what you would like to talk about.", 400);

  const ip = (request.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  if (tooMany(ip)) return fail("You have sent a few messages already. Please try again later or use WhatsApp.", 429);

  if (!SMTP_USER || !SMTP_PASS) {
    return fail("Sending from this page is not available right now. Please use WhatsApp or write to connect@handysolver.com.", 503);
  }

  try {
    const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: SMTP_USER, pass: SMTP_PASS } });
    await transporter.sendMail({
      from: `"HandySolver website" <${SMTP_USER}>`,
      to: CONTACT_TO,
      replyTo: { name, address: email },
      subject: `Website enquiry: ${topic} (${name})`,
      text: [
        "New enquiry from the HandySolver website",
        "",
        `Topic: ${topic}`,
        `Name: ${name}`,
        `Company: ${company || "-"}`,
        `Email: ${email}`,
        "",
        "Message:",
        message,
      ].join("\n"),
    });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Contact email failed:", error instanceof Error ? error.message : error);
    return fail("We could not send that just now. Please try WhatsApp or write to connect@handysolver.com.", 502);
  }
}
