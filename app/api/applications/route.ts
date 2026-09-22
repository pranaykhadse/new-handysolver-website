import { getSupabase } from "@/lib/supabase";

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
    const { error } = await getSupabase().from("job_applications").insert({
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
    });
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("job_applications insert failed:", msg);
    return Response.json({ ok: false, error: "store failed" }, { status: 500 });
  }
}
