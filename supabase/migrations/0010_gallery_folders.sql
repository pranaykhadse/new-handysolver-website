-- Gallery folders: lets photos be moved between folders and lets admins create new (even empty) folders.
-- Run in Supabase Dashboard -> SQL Editor.

alter table public.gallery_photos add column if not exists category text;

create table if not exists public.gallery_folders (
  slug text primary key,
  label text not null,
  created_at timestamptz not null default now()
);

alter table public.gallery_folders enable row level security;

drop policy if exists "Public read access" on public.gallery_folders;
create policy "Public read access" on public.gallery_folders for select to anon using (true);

drop policy if exists "Public insert access" on public.gallery_folders;
create policy "Public insert access" on public.gallery_folders for insert to anon with check (true);

drop policy if exists "Public update access" on public.gallery_folders;
create policy "Public update access" on public.gallery_folders for update to anon using (true) with check (true);

drop policy if exists "Public delete access" on public.gallery_folders;
create policy "Public delete access" on public.gallery_folders for delete to anon using (true);
