begin;

-- Shared festival contracts; progress belongs to the player, not the shared board.
alter table public.v2_missions
  add column event_key text,
  add column event_day date,
  add column reward_candies integer not null default 0 check (reward_candies >= 0),
  add constraint v2_missions_festival_check check (
    (event_key is null and event_day is null and reward_candies = 0)
    or (event_key is not null and event_day is not null and event_key = 'noites-apavorantes-2026' and event_day between date '2026-10-08' and date '2026-10-25'
      and not is_rank_trial and reward_gold = 0)
  );
create unique index v2_missions_festival_day_idx on public.v2_missions(event_key, kingdom, event_day)
  where event_key is not null;

alter table public.v2_mission_assignments
  add column event_key text,
  add column event_day date,
  add column reward_candies integer not null default 0 check (reward_candies >= 0),
  add constraint v2_mission_assignments_festival_check check (
    (event_key is null and event_day is null and reward_candies = 0)
    or (event_key is not null and event_day is not null and event_key = 'noites-apavorantes-2026' and event_day between date '2026-10-08' and date '2026-10-25')
  );
-- Prevent farming by changing characters/kingdoms, including concurrent requests.
create unique index v2_mission_festival_once_per_player_idx
  on public.v2_mission_assignments(user_id, event_key, event_day)
  where event_key is not null and status in ('in_progress', 'completed');

create table public.v2_festival_wallets (
  character_id uuid not null references public.v2_characters(id) on delete cascade,
  event_key text not null check (event_key = 'noites-apavorantes-2026'),
  candies bigint not null default 0 check (candies >= 0),
  updated_at timestamptz not null default now(),
  primary key(character_id, event_key)
);
alter table public.v2_festival_wallets enable row level security;
revoke all on public.v2_festival_wallets from public, anon, authenticated;
grant select on public.v2_festival_wallets to authenticated;
create policy "festival wallet owner read" on public.v2_festival_wallets
  for select to authenticated using (
    exists(select 1 from public.v2_characters c where c.id = character_id and c.user_id = (select auth.uid()))
  );

-- Reward is exactly twice the official rank XP; no WG or additional kingdom multiplier.
create function public.v2_festival_rank_xp(p_rank text)
returns bigint language sql immutable security invoker set search_path = '' as $$
  select case p_rank when 'E' then 1000 when 'D' then 2000 when 'C' then 4000
    when 'B' then 8000 when 'A' then 16000 when 'S' then 30000 when 'EX' then 60000 else 0 end::bigint;
$$;
revoke all on function public.v2_festival_rank_xp(text) from public, anon;
grant execute on function public.v2_festival_rank_xp(text) to authenticated;

