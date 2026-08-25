begin;

with sites(kingdom, old_site, evaluation_site) as (values
  ('aokigahara', 'as raízes externas da Árvore Imponente', 'junto às raízes externas da Árvore Imponente'),
  ('darkya', 'os mecanismos centrais da Cidade Ferrugem', 'junto aos mecanismos centrais da Cidade Ferrugem'),
  ('oymyakon', 'as passagens sob as Muralhas de Gelo', 'nas passagens sob as Muralhas de Gelo'),
  ('lesedi', 'a rota iluminada pela Estrela de Mana', 'na rota iluminada pela Estrela de Mana'),
  ('namida', 'as fraturas da antiga Redoma de Mana', 'junto às fraturas da antiga Redoma de Mana'),
  ('skypiece', 'as âncoras do Cristal Azul de Mana', 'junto às âncoras do Cristal Azul de Mana')
)
update public.v2_missions mission
set
  description = replace(
    mission.description,
    ' diante de ' || site.old_site,
    ', ' || site.evaluation_site
  ),
  updated_at = now()
from sites site
where mission.kingdom = site.kingdom
  and mission.is_rank_trial = true
  and mission.created_by is null
  and mission.slug ~ '^(aokigahara|darkya|oymyakon|lesedi|namida|skypiece)-prova-(d|c|b|a)$';

commit;
