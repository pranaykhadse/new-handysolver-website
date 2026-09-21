import { verifyResetToken, hashPassword } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { resetToken, newPassword } = await request.json();

    if (!newPassword || newPassword.length < 8) {
      return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const { valid, email } = await verifyResetToken(resetToken);
    if (!valid || !email) {
      return Response.json({ error: "Reset link has expired. Please request a new one." }, { status: 401 });
    }

    const hash = await hashPassword(newPassword);

    const { error } = await getSupabase()
      .from("admin_emails")
      .update({ password_hash: hash })
      .eq("email", email);

    if (error) {
      console.error("[reset-password] supabase error:", error);
      return Response.json({ error: "Failed to save password. Try again." }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[reset-password]", error);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}
