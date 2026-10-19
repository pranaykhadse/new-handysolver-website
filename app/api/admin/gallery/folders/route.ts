import { getSupabase } from "@/lib/supabase";
import { isAdminRequest, isCsrfValid, unauthorized, forbidden, badRequest, serverError } from "@/lib/admin";

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorized();
  try {
    const { data, error } = await getSupabase().from("gallery_folders").select("*").order("created_at", { ascending: true });
    if (error) throw error;
    return Response.json({ rows: data ?? [] });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorized();
  if (!(await isCsrfValid(request))) return forbidden();
  try {
    const body = await request.json();
    const slug = String(body?.slug ?? "").trim();
    const label = String(body?.label ?? "").trim();
    if (!/^[a-z0-9-]{1,40}$/.test(slug)) return badRequest("Invalid folder name");
    if (!label || label.length > 60) return badRequest("Folder name is required (max 60 characters)");
    const { error } = await getSupabase().from("gallery_folders").insert({ slug, label });
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
    const slug = new URL(request.url).searchParams.get("slug");
    if (!slug) return badRequest("slug is required");
    const { count, error: countError } = await getSupabase()
      .from("gallery_photos").select("id", { count: "exact", head: true }).eq("category", slug);
    if (countError) throw countError;
    if ((count ?? 0) > 0) return badRequest("Move the photos out of this folder before deleting it");
    const { error } = await getSupabase().from("gallery_folders").delete().eq("slug", slug);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}
