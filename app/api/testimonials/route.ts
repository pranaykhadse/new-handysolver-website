import { getSupabase, isSupabaseConfigured, type DbTestimonial } from "@/lib/supabase";
import seed from "@/db/seed/testimonials.json";
import { curlyApostrophes, tidyLabel, tidyName } from "@/lib/tidy-text";

type TestimonialPayload = {
  id: string; name: string; initials: string; label: string; quote: string;
  avatarUrl: string | null; videoUrl: string | null; source: string; sourceLabel: string;
};

function shape(row: DbTestimonial): TestimonialPayload {
  return {
    id: row.id, name: tidyName(row.name), initials: row.initials, label: tidyLabel(row.label ?? ""),
    quote: curlyApostrophes(row.quote), avatarUrl: row.avatar_url ?? null, videoUrl: row.video_url ?? null,
    source: row.source ?? "", sourceLabel: row.source_label ?? "",
  };
}

export async function GET() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await getSupabase()
        .from("testimonials")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      if (Array.isArray(data) && data.length > 0) {
        return Response.json(
          { testimonials: (data as DbTestimonial[]).map(shape), source: "supabase" },
          { headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=120" } }
        );
      }
    } catch {
      // fall through to seed
    }
  }
  return Response.json(
    { testimonials: (seed as DbTestimonial[]).map(shape), source: "seed" },
    { headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=120" } }
  );
}
