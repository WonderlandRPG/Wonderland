-- Wonderland: progressão de caminhos, temas e retratos raciais.
with upgraded as (
  select c.id,
    jsonb_set(c.payload, '{paths}', (
      select jsonb_agg(
        jsonb_set(
          jsonb_set(
            jsonb_set(path, '{unlockLevel}', '50'::jsonb, true),
            '{quest}',
            jsonb_build_object(
              'title', 'A Escolha de ' || (path->>'name'),
              'briefing', 'Ao alcançar o nível 50, procure o mentor de ' || (path->>'name') || '. ' || (path->>'description'),
              'objectives', jsonb_build_array(
                'Converse com o mentor de ' || (path->>'name') || ' no Salão dos Caminhos.',
                'Complete três confrontos de treino demonstrando a doutrina ' || coalesce(path#>>'{passive,name}', path->>'name') || '.',
                'Retorne ao mentor e confirme que ' || (path->>'name') || ' será seu caminho permanente.'
              ),
              'completionText', 'O caminho ' || (path->>'name') || ' e sua primeira habilidade foram desbloqueados.'
            ), true
          ),
          '{skills}',
          (
            select jsonb_agg(
              jsonb_set(
                jsonb_set(
                  jsonb_set(
                    jsonb_set(
                      source.skill,
                      '{level}', to_jsonb(50 + series.i * 10), true
                    ),
                    '{key}',
                    to_jsonb(case when series.i < jsonb_array_length(path->'skills')
                      then source.skill->>'key'
                      else (path->>'key') || '-' || (array['fundamento','tecnica','dominio','ruptura','apogeu','legado'])[series.i + 1]
                    end), true
                  ),
                  '{name}',
                  to_jsonb(case when series.i < jsonb_array_length(path->'skills')
                    then source.skill->>'name'
                    else (array['Fundamento','Técnica','Domínio','Ruptura','Apogeu','Legado'])[series.i + 1] || ' de ' || (path->>'name')
                  end), true
                ),
                '{cost}',
                to_jsonb(greatest(coalesce((source.skill->>'cost')::int,0), 20 + series.i * 6)), true
              )
              order by series.i
            )
            from generate_series(0,5) series(i)
            cross join lateral (
              select path->'skills'->least(series.i, greatest(jsonb_array_length(path->'skills') - 1, 0)) as skill
            ) source
          ), true
        )
        order by path_index
      )
      from jsonb_array_elements(c.payload->'paths') with ordinality paths(path, path_index)
    ), true) as payload
  from public.v2_content c
  where c.content_type='class' and jsonb_array_length(c.payload->'paths') > 0
)
update public.v2_content c set payload=u.payload, updated_at=now()
from upgraded u where c.id=u.id;

update public.v2_content
set payload=jsonb_set(payload,'{imageUrl}',to_jsonb('/images/races/'||slug||'.webp'::text),true),updated_at=now()
where content_type='race' and slug=any(array['aengel','draconato','lobisomem','kitsune','leonis','tiefling','vampiro','elfo','fada','humano','orc']);

insert into public.v2_game_settings(key,category,label,description,value,status,published_at,updated_at)
values
('appearance.available_themes','appearance','Temas disponíveis','Define quais temas podem ser escolhidos pelos jogadores.','{"classic":true,"accessible":true,"christmas":false,"halloween":false}'::jsonb,'published',now(),now()),
('appearance.default_theme','appearance','Tema padrão','Define o tema usado no primeiro acesso ao site.','"classic"'::jsonb,'published',now(),now())
on conflict(key) do update set value=excluded.value,status='published',updated_at=now();

create or replace function public.v2_guard_character()
returns trigger language plpgsql security definer set search_path=public as $$
declare
  allowed_points integer := 100;
  maximum_slots integer := 3;
  valid_arena_reward boolean := false;
  valid_path_choice boolean := false;
begin
  select coalesce((value #>> '{}')::integer,100) into allowed_points from public.v2_game_settings where key='character.distributable_points' and status='published';
  select coalesce((value #>> '{}')::integer,3) into maximum_slots from public.v2_game_settings where key='character.maximum_slots' and status='published';
  allowed_points:=coalesce(allowed_points,100); maximum_slots:=coalesce(maximum_slots,3);
  if tg_op='INSERT' and not public.v2_is_admin() then new.user_id:=auth.uid(); new.level:=1; new.xp:=0; new.class_path_key:=null; end if;
  if auth.uid() is null or (new.user_id<>auth.uid() and not public.v2_is_admin()) then raise exception 'Acesso negado.' using errcode='42501'; end if;
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
      if not valid_arena_reward and not valid_path_choice then raise exception 'Campos de progressão não podem ser alterados diretamente.' using errcode='42501'; end if;
    end if;
  end if;
  new.updated_at:=now(); return new;
end; $$;

create or replace function public.v2_choose_class_path(p_character_id uuid, p_path_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.v2_characters%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Autenticação obrigatória.' using errcode='42501';
  end if;
  select * into target from public.v2_characters
  where id=p_character_id and user_id=auth.uid() for update;
  if not found then raise exception 'Personagem não encontrado.' using errcode='P0002'; end if;
  if target.level < 50 then raise exception 'O caminho exige nível 50.' using errcode='23514'; end if;
  if target.class_path_key is not null then raise exception 'O caminho já foi escolhido.' using errcode='23514'; end if;
  if not exists (
    select 1 from public.v2_content c,
      jsonb_array_elements(c.payload->'paths') path
    where c.id=target.class_id and c.content_type='class' and c.status='published'
      and path->>'key'=p_path_key
  ) then raise exception 'Caminho inválido.' using errcode='23514'; end if;
  update public.v2_characters set class_path_key=p_path_key where id=target.id;
end;
$$;

revoke all on function public.v2_choose_class_path(uuid,text) from public, anon;
grant execute on function public.v2_choose_class_path(uuid,text) to authenticated;
