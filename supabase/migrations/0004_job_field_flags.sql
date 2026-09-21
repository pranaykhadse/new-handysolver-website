-- Add field_flags JSONB column to job_posts for per-field visibility control
alter table job_posts
  add column if not exists field_flags jsonb default '{}'::jsonb;
