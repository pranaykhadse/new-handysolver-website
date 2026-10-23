import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { DEFAULT_FORM_CONFIG, sanitizeConfig } from "@/lib/application-form";

// Public: the layout of the job application form, as set in the admin.
// Falls back to the built-in layout if nothing has been saved yet (or the
// table isn't set up), so the apply form always works.

const CACHE = { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=120" };

export async function GET() {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("application_form_config")
      .select("config")
      .eq("id", "main")
      .maybeSingle();
    if (error) throw error;
    if (data?.config) return Response.json({ config: sanitizeConfig(data.config) }, { headers: CACHE });
  } catch {
    // fall through to the default layout
  }
  return Response.json({ config: DEFAULT_FORM_CONFIG }, { headers: CACHE });
}
