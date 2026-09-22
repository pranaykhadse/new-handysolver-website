import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isAdminRequest, unauthorized, serverError } from "@/lib/admin";

// Admin-only read of website job applications (applicant PII —
// anon has no SELECT policy, so this goes through the service client).
// Each row that has a stored CV gets a short-lived signed resume URL
// (the bucket is private; failures attach nothing and never fail the list).
// GET needs no CSRF check (safe method).

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorized();
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("job_applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;

    const rows = Array.isArray(data) ? data : [];
    const withUrls = await Promise.all(
      rows.map(async (row: Record<string, unknown>) => {
        const path = typeof row.cv_path === "string" ? row.cv_path : "";
        if (!path) return row;
        try {
          const { data: signed, error: signError } = await admin.storage
            .from("application-cvs")
            .createSignedUrl(path, 3600);
          if (signError || !signed?.signedUrl) return row;
          return { ...row, cv_url: signed.signedUrl };
        } catch {
          return row;
        }
      })
    );
    return Response.json({ rows: withUrls });
  } catch (error) {
    return serverError(error);
  }
}
