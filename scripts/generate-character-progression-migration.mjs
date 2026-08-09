import fs from "node:fs";

const thresholds = JSON.parse(
  fs.readFileSync(new URL("../lib/game/official-experience.json", import.meta.url), "utf8"),
);
const values = thresholds.map((xp, index) => `(${index + 1},${xp})`).join(",");

const sql = `begin;

alter table public.v2_characters add column if not exists image_url text;
alter table public.v2_characters add column if not exists last_daily_claim date;
alter table public.v2_characters add column if not exists daily_streak integer not null default 0 check (daily_streak >= 0);
alter table public.v2_characters drop constraint if exists v2_characters_image_url_check;
alter table public.v2_characters add constraint v2_characters_image_url_check check (image_url is null or image_url ~ '^https?://');

create or replace function public.v2_level_for_xp(p_xp bigint)
returns integer language sql immutable strict as $$
  select coalesce(max(level),1) from (values ${values}) as progression(level,xp) where xp <= greatest(p_xp,0)
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
`;

fs.writeFileSync(
  new URL(
    "../supabase/migrations/202608090007_character_progression_and_images.sql",
    import.meta.url,
  ),
  sql,
);
