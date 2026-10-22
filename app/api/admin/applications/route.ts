import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isAdminRequest, isCsrfValid, unauthorized, forbidden, badRequest, serverError } from "@/lib/admin";

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

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EDITABLE_FIELDS = ["type", "fname", "lname", "email", "phone", "exp", "salary", "current_ctc", "hear", "location", "dob", "gender"] as const;

// Edit the details an applicant typed in. The CV file and submission time are not editable.
export async function PUT(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorized();
  if (!(await isCsrfValid(request))) return forbidden();
  try {
    const body = await request.json();
    const id = String(body?.id ?? "");
    if (!UUID_PATTERN.test(id)) return badRequest("A valid application id is required");

    const update: Record<string, string> = {};
    for (const field of EDITABLE_FIELDS) {
      if (body?.[field] === undefined) continue;
      update[field] = String(body[field] ?? "").trim().slice(0, 200);
    }
    if (update.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(update.email)) return badRequest("Enter a valid email address");
    if (Object.keys(update).length === 0) return badRequest("Nothing to update");

    const { error } = await getSupabaseAdmin().from("job_applications").update(update).eq("id", id);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}

// Permanently removes the application and its stored resume.
export async function DELETE(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorized();
  if (!(await isCsrfValid(request))) return forbidden();
  try {
    const id = new URL(request.url).searchParams.get("id") ?? "";
    if (!UUID_PATTERN.test(id)) return badRequest("A valid application id is required");

    const admin = getSupabaseAdmin();
    const { data: row, error: readError } = await admin.from("job_applications").select("cv_path").eq("id", id).maybeSingle();
    if (readError) throw readError;

    const { error } = await admin.from("job_applications").delete().eq("id", id);
    if (error) throw error;

    let cvRemoved = true;
    const path = typeof row?.cv_path === "string" ? row.cv_path : "";
    if (path) {
      const { error: storageError } = await admin.storage.from("application-cvs").remove([path]);
      cvRemoved = !storageError;
    }
    return Response.json({ ok: true, cvRemoved });
  } catch (error) {
    return serverError(error);
  }
}
