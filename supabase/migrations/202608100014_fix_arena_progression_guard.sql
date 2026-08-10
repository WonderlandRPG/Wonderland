begin;

create or replace function public.v2_guard_character()
returns trigger language plpgsql security definer set search_path='public' as $$
declare
  allowed_points integer := 100;
  maximum_slots integer := 3;
  valid_arena_reward boolean := false;
begin
  select coalesce((value #>> '{}')::integer,100) into allowed_points
  from public.v2_game_settings where key='character.distributable_points' and status='published';
  select coalesce((value #>> '{}')::integer,3) into maximum_slots
  from public.v2_game_settings where key='character.maximum_slots' and status='published';
  allowed_points := coalesce(allowed_points,100); maximum_slots := coalesce(maximum_slots,3);

  if tg_op='INSERT' and not public.v2_is_admin() then
    new.user_id := (select auth.uid()); new.level := 1; new.xp := 0; new.class_path_key := null;
  end if;
  if (select auth.uid()) is null or (new.user_id<>(select auth.uid()) and not public.v2_is_admin()) then
    raise exception 'Acesso negado.' using errcode='42501';
  end if;
  if tg_op='INSERT' and (select count(*) from public.v2_characters where user_id=new.user_id)>=maximum_slots then
    raise exception 'Limite de personagens atingido.' using errcode='23514';
  end if;
  if public.v2_character_attribute_total(new.allocated_attributes)<>allowed_points then
    raise exception 'Distribua exatamente % pontos.',allowed_points using errcode='23514';
  end if;
  if not exists(select 1 from public.v2_content where id=new.race_id and content_type='race' and status='published') then
    raise exception 'Raça inválida ou não publicada.' using errcode='23514';
  end if;
  if not exists(select 1 from public.v2_content where id=new.class_id and content_type='class' and status='published') then
    raise exception 'Classe inválida ou não publicada.' using errcode='23514';
  end if;
  if tg_op='UPDATE' and not public.v2_is_admin() then
    if new.xp<>old.xp and new.gold<>old.gold and new.level>=old.level
      and new.xp-old.xp=(case old.adventure_rank when 'E' then 500 when 'D' then 1000 when 'C' then 2000 when 'B' then 4000 when 'A' then 8000 when 'S' then 15000 when 'EX' then 30000 else 500 end)
      and new.gold-old.gold=(case old.adventure_rank when 'E' then 100 when 'D' then 250 when 'C' then 600 when 'B' then 1500 when 'A' then 4000 when 'S' then 10000 when 'EX' then 25000 else 100 end)
    then
      update public.v2_arena_sessions set status='victory',completed_at=now()
      where id=(select id from public.v2_arena_sessions where character_id=old.id and user_id=(select auth.uid()) and mode='pve' and status='open' and created_at>=now()-interval '12 hours' order by created_at desc limit 1 for update skip locked)
      returning true into valid_arena_reward;
    end if;
    if new.user_id<>old.user_id or new.race_id<>old.race_id or new.class_id<>old.class_id
      or new.level<>old.level or new.xp<>old.xp or new.allocated_attributes<>old.allocated_attributes
      or new.class_path_key is distinct from old.class_path_key then
      if not valid_arena_reward then
        raise exception 'Campos de progressão não podem ser alterados diretamente.' using errcode='42501';
      end if;
    end if;
  end if;
  new.updated_at:=now(); return new;
end; $$;

create or replace function public.v2_claim_arena_victory(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare session_row public.v2_arena_sessions; character_row public.v2_characters; reward_xp bigint; reward_wg bigint;
begin
  select * into session_row from public.v2_arena_sessions
  where id=p_session_id and user_id=(select auth.uid()) and mode='pve' and status='open' for update;
  if session_row.id is null or session_row.created_at<now()-interval '12 hours' then
    raise exception 'Esta batalha expirou. Inicie um novo confronto PvE.' using errcode='P0001';
  end if;
  select * into character_row from public.v2_characters where id=session_row.character_id and user_id=(select auth.uid()) for update;
  if character_row.id is null then raise exception 'Personagem da batalha não encontrado' using errcode='P0002'; end if;
  reward_xp:=case character_row.adventure_rank when 'E' then 500 when 'D' then 1000 when 'C' then 2000 when 'B' then 4000 when 'A' then 8000 when 'S' then 15000 when 'EX' then 30000 else 500 end;
  reward_wg:=case character_row.adventure_rank when 'E' then 100 when 'D' then 250 when 'C' then 600 when 'B' then 1500 when 'A' then 4000 when 'S' then 10000 when 'EX' then 25000 else 100 end;
  update public.v2_characters set xp=xp+reward_xp,gold=gold+reward_wg,updated_at=now() where id=character_row.id;
  update public.v2_arena_sessions set status='victory',completed_at=now() where id=session_row.id;
  return jsonb_build_object('xp',reward_xp,'wg',reward_wg,'rank',character_row.adventure_rank,'character_id',character_row.id);
end; $$;

revoke execute on function public.v2_claim_arena_victory(uuid) from public,anon;
grant execute on function public.v2_claim_arena_victory(uuid) to authenticated;

commit;
