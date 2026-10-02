-- Additive Rework path validation. Never rewrites characters or existing choices.
create table if not exists public.v2_rework_class_paths (
  class_slug text not null,
  path_id text not null,
  primary key (class_slug, path_id)
);
alter table public.v2_rework_class_paths enable row level security;
revoke all on table public.v2_rework_class_paths from public, anon, authenticated;

insert into public.v2_rework_class_paths (class_slug, path_id) values
  ('alquimista', 'bombardeiro'),
  ('alquimista', 'transmutador'),
  ('alquimista', 'medico-de-guerra'),
  ('arqueiro', 'atirador'),
  ('arqueiro', 'batedor'),
  ('arqueiro', 'sentinela'),
  ('assassino', 'carrasco'),
  ('assassino', 'espectro'),
  ('assassino', 'veneno'),
  ('barbaro', 'berserker'),
  ('barbaro', 'quebra-linhas'),
  ('barbaro', 'guardiao-tribal'),
  ('bardo', 'virtuoso'),
  ('bardo', 'menestrel'),
  ('bardo', 'dissonante'),
  ('bruxo', 'devorador'),
  ('bruxo', 'maldizente'),
  ('bruxo', 'arauto'),
  ('cavaleiro', 'bastiao'),
  ('cavaleiro', 'comandante'),
  ('cavaleiro', 'cavaleiro-negro'),
  ('clerigo', 'curador'),
  ('clerigo', 'protetor'),
  ('clerigo', 'inquisidor'),
  ('druida', 'predador'),
  ('druida', 'guardiao-verde'),
  ('druida', 'geomante'),
  ('feiticeiro', 'cataclismo'),
  ('feiticeiro', 'fluxo'),
  ('feiticeiro', 'anomalia'),
  ('guerreiro', 'duelista'),
  ('guerreiro', 'vanguarda'),
  ('guerreiro', 'armas-de-guarda'),
  ('ladino', 'trapaceiro'),
  ('ladino', 'acrobata'),
  ('ladino', 'sabotador'),
  ('mago', 'elementalista'),
  ('mago', 'cronomante'),
  ('mago', 'abjurador'),
  ('monge', 'punho-de-ferro'),
  ('monge', 'vento-livre'),
  ('monge', 'templo-vivo'),
  ('necromante', 'senhor-dos-ossos'),
  ('necromante', 'ceifador'),
  ('necromante', 'espiritualista'),
  ('ninja', 'lamina'),
  ('ninja', 'sombra'),
  ('ninja', 'tecnicas'),
  ('paladino', 'templario'),
  ('paladino', 'justicar'),
  ('paladino', 'arauto-da-luz')
on conflict (class_slug, path_id) do nothing;

CREATE OR REPLACE FUNCTION public.v2_guard_character()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
    if not (tg_op='UPDATE' and trusted_gold_source in ('kingdom_salary','arena') and new.user_id=old.user_id and new.gold<>old.gold) then
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
      and exists(select 1 from public.v2_content c join public.v2_rework_class_paths p on p.class_slug=c.slug where c.id=old.class_id and c.content_type='class' and c.status='published' and p.path_id=new.class_path_key);

    valid_arena_reward := trusted_progression_source='arena'
      and trusted_gold_source='arena'
      and new.user_id=old.user_id
      and new.race_id=old.race_id
      and new.class_id=old.class_id
      and new.allocated_attributes=old.allocated_attributes
      and new.class_path_key is not distinct from old.class_path_key
      and new.xp>=old.xp
      and new.gold>=old.gold
      and new.level>=old.level;

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

CREATE OR REPLACE FUNCTION public.v2_choose_class_path(p_character_id uuid, p_path_key text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    select 1 from public.v2_content c
      join public.v2_rework_class_paths p on p.class_slug=c.slug
    where c.id=target.class_id and c.content_type='class' and c.status='published'
      and p.path_id=p_path_key
  ) then raise exception 'Caminho inválido.' using errcode='23514'; end if;
  update public.v2_characters set class_path_key=p_path_key where id=target.id;
end;
$function$;
revoke all on function public.v2_choose_class_path(uuid,text) from public, anon;
grant execute on function public.v2_choose_class_path(uuid,text) to authenticated;
