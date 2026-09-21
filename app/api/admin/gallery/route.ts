import { getSupabase } from "@/lib/supabase";
import { isAdminRequest, isCsrfValid, unauthorized, forbidden, badRequest, serverError } from "@/lib/admin";

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorized();
  try {
    const { data, error } = await getSupabase()
      .from("gallery_photos")
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
    if (!body?.src) return badRequest("src is required");
    const { error } = await getSupabase().from("gallery_photos").insert(body);
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
    const { error } = await getSupabase().from("gallery_photos").upsert(body, { onConflict: "id" });
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
    const { error } = await getSupabase().from("gallery_photos").delete().eq("id", id);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}
