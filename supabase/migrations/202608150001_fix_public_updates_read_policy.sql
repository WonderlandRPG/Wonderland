drop policy if exists "updates public read" on public.v2_updates;

create policy "updates public read"
on public.v2_updates
for select
to anon, authenticated
using (active = true);
