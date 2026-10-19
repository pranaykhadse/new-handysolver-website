-- Folder order and per-photo visibility for the gallery.
alter table public.gallery_folders add column if not exists sort_order integer not null default 0;
alter table public.gallery_photos add column if not exists is_active boolean not null default true;
