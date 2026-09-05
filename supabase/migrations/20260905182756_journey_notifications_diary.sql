create schema if not exists private;

alter table public.v2_mission_assignments
  add column if not exists scene_stage text not null default 'accepted'
    check (scene_stage in ('accepted','in_scene','awaiting_evaluation','completed','reward_received')),
  add column if not exists scene_summary text,
  add column if not exists scene_started_at timestamptz,
  add column if not exists scene_submitted_at timestamptz;

create table if not exists public.v2_character_diary (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.v2_characters(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null default 'scene' check (category in ('scene','relationship','journey')),
  title text not null check (char_length(title) between 2 and 100),
  body text not null check (char_length(body) between 2 and 4000),
  occurred_on date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists v2_character_diary_character_date_idx
  on public.v2_character_diary(character_id, occurred_on desc, created_at desc);
alter table public.v2_character_diary enable row level security;
revoke all on public.v2_character_diary from anon;
grant select, insert, update, delete on public.v2_character_diary to authenticated;

drop policy if exists "diary_owner_select" on public.v2_character_diary;
create policy "diary_owner_select" on public.v2_character_diary for select to authenticated
using ((select auth.uid()) = user_id and exists (
  select 1 from public.v2_characters c where c.id = character_id and c.user_id = (select auth.uid())
));
drop policy if exists "diary_owner_insert" on public.v2_character_diary;
create policy "diary_owner_insert" on public.v2_character_diary for insert to authenticated
with check ((select auth.uid()) = user_id and exists (
  select 1 from public.v2_characters c where c.id = character_id and c.user_id = (select auth.uid())
));
drop policy if exists "diary_owner_update" on public.v2_character_diary;
create policy "diary_owner_update" on public.v2_character_diary for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id and exists (
  select 1 from public.v2_characters c where c.id = character_id and c.user_id = (select auth.uid())
));
drop policy if exists "diary_owner_delete" on public.v2_character_diary;
create policy "diary_owner_delete" on public.v2_character_diary for delete to authenticated
using ((select auth.uid()) = user_id);

create table if not exists public.v2_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid references public.v2_characters(id) on delete cascade,
  kind text not null,
  title text not null,
  message text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists v2_notifications_user_unread_idx
  on public.v2_notifications(user_id, read_at, created_at desc);
alter table public.v2_notifications enable row level security;
revoke all on public.v2_notifications from anon, authenticated;
grant select on public.v2_notifications to authenticated;
drop policy if exists "notification_owner_select" on public.v2_notifications;
create policy "notification_owner_select" on public.v2_notifications for select to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.v2_mark_notification_read(p_notification_id uuid default null)
returns integer language plpgsql security invoker set search_path = '' as $$
declare v_count integer;
begin
  update public.v2_notifications
  set read_at = coalesce(read_at, now())
  where user_id = (select auth.uid())
    and (p_notification_id is null or id = p_notification_id)
    and read_at is null;
  get diagnostics v_count = row_count;
  return v_count;
end; $$;
revoke all on function public.v2_mark_notification_read(uuid) from public, anon;
grant execute on function public.v2_mark_notification_read(uuid) to authenticated;
grant update(read_at) on public.v2_notifications to authenticated;

create or replace function public.v2_update_mission_scene(
  p_assignment_id uuid,
  p_stage text,
  p_summary text default null
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_assignment public.v2_mission_assignments%rowtype;
begin
  if p_stage not in ('in_scene','awaiting_evaluation') then
    raise exception 'Etapa de cena inválida.';
  end if;
  select * into v_assignment from public.v2_mission_assignments
  where id = p_assignment_id and user_id = (select auth.uid()) and status = 'in_progress'
  for update;
  if not found then raise exception 'Missão ativa não encontrada.'; end if;
  if p_stage = 'in_scene' and v_assignment.scene_stage <> 'accepted' then
    raise exception 'Esta cena já foi iniciada.';
  end if;
  if p_stage = 'awaiting_evaluation' and (v_assignment.scene_stage <> 'in_scene' or char_length(trim(coalesce(p_summary,''))) < 10) then
    raise exception 'Escreva um resumo da cena antes de enviar.';
  end if;
  update public.v2_mission_assignments set
    scene_stage = p_stage,
    scene_summary = case when p_stage = 'awaiting_evaluation' then trim(p_summary) else scene_summary end,
    scene_started_at = case when p_stage = 'in_scene' then now() else scene_started_at end,
    scene_submitted_at = case when p_stage = 'awaiting_evaluation' then now() else scene_submitted_at end
  where id = p_assignment_id;
  return jsonb_build_object('stage',p_stage);
end; $$;
revoke all on function public.v2_update_mission_scene(uuid,text,text) from public, anon;
grant execute on function public.v2_update_mission_scene(uuid,text,text) to authenticated;

create or replace function private.v2_notify_mission_resolution()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.status = 'in_progress' and new.status in ('completed','failed','cancelled') then
    if new.status = 'completed' then
      new.scene_stage := 'reward_received';
      insert into public.v2_notifications(user_id,character_id,kind,title,message,href)
      values(new.user_id,new.character_id,'mission','Missão concluída','A avaliação foi aprovada e as recompensas já foram entregues.','/missoes');
    else
      insert into public.v2_notifications(user_id,character_id,kind,title,message,href)
      values(new.user_id,new.character_id,'mission','Missão encerrada',
        case when new.status='failed' then 'A missão não foi concluída. Você já pode escolher outro contrato.' else 'A missão foi cancelada e o personagem está livre.' end,
        '/missoes');
    end if;
  end if;
  return new;
end; $$;
revoke all on function private.v2_notify_mission_resolution() from public, anon, authenticated;
drop trigger if exists v2_mission_resolution_notification on public.v2_mission_assignments;
create trigger v2_mission_resolution_notification before update of status
on public.v2_mission_assignments for each row execute function private.v2_notify_mission_resolution();

create or replace function private.v2_touch_diary()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end; $$;
drop trigger if exists v2_touch_character_diary on public.v2_character_diary;
create trigger v2_touch_character_diary before update on public.v2_character_diary
for each row execute function private.v2_touch_diary();
