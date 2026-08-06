-- Wonderland: corrige views antigas da Arena com ordem de colunas incompatível
-- Execute este arquivo uma vez antes de executar novamente Wonderland_CMS.sql.

begin;

-- CREATE OR REPLACE VIEW não consegue renomear/reordenar colunas antigas.
-- Removemos e recriamos as views usando a ordem real das tabelas atuais.
drop view if exists public.arena_skill_catalog;
drop view if exists public.arena_passive_catalog;

create view public.arena_skill_catalog as
select *
from public.skills
where is_active = true;

create view public.arena_passive_catalog as
select *
from public.passives
where is_active = true;

grant select on public.arena_skill_catalog, public.arena_passive_catalog
to anon, authenticated;

notify pgrst, 'reload schema';

commit;
