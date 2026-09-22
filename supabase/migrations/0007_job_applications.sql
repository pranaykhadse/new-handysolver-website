-- HandySolver job applications mirror table.
-- Every website application is saved here as a silent copy. The myhandydash
-- API remains the primary store (it also queues the admin email), so this
-- insert must never block the applicant — the client swallows all failures.
-- Run this in the Supabase SQL Editor, like 0005/0006.

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  type text not null default '',
  fname text not null default '',
  lname text not null default '',
  email text not null default '',
  phone text not null default '',
  exp text not null default '',
  salary text not null default '',
  current_ctc text not null default '',
  hear text not null default '',
  location text not null default '',
  dob text not null default '',
  gender text not null default '',
  cv_filename text not null default ''
);

alter table public.job_applications enable row level security;

-- Public form may insert rows. Applicant PII must never be publicly readable,
-- so there is deliberately NO select policy for anon.
create policy "Public insert applications" on public.job_applications
  for insert to anon with check (true);

create index if not exists idx_job_applications_created_at on public.job_applications (created_at desc);
create index if not exists idx_job_applications_email on public.job_applications (email);
