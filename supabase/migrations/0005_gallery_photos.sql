-- HandySolver gallery photos table and RLS policies (run in Supabase Dashboard -> SQL Editor -> New query).
-- Creates the gallery_photos table with public read access and anon write access for admin CRUD.

-- ============ TABLE ============

create table if not exists public.gallery_photos (
  id text primary key,
  sort_order integer not null default 0,
  src text not null,
  caption text not null default '',
  created_at timestamptz not null default now()
);

-- ============ RLS ============

alter table public.gallery_photos enable row level security;

-- Public read access (for the public gallery page)
drop policy if exists "Public read access" on public.gallery_photos;
create policy "Public read access" on public.gallery_photos for select to anon using (true);

-- Write access for admin CRUD (anon key, gated by admin password in the API layer)
drop policy if exists "Public insert access" on public.gallery_photos;
create policy "Public insert access" on public.gallery_photos for insert to anon with check (true);

drop policy if exists "Public update access" on public.gallery_photos;
create policy "Public update access" on public.gallery_photos for update to anon using (true) with check (true);

drop policy if exists "Public delete access" on public.gallery_photos;
create policy "Public delete access" on public.gallery_photos for delete to anon using (true);
