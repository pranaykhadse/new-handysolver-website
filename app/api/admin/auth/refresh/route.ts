import { verifyRefreshToken, setAuthCookies, clearAuthCookies, parseCookies, hashToken } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const cookies = parseCookies(request.headers.get("Cookie"));
    const refreshToken = cookies.hs_refresh;
    if (!refreshToken) {
      return clearAuthCookies(new Response(JSON.stringify({ error: "No session" }), { status: 401 }));
    }

    const valid = await verifyRefreshToken(refreshToken);
    if (!valid) {
      return clearAuthCookies(new Response(JSON.stringify({ error: "Invalid session" }), { status: 401 }));
    }

    // Best-effort DB check — if table doesn't exist, still allow refresh via valid JWT
    let sessionValid = true;
    try {
      const tokenHash = await hashToken(refreshToken);
      const { data, error: dbError } = await getSupabase()
        .from("admin_sessions")
        .select("id")
        .eq("token_hash", tokenHash)
        .eq("revoked", false)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();
      if (dbError) {
        console.warn("admin_sessions query failed (run migration 0006):", dbError.message);
        // Table might not exist yet — trust the JWT alone
      } else if (!data) {
        sessionValid = false;
      }
    } catch (e) {
      console.warn("admin_sessions check skipped:", (e as Error).message);
    }

    if (!sessionValid) {
      return clearAuthCookies(new Response(JSON.stringify({ error: "Session expired" }), { status: 401 }));
    }

    // Issue new set of cookies (rotate refresh token too)
    const baseResponse = new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    const { refreshToken: newRefreshToken, response } = await setAuthCookies(baseResponse);

    // Best-effort: revoke old token, store new one
    try {
      const oldHash = await hashToken(refreshToken);
      await getSupabase().from("admin_sessions").update({ revoked: true }).eq("token_hash", oldHash);
      const newHash = await hashToken(newRefreshToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await getSupabase().from("admin_sessions").insert({ token_hash: newHash, admin_id: "admin", expires_at: expiresAt });
    } catch (e) {
      console.warn("admin_sessions rotation skipped:", (e as Error).message);
    }

    return response;
  } catch (error) {
    const raw = error as { message?: string };
    return Response.json({ error: raw?.message ?? "Refresh failed" }, { status: 500 });
  }
}
