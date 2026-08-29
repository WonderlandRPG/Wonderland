begin;

alter table public.v2_characters
  add column if not exists cosmetics jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'v2_characters_cosmetics_object'
      and conrelid = 'public.v2_characters'::regclass
  ) then
    alter table public.v2_characters
      add constraint v2_characters_cosmetics_object
      check (jsonb_typeof(cosmetics) = 'object');
  end if;
end
$$;

comment on column public.v2_characters.cosmetics is
  'Character-specific visual cosmetic loadout. Keys are card, frame, background, aura and theme.';

commit;
