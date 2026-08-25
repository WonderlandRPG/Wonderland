begin;

-- Reescreve apenas contratos gerados pelo sistema. Missões autorais criadas
-- no painel administrativo (created_by preenchido) permanecem intactas.
with realm_details(
  kingdom, patrol_threat, cargo, material, traveler, investigation_sign,
  missing_group, containment_threat, lost_object, attackers, expedition_hazard
) as (values
  ('aokigahara',
   'criaturas cobertas por seiva escura e raízes agressivas',
   'ervas lunares e resina medicinal',
   'brotos de seiva dourada',
   'um botânico dos Sacerdotes Verdes',
   'cantos subterrâneos que fazem as raízes se moverem contra os viajantes',
   'coletores de ervas que não retornaram ao santuário',
   'raízes corrompidas que avançam em direção às moradias',
   'um relicário com sementes da Árvore Imponente',
   'feras corrompidas atraídas pela seiva',
   'raízes móveis, cipós fechando trilhas e nuvens de esporos'),
  ('darkya',
   'saqueadores e autômatos enferrujados ocultos pela chuva',
   'filtros de água, mantas secas e peças de reposição',
   'engrenagens de cobre ainda utilizáveis',
   'uma engenheira responsável pelos para-raios da Cidade Ferrugem',
   'descargas irregulares ligadas a mecanismos acionados durante as tempestades',
   'operários que desapareceram durante a última chuva de fuligem',
   'vazamentos tóxicos que descem pelos canais até os bairros baixos',
   'o núcleo de cobre de um para-raios antigo',
   'contrabandistas que tentam tomar o posto da Guilda',
   'passarelas corroídas, canais alagados e descargas elétricas'),
  ('oymyakon',
   'predadores glaciais e saqueadores escondidos na nevasca',
   'carvão, óleo para lamparinas e remédios contra congelamento',
   'cristais azuis livres de rachaduras',
   'uma cartógrafa das caravanas de mineração',
   'rachaduras que emitem calor sob o gelo regenerativo',
   'mineiros isolados depois do desabamento de um túnel',
   'uma fissura instável que espalha gelo sobre as rotas de abastecimento',
   'uma bússola boreal usada pelos primeiros exploradores',
   'feras da neve atraídas pelo calor das fogueiras',
   'gelo quebradiço, baixa visibilidade e risco de avalanche'),
  ('lesedi',
   'escaravelhos gigantes e saqueadores que seguem as caravanas',
   'água, especiarias e frascos de óleo perfumado',
   'fragmentos de vidro de mana ainda luminosos',
   'uma guia das caravanas da Estrela de Mana',
   'rastros circulares que surgem nas dunas antes do desaparecimento de cargas',
   'mercadores separados da caravana por uma tempestade de areia',
   'um enxame de escaravelhos que avança para os poços habitados',
   'um astrolábio de vidro usado para orientar caravanas',
   'saqueadores montados que cercam o posto ao anoitecer',
   'dunas móveis, miragens de mana e calor extremo'),
  ('namida',
   'predadores marinhos que atravessaram as barreiras rompidas',
   'pérolas de luz, medicamentos e cilindros de ar',
   'corais luminosos próprios para reparar as barreiras',
   'uma cuidadora do Berçário dos Cavalos-marinhos',
   'correntes frias surgidas perto das fraturas da antiga Redoma de Mana',
   'mergulhadores levados para túneis depois de uma mudança de corrente',
   'uma corrente contaminada que avança para os distritos habitados',
   'uma concha de comando dos antigos Guardiões',
   'criaturas abissais atraídas pelas luzes do posto',
   'correntes violentas, túneis alagados e baixa visibilidade'),
  ('skypiece',
   'criaturas aladas corrompidas e fragmentos de cristal instáveis',
   'quartzo branco, cabos de ancoragem e cristais de sustentação',
   'estilhaços puros do Cristal Azul de Mana',
   'uma técnica responsável pelas âncoras das ilhas',
   'oscilações de mana que fazem pontes e ilhas perderem altitude',
   'trabalhadores presos numa ilha que se afastou da rota principal',
   'corrupção cristalina que se espalha pelos suportes das ilhas',
   'uma chave de sintonia usada nas antigas âncoras celestes',
   'feras aladas atraídas pela energia dos cristais',
   'rajadas imprevisíveis, pontes instáveis e quedas de fragmentos')
), rank_details(rank, quota, rank_context) as (values
  ('E', 2, 'A ocorrência parece localizada, mas deve ser resolvida antes que cresça.'),
  ('D', 3, 'Batedores confirmaram resistência organizada; avance com cautela e mantenha a rota de retirada.'),
  ('C', 4, 'A área foi classificada como alto risco, e qualquer descuido pode colocar moradores em perigo.'),
  ('B', 5, 'Esta é uma ameaça crítica e prioritária; impeça seu avanço e preserve toda infraestrutura essencial.')
), generated_missions as (
  select
    mission.id,
    substring(mission.name from '.*: (.*)$') as location,
    substring(mission.slug from '-([0-9]{2})-[0-9]{2}$')::integer as action_index,
    realm.*,
    rank_detail.quota,
    rank_detail.rank_context
  from public.v2_missions mission
  join realm_details realm on realm.kingdom = mission.kingdom
  join rank_details rank_detail on rank_detail.rank = mission.rank
  where mission.is_rank_trial = false
    and mission.created_by is null
    and mission.slug ~ '^(aokigahara|darkya|oymyakon|lesedi|namida|skypiece)-(e|d|c|b)-[0-9]{2}-[0-9]{2}$'
), rewritten as (
  select
    generated.id,
    case generated.action_index
      when 1 then format(
        'Moradores de %s relataram %s nas rotas de acesso. Percorra os pontos marcados pela Guilda, elimine os focos ativos e registre qualquer sinal de retorno. %s',
        generated.location, generated.patrol_threat, generated.rank_context)
      when 2 then format(
        'Uma remessa de %s precisa chegar ao posto da Guilda em %s. A rota está instável; mantenha a carga lacrada e entregue-a diretamente ao intendente responsável. %s',
        generated.cargo, generated.location, generated.rank_context)
      when 3 then format(
        'Os estoques da Guilda estão baixos. Recolha %s em %s, descarte amostras contaminadas e evite danificar a fonte de coleta. %s',
        generated.material, generated.location, generated.rank_context)
      when 4 then format(
        '%s precisa atravessar %s para concluir uma tarefa urgente. Verifique o caminho antes da passagem e mantenha o protegido ao seu alcance durante todo o trajeto. %s',
        initcap(generated.traveler), generated.location, generated.rank_context)
      when 5 then format(
        'Relatos vindos de %s descrevem %s. Examine a área, identifique a origem do fenômeno e preserve uma prova que confirme sua conclusão. %s',
        generated.location, generated.investigation_sign, generated.rank_context)
      when 6 then format(
        'A Guilda perdeu contato com %s nas proximidades de %s. Siga os últimos rastros conhecidos, preste os primeiros socorros e organize o retorno do grupo. %s',
        generated.missing_group, generated.location, generated.rank_context)
      when 7 then format(
        'Batedores detectaram %s em %s. Monte um perímetro antes da rota principal, elimine os focos que romperem a contenção e proteja a retirada dos moradores. %s',
        generated.containment_threat, generated.location, generated.rank_context)
      when 8 then format(
        '%s desapareceu durante uma passagem por %s. Refaça o trajeto, recupere o objeto sem alterar seu estado e devolva-o ao arquivo da Guilda. %s',
        initcap(generated.lost_object), generated.location, generated.rank_context)
      when 9 then format(
        'O posto avançado de %s espera ataques de %s antes da próxima troca de guarda. Reforce os acessos, mantenha os vigias em segurança e não abandone a posição. %s',
        generated.location, generated.attackers, generated.rank_context)
      when 10 then format(
        'A Guilda ainda não possui uma rota confiável através de %s, onde há %s. Explore o percurso, marque referências visíveis e identifique uma saída segura para futuras expedições. %s',
        generated.location, generated.expedition_hazard, generated.rank_context)
    end as description,
    case generated.action_index
      when 1 then format('Inspecione 3 pontos de patrulha em %s, neutralize %s focos hostis e retorne com a rota liberada.', generated.location, generated.quota)
      when 2 then format('Conduza a remessa até o posto de %s e obtenha do intendente a confirmação de que a carga chegou completa e lacrada.', generated.location)
      when 3 then format('Colete %s amostras válidas em %s e entregue-as identificadas ao responsável pelos suprimentos.', generated.quota + 2, generated.location)
      when 4 then format('Escolte o protegido por %s até o ponto de encontro da Guilda, sem perdê-lo ou deixá-lo incapacitado.', generated.location)
      when 5 then format('Examine 3 indícios em %s, determine a causa da ocorrência e retorne com pelo menos 1 prova material.', generated.location)
      when 6 then format('Localize %s desaparecidos em %s e conduza todos os sobreviventes ao posto da Guilda.', generated.quota, generated.location)
      when 7 then format('Estabeleça o perímetro em %s, contenha %s focos da ameaça e impeça que qualquer um alcance as áreas habitadas.', generated.location, generated.quota)
      when 8 then format('Recupere o objeto perdido em %s e entregue-o intacto ao arquivo da Guilda.', generated.location)
      when 9 then format('Defenda o posto de %s durante %s investidas e mantenha os acessos livres até a troca da guarda.', generated.location, generated.quota)
      when 10 then format('Registre 3 marcos de orientação em %s, sinalize os perigos encontrados e entregue um mapa com entrada e saída seguras.', generated.location)
    end as objective
  from generated_missions generated
)
update public.v2_missions mission
set description = rewritten.description,
    objective = rewritten.objective,
    updated_at = now()
