import { getSupabase, isSupabaseConfigured, type DbCaseStudy, type DbTeamMember, type DbTestimonial } from "@/lib/supabase";
import { legacyAsset } from "@/lib/legacy-assets";
import caseStudySeed from "@/db/seed/case-studies.json";
import teamSeed from "@/db/seed/team.json";
import testimonialSeed from "@/db/seed/testimonials.json";
import { curlyApostrophes, tidyLabel, tidyName } from "@/lib/tidy-text";

// Shared by the public API routes and the home page, so the page can arrive with this content already in
// it (no waiting for a second request, no layout jump when it appears).

export type CaseStudyPayload = {
  id: string; label: string; metric: string; title: string;
  before: string; changed: string; result: string; tags: string[]; icon: string;
};

export type TestimonialPayload = {
  id: string; name: string; initials: string; label: string; quote: string;
  avatarUrl: string | null; videoUrl: string | null; source: string; sourceLabel: string;
};

function shapeCaseStudy(row: DbCaseStudy): CaseStudyPayload {
  return {
    id: row.id, label: row.label, metric: row.metric, title: row.title,
    before: row.before_text, changed: row.changed, result: row.result,
    tags: Array.isArray(row.tags) ? row.tags : [], icon: row.icon,
  };
}

const OLD_SITE_ANCHOR = /^https?:\/\/(www\.)?handysolver\.com\/?#/i;

function shapeTestimonial(row: DbTestimonial): TestimonialPayload {
  // Links to the old site's testimonials section no longer lead anywhere useful, so they are dropped.
  const staleLink = OLD_SITE_ANCHOR.test(row.source ?? "");
  return {
    id: row.id, name: tidyName(row.name), initials: row.initials, label: tidyLabel(row.label ?? ""),
    quote: curlyApostrophes(row.quote), avatarUrl: legacyAsset(row.avatar_url) || null, videoUrl: row.video_url ?? null,
    source: staleLink ? "" : (row.source ?? ""),
    sourceLabel: staleLink ? "" : (row.source_label ?? ""),
  };
}

export async function getCaseStudies(): Promise<{ studies: CaseStudyPayload[]; source: "supabase" | "seed" }> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await getSupabase().from("case_studies").select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      if (Array.isArray(data) && data.length > 0) return { studies: (data as DbCaseStudy[]).map(shapeCaseStudy), source: "supabase" };
    } catch {
      // fall through to the bundled copy
    }
  }
  return { studies: (caseStudySeed as DbCaseStudy[]).map(shapeCaseStudy), source: "seed" };
}

export async function getTestimonials(): Promise<{ testimonials: TestimonialPayload[]; source: "supabase" | "seed" }> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await getSupabase().from("testimonials").select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      if (Array.isArray(data) && data.length > 0) return { testimonials: (data as DbTestimonial[]).map(shapeTestimonial), source: "supabase" };
    } catch {
      // fall through to the bundled copy
    }
  }
  return { testimonials: (testimonialSeed as DbTestimonial[]).map(shapeTestimonial), source: "seed" };
}

export type TeamPayload = { id: string; name: string; surname: string; photoUrl: string };

function shapeMember(row: DbTeamMember): TeamPayload {
  return { id: row.id, name: row.name ?? "", surname: row.surname ?? "", photoUrl: row.photo_url ?? "" };
}

export async function getTeamMembers(): Promise<{ members: TeamPayload[]; source: "supabase" | "seed" }> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await getSupabase().from("team_members").select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      if (Array.isArray(data) && data.length > 0) return { members: (data as DbTeamMember[]).map(shapeMember), source: "supabase" };
    } catch {
      // fall through to the bundled copy
    }
  }
  return { members: (teamSeed as DbTeamMember[]).map(shapeMember), source: "seed" };
}