insert into public.v2_missions(kingdom,event_day,name,description,objective,slug,event_key,rank,min_level,reward_xp,reward_gold,reward_candies,active)
select kingdom,day::date,name,description,objective,slug,'noites-apavorantes-2026','E',1,1000,0,10,true
from (values
('aokigahara','2026-10-08','Espaço para a festa','A clareira ainda está coberta por galhos caídos e restos de folhas. Os organizadores pedem ajuda para liberar o espaço das barracas, mas nenhum galho deve ser cortado das árvores.','Recolha 10 galhos secos na área indicada e entregue ao grupo.','festival-2026-aokigahara-08'),
('aokigahara','2026-10-09','Um caminho mais seguro','Algumas partes do caminho até a clareira ficam escorregadias ao anoitecer. O grupo marcou os trechos onde os visitantes terão mais dificuldade para passar.','Recolha 8 pedras achatadas perto do riacho e coloque nos trechos marcados.','festival-2026-aokigahara-09'),
('aokigahara','2026-10-10','Lanternas entre as árvores','As primeiras lanternas estão prontas, mas ainda precisam ser penduradas. Cada uma tem uma fita de cor diferente e deve ficar no lugar correspondente.','Instale 5 lanternas nas árvores indicadas, respeitando a cor de cada fita.','festival-2026-aokigahara-10'),
('aokigahara','2026-10-11','Folhas que conservam a cor','O grupo quer preparar enfeites que durem até o fim do festival. As folhas verdes e as completamente secas não serão aceitas.','Recolha 12 folhas avermelhadas que já tenham caído no chão e entregue aos organizadores.','festival-2026-aokigahara-11'),
('aokigahara','2026-10-12','Cordas para os enfeites','As cordas trazidas pelos viajantes não são suficientes para as guirlandas. As fibras precisam chegar inteiras, sem cortes no meio.','Consiga 6 fibras resistentes de plantas da região e entregue para a montagem das guirlandas.','festival-2026-aokigahara-12'),
('aokigahara','2026-10-13','A madeira certa','Algumas placas de boas-vindas ainda precisam de suporte. O grupo procura peças com o centro preservado, mesmo que a parte de fora esteja apodrecida.','Recolha 4 pedaços de madeira escura entre os troncos caídos e entregue ao grupo.','festival-2026-aokigahara-13'),
('aokigahara','2026-10-14','O cheiro da floresta','Os organizadores estão preparando pequenos sachês para deixar nas barracas. Eles indicaram árvores onde a resina pode ser recolhida sem ferir os troncos.','Recolha 5 porções de resina nos pontos indicados, sem ferir as árvores.','festival-2026-aokigahara-14'),
('aokigahara','2026-10-15','Enfeites que desapareceram','Parte das fitas colocadas no dia anterior foi encontrada longe da clareira. Algumas ficaram presas em raízes baixas, apesar de terem sido penduradas nos galhos.','Recupere 6 fitas alaranjadas ao longo do caminho e devolva ao grupo.','festival-2026-aokigahara-15'),
('aokigahara','2026-10-16','Terra para os vasos','As barracas receberão vasos com plantas locais. Os organizadores já deixaram recipientes numerados e pedem que a terra de cada ponto seja mantida separada.','Recolha 3 pequenas porções de terra nos pontos assinalados e entregue nos recipientes correspondentes.','festival-2026-aokigahara-16'),
('aokigahara','2026-10-17','Abóboras sem rachaduras','As novas lanternas serão feitas com abóboras. O grupo também está separando as cascas retiradas durante o preparo para aproveitar na compostagem.','Entregue 4 abóboras intactas e leve as cascas do preparo até a caixa de compostagem atrás das barracas.','festival-2026-aokigahara-17'),
('aokigahara','2026-10-18','A trilha das fitas','Os visitantes precisarão encontrar o festival depois de escurecer. Uma das marcações fica em uma passagem pouco usada, que dá acesso aos fundos da clareira.','Amarre 6 fitas nos pontos indicados do caminho até o festival.','festival-2026-aokigahara-18'),
('aokigahara','2026-10-19','Onde a água acumula','A chuva deixou poças perto das mesas. Os organizadores entregaram um desenho para conduzir a água até a área das raízes sem alagar as barracas.','Abra 3 pequenos canais de escoamento nos trechos demarcados, seguindo o desenho recebido.','festival-2026-aokigahara-19'),
('aokigahara','2026-10-20','Musgo para o acabamento','As bases de madeira estão destoando do restante da decoração. O grupo quer cobrir os suportes com musgo, mas pede que as raízes vivas sejam preservadas.','Recolha 6 porções de musgo em pedras úmidas e entregue para cobrir os suportes.','festival-2026-aokigahara-20'),
('aokigahara','2026-10-21','Sinos para os visitantes','Pequenos sinos serão colocados nas entradas do festival. Um deles soa mais baixo que os outros, mas os organizadores pedem que seja mantido.','Instale 4 sinos nos suportes marcados e teste cada um.','festival-2026-aokigahara-21'),
('aokigahara','2026-10-22','Raízes descobertas','A passagem de trabalhadores deixou alguns trechos das raízes expostos. As fitas amarradas nesses pontos devem permanecer no lugar durante o trabalho.','Cubra 4 pontos das raízes com a terra e as folhas entregues pelo grupo, sem deslocar as fitas.','festival-2026-aokigahara-22'),
('aokigahara','2026-10-23','Uma luz para cada lembrança','Uma parte da clareira será reservada para homenagens. Os moradores poderão deixar pequenas lembranças diante das lanternas preparadas pelo grupo.','Coloque 6 lanternas apagadas nos suportes indicados e deixe espaço para as lembranças.','festival-2026-aokigahara-23'),
('aokigahara','2026-10-24','Preparativos depois do anoitecer','O grupo quer conferir se o caminho está bem iluminado. Em alguns trechos, a luz parece ficar mais fraca perto do chão.','Percorra 5 pontos da trilha à noite e registre quais lanternas precisam de óleo.','festival-2026-aokigahara-24'),
('aokigahara','2026-10-25','A clareira está pronta','Os organizadores estão fazendo a última revisão da área. O cesto de folhas destinado à estrutura central será guardado fechado até a noite principal do festival.','Recoloque uma placa, reforce duas amarrações e leve um cesto de folhas até a estrutura central.','festival-2026-aokigahara-25'),
('darkya','2026-10-08','Antes que tudo molhe','Algumas caixas chegaram com as lonas soltas. A água está se aproximando dos tecidos e dos enfeites que serão usados nas barracas.','Leve 4 caixas de materiais até a área coberta indicada.','festival-2026-darkya-08'),
('darkya','2026-10-09','Tendas para a chuva','As primeiras barracas precisam de reforço para suportar o tempo de Darkya. O grupo aceita peças usadas, desde que estejam firmes.','Entregue 6 peças de madeira resistente para sustentar as coberturas.','festival-2026-darkya-09'),
('darkya','2026-10-10','Barris vazios','A água recolhida será usada na limpeza e nos preparativos. Os organizadores pedem barris que nunca tenham armazenado óleo.','Consiga 3 barris vazios, lave por dentro e entregue ao grupo.','festival-2026-darkya-10'),
('darkya','2026-10-11','Calhas desobstruídas','Folhas e ferrugem estão impedindo a passagem da água nas construções cedidas ao festival. O grupo forneceu sacos para guardar os resíduos retirados.','Limpe 4 trechos de calha e deixe os resíduos nos sacos fornecidos.','festival-2026-darkya-11'),
('darkya','2026-10-12','Tecidos para as mesas','Os tecidos das barracas chegaram manchados da viagem. Cada peça tem uma pequena marca bordada no canto, que deve ser preservada durante a lavagem.','Lave 5 peças na água recolhida pelo grupo e estenda na área coberta.','festival-2026-darkya-12'),
('darkya','2026-10-13','Água da primeira chuva','Um dos cozinheiros separou novos recipientes para o trabalho. Para este pedido, a água dos reservatórios antigos não serve.','Encha 3 jarros com água de chuva recém-recolhida nos pontos indicados.','festival-2026-darkya-13'),
('darkya','2026-10-14','Uma tampa para cada barril','Alguns reservatórios estão recebendo sujeira das ruas. Os barris já estão identificados por símbolos na madeira e precisam conservar a abertura da coleta.','Ajuste 4 tampas, deixando apenas a abertura destinada à entrada da água.','festival-2026-darkya-14'),
('darkya','2026-10-15','Passagem sem lama','O terreno entre as barracas está dificultando o transporte. Pequenas canaletas passam entre os reservatórios e não devem ser cobertas.','Espalhe 5 cargas de cascalho nos trechos marcados, deixando as canaletas livres.','festival-2026-darkya-15'),
('darkya','2026-10-16','Recipientes fora do lugar','Durante a madrugada, duas coberturas cederam e alguns vasos foram deslocados. Mesmo os que ficaram em lugares aparentemente melhores precisam voltar às marcas do piso.','Recoloque 5 recipientes nas posições marcadas pelos organizadores.','festival-2026-darkya-16'),
('darkya','2026-10-17','O sabor dos doces','O grupo está testando uma receita para o festival. As cascas das frutas serão guardadas para perfumar a água usada na limpeza.','Recolha 6 porções de frutas ácidas e entregue na barraca de preparo.','festival-2026-darkya-17'),
('darkya','2026-10-18','Depois do trovão','Os organizadores querem substituir parte da água armazenada. Os frascos devem ser preenchidos depois do primeiro trovão e entregues com as tampas fechadas.','Durante uma tempestade, recolha 3 frascos de água nas calhas indicadas, depois do primeiro trovão.','festival-2026-darkya-18'),
('darkya','2026-10-19','Marcas nos reservatórios','A chuva apagou algumas identificações. O desenho de cada marca vem em uma folha separada, junto da posição correta.','Refaça 6 marcas nos barris usando a tinta e os desenhos fornecidos.','festival-2026-darkya-19'),
('darkya','2026-10-20','Goteiras no depósito','Uma infiltração está ameaçando as caixas de decoração. A água recolhida durante o reparo deve ser levada ao reservatório coberto.','Vede 3 goteiras, posicione os recipientes de coleta e leve a água ao reservatório coberto.','festival-2026-darkya-20'),
('darkya','2026-10-21','O fundo dos vasos','Alguns recipientes precisam ser limpos antes de receber mais água. Os organizadores querem conferir o material acumulado antes de descartar.','Retire o sedimento de 4 vasos vazios e entregue os resíduos ao grupo.','festival-2026-darkya-21'),
('darkya','2026-10-22','Lanternas contra o vento','As lanternas das tendas estão apagando com facilidade. Uma delas fica sobre o reservatório central, longe das mesas.','Instale 5 proteções de vidro e confira as amarrações das lanternas.','festival-2026-darkya-22'),
('darkya','2026-10-23','Uma reserva para a festa','A barraca de preparo precisa de água separada para os últimos dias. O grupo entregou uma lista com a ordem dos barris que devem ser usados.','Transfira 6 baldes dos barris identificados para o reservatório central, seguindo a ordem da lista.','festival-2026-darkya-23'),
('darkya','2026-10-24','O caminho da chuva','O grupo quer verificar o funcionamento das calhas durante uma chuva. Todos os pontos de escoamento devem alimentar os recipientes indicados.','Observe 4 pontos de escoamento durante a chuva e corrija as peças que estiverem desviando a água.','festival-2026-darkya-24'),
('darkya','2026-10-25','Tudo sob cobertura','Os materiais que só serão usados na celebração precisam ser protegidos. A lona central tem aberturas próprias para a água continuar entrando.','Cubra três reservatórios e prenda a lona da estrutura central, mantendo livres as aberturas de coleta.','festival-2026-darkya-25'),
('oymyakon','2026-10-08','Um lugar sob a neve','A área cedida ao festival ainda está coberta pela nevasca. Algumas marcas já estavam no gelo quando o grupo chegou e precisam continuar visíveis.','Limpe 4 trechos demarcados, levando a neve retirada até a borda do terreno.','festival-2026-oymyakon-08'),
('oymyakon','2026-10-09','Carga nos trenós','As caixas mais pesadas continuam perto da entrada da capital. Uma delas precisa permanecer fechada e longe dos braseiros.','Transporte 3 caixas nos trenós disponibilizados e deixe nos pontos indicados.','festival-2026-oymyakon-09'),
('oymyakon','2026-10-10','Calor para quem chega','Os visitantes terão um espaço para se aquecer. Os braseiros ficarão afastados da escultura principal para não prejudicar o trabalho.','Entregue 8 pedaços de lenha seca na área das barracas.','festival-2026-oymyakon-10'),
('oymyakon','2026-10-11','Gelo sem bolhas','O grupo começou a selecionar blocos para as esculturas. Peças com bolhas ou rachaduras serão separadas para outros usos.','Recolha 4 fragmentos de gelo transparente na região indicada, sem bolhas ou rachaduras.','festival-2026-oymyakon-11'),
('oymyakon','2026-10-12','Tecidos que seguram o vento','As laterais das barracas precisam de proteção. O desenho dos organizadores indica quais passagens devem continuar abertas.','Instale 4 painéis de tecido grosso, deixando abertas as passagens marcadas.','festival-2026-oymyakon-12'),
('oymyakon','2026-10-13','Ferramentas presas no gelo','Algumas ferramentas ficaram congeladas durante o trabalho. O grupo forneceu um material para soltá-las sem aquecer as caixas ao redor.','Recupere 5 ferramentas no depósito externo e entregue ao escultor.','festival-2026-oymyakon-13'),
('oymyakon','2026-10-14','Cristais para a iluminação','As lanternas receberão cristais que refletem melhor a luz. O grupo procura os que continuam frios mesmo depois de algum tempo dentro de uma bolsa.','Recolha 6 cristais pálidos nas formações próximas e entregue aos organizadores.','festival-2026-oymyakon-14'),
('oymyakon','2026-10-15','Uma base mais firme','Os suportes da escultura precisam ser assentados nas cavidades já abertas. Cada placa tem uma marca que deve ficar voltada para baixo.','Coloque 4 placas de pedra nas cavidades indicadas, com as marcas voltadas para baixo.','festival-2026-oymyakon-15'),
('oymyakon','2026-10-16','Conservar os ingredientes','Os alimentos da festa serão guardados em caixas próprias. Os organizadores pedem que cada caixa receba uma camada de neve limpa.','Separe 5 porções de ingredientes e leve ao depósito indicado, cobrindo as caixas com neve limpa.','festival-2026-oymyakon-16'),
('oymyakon','2026-10-17','O caminho dos visitantes','A neve voltou a cobrir a entrada do festival. Uma das lanternas baixas marca uma passagem usada apenas pelos trabalhadores.','Limpe 5 pontos do trajeto e reposicione as lanternas baixas.','festival-2026-oymyakon-17'),
('oymyakon','2026-10-18','Uma rachadura pequena','Uma parte da escultura começou a apresentar fissuras. A mistura entregue pelo grupo deixa o gelo levemente azulado antes de desaparecer.','Preencha 3 rachaduras com a mistura fornecida e alise a superfície.','festival-2026-oymyakon-18'),
('oymyakon','2026-10-19','Neve que ainda não foi pisada','A decoração das mesas precisa de neve limpa. Os recipientes serão fechados assim que chegarem à área de preparo.','Recolha 4 recipientes de neve em uma área protegida do vento e entregue sem compactar.','festival-2026-oymyakon-19'),
('oymyakon','2026-10-20','Enfeites dentro do gelo','Algumas peças decorativas serão congeladas na base da escultura. Cada peça tem um formato diferente e uma cavidade correspondente.','Coloque 5 pequenos enfeites nas cavidades indicadas e cubra com água.','festival-2026-oymyakon-20'),
('oymyakon','2026-10-21','Cobertores para a espera','O grupo espera receber visitantes que viajaram de longe. As mantas gastas também servem, desde que não estejam rasgadas.','Entregue 3 mantas grossas e organize os bancos da área de descanso.','festival-2026-oymyakon-21'),
('oymyakon','2026-10-22','A luz atravessa a escultura','Os organizadores estão testando a iluminação. Algumas partes da estrutura continuam escuras mesmo com as lanternas próximas.','Posicione 4 lanternas ao redor da estrutura e marque no desenho os pontos que continuam escuros.','festival-2026-oymyakon-22'),
('oymyakon','2026-10-23','O depósito mais frio','Algumas caixas precisam ser transferidas para uma sala com temperatura mais baixa. Há instruções para não empilhar nenhuma delas.','Leve 3 caixas lacradas até o novo depósito, mantendo cada uma separada.','festival-2026-oymyakon-23'),
('oymyakon','2026-10-24','Acabamento antes da festa','A escultura está quase pronta. Os canais estreitos da base precisam permanecer abertos até a revisão dos organizadores.','Remova o excesso de neve de 5 partes da estrutura e limpe os canais estreitos da base.','festival-2026-oymyakon-24'),
('oymyakon','2026-10-25','Guardar até a última noite','O grupo está fechando a área de trabalho. O compartimento da base será selado com uma nova camada de gelo depois que receber os cristais.','Prenda duas coberturas e coloque uma caixa de cristais no compartimento da base.','festival-2026-oymyakon-25'),
('skypiece','2026-10-08','Pouca bagagem, muito trabalho','O grupo trouxe menos materiais do que precisava. O depósito local autorizou a retirada de peças reaproveitáveis para as primeiras barracas.','Recolha 6 peças de madeira reaproveitável no depósito autorizado e entregue ao grupo.','festival-2026-skypiece-08'),
('skypiece','2026-10-09','Enfeites levados pelo vento','Algumas fitas escaparam durante a descarga. As mais leves acabaram presas nas bordas das passarelas.','Recupere 8 fitas nos pontos indicados da capital e devolva aos organizadores.','festival-2026-skypiece-09'),
('skypiece','2026-10-10','Bases para as lanternas','Os postes precisam ser firmados antes da instalação das luzes. Cada base deve ficar sobre a marca correspondente no piso.','Monte 4 bases com as peças fornecidas, respeitando as marcas do piso.','festival-2026-skypiece-10'),
('skypiece','2026-10-11','Cristais pequenos também servem','O grupo aceita fragmentos que já não são usados em peças maiores. Os organizadores querem todos separados por tamanho.','Entregue 6 pequenos cristais de Mana obtidos na área autorizada, separados por tamanho.','festival-2026-skypiece-11'),
('skypiece','2026-10-12','Um teto que não voe','As coberturas precisam resistir ao vento de Skypiece. Os fios finos presos aos suportes devem permanecer livres durante o reforço.','Reforce 5 amarrações nas barracas sem prender os fios finos dos suportes.','festival-2026-skypiece-12'),
('skypiece','2026-10-13','Lanternas de cores diferentes','A iluminação será dividida entre as áreas do festival. A lanterna azul fica na passagem entre duas barracas.','Instale 5 lanternas de acordo com o desenho recebido.','festival-2026-skypiece-13'),
('skypiece','2026-10-14','Piso para os visitantes','Parte do terreno precisa de uma cobertura para evitar tropeços. Algumas placas têm um pequeno espaço por baixo para a passagem dos cabos.','Assente 6 placas de piso nos trechos preparados, preservando o espaço dos cabos.','festival-2026-skypiece-14'),
('skypiece','2026-10-15','Uma luz que falha','Certas lanternas apagam pouco depois de serem acesas. Um dos cristais volta a brilhar quando é aproximado dos demais.','Teste 4 lanternas e leve os cristais defeituosos ao grupo.','festival-2026-skypiece-15'),
('skypiece','2026-10-16','Peças para reposição','Os organizadores querem evitar atrasos durante a festa. As peças precisam estar sem ferrugem e sem tinta nas extremidades.','Consiga 5 conectores metálicos no depósito autorizado e entregue ao grupo.','festival-2026-skypiece-16'),
('skypiece','2026-10-17','Fios fora da passagem','Alguns cabos ficaram expostos perto das mesas. Eles serão cobertos depois da revisão, mas a sequência das etiquetas precisa ser mantida.','Prenda 6 trechos de fio nos encaixes indicados, mantendo a sequência das etiquetas.','festival-2026-skypiece-17'),
('skypiece','2026-10-18','Vidros bem limpos','A poeira está alterando a cor das lanternas. Uma das proteções tem marcas por dentro e precisa ser devolvida sem tentar removê-las.','Limpe 5 proteções de vidro com o tecido fornecido, preservando as marcas internas.','festival-2026-skypiece-18'),
('skypiece','2026-10-19','Luzes na mesma altura','O grupo quer ajustar a aparência da decoração. A altura pedida varia poucos centímetros entre cada suporte.','Reposicione 4 lanternas usando a régua e as medidas entregues pelos organizadores.','festival-2026-skypiece-19'),
('skypiece','2026-10-20','Uma caixa esquecida','Uma caixa de materiais ficou no ponto de chegada da Ponte de Arco-Íris. Ela contém peças reservadas para a estrutura central.','Busque a caixa identificada com uma lanterna e entregue fechada na área do festival.','festival-2026-skypiece-20'),
('skypiece','2026-10-21','O teste das barracas','A iluminação precisa funcionar com todas as áreas ocupadas. O grupo forneceu uma ordem específica para o teste.','Ative 5 conjuntos de lanternas, um de cada vez, na ordem recebida, e anote qual demora mais para acender.','festival-2026-skypiece-21'),
('skypiece','2026-10-22','Cristais que perderam o brilho','Algumas peças serão substituídas antes da celebração. Os cristais antigos devem voltar para a caixa de coleta.','Retire 4 cristais opacos, coloque os novos nos mesmos encaixes e devolva as peças antigas.','festival-2026-skypiece-22'),
('skypiece','2026-10-23','Um acabamento discreto','Os fios ainda aparecem em partes da decoração. As pequenas placas metálicas nas pontas precisam continuar descobertas.','Instale 5 faixas de tecido sobre os suportes indicados, deixando as placas metálicas expostas.','festival-2026-skypiece-23'),
('skypiece','2026-10-24','A iluminação depois do movimento','O grupo quer observar as lanternas quando o local estiver mais vazio. Algumas parecem acompanhar o brilho do Cristal Azul ao longe.','Confira 6 luzes ao anoitecer e registre qualquer mudança de cor.','festival-2026-skypiece-24'),
('skypiece','2026-10-25','A última peça do conjunto','O cristal reservado à estrutura central chegou embalado. Depois da instalação, a ferramenta precisa voltar para o responsável pelos testes finais.','Leve o cristal embalado até a estrutura central, encaixe na posição indicada e feche a proteção.','festival-2026-skypiece-25'),
('lesedi','2026-10-08','A caravana precisa descarregar','Algumas mercadorias ainda estão nas carroças. Os espelhos serão descarregados separadamente dos outros enfeites.','Leve 5 volumes de tecidos e enfeites até a praça escolhida.','festival-2026-lesedi-08'),
('lesedi','2026-10-09','Sombra para os visitantes','As primeiras barracas precisam de cobertura. Os organizadores pedem que a parte central da praça continue livre.','Instale 4 toldos nos suportes preparados, deixando o centro da praça livre.','festival-2026-lesedi-09'),
('lesedi','2026-10-10','Areia entre as peças','A viagem deixou areia nas caixas de decoração. As pequenas marcas gravadas na madeira não devem ser removidas durante a limpeza.','Limpe 6 suportes de espelho e entregue as peças prontas para montagem.','festival-2026-lesedi-10'),
('lesedi','2026-10-11','Doces para experimentar','Os comerciantes estão preparando amostras para os moradores. Cada porção de frutas será usada em uma receita diferente.','Recolha 8 porções de frutas secas e entregue na barraca de doces.','festival-2026-lesedi-11'),
('lesedi','2026-10-12','Espelhos sem manchas','Os primeiros espelhos já podem ser colocados na praça. Um deles tem o vidro mais escuro que os outros.','Limpe 5 espelhos com o material fornecido e leve até os suportes numerados.','festival-2026-lesedi-12'),
('lesedi','2026-10-13','Tecidos que deixam a luz passar','Algumas barracas receberão cortinas leves. O grupo quer materiais que permitam a passagem da luz sem deixar o interior completamente exposto.','Consiga 4 peças de tecido fino e entregue aos organizadores.','festival-2026-lesedi-13'),
('lesedi','2026-10-14','Bases que não afundam','Os suportes mais pesados estão cedendo na areia. As posições já foram medidas pelos organizadores.','Coloque 6 placas de pedra sob as bases indicadas.','festival-2026-lesedi-14'),
('lesedi','2026-10-15','Uma entrega delicada','Um artesão local terminou novas peças para o festival. Os discos serão guardados em caixas individuais ao chegar à praça.','Busque 3 discos de vidro polido e leve até a praça sem empilhar.','festival-2026-lesedi-15'),
('lesedi','2026-10-16','A praça mais bonita','O grupo quer distribuir os enfeites entre as barracas. Duas molduras ficam voltadas para o centro, mesmo sem nenhuma barraca naquela direção.','Instale 5 molduras decorativas nos suportes marcados.','festival-2026-lesedi-16'),
('lesedi','2026-10-17','O vento mudou tudo','Uma ventania deslocou algumas peças. Os organizadores pedem que o ajuste seja feito no horário registrado na folha da missão.','Recoloque 4 espelhos nas posições marcadas no chão, no horário indicado.','festival-2026-lesedi-17'),
('lesedi','2026-10-18','Uma tinta que aguenta o calor','As placas do festival precisam ser retocadas. O responsável pela decoração procura um tom dourado específico.','Recolha 5 porções de pigmento mineral na área indicada e entregue para o preparo da tinta.','festival-2026-lesedi-18'),
('lesedi','2026-10-19','Luz sobre as mesas','Alguns reflexos estão atingindo os olhos dos visitantes. O esquema recebido direciona a luz para as faixas claras presas acima das mesas.','Ajuste 3 pequenos espelhos para que os reflexos alcancem as faixas indicadas.','festival-2026-lesedi-19'),
('lesedi','2026-10-20','Peças que não podem riscar','Os enfeites de vidro serão usados apenas na celebração principal. Cada peça precisa ficar com a face marcada para cima.','Embale 6 peças com os tecidos fornecidos e coloque nas caixas numeradas.','festival-2026-lesedi-20'),
('lesedi','2026-10-21','Poeira na decoração','A areia voltou a cobrir os espelhos mais baixos. Uma das peças permanece morna mesmo sob a sombra do toldo.','Limpe 5 espelhos instalados sem alterar sua inclinação.','festival-2026-lesedi-21'),
('lesedi','2026-10-22','Um ponto de luz','Os organizadores querem testar um efeito para a festa. A placa de teste será retirada assim que o trabalho terminar.','Ajuste 3 espelhos menores até que seus reflexos alcancem as marcas da placa de teste.','festival-2026-lesedi-22'),
('lesedi','2026-10-23','Cortinas para a surpresa','Parte da decoração ficará escondida até a noite principal. Há pequenas passagens assinaladas nas laterais da estrutura.','Pendure 4 cortinas ao redor da estrutura central, deixando abertas as passagens assinaladas.','festival-2026-lesedi-23'),
('lesedi','2026-10-24','Conferir na hora certa','O desenho dos reflexos precisa ser revisado. Os organizadores pedem apenas o registro dos resultados, sem novos ajustes.','Visite 5 suportes no horário indicado e confira se a luz alcança suas marcas.','festival-2026-lesedi-24'),
('lesedi','2026-10-25','O centro da decoração','O último disco de vidro polido será usado na estrutura central. A peça ficará coberta até a apresentação do festival.','Leve o último disco até a estrutura central, ajude a prender a moldura e cubra com o tecido fornecido.','festival-2026-lesedi-25'),
('namida','2026-10-08','Caixas vindas do oceano','Os equipamentos de viagem ainda estão na entrada de Namida. As bases da área do festival já estão preparadas para receber a carga.','Transporte 4 caixas impermeáveis até a área do festival e coloque sobre as bases preparadas.','festival-2026-namida-08'),
('namida','2026-10-09','Sal nos enfeites','Parte da decoração chegou coberta de sal. As peças têm encaixes pequenos que também precisam ficar desobstruídos.','Limpe 6 peças metálicas com a solução fornecida e entregue ao grupo.','festival-2026-namida-09'),
('namida','2026-10-10','Conchas para as mesas','O grupo quer decorar as barracas com materiais da região. As conchas precisam estar vazias para não prejudicar os animais.','Recolha 10 conchas vazias na área permitida, sem retirar animais vivos de suas casas.','festival-2026-namida-10'),
('namida','2026-10-11','Lanternas do fundo do mar','As primeiras lanternas estão prontas para instalação. Uma delas ficará baixa, perto da estrutura central.','Pendure 5 lanternas marinhas nos suportes indicados.','festival-2026-namida-11'),
('namida','2026-10-12','Cordas resistentes à umidade','As amarrações comuns começaram a se desfazer. O novo material será usado nas barracas e nos suportes dos enfeites.','Entregue 6 porções de fibra própria para uso marinho ao grupo.','festival-2026-namida-12'),
('namida','2026-10-13','Vidro sem rachaduras','Algumas esferas foram danificadas durante a viagem. As peças rachadas ficarão em outra caixa para revisão.','Separe 5 esferas intactas no depósito e entregue ao responsável pela decoração.','festival-2026-namida-13'),
('namida','2026-10-14','Cores do oceano','O grupo está preparando tinta para as placas. Os organizadores pedem que as amostras permaneçam úmidas durante o transporte.','Recolha 4 porções de pigmento de algas na área autorizada e entregue ainda úmidas.','festival-2026-namida-14'),
('namida','2026-10-15','Bolhas pela praça','As primeiras bolhas decorativas já podem ser distribuídas. Cada uma deve permanecer acima de sua própria base.','Instale 4 esferas encantadas nos suportes indicados e confira a posição das bolhas.','festival-2026-namida-15'),
('namida','2026-10-16','Fragmentos para as molduras','As molduras receberão detalhes de coral. O grupo aceita apenas fragmentos que já estejam desprendidos.','Recolha 6 fragmentos de coral já desprendidos na região indicada, sem cortar corais vivos.','festival-2026-namida-16'),
('namida','2026-10-17','Perto da redoma','Algumas peças precisam passar por um teste antes da instalação. Os suportes próximos da redoma foram autorizados para esse trabalho.','Coloque 3 esferas nos suportes indicados, aguarde o indicador mudar de cor e devolva as peças ao grupo.','festival-2026-namida-17'),
('namida','2026-10-18','Uma bolha que não permanece','Certos enfeites perdem a forma pouco depois de serem ativados. Uma das esferas forma uma película que demora a desaparecer.','Teste 5 esferas e separe as que não conseguem manter a bolha.','festival-2026-namida-18'),
('namida','2026-10-19','Bases longe da umidade','A água acumulada está alcançando algumas caixas. As caixas com esferas devem permanecer próximas umas das outras.','Coloque 4 bases de pedra sob os recipientes indicados, mantendo as caixas com esferas próximas.','festival-2026-namida-19'),
('namida','2026-10-20','Pérolas para os enfeites','O grupo quer finalizar os detalhes das lanternas. Peças irregulares também serão aceitas, desde que estejam inteiras.','Consiga 5 pequenas pérolas de fornecedores ou pontos de coleta autorizados e entregue ao grupo.','festival-2026-namida-20'),
('namida','2026-10-21','Um trajeto mais bonito','A entrada do festival receberá novos enfeites. As últimas esferas ficam na passagem para a parte de trás das barracas.','Distribua 6 pequenas esferas luminosas ao longo do caminho marcado.','festival-2026-namida-21'),
('namida','2026-10-22','O que ficou no vidro','Algumas esferas estão com o interior embaçado. Os organizadores pedem que elas não sejam abertas antes da revisão.','Leve 4 esferas até a bancada e registre quais apresentam uma película por dentro.','festival-2026-namida-22'),
('namida','2026-10-23','Decoração para a estrutura central','As peças maiores já podem receber os últimos detalhes. Cada moldura guarda espaço para uma esfera transparente.','Fixe 5 molduras de conchas nos encaixes indicados da estrutura central.','festival-2026-namida-23'),
('namida','2026-10-24','As bolhas depois do movimento','O grupo quer conferir a decoração com menos gente passando. Algumas bolhas se aproximam umas das outras durante o teste.','Observe 5 conjuntos de bolhas no período indicado e registre quais se aproximam, sem tentar separá-las.','festival-2026-namida-24'),
('namida','2026-10-25','Um enfeite que merece cuidado','A esfera reservada à celebração principal está na bancada próxima da redoma. Ela deve continuar lacrada durante o transporte.','Busque a esfera lacrada, leve até a estrutura central, coloque no suporte marcado e feche a proteção.','festival-2026-namida-25')) catalog(kingdom,day,name,description,objective,slug);

