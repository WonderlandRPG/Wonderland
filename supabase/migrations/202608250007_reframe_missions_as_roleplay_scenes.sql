begin;

-- As missões são propostas de cenas escritas no WhatsApp. Estes textos oferecem
-- contexto, conflito e um desfecho narrativo, sem contadores de videogame.
with realm_details(
  kingdom, atmosphere, patrol_threat, cargo, material, traveler, mystery,
  missing_group, containment_threat, lost_object, attackers, route_hazard
) as (values
  ('aokigahara',
   'o ar carrega cheiro de terra molhada, folhas sussurram sem vento e raízes parecem mudar de lugar',
   'criaturas cobertas por seiva escura rondam os caminhos vivos',
   'ervas lunares e frascos de resina medicinal',
   'brotos de seiva dourada que só podem ser retirados sem ferir a árvore',
   'um botânico dos Sacerdotes Verdes que conhece os sinais da floresta',
   'um canto subterrâneo que desperta raízes agressivas',
   'coletores de ervas que deixaram ferramentas e pegadas interrompidas para trás',
   'raízes corrompidas que avançam lentamente na direção das moradias',
   'um relicário com sementes da Árvore Imponente',
   'feras corrompidas atraídas pela seiva armazenada no posto',
   'cipós que fecham passagens, raízes móveis e nuvens de esporos'),
  ('darkya',
   'a chuva bate no metal oxidado, os lampiões falham e cada trovão encobre passos nas passarelas',
   'saqueadores e autômatos enferrujados usam a tempestade como cobertura',
   'filtros de água, mantas secas e peças de reposição',
   'engrenagens de cobre retiradas de mecanismos abandonados',
   'uma engenheira que precisa alcançar os para-raios da Cidade Ferrugem',
   'descargas irregulares ligadas a máquinas que deveriam estar desativadas',
   'operários desaparecidos durante uma chuva de fuligem',
   'um vazamento tóxico que escorre pelos canais até os bairros baixos',
   'o núcleo de cobre de um para-raios antigo',
   'contrabandistas interessados nos suprimentos da Guilda',
   'passarelas corroídas, canais alagados e descargas elétricas'),
  ('oymyakon',
   'a neve apaga rastros rapidamente, o gelo estala sob os pés e a neblina torna qualquer silhueta suspeita',
   'predadores glaciais e saqueadores se escondem na nevasca',
   'carvão, óleo para lamparinas e remédios contra congelamento',
   'cristais azuis que precisam ser extraídos sem provocar novas rachaduras',
   'uma cartógrafa das caravanas de mineração que conhece atalhos sob o gelo',
   'rachaduras que emitem um calor impossível sob o gelo regenerativo',
   'mineiros isolados depois do desabamento de um túnel',
   'uma fissura instável que congela as rotas de abastecimento',
   'uma bússola boreal pertencente aos primeiros exploradores',
   'feras da neve atraídas pelo calor das fogueiras',
   'gelo quebradiço, baixa visibilidade e sinais de avalanche'),
  ('lesedi',
   'o calor distorce o horizonte, a areia cobre marcas em poucos minutos e a mana faz miragens parecerem reais',
   'escaravelhos gigantes e saqueadores seguem as caravanas à distância',
   'água, especiarias e frascos de óleo perfumado',
   'fragmentos de vidro de mana que ainda conservam luz',
   'uma guia das caravanas que sabe ler a posição da Estrela de Mana',
   'rastros circulares que surgem antes do desaparecimento de cargas',
   'mercadores separados da caravana por uma tempestade de areia',
   'um enxame de escaravelhos que se aproxima dos poços habitados',
   'um astrolábio de vidro usado para orientar caravanas',
   'saqueadores montados que observam o posto ao anoitecer',
   'dunas móveis, miragens de mana e trechos sem qualquer abrigo'),
  ('namida',
   'a luz dos corais oscila, as correntes trazem sons distantes e as fraturas da antiga redoma permanecem visíveis',
   'predadores marinhos atravessam as barreiras rompidas',
   'pérolas de luz, medicamentos e cilindros de ar',
   'corais luminosos usados no reparo das barreiras',
   'uma cuidadora do Berçário dos Cavalos-marinhos que teme novas rupturas',
   'correntes frias surgidas onde os mapas indicavam águas calmas',
   'mergulhadores arrastados para túneis depois de uma mudança de corrente',
   'uma corrente contaminada que avança para os distritos habitados',
   'uma concha de comando dos antigos Guardiões',
   'criaturas abissais atraídas pelas luzes do posto',
   'correntes violentas, túneis alagados e áreas de escuridão profunda'),
  ('skypiece',
   'rajadas fazem as pontes vibrarem, fragmentos flutuam contra o vento e ilhas distantes mudam de posição',
   'criaturas aladas corrompidas circulam cristais instáveis',
   'quartzo branco, cabos de ancoragem e cristais de sustentação',
   'estilhaços puros do Cristal Azul de Mana',
   'uma técnica responsável por estabilizar as âncoras das ilhas',
   'oscilações de mana que fazem pontes e ilhas perderem altitude',
   'trabalhadores presos numa ilha que se afastou da rota principal',
   'corrupção cristalina que se espalha pelos suportes das ilhas',
   'uma chave de sintonia usada nas antigas âncoras celestes',
   'feras aladas atraídas pela energia do posto',
   'pontes instáveis, rajadas imprevisíveis e quedas de fragmentos')
), rank_details(rank, pressure) as (values
  ('E', 'O problema ainda é pequeno, deixando espaço para cautela, diálogo e descoberta.'),
  ('D', 'Há sinais de oposição organizada, e uma decisão precipitada pode piorar a situação.'),
  ('C', 'A cena deve transmitir alto risco e consequências reais para quem vive na região.'),
  ('B', 'A crise é urgente: escolhas difíceis, perdas possíveis e a proteção dos habitantes devem pesar na narrativa.')
), generated_missions as (
  select
    mission.id,
    substring(mission.name from '.*: (.*)$') as location,
    substring(mission.slug from '-([0-9]{2})-[0-9]{2}$')::integer as action_index,
    realm.*,
    rank_detail.pressure
  from public.v2_missions mission
  join realm_details realm on realm.kingdom = mission.kingdom
  join rank_details rank_detail on rank_detail.rank = mission.rank
  where mission.is_rank_trial = false
    and mission.created_by is null
    and mission.slug ~ '^(aokigahara|darkya|oymyakon|lesedi|namida|skypiece)-(e|d|c|b)-[0-9]{2}-[0-9]{2}$'
), scene_prompts as (
  select
    generated.id,
    case generated.action_index
      when 1 then format(
        'Na região de %s, %s. Moradores afirmam que %s. Seu personagem foi chamado para percorrer o local, entender o que está assustando os viajantes e decidir como devolver alguma segurança ao caminho. %s',
        generated.location, generated.atmosphere, generated.patrol_threat, generated.pressure)
      when 2 then format(
        'Uma remessa de %s precisa atravessar a região de %s. Enquanto %s, rumores sobre perigos na rota colocam em dúvida se a carga chegará ao destino. O encontro com o intendente pode revelar por que esses suprimentos são tão importantes. %s',
        generated.cargo, generated.location, generated.atmosphere, generated.pressure)
      when 3 then format(
        'A Guilda enviou seu personagem à região de %s em busca de %s. O recurso é valioso e deve ser recolhido com cuidado; sinais no ambiente sugerem que alguém ou alguma coisa também o procura. Em volta, %s. %s',
        generated.location, generated.material, generated.atmosphere, generated.pressure)
      when 4 then format(
        '%s precisa atravessar a região de %s e pediu a proteção da Guilda. Durante o caminho, %s. A viagem oferece espaço para conversa, desconfiança e uma ameaça que obrigue seu personagem a escolher como proteger o viajante. %s',
        initcap(generated.traveler), generated.location, generated.atmosphere, generated.pressure)
      when 5 then format(
        'Relatos vindos da região de %s descrevem %s. Ao chegar, seu personagem encontra um cenário em que %s. As pistas não apontam imediatamente para uma única resposta, e alguém pode ter interesse em esconder a verdade. %s',
        generated.location, generated.mystery, generated.atmosphere, generated.pressure)
      when 6 then format(
        'A Guilda perdeu contato com %s nas proximidades de %s. Os últimos sinais deixados pelo grupo atravessam um lugar onde %s. Encontrá-los será apenas parte do problema: será preciso descobrir o que aconteceu e criar uma saída segura. %s',
        generated.missing_group, generated.location, generated.atmosphere, generated.pressure)
      when 7 then format(
        'Batedores viram %s na região de %s. Enquanto %s, os moradores tentam abandonar a rota ameaçada. Seu personagem precisa ganhar tempo, compreender como o perigo se espalha e impedir que ele alcance a comunidade. %s',
        generated.containment_threat, generated.location, generated.atmosphere, generated.pressure)
      when 8 then format(
        '%s desapareceu durante uma passagem por %s. No local, %s. Rastros incompletos sugerem que o objeto pode ter sido encontrado por outra pessoa ou estar protegido por algo que não deseja entregá-lo. %s',
        initcap(generated.lost_object), generated.location, generated.atmosphere, generated.pressure)
      when 9 then format(
        'O posto avançado de %s espera a chegada de %s antes da troca da guarda. Lá, %s. Os vigias estão cansados e divididos sobre a melhor defesa, cabendo ao seu personagem preparar o local e sustentar a coragem do grupo. %s',
        generated.location, generated.attackers, generated.atmosphere, generated.pressure)
      when 10 then format(
        'Nenhum mapa confiável atravessa a região de %s. O local apresenta %s e, durante a aproximação, %s. A expedição deve revelar algo útil ou inesperado sobre o caminho, mesmo que seja necessário abandonar a rota inicialmente planejada. %s',
        generated.location, generated.route_hazard, generated.atmosphere, generated.pressure)
    end as description,
    case generated.action_index
      when 1 then format('Na cena, mostre a chegada à região de %s, o encontro com a ameaça e a escolha usada para tornar o caminho seguro. Encerre com o retorno à Guilda ou aos moradores.', generated.location)
      when 2 then format('Na cena, desenvolva ao menos uma complicação durante a travessia pela região de %s e encerre com a entrega da carga — ou com uma consequência clara caso ela seja perdida.', generated.location)
      when 3 then format('Na cena, narre a procura na região de %s, a dificuldade para obter o material sem destruí-lo e a entrega do que foi recuperado à Guilda.', generated.location)
      when 4 then format('Na cena, dê voz ao viajante, apresente um perigo ou impasse na região de %s e conduza a relação entre ele e seu personagem até um desfecho seguro ou justificadamente dramático.', generated.location)
      when 5 then format('Na cena, investigue sinais na região de %s, conecte as pistas a uma causa e termine levando uma prova, testemunho ou conclusão fundamentada à Guilda.', generated.location)
      when 6 then format('Na cena, siga os rastros em %s, revele o que aconteceu aos desaparecidos e mostre como seu personagem tenta conduzi-los de volta em segurança.', generated.location)
      when 7 then format('Na cena, mostre a ameaça avançando pela região de %s, a reação dos habitantes e a maneira encontrada por seu personagem para contê-la antes que alcance a comunidade.', generated.location)
      when 8 then format('Na cena, siga as pistas deixadas em %s, confronte o obstáculo que protege ou tomou o objeto e encerre com sua recuperação ou com uma consequência coerente.', generated.location)
      when 9 then format('Na cena, prepare a defesa do posto de %s, trabalhe a tensão entre os vigias e mostre como a posição resiste — ou o preço pago para que outros escapem.', generated.location)
      when 10 then format('Na cena, explore a região de %s, apresente os perigos e uma descoberta marcante, e termine com seu personagem registrando uma rota útil ou explicando por que ela deve ser evitada.', generated.location)
    end as objective
  from generated_missions generated
)
update public.v2_missions mission
set
  description = scene.description,
  objective = scene.objective,
  updated_at = now()
