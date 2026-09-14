begin;

create table if not exists public.v2_kingdom_salary_payments (
  id uuid primary key default gen_random_uuid(),
  cycle_date date not null,
  kingdom text not null,
  office text not null,
  character_id uuid not null references public.v2_characters(id) on delete cascade,
  amount bigint not null check (amount > 0),
  created_at timestamptz not null default now(),
  constraint v2_kingdom_salary_payments_unique unique (cycle_date, kingdom, office, character_id)
);

create index if not exists v2_kingdom_salary_payments_character_idx
  on public.v2_kingdom_salary_payments(character_id, cycle_date desc);

alter table public.v2_kingdom_salary_payments enable row level security;
revoke all on public.v2_kingdom_salary_payments from public, anon, authenticated;

create or replace function public.v2_guard_character()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  allowed_points integer := 100;
  maximum_slots integer := 3;
  valid_arena_reward boolean := false;
  valid_path_choice boolean := false;
  trusted_progression_source text := current_setting('wonderland.progression_source', true);
  trusted_gold_source text := current_setting('wonderland.gold_source', true);
begin
  select coalesce((value #>> '{}')::integer,100) into allowed_points from public.v2_game_settings where key='character.distributable_points' and status='published';
  select coalesce((value #>> '{}')::integer,3) into maximum_slots from public.v2_game_settings where key='character.maximum_slots' and status='published';
  allowed_points:=coalesce(allowed_points,100); maximum_slots:=coalesce(maximum_slots,3);

  if tg_op='INSERT' and not public.v2_is_admin() then new.user_id:=auth.uid(); new.level:=1; new.xp:=0; new.class_path_key:=null; end if;

  if auth.uid() is null or (new.user_id<>auth.uid() and not public.v2_is_admin()) then
    if not (tg_op='UPDATE' and trusted_gold_source='kingdom_salary' and new.user_id=old.user_id and new.gold<>old.gold) then
      raise exception 'Acesso negado.' using errcode='42501';
    end if;
  end if;

  if tg_op='INSERT' and (select count(*) from public.v2_characters where user_id=new.user_id)>=maximum_slots then raise exception 'Limite de personagens atingido.' using errcode='23514'; end if;
  if public.v2_character_attribute_total(new.allocated_attributes)<>allowed_points then raise exception 'Distribua exatamente % pontos.',allowed_points using errcode='23514'; end if;
  if not exists(select 1 from public.v2_content where id=new.race_id and content_type='race' and status='published') then raise exception 'Raça inválida ou não publicada.' using errcode='23514'; end if;
  if not exists(select 1 from public.v2_content where id=new.class_id and content_type='class' and status='published') then raise exception 'Classe inválida ou não publicada.' using errcode='23514'; end if;

  if tg_op='UPDATE' and not public.v2_is_admin() then
    valid_path_choice := old.class_path_key is null and new.class_path_key is not null and old.level>=50
      and new.user_id=old.user_id and new.race_id=old.race_id and new.class_id=old.class_id
      and new.level=old.level and new.xp=old.xp and new.allocated_attributes=old.allocated_attributes
      and exists(select 1 from public.v2_content c, jsonb_array_elements(c.payload->'paths') path where c.id=old.class_id and c.content_type='class' and c.status='published' and path->>'key'=new.class_path_key);

    if new.xp<>old.xp and new.gold<>old.gold and new.level>=old.level
      and new.xp-old.xp=(case old.adventure_rank when 'E' then 500 when 'D' then 1000 when 'C' then 2000 when 'B' then 4000 when 'A' then 8000 when 'S' then 15000 when 'EX' then 30000 else 500 end)
      and new.gold-old.gold=(case old.adventure_rank when 'E' then 100 when 'D' then 250 when 'C' then 600 when 'B' then 1500 when 'A' then 4000 when 'S' then 10000 when 'EX' then 25000 else 100 end)
    then
      update public.v2_arena_sessions set status='victory',completed_at=now()
      where id=(select id from public.v2_arena_sessions where character_id=old.id and user_id=auth.uid() and mode='pve' and status='open' and created_at>=now()-interval '12 hours' order by created_at desc limit 1 for update skip locked)
      returning true into valid_arena_reward;
    end if;

    if new.user_id<>old.user_id or new.race_id<>old.race_id or new.class_id<>old.class_id or new.level<>old.level or new.xp<>old.xp or new.allocated_attributes<>old.allocated_attributes or new.class_path_key is distinct from old.class_path_key then
      if trusted_progression_source in ('presence','event') then
        if new.user_id<>old.user_id or new.race_id<>old.race_id or new.class_id<>old.class_id
          or new.allocated_attributes<>old.allocated_attributes
          or new.class_path_key is distinct from old.class_path_key
          or new.xp<old.xp or new.level<old.level then
          raise exception 'Recompensa tentou alterar campos protegidos.' using errcode='42501';
        end if;
      elsif not valid_arena_reward and not valid_path_choice then
        raise exception 'Campos de progressão não podem ser alterados diretamente.' using errcode='42501';
      end if;
    end if;
  end if;

  new.updated_at:=now(); return new;
end;
$function$;

create or replace function public.v2_process_kingdom_cycles()
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
 cfg public.v2_kingdom_economy_config;
 s public.v2_kingdom_states;
 sunday date;
 leader record;
 salary bigint;
 payment_id uuid;
 expired record;
begin
 select * into cfg from public.v2_kingdom_economy_config where id;
 sunday := (timezone('America/Sao_Paulo',now())::date - extract(dow from timezone('America/Sao_Paulo',now()))::integer);

 for s in select * from public.v2_kingdom_states where last_weekly_cycle < sunday for update loop
  update public.v2_kingdom_states
     set infrastructure=greatest(0,infrastructure-cfg.infrastructure_drain),
         provisions=greatest(0,provisions-cfg.provisions_drain),
         arsenal=greatest(0,arsenal-cfg.arsenal_drain),
         livestock=greatest(0,livestock-cfg.livestock_drain),
         last_weekly_cycle=sunday
   where kingdom=s.kingdom;

  for leader in
   select l.office,c.id,l.assigned_at
     from public.v2_kingdom_leadership l
     join public.v2_characters c on c.id=l.character_id
    where l.kingdom=s.kingdom
      and l.assigned_at::date <= sunday
    order by case l.office when 'monarch' then 1 else 2 end
  loop
   salary := case leader.office
      when 'monarch' then cfg.monarch_salary
      when 'realm_councilor' then cfg.realm_councilor_salary
      else cfg.war_councilor_salary
   end;

   payment_id := null;
   insert into public.v2_kingdom_salary_payments(cycle_date,kingdom,office,character_id,amount)
   values(sunday,s.kingdom,leader.office,leader.id,salary)
   on conflict (cycle_date,kingdom,office,character_id) do nothing
   returning id into payment_id;

   if payment_id is not null then
    perform set_config('wonderland.gold_source','kingdom_salary',true);
    update public.v2_characters
       set gold=case when gold>9223372036854775807-salary then 9223372036854775807 else gold+salary end
     where id=leader.id;
    perform set_config('wonderland.gold_source','',true);
   end if;
  end loop;
 end loop;

 update public.v2_kingdom_peace_proposals set status='expired',responded_at=now() where status='pending' and expires_at<=now();
 for expired in update public.v2_kingdom_wars w set status='surrendered',winner_kingdom=attacker_kingdom,loser_kingdom=defender_kingdom,resolved_at=now() where w.status='pending' and w.expires_at<=now() returning defender_kingdom loop
  update public.v2_characters set gold=floor(gold*.5),updated_at=now() where kingdom=expired.defender_kingdom;
  update public.v2_kingdom_states set penalty_until=now()+interval'7 days',reward_penalty_percent=30,shop_markup_percent=0 where kingdom=expired.defender_kingdom;
 end loop;
 update public.v2_crown_votes set status='rejected',resolved_at=now() where status='active' and expires_at<=now();
end;
$function$;

commit;
