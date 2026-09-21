import { getSupabase, isSupabaseConfigured, type DbTeamMember } from "@/lib/supabase";
import seed from "@/db/seed/team.json";

type TeamPayload = { id: string; name: string; photoUrl: string };

function shape(row: DbTeamMember): TeamPayload {
  return { id: row.id, name: row.name ?? "", photoUrl: row.photo_url ?? "" };
}

export async function GET() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await getSupabase()
        .from("team_members")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      if (Array.isArray(data) && data.length > 0) {
        return Response.json(
          { members: (data as DbTeamMember[]).map(shape), source: "supabase" },
          { headers: { "Cache-Control": "no-store" } }
        );
      }
    } catch {
      // fall through to seed
    }
  }
  return Response.json(
    { members: (seed as DbTeamMember[]).map(shape), source: "seed" },
    { headers: { "Cache-Control": "no-store" } }
  );
}