from rewritten
where mission.id = rewritten.id;

with realm_trials(kingdom, evaluation_site, danger) as (values
  ('aokigahara', 'junto às raízes externas da Árvore Imponente', 'uma expansão de seiva corrompida'),
  ('darkya', 'junto aos mecanismos centrais da Cidade Ferrugem', 'uma tempestade que reativou máquinas antigas'),
  ('oymyakon', 'nas passagens sob as Muralhas de Gelo', 'uma ruptura no gelo regenerativo'),
  ('lesedi', 'na rota iluminada pela Estrela de Mana', 'uma caravana cercada por saqueadores'),
  ('namida', 'junto às fraturas da antiga Redoma de Mana', 'uma corrente abissal que alcançou a cidade'),
  ('skypiece', 'junto às âncoras do Cristal Azul de Mana', 'uma ilha instável tomada pela corrupção')
), trial_steps(rank, promotion_rank, assignment, success_condition) as (values
  ('E', 'D', 'conduzir uma patrulha supervisionada, identificar o perigo e executar a resposta correta', 'Complete a patrulha, neutralize 3 focos e apresente o relatório ao avaliador da Guilda.'),
  ('D', 'C', 'rastrear uma ameaça organizada, proteger uma rota civil e recuperar uma prova do responsável pelo ataque', 'Proteja a rota, derrote a resistência organizada e retorne com 1 prova que identifique sua origem.'),
  ('C', 'B', 'liderar uma operação em área de alto risco, resgatar os envolvidos e impedir que a crise se espalhe', 'Resgate todos os sobreviventes, contenha 4 focos e mantenha a área segura até a chegada dos reforços.'),
  ('B', 'A', 'assumir o comando de uma crise crítica, preservar a população e eliminar sua causa principal', 'Conclua as etapas de evacuação, contenção e confronto final sob a supervisão da Guilda, sem perder nenhum objetivo essencial.')
)
update public.v2_missions mission
set description = format(
      'A Guilda convocou você para %s, %s. O cenário da avaliação reproduz %s; suas decisões, o cumprimento dos objetivos e a segurança dos envolvidos determinarão a promoção ao Rank %s.',
      trial.assignment, realm.evaluation_site, realm.danger, trial.promotion_rank),
    objective = trial.success_condition,
    updated_at = now()
