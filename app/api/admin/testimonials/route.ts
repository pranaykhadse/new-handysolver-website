import { getServerSupabase } from "@/lib/supabase-admin";
import { isAdminRequest, isCsrfValid, unauthorized, forbidden, badRequest, serverError } from "@/lib/admin";

// A testimonial can be video-only, but the quote column cannot be null, so an empty quote is stored as "".
const withQuote = (body: Record<string, unknown>) => ({ ...body, quote: typeof body.quote === "string" ? body.quote : "" });

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorized();
  try {
    const { data, error } = await getServerSupabase()
      .from("testimonials")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return Response.json({ rows: data });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorized();
  if (!(await isCsrfValid(request))) return forbidden();
  try {
    const body = await request.json();
    if (!body?.name || !(body?.quote || body?.video_url)) return badRequest("name and either a quote or a video are required");
    const { error } = await getServerSupabase().from("testimonials").insert(withQuote(body));
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorized();
  if (!(await isCsrfValid(request))) return forbidden();
  try {
    const body = await request.json();
    if (!body?.id) return badRequest("id is required");
    const { error } = await getServerSupabase().from("testimonials").upsert(withQuote(body), { onConflict: "id" });
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorized();
  if (!(await isCsrfValid(request))) return forbidden();
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return badRequest("id is required");
    const { error } = await getServerSupabase().from("testimonials").delete().eq("id", id);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}