CREATE OR REPLACE FUNCTION public.v2_get_mission_board(p_character_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare chosen public.v2_characters; active_assignment jsonb; completed_count integer; needed integer; locked_until timestamptz; mission_list jsonb;
 festival jsonb; event_mission public.v2_missions; next_release date;
 festival_completed integer; candy_balance bigint;
 today date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  select * into chosen from public.v2_characters where id=p_character_id and user_id=(select auth.uid());
  if chosen.id is null then raise exception 'Personagem não encontrado' using errcode='P0002'; end if;
  select jsonb_build_object('id',a.id,'missionId',m.id,'name',m.name,'rank',case when m.event_key is not null then chosen.adventure_rank else m.rank end,'kingdom',m.kingdom,'objective',m.objective,'acceptedAt',a.accepted_at,'isRankTrial',m.is_rank_trial,'description',m.description,
    'eventDay',m.event_day,'rewardCandies',m.reward_candies,
    'rewardXp',case when m.event_key is not null then public.v2_festival_rank_xp(chosen.adventure_rank) else m.reward_xp end)
  into active_assignment from public.v2_mission_assignments a join public.v2_missions m on m.id=a.mission_id where a.character_id=chosen.id and a.status='in_progress' limit 1;
  select count(*)::integer into completed_count from public.v2_mission_assignments a join public.v2_missions m on m.id=a.mission_id where a.character_id=chosen.id and a.status='completed' and m.event_key is null and not m.is_rank_trial and m.rank=chosen.adventure_rank;
  select required_completions into needed from public.v2_rank_mission_requirements where rank=chosen.adventure_rank;
  select max(retry_after) into locked_until from public.v2_mission_assignments where character_id=chosen.id and status='failed' and retry_after>now();
  with eligible as (
    select m.*,row_number() over(partition by split_part(m.slug,'-',3) order by md5(m.id::text||chosen.id::text||date_trunc('week',now())::text)) family_position
    from public.v2_missions m where m.active and m.event_key is null and m.kingdom=chosen.kingdom and m.rank=chosen.adventure_rank and not m.is_rank_trial
      and (m.available_after is null or m.available_after<=now()) and chosen.level>=m.min_level
      and not exists(select 1 from public.v2_mission_assignments recent where recent.character_id=chosen.id and recent.mission_id=m.id and recent.status='completed' and recent.resolved_at>now()-interval '7 days')
  ), weekly_selection as (
    select * from eligible where family_position=1 order by md5(id::text||chosen.id::text||date_trunc('week',now())::text) limit 10
  ), visible as (
    select id,slug,name,description,objective,kingdom,rank,min_level,reward_xp,reward_gold,is_rank_trial,promotion_rank from weekly_selection
    union all
    select m.id,m.slug,m.name,m.description,m.objective,m.kingdom,m.rank,m.min_level,m.reward_xp,m.reward_gold,m.is_rank_trial,m.promotion_rank
    from public.v2_missions m where m.active and m.event_key is null and m.kingdom=chosen.kingdom and m.rank=chosen.adventure_rank and m.is_rank_trial and completed_count>=coalesce(needed,2147483647) and chosen.level>=m.min_level
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',m.id,'slug',m.slug,'name',m.name,'description',m.description,'objective',m.objective,'rank',m.rank,'kingdom',m.kingdom,'minLevel',m.min_level,
    'rewardXp',m.reward_xp,'rewardGold',m.reward_gold,'isRankTrial',m.is_rank_trial,'promotionRank',m.promotion_rank,
    'creature',(select jsonb_build_object('slug',c.slug,'name',c.name,'rank',c.rank,'category',c.category,'weaknesses',c.weaknesses)
      from public.v2_mission_creatures mc join public.v2_creatures c on c.id=mc.creature_id where mc.mission_id=m.id limit 1)
  ) order by m.is_rank_trial desc,m.name),'[]'::jsonb) into mission_list from visible m;
  select count(*)::integer into festival_completed from public.v2_mission_assignments
    where user_id=(select auth.uid()) and event_key='noites-apavorantes-2026' and status='completed';
  select coalesce((select candies from public.v2_festival_wallets
    where character_id=chosen.id and event_key='noites-apavorantes-2026'),0) into candy_balance;
  select * into event_mission from public.v2_missions m
    where m.event_key='noites-apavorantes-2026' and m.kingdom=chosen.kingdom and m.active
      and not exists(select 1 from public.v2_mission_assignments a where a.user_id=(select auth.uid())
        and a.event_key=m.event_key and a.event_day=m.event_day and a.status='completed')
    order by m.event_day limit 1;
  if event_mission.id is not null and event_mission.event_day>today then
    next_release:=event_mission.event_day;
  end if;
  festival:=jsonb_build_object('completedCount',festival_completed,'totalMissions',18,
    'releasedCount',least(18,greatest(0,today-date '2026-10-08'+1)),
    'candyBalance',candy_balance,'nextReleaseDate',next_release,'endsOn','2026-10-31',
    'isActive',today between date '2026-10-08' and date '2026-10-31',
    'mission',case when event_mission.id is not null and event_mission.event_day<=today
      and today between date '2026-10-08' and date '2026-10-31' then jsonb_build_object(
      'id',event_mission.id,'name',event_mission.name,'description',event_mission.description,
      'objective',event_mission.objective,'eventDay',event_mission.event_day,
      'rewardXp',public.v2_festival_rank_xp(chosen.adventure_rank),'rewardCandies',event_mission.reward_candies
    ) else null end);
  return jsonb_build_object('character',jsonb_build_object('id',chosen.id,'name',chosen.name,'rank',chosen.adventure_rank,'level',chosen.level,'kingdom',chosen.kingdom,'imageUrl',chosen.image_url),
    'festival',festival,'missions',mission_list,'activeAssignment',active_assignment,'completedForRank',completed_count,'requiredForTrial',needed,'lockedUntil',locked_until,'canManage',public.v2_is_mission_manager());
