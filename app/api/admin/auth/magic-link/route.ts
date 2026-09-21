import { signMagicToken, hashToken } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import nodemailer from "nodemailer";

const SMTP_USER = process.env.SMTP_USER ?? "";
const SMTP_PASS = process.env.SMTP_PASS ?? "";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Check if email is registered as an admin
    const { data: adminRecord } = await getSupabase()
      .from("admin_emails")
      .select("email")
      .eq("email", email)
      .single();

    if (!adminRecord) {
      return Response.json({ error: 'That email is not registered as an admin.' }, { status: 403 });
    }

    const token = await signMagicToken();
    const tokenHash = await hashToken(token);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Store token hash in Supabase
    await getSupabase()
      .from("admin_magic_tokens")
      .insert({ token_hash: tokenHash, expires_at: expiresAt, email });

    // Build magic link — always use the public-facing base URL (port 3000)
    const origin = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(request.url).origin;
    const magicLink = `${origin}/api/admin/auth/magic-link/verify?token=${encodeURIComponent(token)}`;

    // Send email via Gmail SMTP (nodemailer)
    if (SMTP_USER && SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      });
      await transporter.sendMail({
        from: `"HandySolver Admin" <${SMTP_USER}>`,
        to: email,
        subject: "Reset your HandySolver admin password",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#faf8f5;">
            <div style="margin-bottom:24px;">
              <span style="background:#ff7a21;color:#fff;font-weight:700;padding:6px 10px;border-radius:6px;font-size:13px;letter-spacing:0.5px;">hs</span>
              <span style="font-size:15px;font-weight:600;color:#1a1208;margin-left:8px;">HandySolver Admin</span>
            </div>
            <h2 style="font-size:22px;font-weight:700;color:#1a1208;margin:0 0 12px;">Reset your password</h2>
            <p style="font-size:14px;color:#62615d;line-height:1.7;margin:0 0 28px;">
              Click the button below to set a new password for your HandySolver admin account.
              This link expires in <strong>15 minutes</strong> and can only be used once.
            </p>
            <a href="${magicLink}" style="display:inline-block;background:#ff7a21;color:#fff;font-weight:600;font-size:14px;padding:14px 28px;border-radius:10px;text-decoration:none;">
              Reset password →
            </a>
            <p style="font-size:12px;color:#999;margin:28px 0 0;line-height:1.6;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        `,
      });
    } else {
      console.warn("[magic-link] SMTP not configured — magic link:", magicLink);
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[magic-link] error:", error);
    return Response.json({ ok: true }); // Always succeed to avoid enumeration
  }
}
