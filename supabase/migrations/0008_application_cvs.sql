-- Resume backup for job applications.
-- Stores CV files in a PRIVATE Supabase Storage bucket (resumes are PII —
-- the bucket must never be public). Run this in the Supabase SQL Editor.

alter table public.job_applications
  add column if not exists cv_path text not null default '';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'application-cvs',
  'application-cvs',
  false,
  10485760,
  '{application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document}'
)
on conflict (id) do nothing;

-- Website visitors may upload CVs. Nobody may list or read via anon —
-- the admin panel reads through the service key with short-lived signed URLs.
drop policy if exists "Public upload application CVs" on storage.objects;
create policy "Public upload application CVs" on storage.objects
  for insert to anon with check (bucket_id = 'application-cvs');
