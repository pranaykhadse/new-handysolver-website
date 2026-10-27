import { getServerSupabase } from "@/lib/supabase-admin";

// Public endpoint: mirrors a website job application into Supabase.
// The myhandydash API is the primary store; this is only a silent copy,
// so callers must swallow all failures and never surface them to applicants.
// No auth/CSRF here — there is no session on the public careers page.

const MAX = 2000;
const str = (v: unknown): string =>
  typeof v === "string" ? v.trim().slice(0, MAX) : "";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const type = str(body?.type);
    const email = str(body?.email);
    if (!type || !email || !email.includes("@")) {
      return Response.json(
        { ok: false, error: "type and a valid email are required" },
        { status: 400 }
      );
    }
    // Answers to questions the admin added to the form: [{label, value}]
    const extra = (Array.isArray(body?.extra) ? body.extra.slice(0, 40) : [])
      .map((item: { label?: unknown; value?: unknown }) => ({ label: str(item?.label).slice(0, 200), value: str(item?.value) }))
      .filter((item: { label: string }) => item.label);
    const row: Record<string, unknown> = {
      type,
      fname: str(body?.fname),
      lname: str(body?.lname),
      email,
      phone: str(body?.phone),
      exp: str(body?.exp),
      salary: str(body?.salary),
      current_ctc: str(body?.current_ctc),
      hear: str(body?.hear),
      location: str(body?.location),
      dob: str(body?.dob),
      gender: str(body?.gender),
      cv_filename: str(body?.cv_filename),
      cv_path: str(body?.cv_path),
    };
    const supabase = getServerSupabase();
    let { error } = await supabase.from("job_applications").insert(extra.length ? { ...row, extra } : row);
    // The `extra` column is added by the form-builder setup SQL; if it isn't there yet, still save the core row.
    if (error && extra.length) ({ error } = await supabase.from("job_applications").insert(row));
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("job_applications insert failed:", msg);
    return Response.json({ ok: false, error: "store failed" }, { status: 500 });
  }
}
