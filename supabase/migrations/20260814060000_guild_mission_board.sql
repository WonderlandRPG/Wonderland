begin;

alter table public.v2_user_roles drop constraint if exists v2_user_roles_role_check;
alter table public.v2_user_roles add constraint v2_user_roles_role_check
  check (role in ('player','moderator','guild_leader','admin','founder'));

create or replace function public.v2_is_mission_manager()
returns boolean language sql stable security definer set search_path='' as $$
  select exists (
    select 1 from public.v2_user_roles
    where user_id=(select auth.uid()) and role in ('guild_leader','admin','founder')
  );
$$;

create table public.v2_rank_mission_requirements (
  rank text primary key check (rank in ('E','D','C','B')),
  required_completions integer not null check (required_completions > 0),
  promotion_rank text not null check (promotion_rank in ('D','C','B','A'))
);

create table public.v2_missions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(trim(name)) between 3 and 100),
  description text not null check (char_length(trim(description)) between 10 and 1200),
  objective text not null check (char_length(trim(objective)) between 3 and 300),
  kingdom text not null check (kingdom in ('aokigahara','darkya','oymyakon','lesedi','namida','skypiece')),
  rank text not null check (rank in ('E','D','C','B')),
  min_level integer not null default 1 check (min_level between 1 and 100),
  reward_xp bigint not null default 0 check (reward_xp >= 0),
  reward_gold bigint not null default 0 check (reward_gold >= 0),
  is_rank_trial boolean not null default false,
  promotion_rank text check (promotion_rank in ('D','C','B','A')),
  active boolean not null default true,
  available_after timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((is_rank_trial and promotion_rank is not null) or (not is_rank_trial and promotion_rank is null))
);

create index v2_missions_board_idx on public.v2_missions(kingdom,rank,active,available_after);

