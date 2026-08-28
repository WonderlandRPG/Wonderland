drop policy if exists "bestiary admin manage" on public.v2_creatures;
drop policy if exists "mission creatures admin manage" on public.v2_mission_creatures;
create policy "bestiary admin insert" on public.v2_creatures for insert to authenticated with check((select public.v2_is_admin()));
create policy "bestiary admin update" on public.v2_creatures for update to authenticated using((select public.v2_is_admin())) with check((select public.v2_is_admin()));
create policy "bestiary admin delete" on public.v2_creatures for delete to authenticated using((select public.v2_is_admin()));
create policy "mission creatures admin insert" on public.v2_mission_creatures for insert to authenticated with check((select public.v2_is_admin()));
create policy "mission creatures admin update" on public.v2_mission_creatures for update to authenticated using((select public.v2_is_admin())) with check((select public.v2_is_admin()));
create policy "mission creatures admin delete" on public.v2_mission_creatures for delete to authenticated using((select public.v2_is_admin()));
