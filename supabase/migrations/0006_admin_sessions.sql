-- HandySolver admin sessions table for refresh token management.
-- Stores refresh token hashes so they can be revoked on logout.

create table if not exists public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  admin_id text not null default 'admin',
  revoked boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

-- Only need admin-level access (anon key with RLS, gated by password in the API layer)
alter table public.admin_sessions enable row level security;

create policy "Service full access" on public.admin_sessions for all to anon using (true) with check (true);

-- Index for fast lookup by token hash
create index if not exists idx_admin_sessions_token_hash on public.admin_sessions (token_hash);

-- Cleanup: periodically delete expired/revoked sessions
-- (can be run manually or via a cron job)
-- delete from public.admin_sessions where revoked = true or expires_at < now();
