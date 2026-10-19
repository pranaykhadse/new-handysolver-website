import { getSupabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await getSupabase()
      .from("gallery_photos")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    let folders: { slug: string; label: string }[] = [];
    try {
      const res = await getSupabase().from("gallery_folders").select("slug,label");
      if (!res.error && res.data) folders = res.data;
    } catch { /* folders table not created yet */ }
    return Response.json({ photos: data ?? [], folders });
  } catch (error) {
    return Response.json({ photos: [], folders: [] });
  }
}