create table public.v2_mission_assignments (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.v2_missions(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid not null references public.v2_characters(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress','completed','failed')),
  accepted_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  retry_after timestamptz,
  reward_xp bigint not null default 0,
  reward_gold bigint not null default 0
);

create unique index v2_mission_one_active_character_idx
  on public.v2_mission_assignments(character_id) where status='in_progress';
create index v2_mission_assignments_manager_idx
  on public.v2_mission_assignments(status,accepted_at);
create index v2_mission_assignments_progress_idx
  on public.v2_mission_assignments(character_id,status);

alter table public.v2_rank_mission_requirements enable row level security;
alter table public.v2_missions enable row level security;
alter table public.v2_mission_assignments enable row level security;

create policy "mission requirements authenticated read" on public.v2_rank_mission_requirements
  for select to authenticated using (true);
create policy "missions authenticated read" on public.v2_missions
  for select to authenticated using (active or public.v2_is_admin());
create policy "missions admin insert" on public.v2_missions
  for insert to authenticated with check (public.v2_is_admin());
create policy "missions admin update" on public.v2_missions
  for update to authenticated using (public.v2_is_admin()) with check (public.v2_is_admin());
create policy "mission assignments own or manager read" on public.v2_mission_assignments
  for select to authenticated using (user_id=(select auth.uid()) or public.v2_is_mission_manager());

revoke all on public.v2_rank_mission_requirements,public.v2_missions,public.v2_mission_assignments from public,anon,authenticated;
grant select on public.v2_rank_mission_requirements to authenticated;
grant select,insert,update on public.v2_missions to authenticated;
grant select on public.v2_mission_assignments to authenticated;

create trigger v2_missions_touch before update on public.v2_missions
for each row execute function public.v2_touch_updated_at();

create or replace function public.v2_character_has_active_mission(p_character_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists (
    select 1 from public.v2_mission_assignments
    where character_id=p_character_id and status='in_progress'
  );
$$;

create or replace function public.v2_get_mission_board(p_character_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  chosen public.v2_characters;
  active_assignment jsonb;
  completed_count integer;
  needed integer;
  locked_until timestamptz;
  mission_list jsonb;
begin
  select * into chosen from public.v2_characters
  where id=p_character_id and user_id=(select auth.uid());
  if chosen.id is null then raise exception 'Personagem não encontrado' using errcode='P0002'; end if;

  select jsonb_build_object(
    'id',a.id,'missionId',m.id,'name',m.name,'rank',m.rank,'kingdom',m.kingdom,
    'objective',m.objective,'acceptedAt',a.accepted_at,'isRankTrial',m.is_rank_trial
  ) into active_assignment
  from public.v2_mission_assignments a join public.v2_missions m on m.id=a.mission_id
  where a.character_id=chosen.id and a.status='in_progress' limit 1;

  select count(*)::integer into completed_count
  from public.v2_mission_assignments a join public.v2_missions m on m.id=a.mission_id
  where a.character_id=chosen.id and a.status='completed'
    and not m.is_rank_trial and m.rank=chosen.adventure_rank;

  select required_completions into needed from public.v2_rank_mission_requirements
  where rank=chosen.adventure_rank;

  select max(retry_after) into locked_until from public.v2_mission_assignments
  where character_id=chosen.id and status='failed' and retry_after>now();

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',m.id,'slug',m.slug,'name',m.name,'description',m.description,'objective',m.objective,
    'rank',m.rank,'kingdom',m.kingdom,'minLevel',m.min_level,'rewardXp',m.reward_xp,
    'rewardGold',m.reward_gold,'isRankTrial',m.is_rank_trial,'promotionRank',m.promotion_rank
  ) order by m.is_rank_trial desc,m.name),'[]'::jsonb) into mission_list
  from public.v2_missions m
  where m.active and m.kingdom=chosen.kingdom and m.rank=chosen.adventure_rank
    and (m.available_after is null or m.available_after<=now())
    and chosen.level>=m.min_level
    and (not m.is_rank_trial or completed_count>=coalesce(needed,2147483647));

  return jsonb_build_object(
    'character',jsonb_build_object('id',chosen.id,'name',chosen.name,'rank',chosen.adventure_rank,
      'level',chosen.level,'kingdom',chosen.kingdom,'imageUrl',chosen.image_url),
    'missions',mission_list,'activeAssignment',active_assignment,
    'completedForRank',completed_count,'requiredForTrial',needed,'lockedUntil',locked_until,
    'canManage',public.v2_is_mission_manager()
  );
end;
$$;

create or replace function public.v2_accept_mission(p_mission_id uuid,p_character_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare chosen public.v2_characters; selected public.v2_missions; assignment public.v2_mission_assignments;
  completed_count integer; needed integer;
begin
  select * into chosen from public.v2_characters
  where id=p_character_id and user_id=(select auth.uid()) for update;
  if chosen.id is null then raise exception 'Personagem não encontrado' using errcode='P0002'; end if;
  if not exists(select 1 from public.v2_active_characters where user_id=(select auth.uid()) and character_id=chosen.id) then
    raise exception 'Este não é o personagem ativo' using errcode='42501';
  end if;
  if public.v2_character_has_active_mission(chosen.id) then raise exception 'Você já possui uma missão em andamento'; end if;
  if exists(select 1 from public.v2_mission_assignments where character_id=chosen.id and status='failed' and retry_after>now()) then
    raise exception 'Após uma falha, aguarde 24 horas para aceitar outra missão';
  end if;
  if exists(select 1 from public.v2_arena_sessions where character_id=chosen.id and status='active')
    or exists(select 1 from public.v2_pvp_queue where character_id=chosen.id and status in ('searching','matched'))
    or exists(select 1 from public.v2_dungeon_queue where character_id=chosen.id)
    or exists(select 1 from public.v2_dungeon_runs where chosen.id=any(party_character_ids) and status='active') then
    raise exception 'Saia das filas e encerre combates antes de aceitar uma missão';
  end if;

  select * into selected from public.v2_missions where id=p_mission_id for update;
  if selected.id is null or not selected.active or selected.kingdom<>chosen.kingdom
    or selected.rank<>chosen.adventure_rank or chosen.level<selected.min_level
    or (selected.available_after is not null and selected.available_after>now()) then
    raise exception 'Esta missão não está disponível para o personagem';
  end if;
  if selected.is_rank_trial then
    select count(*)::integer into completed_count from public.v2_mission_assignments a
      join public.v2_missions m on m.id=a.mission_id
      where a.character_id=chosen.id and a.status='completed' and not m.is_rank_trial and m.rank=chosen.adventure_rank;
    select required_completions into needed from public.v2_rank_mission_requirements where rank=chosen.adventure_rank;
    if needed is null or completed_count<needed then raise exception 'Requisitos da prova ainda não foram cumpridos'; end if;
  end if;
  insert into public.v2_mission_assignments(mission_id,user_id,character_id)
  values(selected.id,(select auth.uid()),chosen.id) returning * into assignment;
  return jsonb_build_object('assignmentId',assignment.id,'missionName',selected.name,'status','in_progress');
end;
$$;

create or replace function public.v2_get_managed_missions()
returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if not public.v2_is_mission_manager() then raise exception 'Acesso de liderança necessário' using errcode='42501'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
    'assignmentId',a.id,'characterName',c.name,'characterRank',c.adventure_rank,'characterLevel',c.level,
    'missionName',m.name,'missionRank',m.rank,'kingdom',m.kingdom,'acceptedAt',a.accepted_at,
    'rewardXp',m.reward_xp,'rewardGold',m.reward_gold,'isRankTrial',m.is_rank_trial
  ) order by a.accepted_at) from public.v2_mission_assignments a
    join public.v2_characters c on c.id=a.character_id join public.v2_missions m on m.id=a.mission_id
    where a.status='in_progress'),'[]'::jsonb);
