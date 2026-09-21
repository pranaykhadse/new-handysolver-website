-- HandySolver admin write access (run in Supabase Dashboard -> SQL Editor -> New query).
-- Enables the /admin panel in the app to insert/update/delete rows using the anon key.
-- NOTE: this opens write access to anyone holding the anon (publishable) key.
-- The app gates /admin API routes behind a password, but direct API writes are possible.
-- For production hardening, swap this for Supabase Auth + role-based RLS policies.

create policy "Public insert access" on public.case_studies for insert to anon with check (true);
create policy "Public update access" on public.case_studies for update to anon using (true) with check (true);
create policy "Public delete access" on public.case_studies for delete to anon using (true);

create policy "Public insert access" on public.testimonials for insert to anon with check (true);
create policy "Public update access" on public.testimonials for update to anon using (true) with check (true);
create policy "Public delete access" on public.testimonials for delete to anon using (true);

create policy "Public insert access" on public.team_members for insert to anon with check (true);
create policy "Public update access" on public.team_members for update to anon using (true) with check (true);
create policy "Public delete access" on public.team_members for delete to anon using (true);