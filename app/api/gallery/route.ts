import { legacyAsset } from "@/lib/legacy-assets";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await getSupabase()
      .from("gallery_photos")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    // Hidden photos never reach the public site. Rows without the flag (older databases) count as visible.
    // Pictures that lived on the old website and could not be recovered are left out rather than shown broken.
    const photos = (data ?? [])
      .filter((p: { is_active?: boolean }) => p.is_active !== false)
      .map((p: { src: string }) => ({ ...p, src: legacyAsset(p.src) }))
      .filter((p: { src: string }) => p.src);

    let folders: { slug: string; label: string; sort_order?: number }[] = [];
    try {
      const res = await getSupabase().from("gallery_folders").select("*");
      if (!res.error && res.data) folders = res.data.map((f: { slug: string; label: string; sort_order?: number }) => ({ slug: f.slug, label: f.label, sort_order: f.sort_order }));
    } catch { /* folders table not created yet */ }
    return Response.json({ photos, folders }, { headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=120" } });
  } catch (error) {
    return Response.json({ photos: [], folders: [] });
  }
}
