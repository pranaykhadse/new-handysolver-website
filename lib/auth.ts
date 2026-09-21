// Server-only JWT + cookie helpers using jose.
// Never import this from a client component.

import { SignJWT, jwtVerify } from "jose";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const [salt, key] = hash.split(":");
    const derived = (await scryptAsync(password, salt, 64)) as Buffer;
    return timingSafeEqual(Buffer.from(key, "hex"), derived);
  } catch {
    return false;
  }
}

const ACCESS_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET ?? "hs-access-dev-secret-change-in-prod"
);
const REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET ?? "hs-refresh-dev-secret-change-in-prod"
);

const ADMIN_ID = "admin";
const CSRF_SECRET = new TextEncoder().encode(
  process.env.JWT_CSRF_SECRET ?? "hs-csrf-dev-secret-change-in-prod"
);

// ── JWT signing / verification ─────────────────────────────────────────

export async function signAccessToken(): Promise<string> {
  return new SignJWT({ sub: ADMIN_ID, typ: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(ACCESS_SECRET);
}

export async function signRefreshToken(): Promise<string> {
  return new SignJWT({ sub: ADMIN_ID, typ: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(REFRESH_SECRET);
}

export async function signCsrfToken(): Promise<string> {
  return new SignJWT({ sub: ADMIN_ID, typ: "csrf" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(CSRF_SECRET);
}

export async function verifyAccessToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET);
    return payload.typ === "access";
  } catch {
    return false;
  }
}

export async function verifyRefreshToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET);
    return payload.typ === "refresh";
  } catch {
    return false;
  }
}

export async function verifyCsrfToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, CSRF_SECRET);
    return payload.typ === "csrf";
  } catch {
    return false;
  }
}

const MAGIC_SECRET = new TextEncoder().encode(
  process.env.JWT_MAGIC_SECRET ?? "hs-magic-dev-secret-change-in-prod"
);

export async function signMagicToken(): Promise<string> {
  return new SignJWT({ sub: ADMIN_ID, typ: "magic" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(MAGIC_SECRET);
}

export async function verifyMagicToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, MAGIC_SECRET);
    return payload.typ === "magic";
  } catch {
    return false;
  }
}

const RESET_SECRET = new TextEncoder().encode(
  process.env.JWT_RESET_SECRET ?? "hs-reset-dev-secret-change-in-prod"
);

export async function signResetToken(email: string): Promise<string> {
  return new SignJWT({ sub: ADMIN_ID, typ: "reset", email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(RESET_SECRET);
}

export async function verifyResetToken(token: string): Promise<{ valid: boolean; email: string | null }> {
  try {
    const { payload } = await jwtVerify(token, RESET_SECRET);
    if (payload.typ !== "reset") return { valid: false, email: null };
    return { valid: true, email: (payload.email as string) ?? null };
  } catch {
    return { valid: false, email: null };
  }
}

export async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── Cookie helpers ─────────────────────────────────────────────────────

const IS_PROD = process.env.NODE_ENV === "production";

type CookieOptions = {
  name: string;
  value: string;
  maxAge: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
  path?: string;
};

export function buildCookie(opts: CookieOptions): string {
  const {
    name,
    value,
    maxAge,
    httpOnly = true,
    secure = IS_PROD,
    sameSite = "lax",
    path = "/",
  } = opts;

  return [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${path}`,
    `Max-Age=${maxAge}`,
    httpOnly ? "HttpOnly" : "",
    secure ? "Secure" : "",
    `SameSite=${sameSite.charAt(0).toUpperCase() + sameSite.slice(1)}`,
  ]
    .filter(Boolean)
    .join("; ");
}

export function setCookie(res: Response, opts: CookieOptions): Response {
  const headers = new Headers(res.headers);
  headers.append("Set-Cookie", buildCookie(opts));
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

export function clearCookie(res: Response, name: string): Response {
  return setCookie(res, { name, value: "", maxAge: 0 });
}

export function parseCookies(header: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;
  for (const pair of header.split(";")) {
    const [key, ...rest] = pair.split("=");
    const name = key.trim();
    if (name) cookies[name] = decodeURIComponent(rest.join("=").trim());
  }
  return cookies;
}

// ── Convenience: set all auth cookies on a response ────────────────────

export async function setAuthCookies(res: Response, rememberMe = true): Promise<{ accessToken: string; refreshToken: string; csrfToken: string; response: Response }> {
  const accessToken = await signAccessToken();
  const refreshToken = await signRefreshToken();
  const csrfToken = await signCsrfToken();

  const refreshMaxAge = rememberMe ? 30 * 24 * 60 * 60 : 4 * 60 * 60; // 30 days vs 4 hours
  const csrfMaxAge = rememberMe ? 30 * 24 * 60 * 60 : 4 * 60 * 60;

  const headers = new Headers(res.headers);
  headers.append("Set-Cookie", buildCookie({ name: "hs_access", value: accessToken, maxAge: 15 * 60 }));
  headers.append("Set-Cookie", buildCookie({ name: "hs_refresh", value: refreshToken, maxAge: refreshMaxAge }));
  headers.append("Set-Cookie", buildCookie({ name: "hs_csrf", value: csrfToken, maxAge: csrfMaxAge, httpOnly: false }));

  const response = new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  return { accessToken, refreshToken, csrfToken, response };
}

export function clearAuthCookies(res: Response): Response {
  const headers = new Headers(res.headers);
  for (const name of ["hs_access", "hs_refresh", "hs_csrf"]) {
    headers.append("Set-Cookie", buildCookie({ name, value: "", maxAge: 0 }));
  }
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}
