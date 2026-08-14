begin;

alter table public.v2_characters
  drop constraint if exists v2_characters_kingdom_check;

alter table public.v2_characters
  add constraint v2_characters_kingdom_check
  check (kingdom in ('aokigahara','darkya','oymyakon','lesedi','namida','skypiece'));

create or replace function public.v2_admin_update_character(
  p_character_id uuid,
  p_name text,
  p_xp bigint,
  p_gold bigint,
  p_image_url text,
  p_kingdom text,
  p_adventure_rank text,
  p_class_path_key text
)
returns public.v2_characters
language plpgsql
security definer
set search_path = ''
as $$
declare result public.v2_characters; clean_url text; chosen_class uuid;
begin
  if not (select public.v2_is_admin()) then raise exception 'Acesso negado' using errcode='42501'; end if;
  if char_length(trim(p_name)) not between 2 and 32 or p_xp < 0 or p_gold < 0 then raise exception 'Dados inválidos'; end if;
  if p_kingdom not in ('aokigahara','darkya','oymyakon','lesedi','namida','skypiece') then raise exception 'Reino inválido'; end if;
  if p_adventure_rank not in ('E','D','C','B','A','S','EX') then raise exception 'Rank inválido'; end if;
  select class_id into chosen_class from public.v2_characters where id=p_character_id;
  if not exists (select 1 from public.v2_content c, jsonb_array_elements(c.payload->'paths') path where c.id=chosen_class and path->>'key'=p_class_path_key) then raise exception 'Caminho inválido'; end if;
  clean_url := nullif(trim(p_image_url),'');
  if clean_url is not null and clean_url !~ '^https?://' then raise exception 'Link inválido'; end if;
  update public.v2_characters set name=trim(p_name),xp=p_xp,gold=p_gold,image_url=clean_url,kingdom=p_kingdom,adventure_rank=p_adventure_rank,class_path_key=p_class_path_key,updated_at=now() where id=p_character_id returning * into result;
  if result.id is null then raise exception 'Personagem não encontrado' using errcode='P0002'; end if;
  insert into public.v2_admin_history(actor_id,action,target_type,target_id,details) values ((select auth.uid()),'character.updated','character',p_character_id::text,jsonb_build_object('name',p_name,'xp',p_xp,'gold',p_gold,'class_path_key',p_class_path_key,'kingdom',p_kingdom));
  return result;
end;
$$;

revoke execute on function public.v2_admin_update_character(uuid,text,bigint,bigint,text,text,text,text) from public,anon;
grant execute on function public.v2_admin_update_character(uuid,text,bigint,bigint,text,text,text,text) to authenticated;

commit;
