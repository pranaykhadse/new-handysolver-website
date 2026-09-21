import { getSupabase } from "@/lib/supabase";
import { isAdminRequest, isCsrfValid, unauthorized, forbidden, badRequest, serverError } from "@/lib/admin";

export async function PUT(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorized();
  if (!(await isCsrfValid(request))) return forbidden();
  try {
    const body = await request.json();
    if (!Array.isArray(body?.items)) return badRequest("items array is required");
    const items = body.items as { id: string; sort_order: number; src: string; caption: string }[];
    if (items.length === 0) return badRequest("items must not be empty");

    const { error } = await getSupabase()
      .from("gallery_photos")
      .upsert(
        items.map((item) => ({ id: item.id, sort_order: item.sort_order, src: item.src, caption: item.caption ?? "" })),
        { onConflict: "id" }
      );
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}