from realm_trials realm
cross join trial_steps trial
where mission.kingdom = realm.kingdom
  and trial.rank = mission.rank
  and trial.promotion_rank = mission.promotion_rank
  and mission.is_rank_trial = true
  and mission.created_by is null
  and mission.slug ~ '^(aokigahara|darkya|oymyakon|lesedi|namida|skypiece)-prova-(d|c|b|a)$';

do $$
begin
  if not exists (
    select 1 from public.v2_missions
    where created_by is null
      and slug ~ '^(aokigahara|darkya|oymyakon|lesedi|namida|skypiece)-(e|d|c|b)-[0-9]{2}-[0-9]{2}$'
  ) then
    raise exception 'Nenhuma missão gerada foi encontrada para reescrita';
  end if;

  if exists (
    select 1 from public.v2_missions
    where created_by is null
      and slug ~ '^(aokigahara|darkya|oymyakon|lesedi|namida|skypiece)-(e|d|c|b)-[0-9]{2}-[0-9]{2}$'
      and (
        description ~ '^(Patrulhe|Leve a carga|Colete os materiais|Escolte o viajante|Investigue os sinais|Encontre os desaparecidos|Contenha a ameaça|Recupere o objeto|Proteja o posto|Explore)'
        or objective in (
          'Deixe a área segura para os moradores.',
          'Entregue a carga intacta.',
          'Entregue os materiais à Guilda.',
          'Leve o viajante ao destino.',
          'Retorne com provas da investigação.',
          'Traga todos de volta em segurança.',
          'Impeça a ameaça de chegar às áreas habitadas.',
          'Devolva o objeto ao responsável.',
          'Mantenha o posto protegido.',
          'Entregue o mapa da nova rota.'
        )
      )
  ) then
    raise exception 'Ainda existem contratos gerados com texto vago';
  end if;
end;
$$;

commit;
