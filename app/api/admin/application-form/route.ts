import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isAdminRequest, isCsrfValid, unauthorized, forbidden, badRequest, serverError } from "@/lib/admin";
import { DEFAULT_FORM_CONFIG, sanitizeConfig } from "@/lib/application-form";

// Admin-only: read and save the job application form layout.

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorized();
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("application_form_config")
      .select("config")
      .eq("id", "main")
      .maybeSingle();
    if (error) {
      // Table not created yet: show the default layout and tell the admin to run the setup SQL.
      return Response.json({ config: DEFAULT_FORM_CONFIG, needsSetup: true });
    }
    return Response.json({ config: data?.config ? sanitizeConfig(data.config) : DEFAULT_FORM_CONFIG, needsSetup: false });
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorized();
  if (!(await isCsrfValid(request))) return forbidden();
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || !("config" in body)) return badRequest("Missing form layout");
    const config = sanitizeConfig((body as { config: unknown }).config);
    const { error } = await getSupabaseAdmin()
      .from("application_form_config")
      .upsert({ id: "main", config, updated_at: new Date().toISOString() });
    if (error) throw error;
    return Response.json({ ok: true, config });
  } catch (error) {
    return serverError(error);
  }
}
