// Server-only Supabase client using the service-role key (bypasses RLS).
// NEVER import this from a client component — it would leak the service key
// into the browser bundle. Only API routes under app/api may use it.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://szgcvfmvxdazxtlepxqg.supabase.co";

let admin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_KEY is not set");
  if (!admin) {
    admin = createClient(SUPABASE_URL, key);
  }
  return admin;
}
