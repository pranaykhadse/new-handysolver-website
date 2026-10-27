import { getServerSupabase } from "@/lib/supabase-admin";
import { isAdminRequest, isCsrfValid, unauthorized, forbidden, badRequest, serverError } from "@/lib/admin";

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorized();
  try {
    const { data, error } = await getServerSupabase().from("gallery_folders").select("*");
    if (error) throw error;
    const rows = [...(data ?? [])].sort((a, b) => (a.sort_order || 1e6) - (b.sort_order || 1e6) || String(a.created_at).localeCompare(String(b.created_at)));
    return Response.json({ rows });
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
    if (!/^[a-z0-9_-]{1,40}$/.test(slug)) return badRequest("Invalid folder name");
    if (!label || label.length > 60) return badRequest("Folder name is required (max 60 characters)");
    const { error } = await getServerSupabase().from("gallery_folders").insert({ slug, label });
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
    const list = Array.isArray(body?.folders) ? body.folders : [];
    if (list.length === 0 || list.length > 200) return badRequest("folders must be a non-empty list");
    const rows = [];
    for (const f of list) {
      const slug = String(f?.slug ?? "").trim();
      const label = String(f?.label ?? "").trim();
      const sort_order = Number(f?.sort_order);
      if (!/^[a-z0-9_-]{1,40}$/.test(slug)) return badRequest("Invalid folder name");
      if (!label || label.length > 60) return badRequest("Folder name is required (max 60 characters)");
      if (!Number.isInteger(sort_order) || sort_order < 1) return badRequest("Invalid folder position");
      rows.push({ slug, label, sort_order });
    }
    const { error } = await getServerSupabase().from("gallery_folders").upsert(rows, { onConflict: "slug" });
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
    const { count, error: countError } = await getServerSupabase()
      .from("gallery_photos").select("id", { count: "exact", head: true }).eq("category", slug);
    if (countError) throw countError;
    if ((count ?? 0) > 0) return badRequest("Move the photos out of this folder before deleting it");
    const { error } = await getServerSupabase().from("gallery_folders").delete().eq("slug", slug);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}
