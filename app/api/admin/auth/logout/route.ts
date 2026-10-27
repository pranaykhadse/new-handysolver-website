import { clearAuthCookies, parseCookies, hashToken } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const cookies = parseCookies(request.headers.get("Cookie"));
    const refreshToken = cookies.hs_refresh;

    if (refreshToken) {
      try {
        const tokenHash = await hashToken(refreshToken);
        await getServerSupabase()
          .from("admin_sessions")
          .update({ revoked: true })
          .eq("token_hash", tokenHash);
      } catch (e) {
        console.warn("admin_sessions revoke skipped:", (e as Error).message);
      }
    }

    return clearAuthCookies(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
  } catch {
    return clearAuthCookies(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );
  }
}
