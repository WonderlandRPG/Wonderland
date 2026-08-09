drop policy if exists "history admin insert" on public.v2_admin_history;
create policy "history admin insert" on public.v2_admin_history
for insert to authenticated with check (
  actor_id=(select auth.uid()) and (select public.v2_is_admin())
);
grant insert on public.v2_admin_history to authenticated;
grant usage,select on sequence public.v2_admin_history_id_seq to authenticated;
