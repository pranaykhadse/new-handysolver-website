// Server-only Supabase client using the service-role key (bypasses RLS).
// NEVER import this from a client component — it would leak the service key
// into the browser bundle. Only API routes under app/api may use it.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

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

// For server routes that read or write private data (admin login, admin editing, job applications).
// Uses the service-role key when it is configured, so those tables can stay closed to the public key.
// Falls back to the public client only if the service key is missing, which keeps older setups working.
export function getServerSupabase(): SupabaseClient {
  return process.env.SUPABASE_SERVICE_KEY ? getSupabaseAdmin() : getSupabase();
}
