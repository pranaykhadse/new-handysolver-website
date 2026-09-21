import { getSupabase, isSupabaseConfigured, type DbCaseStudy } from "@/lib/supabase";
import seed from "@/db/seed/case-studies.json";

type CaseStudyPayload = {
  id: string; label: string; metric: string; title: string;
  before: string; changed: string; result: string; tags: string[]; icon: string;
};

function shape(row: DbCaseStudy): CaseStudyPayload {
  return {
    id: row.id, label: row.label, metric: row.metric, title: row.title,
    before: row.before_text, changed: row.changed, result: row.result,
    tags: Array.isArray(row.tags) ? row.tags : [], icon: row.icon,
  };
}

export async function GET() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await getSupabase()
        .from("case_studies")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      if (Array.isArray(data) && data.length > 0) {
        return Response.json(
          { studies: (data as DbCaseStudy[]).map(shape), source: "supabase" },
          { headers: { "Cache-Control": "no-store" } }
        );
      }
    } catch {
      // fall through to seed
    }
  }
  return Response.json(
    { studies: (seed as DbCaseStudy[]).map(shape), source: "seed" },
    { headers: { "Cache-Control": "no-store" } }
  );
}
