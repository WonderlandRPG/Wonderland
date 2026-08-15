begin;

with templates(action_index,instruction,objective) as (values
  (1,'Patrulhe a área de %s e elimine as ameaças encontradas.','Deixe a área segura para os moradores.'),
  (2,'Leve a carga da Guilda até %s sem perder os suprimentos.','Entregue a carga intacta.'),
  (3,'Colete os materiais solicitados em %s.','Entregue os materiais à Guilda.'),
  (4,'Escolte o viajante em segurança através de %s.','Leve o viajante ao destino.'),
  (5,'Investigue os sinais estranhos em %s e encontre sua origem.','Retorne com provas da investigação.'),
  (6,'Encontre os desaparecidos em %s e traga-os de volta.','Traga todos de volta em segurança.'),
  (7,'Contenha a ameaça em %s.','Impeça a ameaça de chegar às áreas habitadas.'),
  (8,'Recupere o objeto perdido em %s.','Devolva o objeto ao responsável.'),
  (9,'Proteja o posto da Guilda em %s até a troca da guarda.','Mantenha o posto protegido.'),
  (10,'Explore %s e marque uma rota segura.','Entregue o mapa da nova rota.')
), regular_missions as (
  select
    m.id,
    m.rank,
    substring(m.name from '.*: (.*)$') as mission_location,
    substring(m.slug from '-([0-9]{2})-[0-9]{2}$')::integer as action_index
  from public.v2_missions m
  where m.is_rank_trial = false
    and m.created_by is null
    and m.slug ~ '^(aokigahara|darkya|oymyakon|lesedi|namida|skypiece)-(e|d|c|b)-[0-9]{2}-[0-9]{2}$'
)
update public.v2_missions mission
set
  description = format(template.instruction,regular.mission_location) || case regular.rank
    when 'D' then ' Atenção: há resistência organizada.'
    when 'C' then ' Área de alto risco.'
    when 'B' then ' Ameaça crítica: não permita que ela avance.'
    else ''
  end,
  objective = template.objective,
  updated_at = now()
from regular_missions regular
join templates template on template.action_index = regular.action_index
where mission.id = regular.id;

do $$
begin
  if exists (
    select 1 from public.v2_missions
    where is_rank_trial = false
      and created_by is null
      and slug ~ '^(aokigahara|darkya|oymyakon|lesedi|namida|skypiece)-(e|d|c|b)-[0-9]{2}-[0-9]{2}$'
      and description like 'Contrato Rank %'
  ) then
    raise exception 'Ainda existem missões regulares com a descrição antiga';
  end if;
end;
$$;

commit;
