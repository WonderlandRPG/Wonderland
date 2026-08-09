begin;

alter table public.v2_characters add column if not exists image_url text;
alter table public.v2_characters add column if not exists last_daily_claim date;
alter table public.v2_characters add column if not exists daily_streak integer not null default 0 check (daily_streak >= 0);
alter table public.v2_characters drop constraint if exists v2_characters_image_url_check;
alter table public.v2_characters add constraint v2_characters_image_url_check check (image_url is null or image_url ~ '^https?://');

create or replace function public.v2_level_for_xp(p_xp bigint)
returns integer language sql immutable strict as $$
  select coalesce(max(level),1) from (values (1,0),(2,100),(3,250),(4,450),(5,700),(6,1000),(7,1350),(8,1750),(9,2200),(10,2700),(11,3400),(12,4150),(13,4950),(14,5700),(15,6500),(16,7600),(17,8700),(18,9950),(19,11200),(20,12500),(21,14200),(22,15900),(23,17600),(24,19300),(25,21000),(26,23200),(27,25400),(28,27600),(29,29800),(30,32000),(31,34800),(32,37600),(33,40400),(34,43200),(35,46000),(36,49400),(37,52800),(38,56200),(39,59600),(40,63000),(41,67000),(42,71000),(43,75000),(44,79000),(45,83000),(46,87600),(47,92200),(48,96800),(49,101400),(50,106000),(51,111200),(52,116400),(53,121600),(54,126800),(55,132000),(56,137800),(57,143600),(58,149400),(59,155200),(60,161000),(61,167600),(62,174200),(63,180800),(64,187400),(65,194000),(66,201200),(67,208400),(68,215600),(69,222800),(70,230000),(71,238000),(72,246000),(73,254000),(74,262000),(75,270000),(76,278800),(77,287600),(78,296400),(79,305200),(80,314000),(81,323600),(82,333200),(83,342800),(84,352400),(85,362000),(86,372600),(87,383200),(88,393800),(89,404400),(90,415000),(91,426400),(92,437800),(93,449200),(94,460600),(95,472000),(96,484600),(97,497200),(98,509800),(99,522400),(100,535000)) as progression(level,xp) where xp <= greatest(p_xp,0)
$$;

create or replace function public.v2_sync_character_level()
returns trigger language plpgsql set search_path=public as $$
begin new.level := public.v2_level_for_xp(new.xp); return new; end; $$;
drop trigger if exists v2_characters_sync_level on public.v2_characters;
create trigger v2_characters_sync_level before insert or update of xp on public.v2_characters for each row execute function public.v2_sync_character_level();
create or replace function public.v2_set_character_image(p_character_id uuid,p_image_url text)
returns public.v2_characters language plpgsql security definer set search_path=public as $$
declare result public.v2_characters; clean_url text;
begin
  clean_url := nullif(trim(p_image_url),'');
  if clean_url is not null and clean_url !~ '^https?://' then raise exception 'Use um link http ou https válido'; end if;
  update public.v2_characters set image_url=clean_url,updated_at=now() where id=p_character_id and user_id=(select auth.uid()) returning * into result;
  if result.id is null then raise exception 'Personagem não encontrado' using errcode='P0002'; end if;
  return result;
end; $$;

create or replace function public.v2_admin_update_character(p_character_id uuid,p_name text,p_xp bigint,p_gold bigint,p_image_url text)
returns public.v2_characters language plpgsql security definer set search_path=public as $$
declare result public.v2_characters; clean_url text;
begin
  if not (select public.v2_is_admin()) then raise exception 'Acesso negado' using errcode='42501'; end if;
  if char_length(trim(p_name)) not between 2 and 32 or p_xp<0 or p_gold<0 then raise exception 'Dados inválidos'; end if;
  clean_url := nullif(trim(p_image_url),'');
  if clean_url is not null and clean_url !~ '^https?://' then raise exception 'Link de imagem inválido'; end if;
  update public.v2_characters set name=trim(p_name),xp=p_xp,gold=p_gold,image_url=clean_url,updated_at=now() where id=p_character_id returning * into result;
  if result.id is null then raise exception 'Personagem não encontrado' using errcode='P0002'; end if;
  insert into public.v2_admin_history(actor_id,action,target_type,target_id,details) values((select auth.uid()),'character.updated','character',p_character_id::text,jsonb_build_object('name',p_name,'xp',p_xp,'gold',p_gold,'level',result.level));
  return result;
end; $$;

create or replace function public.v2_claim_daily_reward()
returns jsonb language plpgsql security definer set search_path=public as $$
declare chosen uuid; character_row public.v2_characters; reward integer;
begin
  select character_id into chosen from public.v2_active_characters where user_id=(select auth.uid());
  if chosen is null then raise exception 'Selecione um personagem antes de marcar presença'; end if;
  select * into character_row from public.v2_characters where id=chosen and user_id=(select auth.uid()) for update;
  if character_row.last_daily_claim=current_date then raise exception 'Presença já marcada hoje'; end if;
  character_row.daily_streak := case when character_row.last_daily_claim=current_date-1 then character_row.daily_streak+1 else 1 end;
  reward := 50 + least(character_row.daily_streak,7)*10;
  update public.v2_characters set gold=gold+reward,daily_streak=character_row.daily_streak,last_daily_claim=current_date,updated_at=now() where id=chosen;
  return jsonb_build_object('reward',reward,'streak',character_row.daily_streak,'character_id',chosen);
end; $$;

revoke update on public.v2_characters from authenticated;
revoke execute on function public.v2_level_for_xp(bigint),public.v2_sync_character_level(),public.v2_set_character_image(uuid,text),public.v2_admin_update_character(uuid,text,bigint,bigint,text),public.v2_claim_daily_reward() from public,anon;
grant execute on function public.v2_set_character_image(uuid,text),public.v2_admin_update_character(uuid,text,bigint,bigint,text),public.v2_claim_daily_reward() to authenticated;

commit;
