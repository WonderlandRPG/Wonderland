-- Wonderland: sistema oficial de multiplicadores de atributos
-- Mantém scale_percent apenas como compatibilidade e torna scale_multiplier a fonte principal.

create extension if not exists pgcrypto;

alter table public.skills
  add column if not exists scale_multiplier numeric(10,4);

update public.skills
set scale_multiplier = case
  when scale_multiplier is not null and scale_multiplier > 0 then scale_multiplier
  when coalesce(scale_percent, 0) > 0 then scale_percent / 100.0
  else 0
end;

alter table public.skills
  alter column scale_multiplier set default 0;

alter table public.skills
  alter column scale_multiplier set not null;

create or replace function public.sync_skill_multiplier()
returns trigger
language plpgsql
as $$
declare
  v_match text[];
  v_multiplier numeric;
  v_attribute text;
begin
  -- Multiplicador informado pelo painel é a fonte principal.
  if coalesce(new.scale_multiplier, 0) > 0 then
    new.scale_percent := round(new.scale_multiplier * 100.0, 2);
  elsif coalesce(new.scale_percent, 0) > 0 then
    new.scale_multiplier := round(new.scale_percent / 100.0, 4);
  else
    -- Compatibilidade com descrições já escritas em 1,5x FOR.
    v_match := regexp_match(
      coalesce(new.description, ''),
      '([0-9]+(?:[\.,][0-9]+)?)\s*[x×]\s*(?:do|de|da)?\s*(FOR|DEF|RES|INI|INT|ARC)',
      'i'
    );

    if v_match is not null then
      v_multiplier := replace(v_match[1], ',', '.')::numeric;
      v_attribute := upper(v_match[2]);
      new.scale_multiplier := v_multiplier;
      new.scale_percent := round(v_multiplier * 100.0, 2);
      if nullif(trim(coalesce(new.scale_attribute, '')), '') is null then
        new.scale_attribute := v_attribute;
      end if;
    else
      -- Compatibilidade com descrições antigas em porcentagem.
      v_match := regexp_match(
        coalesce(new.description, ''),
        '([0-9]+(?:[\.,][0-9]+)?)%\s*(?:do|de|da)?\s*(?:seu|sua)?\s*(FOR|DEF|RES|INI|INT|ARC)',
        'i'
      );

      if v_match is not null then
        v_multiplier := replace(v_match[1], ',', '.')::numeric / 100.0;
        v_attribute := upper(v_match[2]);
        new.scale_multiplier := round(v_multiplier, 4);
        new.scale_percent := round(v_multiplier * 100.0, 2);
        if nullif(trim(coalesce(new.scale_attribute, '')), '') is null then
          new.scale_attribute := v_attribute;
        end if;
      else
        new.scale_multiplier := 0;
        new.scale_percent := 0;
      end if;
    end if;
  end if;

  if new.scale_attribute is not null then
    new.scale_attribute := upper(trim(new.scale_attribute));
  end if;

  return new;
end
$$;

drop trigger if exists skills_sync_multiplier on public.skills;
create trigger skills_sync_multiplier
before insert or update of description, scale_multiplier, scale_percent, scale_attribute
on public.skills
for each row execute function public.sync_skill_multiplier();

-- Reaplica a sincronização em todos os registros existentes.
update public.skills
set
  scale_multiplier = scale_multiplier,
  scale_percent = scale_percent,
  scale_attribute = scale_attribute,
  description = description;

-- As views antigas usavam SELECT * e precisam ser recriadas para expor a coluna nova.
drop view if exists public.arena_skill_catalog;
create view public.arena_skill_catalog as
select *
from public.skills
where is_active = true;

grant select on public.arena_skill_catalog to anon, authenticated;

notify pgrst, 'reload schema';
