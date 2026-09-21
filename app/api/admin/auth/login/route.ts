import { setAuthCookies, hashToken, verifyPassword } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

const ADMIN_KEY = process.env.ADMIN_KEY ?? "HandySolver@2026";

async function checkPassword(email: string, password: string): Promise<boolean> {
  const { data } = await getSupabase()
    .from("admin_emails")
    .select("password_hash")
    .eq("email", email)
    .single();

  if (!data) return false;

  // If this admin has set their own password, verify it
  if (data.password_hash) return verifyPassword(password, data.password_hash);

  // Fall back to shared ADMIN_KEY for admins who haven't set a password yet
  return password === ADMIN_KEY;
}

export async function POST(request: Request) {
  try {
    const { email, password, rememberMe } = await request.json();

    if (!(await checkPassword(email, password))) {
      return Response.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const baseResponse = new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    const { refreshToken, response } = await setAuthCookies(baseResponse, rememberMe);

    try {
      const tokenHash = await hashToken(refreshToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await getSupabase()
        .from("admin_sessions")
        .insert({ token_hash: tokenHash, admin_id: email, expires_at: expiresAt });
      if (error) console.warn("admin_sessions insert failed:", error.message);
    } catch (e) {
      console.warn("admin_sessions insert skipped:", (e as Error).message);
    }

    return response;
  } catch (error) {
    const raw = error as { message?: string };
    return Response.json({ error: raw?.message ?? "Login failed" }, { status: 500 });
  }
}
