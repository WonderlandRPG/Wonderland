-- Item 4 do Rework: talentos, loadouts e balanceamento de habilidades.
-- A ausência de uma linha nesta tabela mantém todas as habilidades já desbloqueadas ativas.

create table if not exists public.v2_character_skill_loadouts (
  character_id uuid primary key references public.v2_characters(id) on delete cascade,
  equipped_class_skill_keys text[] not null default '{}',
  equipped_race_skill_keys text[] not null default '{}',
  selected_passive_keys text[] not null default '{}',
  selected_talent_keys text[] not null default '{}',
  revision bigint not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.v2_character_skill_loadouts enable row level security;

revoke all on table public.v2_character_skill_loadouts from anon, authenticated;
grant select, insert, update on table public.v2_character_skill_loadouts to authenticated;

drop policy if exists "skill_loadout_owner_select" on public.v2_character_skill_loadouts;
create policy "skill_loadout_owner_select"
on public.v2_character_skill_loadouts for select
to authenticated
using (
  exists (
    select 1 from public.v2_characters character
    where character.id = character_id
      and character.user_id = (select auth.uid())
  )
);

drop policy if exists "skill_loadout_owner_insert" on public.v2_character_skill_loadouts;
create policy "skill_loadout_owner_insert"
on public.v2_character_skill_loadouts for insert
to authenticated
with check (
  exists (
    select 1 from public.v2_characters character
    where character.id = character_id
      and character.user_id = (select auth.uid())
  )
);

drop policy if exists "skill_loadout_owner_update" on public.v2_character_skill_loadouts;
create policy "skill_loadout_owner_update"
on public.v2_character_skill_loadouts for update
to authenticated
using (
  exists (
    select 1 from public.v2_characters character
    where character.id = character_id
      and character.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.v2_characters character
    where character.id = character_id
      and character.user_id = (select auth.uid())
  )
);

create or replace function public.v2_touch_skill_loadout() returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  new.revision := old.revision + 1;
  return new;
end;
$$;

drop trigger if exists v2_character_skill_loadouts_touch on public.v2_character_skill_loadouts;
create trigger v2_character_skill_loadouts_touch
before update on public.v2_character_skill_loadouts
for each row execute function public.v2_touch_skill_loadout();

insert into public.v2_game_settings (key, category, label, description, value, status, published_at)
values
  (
    'combat.loadout_limits',
    'combat',
    'Limites do loadout',
    'Quantidade máxima de habilidades de classe, raciais, passivas e talentos selecionados.',
    '{"classSkills":4,"raceSkills":2,"passives":3,"talents":3}'::jsonb,
    'published',
    now()
  ),
  (
    'combat.skill_balance_overrides',
    'combat',
    'Buffs e nerfs de habilidades',
    'Ajustes por chave de habilidade: powerMultiplier, cooldownDelta, rangeDelta, areaDelta, costDelta e disabled.',
    '{}'::jsonb,
    'published',
    now()
  )
on conflict (key) do nothing;

comment on table public.v2_character_skill_loadouts is
  'Seleções explícitas do jogador. Sem registro, a aplicação preserva o loadout legado completo.';
