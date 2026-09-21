import { verifyMagicToken, hashToken, signResetToken } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const origin = process.env.NEXT_PUBLIC_BASE_URL ?? url.origin;
  const adminUrl = `${origin}/admin`;

  function htmlRedirect(dest: string) {
    return new Response(
      `<!doctype html><html><head><meta http-equiv="refresh" content="0;url=${dest}"></head><body>Redirecting…</body></html>`,
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  try {
    const valid = await verifyMagicToken(token);
    if (!valid) return htmlRedirect(`${adminUrl}?magic=invalid`);

    const tokenHash = await hashToken(token);
    const supabase = getSupabase();

    const { data } = await supabase
      .from("admin_magic_tokens")
      .select("id, used, expires_at, email")
      .eq("token_hash", tokenHash)
      .single();

    if (!data || data.used || new Date(data.expires_at) < new Date()) {
      return htmlRedirect(`${adminUrl}?magic=expired`);
    }

    // Mark magic token as used
    await supabase.from("admin_magic_tokens").update({ used: true }).eq("id", data.id);

    // Issue a short-lived reset token carrying the admin's email
    const resetToken = await signResetToken(data.email);
    return htmlRedirect(`${adminUrl}?reset=${encodeURIComponent(resetToken)}`);
  } catch (error) {
    console.error("[magic-link/verify]", error);
    return htmlRedirect(`${adminUrl}?magic=error`);
  }
}
