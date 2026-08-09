import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { officialClasses } from "../lib/game/official-classes";

const paths = officialClasses.map((entry) => ({ slug: entry.slug, paths: entry.payload.paths }));
const pathJson = JSON.stringify(paths).replaceAll("$paths$", "");
const sql = `-- Caminhos de classe, modos de Arena e recompensas oficiais.
begin;

alter table public.v2_characters add column if not exists class_path_key text;

update public.v2_content content
set payload = jsonb_set(content.payload, '{paths}', source.entry->'paths', true), updated_at = now()
from jsonb_array_elements($paths$${pathJson}$paths$::jsonb) source(entry)
where content.content_type = 'class' and content.slug = source.entry->>'slug';

alter table public.v2_characters disable trigger v2_characters_guard;
update public.v2_characters character
set class_path_key = content.payload->'paths'->0->>'key'
from public.v2_content content
where content.id = character.class_id and character.class_path_key is null;
alter table public.v2_characters enable trigger v2_characters_guard;

drop function if exists public.v2_admin_update_character(uuid,text,bigint,bigint,text,text,text);
create function public.v2_admin_update_character(
  p_character_id uuid, p_name text, p_xp bigint, p_gold bigint, p_image_url text,
  p_kingdom text, p_adventure_rank text, p_class_path_key text
) returns public.v2_characters language plpgsql security definer set search_path = '' as $$
declare result public.v2_characters; clean_url text; chosen_class uuid;
begin
  if not (select public.v2_is_admin()) then raise exception 'Acesso negado' using errcode='42501'; end if;
  if char_length(trim(p_name)) not between 2 and 32 or p_xp < 0 or p_gold < 0 then raise exception 'Dados inválidos'; end if;
  if p_kingdom not in ('aokigahara','oymyakon','lesedi','namida','skypiece') then raise exception 'Reino inválido'; end if;
  if p_adventure_rank not in ('E','D','C','B','A','S','EX') then raise exception 'Rank inválido'; end if;
  select class_id into chosen_class from public.v2_characters where id=p_character_id;
  if not exists (select 1 from public.v2_content c, jsonb_array_elements(c.payload->'paths') path where c.id=chosen_class and path->>'key'=p_class_path_key) then raise exception 'Caminho inválido'; end if;
  clean_url := nullif(trim(p_image_url),'');
  if clean_url is not null and clean_url !~ '^https?://' then raise exception 'Link inválido'; end if;
  update public.v2_characters set name=trim(p_name),xp=p_xp,gold=p_gold,image_url=clean_url,kingdom=p_kingdom,adventure_rank=p_adventure_rank,class_path_key=p_class_path_key,updated_at=now() where id=p_character_id returning * into result;
  if result.id is null then raise exception 'Personagem não encontrado' using errcode='P0002'; end if;
  insert into public.v2_admin_history(actor_id,action,target_type,target_id,details) values ((select auth.uid()),'character.updated','character',p_character_id::text,jsonb_build_object('name',p_name,'xp',p_xp,'gold',p_gold,'class_path_key',p_class_path_key));
  return result;
end; $$;
revoke execute on function public.v2_admin_update_character(uuid,text,bigint,bigint,text,text,text,text) from public,anon;
grant execute on function public.v2_admin_update_character(uuid,text,bigint,bigint,text,text,text,text) to authenticated;

create table if not exists public.v2_arena_sessions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid not null references public.v2_characters(id) on delete cascade,
  mode text not null check(mode in ('pve','pvp')), status text not null default 'open' check(status in ('open','victory','defeat','abandoned')),
  created_at timestamptz not null default now(), completed_at timestamptz
);
alter table public.v2_arena_sessions enable row level security;
drop policy if exists "arena_sessions_select_own" on public.v2_arena_sessions;
create policy "arena_sessions_select_own" on public.v2_arena_sessions for select to authenticated using ((select auth.uid())=user_id);
revoke all on public.v2_arena_sessions from anon;
grant select on public.v2_arena_sessions to authenticated;

create or replace function public.v2_start_arena_session(p_character_id uuid,p_mode text) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
  if (select auth.uid()) is null or p_mode not in ('pve','pvp') or not exists(select 1 from public.v2_characters where id=p_character_id and user_id=(select auth.uid())) then raise exception 'Sessão inválida' using errcode='42501'; end if;
  update public.v2_arena_sessions set status='abandoned',completed_at=now() where user_id=(select auth.uid()) and character_id=p_character_id and mode=p_mode and status='open';
  insert into public.v2_arena_sessions(user_id,character_id,mode) values((select auth.uid()),p_character_id,p_mode) returning id into result;
  return result;
end; $$;

create or replace function public.v2_claim_arena_victory(p_session_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare session_row public.v2_arena_sessions; character_row public.v2_characters; reward_xp bigint; reward_wg bigint;
begin
  select * into session_row from public.v2_arena_sessions where id=p_session_id and user_id=(select auth.uid()) and status='open' for update;
  if session_row.id is null or session_row.created_at < now()-interval '2 hours' then raise exception 'Sessão inválida ou encerrada' using errcode='42501'; end if;
  select * into character_row from public.v2_characters where id=session_row.character_id and user_id=(select auth.uid()) for update;
  reward_xp := case character_row.adventure_rank when 'E' then 500 when 'D' then 1000 when 'C' then 2000 when 'B' then 4000 when 'A' then 8000 when 'S' then 15000 when 'EX' then 30000 end;
  reward_wg := case character_row.adventure_rank when 'E' then 100 when 'D' then 250 when 'C' then 600 when 'B' then 1500 when 'A' then 4000 when 'S' then 10000 when 'EX' then 25000 end;
  update public.v2_characters set xp=xp+reward_xp,gold=gold+reward_wg,updated_at=now() where id=character_row.id;
  update public.v2_arena_sessions set status='victory',completed_at=now() where id=session_row.id;
  return jsonb_build_object('xp',reward_xp,'wg',reward_wg,'rank',character_row.adventure_rank,'character_id',character_row.id);
end; $$;
revoke execute on function public.v2_start_arena_session(uuid,text),public.v2_claim_arena_victory(uuid) from public,anon;
grant execute on function public.v2_start_arena_session(uuid,text),public.v2_claim_arena_victory(uuid) to authenticated;

commit;
`;
const target = process.argv[2]; if (!target) throw new Error("Informe a migração.");
writeFileSync(resolve(import.meta.dirname,"..",target),sql);
