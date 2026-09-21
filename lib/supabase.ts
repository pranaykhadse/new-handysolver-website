import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Public connection info. The URL is the project endpoint; the anon key is
// safe to embed (it is public by design — row-level security protects the data).
// Prefer env vars when set so deploys can override without code changes.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return client;
}

export function isSupabaseConfigured(): boolean {
  return SUPABASE_ANON_KEY.length > 0;
}

export type DbCaseStudy = {
  id: string;
  sort_order: number;
  icon: string;
  label: string;
  metric: string;
  title: string;
  before_text: string;
  changed: string;
  result: string;
  tags: string[];
};

export type DbTestimonial = {
  id: string;
  sort_order: number;
  name: string;
  initials: string;
  label: string;
  quote: string;
  avatar_url: string | null;
  video_url: string | null;
  source: string;
  source_label: string;
};

export type DbTeamMember = {
  id: string;
  sort_order: number;
  name: string;
  photo_url: string;
};

export type DbGalleryPhoto = {
  id: string;
  sort_order: number;
  src: string;
  caption: string;
};

export type DbJobPost = {
  id: string;
  sort_order: number;
  title: string;
  icon: string;
  intro: string;
  role: string;
  requirements: string;
  good_to_have: string;
  skills: string;
  exp_min: number | null;
  exp_max: number | null;
  qualification: string;
  salary: string;
  location: string;
  job_type: string;
  is_active: boolean;
  field_flags: Record<string, boolean> | null;
};
