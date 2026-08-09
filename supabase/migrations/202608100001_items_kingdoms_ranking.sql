alter table public.v2_characters add column if not exists kingdom text not null default 'aokigahara';
alter table public.v2_characters drop constraint if exists v2_characters_kingdom_check;
alter table public.v2_characters add constraint v2_characters_kingdom_check
  check (kingdom in ('aokigahara','oymyakon','lesedi','namida','skypiece'));

update public.v2_shop_items set rarity = 'common', updated_at = now() where rarity <> 'common';

drop function if exists public.v2_admin_update_character(uuid,text,bigint,bigint,text);
create function public.v2_admin_update_character(
  p_character_id uuid,
  p_name text,
  p_xp bigint,
  p_gold bigint,
  p_image_url text,
  p_kingdom text
)
returns public.v2_characters
language plpgsql security definer set search_path = '' as $$
declare result public.v2_characters; clean_url text;
begin
  if not (select public.v2_is_admin()) then raise exception 'Acesso negado' using errcode='42501'; end if;
  if char_length(trim(p_name)) not between 2 and 32 or p_xp < 0 or p_gold < 0 then raise exception 'Dados inválidos'; end if;
  if p_kingdom not in ('aokigahara','oymyakon','lesedi','namida','skypiece') then raise exception 'Reino inválido'; end if;
  clean_url := nullif(trim(p_image_url),'');
  if clean_url is not null and clean_url !~ '^https?://' then raise exception 'Link de imagem inválido'; end if;
  update public.v2_characters
  set name=trim(p_name), xp=p_xp, gold=p_gold, image_url=clean_url, kingdom=p_kingdom, updated_at=now()
  where id=p_character_id returning * into result;
  if result.id is null then raise exception 'Personagem não encontrado' using errcode='P0002'; end if;
  insert into public.v2_admin_history(actor_id,action,target_type,target_id,details)
  values((select auth.uid()),'character.updated','character',p_character_id::text,
    jsonb_build_object('name',p_name,'xp',p_xp,'gold',p_gold,'level',result.level,'kingdom',p_kingdom));
  return result;
end; $$;
revoke execute on function public.v2_admin_update_character(uuid,text,bigint,bigint,text,text) from public,anon;
grant execute on function public.v2_admin_update_character(uuid,text,bigint,bigint,text,text) to authenticated;

drop function if exists public.v2_character_ranking();
create function public.v2_character_ranking()
returns table(id uuid,user_id uuid,name text,level integer,xp bigint,race_name text,class_name text,image_url text,kingdom text)
language sql stable security definer set search_path = '' as $$
  select c.id,c.user_id,c.name,c.level,c.xp,r.name,cl.name,c.image_url,c.kingdom
  from public.v2_characters c
  join public.v2_content r on r.id=c.race_id
  join public.v2_content cl on cl.id=c.class_id
  order by c.level desc,c.xp desc,c.created_at asc
  limit 100
$$;
revoke execute on function public.v2_character_ranking() from public,anon;
grant execute on function public.v2_character_ranking() to authenticated;

revoke all on table public.v2_player_achievements from anon, authenticated;
