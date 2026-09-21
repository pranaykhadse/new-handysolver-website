import { getSupabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await getSupabase()
      .from("gallery_photos")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return Response.json({ photos: data ?? [] });
  } catch (error) {
    return Response.json({ photos: [] });
  }
}