from scene_prompts scene
where mission.id = scene.id;

with realm_trials(kingdom, setting, crisis) as (values
  ('aokigahara', 'junto às raízes externas da Árvore Imponente', 'uma expansão de seiva corrompida ameaça alcançar um pequeno povoado'),
  ('darkya', 'entre os mecanismos centrais da Cidade Ferrugem', 'uma tempestade reativou máquinas antigas e isolou trabalhadores'),
  ('oymyakon', 'nas passagens sob as Muralhas de Gelo', 'uma ruptura no gelo regenerativo bloqueou a única rota segura'),
  ('lesedi', 'sob a luz da Estrela de Mana', 'uma caravana cercada precisa decidir entre proteger pessoas ou suprimentos'),
  ('namida', 'junto às fraturas da antiga Redoma de Mana', 'uma corrente abissal alcançou a cidade e separou famílias'),
  ('skypiece', 'junto às âncoras do Cristal Azul de Mana', 'uma ilha instável foi tomada pela corrupção e começa a perder altitude')
), trial_scenes(rank, promotion_rank, expectation, outcome) as (values
  ('E', 'D', 'A avaliação observa iniciativa, prudência e a forma como seu personagem reage quando o plano inicial deixa de funcionar.', 'Na cena, apresente o chamado da Guilda, uma complicação durante a patrulha e uma solução que revele como seu personagem conquistou — ou deixou de conquistar — a confiança do avaliador.'),
  ('D', 'C', 'A avaliação exige leitura da situação, proteção de terceiros e uma decisão diante de oposição organizada.', 'Na cena, investigue a ameaça, inclua alguém que dependa da decisão do seu personagem e encerre mostrando as consequências da estratégia escolhida diante do avaliador.'),
  ('C', 'B', 'A avaliação coloca seu personagem na liderança de pessoas assustadas em uma área de alto risco.', 'Na cena, mostre seu personagem assumindo a liderança, enfrentando um revés sério e escolhendo como salvar os envolvidos sem permitir que a crise se espalhe.'),
  ('B', 'A', 'A avaliação final exige comando, responsabilidade e uma escolha difícil quando não é possível preservar tudo.', 'Na cena, desenvolva a evacuação, a contenção e o confronto decisivo. O desfecho deve deixar claro o que seu personagem protegeu, o que sacrificou e por que merece o Rank A.')
)
update public.v2_missions mission
set
  description = format(
    'A Prova de Ascensão acontece %s, onde %s. %s A cena é supervisionada pela Guilda, mas o avaliador não interferirá nas escolhas do seu personagem.',
    realm.setting, realm.crisis, trial.expectation),
  objective = trial.outcome,
  updated_at = now()
from realm_trials realm
cross join trial_scenes trial
where mission.kingdom = realm.kingdom
  and trial.rank = mission.rank
  and trial.promotion_rank = mission.promotion_rank
  and mission.is_rank_trial = true
  and mission.created_by is null
  and mission.slug ~ '^(aokigahara|darkya|oymyakon|lesedi|namida|skypiece)-prova-(d|c|b|a)$';

do $$
begin
  if exists (
    select 1 from public.v2_missions
    where created_by is null
      and (
        slug ~ '^(aokigahara|darkya|oymyakon|lesedi|namida|skypiece)-(e|d|c|b)-[0-9]{2}-[0-9]{2}$'
        or slug ~ '^(aokigahara|darkya|oymyakon|lesedi|namida|skypiece)-prova-(d|c|b|a)$'
      )
      and objective not like 'Na cena,%'
  ) then
    raise exception 'Ainda existem missões geradas sem direção narrativa de cena';
  end if;
end;
$$;

commit;