end; $function$;
CREATE OR REPLACE FUNCTION public.v2_accept_mission(p_mission_id uuid, p_character_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 chosen public.v2_characters; selected public.v2_missions; assignment public.v2_mission_assignments;
 completed_count integer; needed integer; pvp_queues_left integer:=0; dungeon_queues_left integer:=0;
begin
 select * into chosen from public.v2_characters where id=p_character_id and user_id=(select auth.uid()) for update;
 if chosen.id is null then raise exception 'Personagem não encontrado' using errcode='P0002'; end if;
 if not exists(select 1 from public.v2_active_characters where user_id=(select auth.uid()) and character_id=chosen.id) then raise exception 'Este não é o personagem ativo' using errcode='42501'; end if;
 if public.v2_character_has_active_mission(chosen.id) then raise exception 'Você já possui uma missão em andamento'; end if;
 if exists(select 1 from public.v2_mission_assignments where character_id=chosen.id and status='failed' and retry_after>now()) then raise exception 'Após uma falha, aguarde 24 horas para aceitar outra missão'; end if;
 select * into selected from public.v2_missions where id=p_mission_id for update;
 if selected.id is null or not selected.active or selected.kingdom<>chosen.kingdom or (selected.event_key is null and selected.rank<>chosen.adventure_rank) or chosen.level<selected.min_level or(selected.available_after is not null and selected.available_after>now()) then raise exception 'Esta missão não está disponível para o personagem'; end if;
 if selected.event_key is not null then
  if (now() at time zone 'America/Sao_Paulo')::date not between date '2026-10-08' and date '2026-10-31'
    or selected.event_day>(now() at time zone 'America/Sao_Paulo')::date then
    raise exception 'Esta missão do festival ainda não está disponível ou o evento terminou';
  end if;
  if exists(select 1 from public.v2_mission_assignments where user_id=(select auth.uid())
    and event_key=selected.event_key and event_day=selected.event_day and status in ('in_progress','completed')) then
    raise exception 'Você já aceitou ou concluiu esta missão do festival';
  end if;
  if exists(select 1 from public.v2_missions previous where previous.event_key=selected.event_key
    and previous.kingdom=selected.kingdom and previous.event_day<selected.event_day
    and not exists(select 1 from public.v2_mission_assignments a where a.user_id=(select auth.uid())
      and a.event_key=previous.event_key and a.event_day=previous.event_day and a.status='completed')) then
    raise exception 'Conclua as missões anteriores do festival para acessar esta';
  end if;
 end if;
 if selected.is_rank_trial then
  select count(*)::integer into completed_count from public.v2_mission_assignments a join public.v2_missions m on m.id=a.mission_id where a.character_id=chosen.id and a.status='completed' and not m.is_rank_trial and m.rank=chosen.adventure_rank;
  select required_completions into needed from public.v2_rank_mission_requirements where rank=chosen.adventure_rank;
  if needed is null or completed_count<needed then raise exception 'Requisitos da prova ainda não foram cumpridos'; end if;
 end if;
 if exists(select 1 from public.v2_arena_sessions where character_id=chosen.id and status='open' and created_at>=now()-interval '2 hours') or exists(select 1 from public.v2_pvp_queue q join public.v2_pvp_matches m on m.id=q.match_id where q.character_id=chosen.id and m.status='active' and m.updated_at>=now()-interval '2 hours') or exists(select 1 from public.v2_dungeon_runs where chosen.id=any(party_character_ids) and status='active' and started_at>=now()-interval '12 hours') then raise exception 'Encerre o combate atual antes de aceitar uma missão'; end if;
 update public.v2_pvp_queue set status='cancelled' where character_id=chosen.id and status in('searching','matched'); get diagnostics pvp_queues_left=row_count;
 delete from public.v2_dungeon_queue where character_id=chosen.id; get diagnostics dungeon_queues_left=row_count;
 insert into public.v2_mission_assignments(mission_id,user_id,character_id,event_key,event_day) values(selected.id,(select auth.uid()),chosen.id,selected.event_key,selected.event_day) returning * into assignment;
 return jsonb_build_object('assignmentId',assignment.id,'missionName',selected.name,'status','in_progress','pvpQueuesLeft',pvp_queues_left,'dungeonQueuesLeft',dungeon_queues_left);
end; $function$;
CREATE OR REPLACE FUNCTION public.v2_resolve_mission(p_assignment_id uuid, p_completed boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 assignment public.v2_mission_assignments;
 mission public.v2_missions;
 chosen public.v2_characters;
 desired_xp numeric:=0;
 desired_gold numeric:=0;
 applied_xp bigint:=0;
 applied_gold bigint:=0;
 multiplier numeric:=1;
 applied_candies integer:=0;
 bigint_max constant numeric:=9223372036854775807;
begin
 if not public.v2_is_mission_manager() then raise exception 'Acesso de liderança necessário' using errcode='42501'; end if;
 select * into assignment from public.v2_mission_assignments where id=p_assignment_id for update;
 if assignment.id is null or assignment.status<>'in_progress' then raise exception 'Missão já resolvida ou inexistente'; end if;
 select * into mission from public.v2_missions where id=assignment.mission_id for update;
 select * into chosen from public.v2_characters where id=assignment.character_id for update;
 if p_completed then
  if mission.event_key is not null then
   desired_xp:=public.v2_festival_rank_xp(chosen.adventure_rank);
   desired_gold:=0;
   applied_candies:=mission.reward_candies;
  else
   multiplier:=public.v2_kingdom_reward_multiplier(chosen.kingdom);
  desired_xp:=greatest(0,round(mission.reward_xp::numeric*multiplier));
  desired_gold:=greatest(0,round(mission.reward_gold::numeric*multiplier));
  end if;
  applied_xp:=least(desired_xp,greatest(0,bigint_max-chosen.xp::numeric))::bigint;
  applied_gold:=least(desired_gold,greatest(0,bigint_max-chosen.gold::numeric))::bigint;
  update public.v2_mission_assignments set status='completed',resolved_at=now(),resolved_by=(select auth.uid()),
    retry_after=null,reward_xp=applied_xp,reward_gold=applied_gold,reward_candies=applied_candies where id=assignment.id;
  update public.v2_characters set xp=xp+applied_xp,gold=gold+applied_gold,
   adventure_rank=case when mission.is_rank_trial and adventure_rank=mission.rank then mission.promotion_rank else adventure_rank end where id=chosen.id;
  if mission.event_key is null then
   update public.v2_missions set available_after=now()+interval '7 days' where id=mission.id;
  else
   insert into public.v2_festival_wallets(character_id,event_key,candies)
     values(chosen.id,mission.event_key,applied_candies)
   on conflict(character_id,event_key) do update
     set candies=public.v2_festival_wallets.candies+excluded.candies,updated_at=now();
  end if;
 else
  update public.v2_mission_assignments set status='failed',resolved_at=now(),resolved_by=(select auth.uid()),retry_after=null where id=assignment.id;
 end if;
 insert into public.v2_admin_history(actor_id,action,target_type,target_id,details)
 values((select auth.uid()),case when p_completed then 'mission.completed' else 'mission.failed' end,'mission_assignment',assignment.id::text,
  jsonb_build_object('character_id',chosen.id,'mission_id',mission.id,'kingdom_bonus_percent',round((multiplier-1)*100),'desired_xp',desired_xp,'desired_gold',desired_gold,'applied_xp',applied_xp,'applied_gold',applied_gold,'event_day',mission.event_day,'reward_candies',applied_candies));
 return jsonb_build_object('status',case when p_completed then 'completed' else 'failed' end,'xp',applied_xp,'gold',applied_gold,'candies',applied_candies,
  'kingdomBonusPercent',round((multiplier-1)*100),'newRank',case when p_completed and mission.is_rank_trial then mission.promotion_rank else chosen.adventure_rank end);
end;
$function$;
CREATE OR REPLACE FUNCTION public.v2_get_managed_missions()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not public.v2_is_mission_manager() then raise exception 'Acesso de liderança necessário' using errcode='42501'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
    'assignmentId',a.id,'characterName',c.name,'characterRank',c.adventure_rank,'characterLevel',c.level,
    'missionName',m.name,'missionDescription',m.description,'missionObjective',m.objective,
    'missionRank',case when m.event_key is not null then c.adventure_rank else m.rank end,'kingdom',m.kingdom,'acceptedAt',a.accepted_at,
    'rewardXp',case when m.event_key is not null then public.v2_festival_rank_xp(c.adventure_rank) else m.reward_xp end,'rewardGold',m.reward_gold,'isRankTrial',m.is_rank_trial,'eventDay',m.event_day,'rewardCandies',m.reward_candies
  ) order by a.accepted_at) from public.v2_mission_assignments a
    join public.v2_characters c on c.id=a.character_id
    join public.v2_missions m on m.id=a.mission_id
    where a.status='in_progress'),'[]'::jsonb);
end;
$function$;
-- Future briefings and locked steps are not exposed through direct table reads either.
drop policy "missions authenticated read" on public.v2_missions;
create policy "missions authenticated read" on public.v2_missions
for select to authenticated using (
  public.v2_is_admin() or (active and event_key is null)
  or (active and event_key is not null and event_day <= (now() at time zone 'America/Sao_Paulo')::date
    and exists(select 1 from public.v2_characters c where c.user_id=(select auth.uid()) and c.kingdom=public.v2_missions.kingdom)
    and not exists(select 1 from generate_series(8, extract(day from event_day)::integer - 1) prior(day)
      where not exists(select 1 from public.v2_mission_assignments a
        where a.user_id=(select auth.uid()) and a.event_key='noites-apavorantes-2026'
          and a.event_day=make_date(2026,10,prior.day) and a.status='completed')))
);

revoke all on function public.v2_get_mission_board(uuid), public.v2_accept_mission(uuid,uuid),
  public.v2_resolve_mission(uuid,boolean), public.v2_get_managed_missions() from public, anon;
grant execute on function public.v2_get_mission_board(uuid), public.v2_accept_mission(uuid,uuid),
  public.v2_resolve_mission(uuid,boolean), public.v2_get_managed_missions() to authenticated;

commit;
