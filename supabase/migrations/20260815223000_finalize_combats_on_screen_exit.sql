begin;

-- Encerramento solicitado de todos os combates que ainda estavam ativos.
update public.v2_arena_sessions
set status='abandoned', completed_at=coalesce(completed_at,now())
where status='open';

update public.v2_pvp_matches
set status='abandoned',
    state=coalesce(state,'{}'::jsonb)||jsonb_build_object('status','abandoned'),
    updated_at=now()
where status='active';

update public.v2_pvp_queue
set status='expired'
where status='matched';

update public.v2_dungeon_runs
set status='cancelled',
    state=coalesce(state,'{}'::jsonb)||jsonb_build_object('status','abandoned'),
    finished_at=coalesce(finished_at,now())
where status='active';

create or replace function public.v2_leave_combat_screen(p_kind text,p_combat_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare changed integer:=0;
begin
 if (select auth.uid()) is null then raise exception 'Autenticação necessária' using errcode='42501'; end if;
 if p_kind='arena' then
  update public.v2_arena_sessions set status='abandoned',completed_at=coalesce(completed_at,now())
  where id=p_combat_id and user_id=(select auth.uid()) and status='open';
 elsif p_kind='pvp' then
 update public.v2_pvp_matches set status='abandoned',state=coalesce(state,'{}'::jsonb)||jsonb_build_object('status','abandoned'),updated_at=now()
  where id=p_combat_id and status='active' and ((player_one_user_id=(select auth.uid())) or (player_two_user_id=(select auth.uid())));
  get diagnostics changed=row_count;
  if changed>0 then
   update public.v2_pvp_queue set status='expired' where match_id=p_combat_id and status='matched';
  end if;
 elsif p_kind='dungeon' then
  update public.v2_dungeon_runs r set status='cancelled',state=coalesce(r.state,'{}'::jsonb)||jsonb_build_object('status','abandoned'),finished_at=coalesce(r.finished_at,now())
  where r.id=p_combat_id and r.status='active' and exists(select 1 from public.v2_characters c where c.user_id=(select auth.uid()) and c.id=any(r.party_character_ids));
 else
  raise exception 'Tipo de combate inválido';
 end if;
 if p_kind<>'pvp' then get diagnostics changed=row_count; end if;
 return changed>0;
end; $$;

revoke all on function public.v2_leave_combat_screen(text,uuid) from public,anon;
grant execute on function public.v2_leave_combat_screen(text,uuid) to authenticated;

commit;
