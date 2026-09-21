create table if not exists job_posts (
  id text primary key,
  sort_order int not null default 0,
  title text not null default '',
  icon text not null default '',
  intro text not null default '',
  role text not null default '',
  requirements text not null default '',
  good_to_have text not null default '',
  skills text not null default '',
  exp_min int,
  exp_max int,
  qualification text not null default '',
  salary text not null default '',
  location text not null default '',
  job_type text not null default '',
  is_active boolean not null default true,
  created_at timestamptz default now()
);

alter table job_posts enable row level security;

create policy "Public read active jobs" on job_posts
  for select to anon using (is_active = true);

create policy "Anon insert jobs" on job_posts
  for insert to anon with check (true);

create policy "Anon update jobs" on job_posts
  for update to anon using (true) with check (true);

create policy "Anon delete jobs" on job_posts
  for delete to anon using (true);