end;
$$;

create or replace function public.v2_resolve_mission(p_assignment_id uuid,p_completed boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare assignment public.v2_mission_assignments; mission public.v2_missions; chosen public.v2_characters;
begin
  if not public.v2_is_mission_manager() then raise exception 'Acesso de liderança necessário' using errcode='42501'; end if;
  select * into assignment from public.v2_mission_assignments where id=p_assignment_id for update;
  if assignment.id is null or assignment.status<>'in_progress' then raise exception 'Missão já resolvida ou inexistente'; end if;
  select * into mission from public.v2_missions where id=assignment.mission_id for update;
  select * into chosen from public.v2_characters where id=assignment.character_id for update;
  if p_completed then
    update public.v2_mission_assignments set status='completed',resolved_at=now(),resolved_by=(select auth.uid()),
      reward_xp=mission.reward_xp,reward_gold=mission.reward_gold where id=assignment.id;
    update public.v2_characters set xp=xp+mission.reward_xp,gold=gold+mission.reward_gold,
      adventure_rank=case when mission.is_rank_trial and adventure_rank=mission.rank then mission.promotion_rank else adventure_rank end
      where id=chosen.id;
    update public.v2_missions set available_after=now()+interval '7 days' where id=mission.id;
  else
    update public.v2_mission_assignments set status='failed',resolved_at=now(),resolved_by=(select auth.uid()),
      retry_after=now()+interval '24 hours' where id=assignment.id;
  end if;
  insert into public.v2_admin_history(actor_id,action,target_type,target_id,details)
  values((select auth.uid()),case when p_completed then 'mission.completed' else 'mission.failed' end,
    'mission_assignment',assignment.id::text,jsonb_build_object('character_id',chosen.id,'mission_id',mission.id));
  return jsonb_build_object('status',case when p_completed then 'completed' else 'failed' end,
    'xp',case when p_completed then mission.reward_xp else 0 end,'gold',case when p_completed then mission.reward_gold else 0 end,
    'newRank',case when p_completed and mission.is_rank_trial then mission.promotion_rank else chosen.adventure_rank end);
end;
$$;

create or replace function public.v2_block_combat_during_mission()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if public.v2_character_has_active_mission(new.character_id) then
    raise exception 'Personagem em missão: Arena e Dungeons estão bloqueadas';
  end if;
  return new;
end;
$$;

create trigger v2_mission_blocks_arena before insert or update of character_id,status on public.v2_arena_sessions
for each row when (new.status='active') execute function public.v2_block_combat_during_mission();
create trigger v2_mission_blocks_pvp before insert or update of character_id,status on public.v2_pvp_queue
for each row when (new.status in ('searching','matched')) execute function public.v2_block_combat_during_mission();
create trigger v2_mission_blocks_dungeon before insert or update of character_id on public.v2_dungeon_queue
for each row execute function public.v2_block_combat_during_mission();

revoke all on function public.v2_is_mission_manager(),public.v2_character_has_active_mission(uuid),
  public.v2_get_mission_board(uuid),public.v2_accept_mission(uuid,uuid),public.v2_get_managed_missions(),
  public.v2_resolve_mission(uuid,boolean),public.v2_block_combat_during_mission() from public,anon;
grant execute on function public.v2_is_mission_manager(),public.v2_character_has_active_mission(uuid),
  public.v2_get_mission_board(uuid),public.v2_accept_mission(uuid,uuid),public.v2_get_managed_missions(),
  public.v2_resolve_mission(uuid,boolean) to authenticated;

insert into public.v2_rank_mission_requirements(rank,required_completions,promotion_rank) values
  ('E',20,'D'),('D',16,'C'),('C',12,'B'),('B',8,'A');

-- Cada reino recebe 10 ordens x 10 alvos = 100 contratos próprios em cada Rank.
with realms(key,label,motif,subjects) as (values
  ('aokigahara','Aokigahara','as raízes e os caminhos vivos da Árvore Imponente',array[
    'Bosque das Raízes Cantantes','Jardins de Ervas Lunares','Ponte das Copas Antigas','Ninho dos Fungos Rubros','Santuário da Seiva Dourada',
    'Vale das Flores Sonoras','Mercado das Resinas','Trilha dos Cipós Errantes','Fonte das Sementes Eternas','Círculo dos Sacerdotes Verdes']::text[]),
  ('darkya','Darkya','a chuva incessante e as estruturas metálicas da Cidade Ferrugem',array[
    'Aqueduto da Garoa Cinzenta','Vinícola do Corvo Rubro','Ponte dos Sinos de Ferro','Taverna do Trovão Manso','Distrito dos Curtumes',
    'Estrada das Carruagens Seladas','Torre do Para-raios Antigo','Armazém das Lãs Negras','Canal da Chuva Profunda','Portão da Cidade Ferrugem']::text[]),
  ('oymyakon','Oymyakon','o gelo regenerativo e as riquezas sob as cordilheiras',array[
    'Mina do Diamante Boreal','Porto das Agulhas de Gelo','Caverna dos Cristais Azuis','Passagem da Nevasca Eterna','Salão dos Vidros Coloridos',
    'Veio de Ouro Congelado','Doca dos Quebra-gelos','Vale das Paredes Brancas','Fortaleza da Pedra Escura','Túnel do Carvão Silencioso']::text[]),
  ('lesedi','Lesedi','as rotas iluminadas pela Estrela de Mana',array[
    'Oásis das Frutas de Vidro','Caravana das Especiarias','Pedreira do Arenito Solar','Forja do Vidro de Mana','Dunas dos Escaravelhos Dourados',
    'Mercado que Nunca Dorme','Templo da Estrela Ardente','Vale das Cerâmicas Antigas','Rota dos Óleos Perfumados','Poço das Ervas do Deserto']::text[]),
  ('namida','Namida','as correntes oceânicas protegidas pela Redoma de Mana',array[
    'Jardim dos Corais Luminosos','Canal dos Cardumes Prateados','Torre da Redoma Exterior','Floresta das Algas Azuis','Praça das Conchas Cantoras',
    'Fenda das Correntes Frias','Berçário dos Cavalos-marinhos','Palácio das Pérolas','Túnel das Águas Claras','Recife dos Guardiões']::text[]),
  ('skypiece','Skypiece','as ilhas suspensas pelo Cristal Azul de Mana',array[
    'Ponte do Arco-Íris','Pedreira de Quartzo Branco','Estrada das Nuvens Sólidas','Jardim da Névoa Rasteira','Torre dos Cristais Translúcidos',
    'Ilha dos Ventos Alaranjados','Palácio da Aurora Celeste','Celeiro das Nuvens','Santuário do Cristal Azul','Ancoradouro das Ilhas Flutuantes']::text[])
), ranks(rank,min_level,xp,gold,tier,threat) as (values
  ('E',1,350::bigint,80::bigint,'Iniciação','ameaças locais de baixa complexidade'),
  ('D',20,1400::bigint,500::bigint,'Operação de Campo','ameaças organizadas que exigem experiência'),
  ('C',40,3000::bigint,1100::bigint,'Alto Risco','ameaças severas capazes de afetar uma região inteira'),
  ('B',60,6500::bigint,2400::bigint,'Ordem Prioritária','ameaças críticas que podem desestabilizar o reino')
), templates as (select
  array['Patrulha','Entrega','Coleta','Escolta','Investigação','Resgate','Contenção','Recuperação','Vigília','Expedição']::text[] names,
  array[
    'Patrulhe todo o perímetro e neutralize os riscos encontrados.',
    'Entregue a carga lacrada ao contato indicado sem sofrer perdas.',
    'Reúna os materiais solicitados e preserve sua qualidade.',
    'Proteja o alvo durante todo o trajeto até o ponto seguro.',
    'Localize a origem dos sinais e retorne com provas verificáveis.',
    'Encontre os desaparecidos e conduza-os em segurança até a Guilda.',
    'Contenha a ameaça sem permitir que ela avance para áreas habitadas.',
    'Recupere o objeto desaparecido e identifique os responsáveis.',
    'Mantenha o posto protegido até a chegada da equipe de rendição.',
    'Mapeie a área, registre seus perigos e estabeleça uma rota segura.'
  ]::text[] objectives)
insert into public.v2_missions(slug,name,description,objective,kingdom,rank,min_level,reward_xp,reward_gold)
select lower(r.key||'-'||rk.rank||'-'||lpad(action_index::text,2,'0')||'-'||lpad(subject_index::text,2,'0')),
  rk.tier||' — '||t.names[action_index]||': '||r.subjects[subject_index],
  'Contrato Rank '||rk.rank||' de '||r.label||' sobre '||r.subjects[subject_index]||'. A Guilda classificou o chamado como '||
    rk.threat||', ligado a '||r.motif||'. Conclua a ordem e apresente um relatório completo ao mural.',
  t.objectives[action_index]||' Local da missão: '||r.subjects[subject_index]||'.',
  r.key,rk.rank,rk.min_level,
  rk.xp+(action_index*55)+(subject_index*20),
  rk.gold+(action_index*14)+(subject_index*6)
from realms r
cross join ranks rk
cross join templates t
cross join generate_series(1,10) action_index
cross join generate_series(1,10) subject_index;

with realms(key,label,motif) as (values
  ('aokigahara','Aokigahara','a Árvore Imponente'),('darkya','Darkya','a Cidade Ferrugem'),
  ('oymyakon','Oymyakon','as Muralhas de Gelo'),('lesedi','Lesedi','a Estrela de Mana'),
  ('namida','Namida','a Redoma de Mana'),('skypiece','Skypiece','o Cristal Azul de Mana')
), trials(rank,promotion,min_level,xp,gold) as (values
  ('E','D',20,3000::bigint,750::bigint),('D','C',40,6000::bigint,1500::bigint),
  ('C','B',60,12000::bigint,3000::bigint),('B','A',80,24000::bigint,6000::bigint)
)
insert into public.v2_missions(slug,name,description,objective,kingdom,rank,min_level,reward_xp,reward_gold,is_rank_trial,promotion_rank)
select r.key||'-prova-'||lower(t.promotion),'Prova de Ascensão ao Rank '||t.promotion||' — '||r.label,
  'Uma convocação oficial da Guilda. Demonstre domínio, coragem e responsabilidade diante de '||r.motif||' para conquistar o Rank '||t.promotion||'.',
  'Conclua a prova supervisionada e retorne ao mural para avaliação.',r.key,t.rank,t.min_level,t.xp,t.gold,true,t.promotion
from realms r cross join trials t;

create or replace function public.v2_set_player_role(p_user_id uuid,p_role text)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not public.v2_is_admin() then raise exception 'Acesso negado' using errcode='42501'; end if;
  if p_role not in ('player','moderator','guild_leader','admin','founder') then raise exception 'Cargo inválido'; end if;
  if p_role='founder' and not exists(select 1 from public.v2_user_roles where user_id=(select auth.uid()) and role='founder') then
    raise exception 'Somente fundadores podem promover fundadores' using errcode='42501';
  end if;
  update public.v2_user_roles set role=p_role where user_id=p_user_id;
  insert into public.v2_admin_history(actor_id,action,target_type,target_id,details)
  values((select auth.uid()),'role.updated','player',p_user_id::text,jsonb_build_object('role',p_role));
end;
$$;
revoke all on function public.v2_set_player_role(uuid,text) from public,anon;
grant execute on function public.v2_set_player_role(uuid,text) to authenticated;

commit;
