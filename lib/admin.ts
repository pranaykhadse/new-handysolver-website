// Server-only helpers for the /admin API routes.
// Never import this from a client component — it would leak secrets to the browser.

import { verifyAccessToken, verifyCsrfToken, parseCookies } from "./auth";

const ADMIN_KEY = process.env.ADMIN_KEY ?? "HandySolver@2026";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export async function isAdminRequest(request: Request): Promise<boolean> {
  // 1. Check Bearer token (for API clients)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return verifyAccessToken(authHeader.slice(7));
  }

  // 2. Check httpOnly cookie (primary flow for browser)
  const cookies = parseCookies(request.headers.get("Cookie"));
  if (cookies.hs_access) {
    return verifyAccessToken(cookies.hs_access);
  }

  // 3. Legacy fallback: x-admin-key header (plain password)
  const key = request.headers.get("x-admin-key");
  return Boolean(key) && key === ADMIN_KEY;
}

export async function isCsrfValid(request: Request): Promise<boolean> {
  // Safe methods don't need CSRF protection
  if (SAFE_METHODS.has(request.method)) return true;

  // SameSite=Lax cookies already block cross-site POST,
  // but we double-check with the double-submit pattern.
  const cookies = parseCookies(request.headers.get("Cookie"));
  const cookieToken = cookies.hs_csrf;
  const headerToken = request.headers.get("x-csrf-token");

  if (!cookieToken || !headerToken) return false;
  return cookieToken === headerToken && verifyCsrfToken(cookieToken);
}

export function unauthorized(): Response {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden(): Response {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}

export function badRequest(message: string): Response {
  return Response.json({ error: message }, { status: 400 });
}

export function serverError(error: unknown): Response {
  const raw = error as { message?: string; details?: string };
  const message = raw?.message ?? String(error);
  const detail = raw?.details ?? "";
  const text = `[${(error as any)?.code ?? "ERR"}] ${message}${detail ? " | " + detail : ""}`;
  return Response.json({ error: text }, { status: 500 });
}
