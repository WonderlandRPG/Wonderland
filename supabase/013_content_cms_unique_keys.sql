-- Wonderland CMS: normalização definitiva das chaves naturais
-- Mantém o registro físico mais recente de cada chave e impede novas duplicações.

begin;

create extension if not exists pgcrypto;

do $$
begin
  if to_regclass('public.skills') is not null then
    update public.skills
       set skill_key = 'skill-' || id::text
     where skill_key is null or btrim(skill_key) = '';

    delete from public.skills older
    using public.skills newer
    where older.skill_key = newer.skill_key
      and older.ctid < newer.ctid;

    execute 'create unique index if not exists skills_skill_key_unique on public.skills(skill_key)';
  end if;

  if to_regclass('public.passives') is not null then
    update public.passives
       set passive_key = 'passive-' || id::text
     where passive_key is null or btrim(passive_key) = '';

    delete from public.passives older
    using public.passives newer
    where older.passive_key = newer.passive_key
      and older.ctid < newer.ctid;

    execute 'create unique index if not exists passives_passive_key_unique on public.passives(passive_key)';
  end if;

  if to_regclass('public.combat_mechanics') is not null then
    update public.combat_mechanics
       set mechanic_key = 'mechanic-' || md5(coalesce(name, '') || ctid::text)
     where mechanic_key is null or btrim(mechanic_key) = '';

    delete from public.combat_mechanics older
    using public.combat_mechanics newer
    where older.mechanic_key = newer.mechanic_key
      and older.ctid < newer.ctid;

    execute 'create unique index if not exists combat_mechanics_key_unique on public.combat_mechanics(mechanic_key)';
  end if;
end
$$;

notify pgrst, 'reload schema';

commit;
