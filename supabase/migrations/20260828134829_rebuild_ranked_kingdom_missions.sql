alter table public.v2_missions drop constraint if exists v2_missions_rank_check;
alter table public.v2_missions add constraint v2_missions_rank_check
  check (rank in ('E','D','C','B','A','S','EX'));

create temporary table mission_catalog on commit drop as
with realms(kingdom, realm_name, motif, locations) as (values
  ('aokigahara','Aokigahara','entre raízes vivas, pontes suspensas e comunidades protegidas pela Árvore Imponente',array['Bosque das Raízes Cantantes','Jardins de Ervas Lunares','Ponte das Copas Antigas','Ninho dos Fungos Rubros','Santuário da Seiva Dourada','Vale das Flores Sonoras','Mercado das Resinas','Trilha dos Cipós Errantes','Fonte das Sementes Eternas','Círculo dos Sacerdotes Verdes']::text[]),
  ('darkya','Darkya','sob a chuva constante, entre canais, tavernas e estruturas de ferro da Cidade Ferrugem',array['Aqueduto da Garoa Cinzenta','Vinícola do Corvo Rubro','Ponte dos Sinos de Ferro','Taverna do Trovão Manso','Distrito dos Curtumes','Estrada das Carruagens Seladas','Torre do Para-raios Antigo','Armazém das Lãs Negras','Canal da Chuva Profunda','Portão da Cidade Ferrugem']::text[]),
  ('oymyakon','Oymyakon','sob frio extremo, entre minas, portos e muralhas de gelo regenerativo',array['Mina do Diamante Boreal','Porto das Agulhas de Gelo','Caverna dos Cristais Azuis','Passagem da Nevasca Eterna','Salão dos Vidros Coloridos','Veio de Ouro Congelado','Doca dos Quebra-gelos','Vale das Paredes Brancas','Fortaleza da Pedra Escura','Túnel do Carvão Silencioso']::text[]),
  ('lesedi','Lesedi','nas rotas de caravanas, mercados e dunas iluminadas pela Estrela de Mana',array['Oásis das Frutas de Vidro','Caravana das Especiarias','Pedreira do Arenito Solar','Forja do Vidro de Mana','Dunas dos Escaravelhos Dourados','Mercado que Nunca Dorme','Templo da Estrela Ardente','Vale das Cerâmicas Antigas','Rota dos Óleos Perfumados','Poço das Ervas do Deserto']::text[]),
  ('namida','Namida','entre correntes oceânicas, jardins de coral e cidades protegidas pela Redoma de Mana',array['Jardim dos Corais Luminosos','Canal dos Cardumes Prateados','Torre da Redoma Exterior','Floresta das Algas Azuis','Praça das Conchas Cantoras','Fenda das Correntes Frias','Berçário dos Cavalos-marinhos','Palácio das Pérolas','Túnel das Águas Claras','Recife dos Guardiões']::text[]),
  ('skypiece','Skypiece','sobre ilhas flutuantes, estradas de nuvens e construções sustentadas pelo Cristal Azul de Mana',array['Ponte do Arco-Íris','Pedreira de Quartzo Branco','Estrada das Nuvens Sólidas','Jardim da Névoa Rasteira','Torre dos Cristais Translúcidos','Ilha dos Ventos Alaranjados','Palácio da Aurora Celeste','Celeiro das Nuvens','Santuário do Cristal Azul','Ancoradouro das Ilhas Flutuantes']::text[])
), blueprints(rank, blueprint_index, title, briefing, objective, min_level, xp, gold) as (values
  ('E',1,'As Aves Fugitivas','Vinte e uma aves domésticas escaparam nas proximidades de %1$s. Procure com calma %2$s e devolva todas ao cercado, sem assustá-las.','Encontre as 21 aves e devolva-as ao responsável.',1,500::bigint,100::bigint),
  ('E',2,'Prateleiras em Desordem','Crianças desorganizaram livros, mapas e registros do arquivo comunitário de %1$s. Recoloque cada volume na seção indicada.','Organize todos os livros e registros do arquivo.',1,500::bigint,100::bigint),
  ('E',3,'Praça Bem Cuidada','A área pública de %1$s precisa ser varrida e lavada antes da próxima feira. Execute o serviço %2$s sem danificar as estruturas locais.','Limpe completamente a área pública indicada.',1,500::bigint,100::bigint),
  ('E',4,'Cercas de Cara Nova','As cercas de %1$s perderam a pintura e a proteção contra o clima. Prepare a superfície e pinte todos os trechos marcados.','Pinte e proteja todos os cercados marcados.',1,500::bigint,100::bigint),
  ('E',5,'Sinalização da Comunidade','Placas de orientação caíram ou ficaram ilegíveis em %1$s. Recoloque-as na posição correta para orientar moradores e visitantes.','Repare e reposicione todas as placas indicadas.',1,500::bigint,100::bigint),
  ('E',6,'Entrega para os Moradores','Uma cesta com alimentos, remédios e utensílios precisa chegar às famílias próximas de %1$s. Confira os nomes antes de cada entrega.','Entregue todas as cestas às famílias corretas.',1,500::bigint,100::bigint),
  ('E',7,'A Colheita Espalhada','Caixas de produtos locais se abriram durante o transporte por %1$s. Recolha tudo, separe o que foi danificado e devolva o restante.','Recolha e organize toda a carga espalhada.',1,500::bigint,100::bigint),
  ('E',8,'Preparativos da Festa','Os moradores de %1$s precisam de ajuda para montar mesas, faixas e iluminação para uma celebração comunitária.','Conclua a montagem da celebração antes do horário marcado.',1,500::bigint,100::bigint),
  ('E',9,'Caminho Desobstruído','Folhas, lama, neve, areia ou resíduos locais bloquearam a passagem de %1$s. Limpe o caminho e mantenha as saídas livres.','Desobstrua o caminho sem causar danos ao local.',1,500::bigint,100::bigint),
  ('E',10,'Ajuda na Rotina','Um morador idoso próximo de %1$s precisa de ajuda com limpeza, água, roupas e organização da casa. Trate tudo com cuidado.','Conclua as tarefas domésticas solicitadas pelo morador.',1,500::bigint,100::bigint),

  ('D',1,'O Animal Arisco','Um pequeno animal de estimação fugiu para %1$s. Ele está assustado e pode arranhar ou morder se for encurralado.','Encontre e devolva o animal sem feri-lo.',20,1000::bigint,250::bigint),
  ('D',2,'Carga na Estrada','Uma carroça capotou perto de %1$s e espalhou alimentos e mercadorias. Organize a passagem e recupere a carga aproveitável.','Recolha a carga e libere a estrada.',20,1000::bigint,250::bigint),
  ('D',3,'O Ninho Perigoso','Um ninho de vespas agressivas surgiu numa residência próxima de %1$s. Retire-o com cuidado e mantenha os moradores afastados.','Remova o ninho e deixe a residência segura.',20,1000::bigint,250::bigint),
  ('D',4,'Pragas no Depósito','Ratos, morcegos ou outras pequenas pragas tomaram um depósito em %1$s. Afaste os animais e vede os acessos encontrados.','Retire as pragas e feche os pontos de entrada.',20,1000::bigint,250::bigint),
  ('D',5,'O Cão Raivoso','Um cão de grande temperamento está avançando sobre pedestres em %1$s. Contenha-o sem matar e entregue-o aos tratadores.','Conter o cão e impedir novos ataques.',20,1000::bigint,250::bigint),
  ('D',6,'Cabras Desgarradas','Pequenos animais de criação se perderam no caminho de %1$s e estão entrando em propriedades. Reúna o grupo e leve-o ao curral.','Reúna os animais e conduza-os ao curral.',20,1000::bigint,250::bigint),
  ('D',7,'A Raposa no Galinheiro','Uma raposa ou predador pequeno está rondando as criações perto de %1$s. Capture-o sem matar e solte-o longe das casas.','Capture e remova o pequeno predador com vida.',20,1000::bigint,250::bigint),
  ('D',8,'Besouros no Armazém','Uma colônia de insetos grandes está destruindo mantimentos em %1$s. Retire a infestação antes que alcance outros depósitos.','Eliminar a infestação e preservar os mantimentos.',20,1000::bigint,250::bigint),
  ('D',9,'Ladrões de Comida','Pequenos animais aprenderam a abrir caixas de alimento em %1$s. Recupere as provisões e encontre uma forma segura de afastá-los.','Recupere as provisões e impeça novas invasões.',20,1000::bigint,250::bigint),
  ('D',10,'Serpente no Porão','Uma serpente venenosa de pequeno porte se escondeu numa construção em %1$s. Retire-a antes que algum morador seja ferido.','Capture a serpente e deixe o imóvel seguro.',20,1000::bigint,250::bigint),

  ('C',1,'Feras na Feira','Três grandes predadores nativos invadiram a região comercial de %1$s. Adormeça as feras e não as mate.','Sedação e remoção das três feras com vida.',35,2000::bigint,600::bigint),
  ('C',2,'Resgate na Fenda','Uma criança caiu numa fenda próxima de %1$s. A estrutura continua cedendo e o resgate deve ser realizado imediatamente.','Resgate a criança com vida.',35,2000::bigint,600::bigint),
  ('C',3,'O Bebê Levado','Um grande animal capturou um bebê e fugiu em direção a %1$s. Siga os rastros antes que desapareçam.','Recupere o bebê com vida e afaste a fera.',35,2000::bigint,600::bigint),
  ('C',4,'Manada Descontrolada','Uma manada de animais de grande porte disparou por %1$s e ameaça atingir moradores. Desvie-a para uma rota segura.','Conduza a manada para longe da área habitada.',35,2000::bigint,600::bigint),
  ('C',5,'A Fera no Mercado','Um animal enorme entrou num estabelecimento de %1$s e está destruindo o local. Contenha-o antes que alcance a rua.','Conter a fera e retirar os civis.',35,2000::bigint,600::bigint),
  ('C',6,'Viajantes Cercados','Um grupo de viajantes foi cercado por predadores nas proximidades de %1$s. Abra uma rota e retire todos do local.','Resgate todos os viajantes cercados.',35,2000::bigint,600::bigint),
  ('C',7,'Carroça no Despenhadeiro','Uma carroça com passageiros ficou presa na borda de um desnível em %1$s. Qualquer movimento errado pode derrubá-la.','Estabilize a carroça e resgate os passageiros.',35,2000::bigint,600::bigint),
  ('C',8,'Levado pela Corrente','Um trabalhador foi arrastado por uma corrente, avalanche ou rajada intensa em %1$s. Localize-o antes que se afaste ainda mais.','Localize e resgate o trabalhador desaparecido.',35,2000::bigint,600::bigint),
  ('C',9,'Desabamento Repentino','Parte de uma construção desabou em %1$s e há pessoas presas. Entre apenas após avaliar novos riscos de queda.','Retire todos os sobreviventes dos escombros.',35,2000::bigint,600::bigint),
  ('C',10,'Montaria em Pânico','Uma montaria de grande porte rompeu as amarras e corre por %1$s. Acalme-a antes que provoque um acidente.','Conter e devolver a montaria sem feri-la.',35,2000::bigint,600::bigint),

  ('B',1,'Escolta do Conde','Escolte um Conde através de %1$s até sua residência de veraneio. Ladrões conhecem a rota e podem tentar uma emboscada.','Leve o Conde ao destino com vida.',50,4000::bigint,1500::bigint),
  ('B',2,'Proteção à Testemunha','Uma testemunha importante sofre roubos e invasões perto de %1$s. Proteja-a até a chegada dos investigadores da Guilda.','Mantenha a testemunha viva e identifique os invasores.',50,4000::bigint,1500::bigint),
  ('B',3,'O Assassino na Taverna','Um criminoso embriagado está causando problemas em %1$s. Ele é um assassino profissional de Rank B; pare-o e prenda-o.','Derrote e prenda o assassino com vida.',50,4000::bigint,1500::bigint),
  ('B',4,'Caravana Oficial','Uma caravana de servidores do Reino foi atacada no caminho de %1$s. Resgate os sobreviventes e proteja os documentos oficiais.','Resgate a comitiva e recupere os documentos.',50,4000::bigint,1500::bigint),
  ('B',5,'O Estudioso Ameaçado','Um pesquisador importante precisa concluir uma inspeção em %1$s, mas mercenários querem roubar suas descobertas.','Proteja o pesquisador durante toda a inspeção.',50,4000::bigint,1500::bigint),
  ('B',6,'A Maleta Diplomática','Uma maleta com acordos entre autoridades desapareceu em %1$s. Recupere-a antes que seu conteúdo seja vendido.','Recupere a maleta fechada e capture os responsáveis.',50,4000::bigint,1500::bigint),
  ('B',7,'Guarda do Curandeiro','Um curandeiro renomado atenderá feridos em %1$s enquanto um grupo armado tenta interromper o trabalho.','Proteja o curandeiro e os pacientes.',50,4000::bigint,1500::bigint),
  ('B',8,'Cativeiro dos Mercadores','Mercadores influentes foram sequestrados por criminosos escondidos em %1$s. Localize o cativeiro e organize a retirada.','Liberte todos os mercadores e prenda os sequestradores.',50,4000::bigint,1500::bigint),
  ('B',9,'Transporte da Relíquia','Uma relíquia cultural precisa atravessar %1$s sob sigilo. Saqueadores especializados já demonstraram interesse nela.','Entregue a relíquia intacta ao representante oficial.',50,4000::bigint,1500::bigint),
  ('B',10,'Evacuação do Magistrado','Um magistrado ficou isolado em %1$s durante uma revolta criminosa. Entre, estabilize a situação e retire-o.','Evacue o magistrado e sua equipe com vida.',50,4000::bigint,1500::bigint),

  ('A',1,'O Ritual das Dez Vidas','Magos perigosos sequestraram dez crianças para um ritual em %1$s. Interrompa a cerimônia, salve os reféns e prenda os conjuradores.','Salvar as dez crianças, deter os magos e destruir o ritual.',70,8000::bigint,4000::bigint),
  ('A',2,'Círculo dos Magos Renegados','Um círculo de magos de combate tomou %1$s e ergueu defesas letais. Rompa o cerco antes que concluam o feitiço.','Derrote os magos e desative o feitiço sem atingir civis.',70,8000::bigint,4000::bigint),
  ('A',3,'A Fera Devoradora','Uma criatura capaz de destruir patrulhas inteiras apareceu em %1$s. Localize seu covil e impeça que alcance a população.','Derrote ou contenha a criatura de Rank A.',70,8000::bigint,4000::bigint),
  ('A',4,'O Enviado Real','Um enviado da família real precisa cruzar %1$s enquanto uma organização de elite prepara seu assassinato.','Escolte o enviado e neutralize os assassinos.',70,8000::bigint,4000::bigint),
  ('A',5,'Fortaleza dos Reféns','Uma companhia mercenária fortificou %1$s e mantém moradores como escudos. Planeje a entrada antes do ataque.','Libertar os reféns e capturar o comandante mercenário.',70,8000::bigint,4000::bigint),
  ('A',6,'Ameaça sobre a Capital','Um monstro de grande poder avança a partir de %1$s em direção à capital. Intercepte-o antes que alcance áreas densamente habitadas.','Intercepte e derrote a ameaça antes de sua chegada à capital.',70,8000::bigint,4000::bigint),
  ('A',7,'A Praga Arcana','Uma contaminação mágica em %1$s transforma moradores e animais. Proteja os curandeiros enquanto eles preparam o antídoto.','Conter os infectados e escoltar os curandeiros até a origem.',70,8000::bigint,4000::bigint),
  ('A',8,'Conspiração de Sangue','Agentes descobriram um plano para assassinar autoridades durante uma reunião em %1$s. Identifique os infiltrados antes do primeiro ataque.','Impeça o atentado e capture o responsável pela conspiração.',70,8000::bigint,4000::bigint),
  ('A',9,'A Fenda Instável','Uma fenda mágica se abriu em %1$s e criaturas hostis atravessam em ondas. Entre no perímetro e feche a passagem.','Resista às ondas, estabilize a área e sele a fenda.',70,8000::bigint,4000::bigint),
  ('A',10,'A Família Cercada','Uma família nobre e seus empregados foram cercados por combatentes de elite em %1$s. Rompa o bloqueio e organize a retirada.','Resgate todos os civis e derrote os atacantes de elite.',70,8000::bigint,4000::bigint),

  ('S',1,'Travessia entre Reinos','MISSÃO PERIGOSA — RISCO DE VIDA: escolte um nobre desde %1$s até um Reino vizinho. Uma rede de ladrões e assassinos conhece o itinerário.','Leve o nobre ao outro Reino com vida.',90,15000::bigint,10000::bigint),
  ('S',2,'O Artefato da Fronteira','MISSÃO PERIGOSA — RISCO DE VIDA: transporte um artefato instável de %1$s até especialistas de outro Reino. Facções rivais tentarão tomá-lo.','Cruze a fronteira e entregue o artefato intacto.',90,15000::bigint,10000::bigint),
  ('S',3,'Caçada dos Nove Assassinos','MISSÃO PERIGOSA — RISCO DE VIDA: nove assassinos de alto nível chegaram a %1$s para executar lideranças locais. Encontre-os antes que ataquem.','Localize e neutralize os nove assassinos.',90,15000::bigint,10000::bigint),
  ('S',4,'A Besta da Calamidade','MISSÃO PERIGOSA — RISCO DE VIDA: uma besta capaz de devastar cidades despertou em %1$s. Patrulhas anteriores não retornaram.','Derrote a besta e encontre as patrulhas desaparecidas.',90,15000::bigint,10000::bigint),
  ('S',5,'Colapso de Mana','MISSÃO PERIGOSA — RISCO DE VIDA: uma estrutura essencial de Mana está entrando em colapso em %1$s. Proteja os especialistas durante a estabilização.','Defenda a equipe e estabilize o núcleo de Mana.',90,15000::bigint,10000::bigint),
  ('S',6,'Resgate sob Cerco','MISSÃO PERIGOSA — RISCO DE VIDA: tropas hostis cercaram %1$s e mantêm centenas de civis presos. Abra uma passagem de evacuação.','Rompa o cerco e evacue todos os civis.',90,15000::bigint,10000::bigint),
  ('S',7,'Incursão pelo Portal','MISSÃO PERIGOSA — RISCO DE VIDA: um portal em %1$s despeja criaturas de outro plano. Atravesse-o, destrua a âncora e retorne antes do fechamento.','Atravesse o portal, destrua a âncora e retorne.',90,15000::bigint,10000::bigint),
  ('S',8,'Comboio da Coroa','MISSÃO PERIGOSA — RISCO DE VIDA: proteja um comboio real que partirá de %1$s rumo à fronteira. Um exército mercenário prepara a emboscada.','Garanta que todo o comboio atravesse a fronteira.',90,15000::bigint,10000::bigint),
  ('S',9,'O General Fugitivo','MISSÃO PERIGOSA — RISCO DE VIDA: um criminoso de guerra se esconde em %1$s protegido por veteranos de vários Reinos. Capture-o.','Derrote a guarda e capture o general com vida.',90,15000::bigint,10000::bigint),
  ('S',10,'Êxodo para o Reino Vizinho','MISSÃO PERIGOSA — RISCO DE VIDA: uma calamidade obriga os moradores de %1$s a buscar abrigo em outro Reino. Proteja a longa travessia.','Conduza os refugiados até o Reino vizinho com o menor número de baixas.',90,15000::bigint,10000::bigint),

  ('EX',1,'O Labirinto que Engoliu a Vila','Um labirinto monstruoso surgiu em %1$s e engoliu um vilarejo inteiro. Investigue a origem, encontre os moradores, derrote os guardiões de cada setor e restaure a vila ao mundo.','Mapear o labirinto, resgatar a população, derrotar seus mestres e recuperar a vila.',100,30000::bigint,25000::bigint),
  ('EX',2,'A Cidade Presa no Tempo','O tempo parou ao redor de %1$s. Entre na anomalia, reconstrua os acontecimentos, encontre o responsável e liberte cada pessoa congelada sem apagar sua história.','Resolver a anomalia temporal e devolver todos os habitantes ao fluxo normal.',100,30000::bigint,25000::bigint),
  ('EX',3,'O Reino que Desapareceu','Uma parte de %1$s desapareceu junto com seus moradores. Siga as marcas entre planos, estabeleça uma rota de retorno e enfrente a entidade que roubou o território.','Encontrar o território perdido, derrotar a entidade e trazer a região de volta.',100,30000::bigint,25000::bigint),
  ('EX',4,'As Sete Raízes da Ruína','Uma corrupção antiga abriu sete núcleos conectados sob %1$s. Cada núcleo altera o seguinte; investigue a ordem correta e destrua a fonte sem condenar a região.','Purificar os sete núcleos na ordem correta e salvar a região.',100,30000::bigint,25000::bigint),
  ('EX',5,'A Ilha em Queda','Uma massa territorial inteira está colapsando sobre %1$s. Evacue os habitantes, restaure as âncoras de Mana e enfrente quem sabotou o sistema antes do impacto.','Evacuar a população, restaurar as âncoras e impedir a queda.',100,30000::bigint,25000::bigint),
  ('EX',6,'O Abismo sem Fundo','Uma abertura sob %1$s cresce a cada hora e libera monstros desconhecidos. Desça por suas camadas, encontre expedições perdidas e sele o coração do abismo.','Explorar todas as camadas, resgatar sobreviventes e selar o abismo.',100,30000::bigint,25000::bigint),
  ('EX',7,'A Guerra dos Reflexos','Cópias hostis de figuras importantes surgiram em %1$s e iniciaram uma guerra interna. Descubra quem ainda é verdadeiro e feche o espelho que produz as duplicatas.','Identificar os originais, derrotar as cópias e destruir o espelho.',100,30000::bigint,25000::bigint),
  ('EX',8,'O Deus Adormecido','Um ser ancestral desperta sob %1$s e seus sonhos alteram o mundo. Reúna três chaves, atravesse as memórias da criatura e escolha como encerrar o despertar.','Recuperar as chaves, alcançar o núcleo dos sonhos e impedir a calamidade.',100,30000::bigint,25000::bigint),
  ('EX',9,'A Última Caravana','Milhares de pessoas precisam atravessar %1$s enquanto uma calamidade apaga tudo atrás delas. Organize rotas, defesas e suprimentos antes do confronto final.','Conduzir toda a população para um local seguro e deter a calamidade.',100,30000::bigint,25000::bigint),
  ('EX',10,'O Cerco dos Seis Reinos','Uma força desconhecida usa %1$s como passagem para atacar os seis Reinos. Investigue a invasão, una representantes rivais e destrua o comando inimigo.','Unir as forças dos Reinos, fechar a passagem e derrotar o comandante da invasão.',100,30000::bigint,25000::bigint)
), sites as (
  select r.kingdom,r.realm_name,r.motif,location,site_index::integer
  from realms r cross join lateral unnest(r.locations) with ordinality site(location,site_index)
)
select
  s.kingdom||'-'||lower(b.rank)||'-'||lpad(b.blueprint_index::text,2,'0')||'-'||lpad(s.site_index::text,2,'0') slug,
  b.title||' — '||s.location name,
  format(b.briefing,s.location,s.motif,s.realm_name) description,
  b.objective,
  s.kingdom,b.rank,b.min_level,b.xp reward_xp,b.gold reward_gold
from sites s cross join blueprints b;

insert into public.v2_missions(slug,name,description,objective,kingdom,rank,min_level,reward_xp,reward_gold,is_rank_trial,promotion_rank,active,available_after)
select slug,name,description,objective,kingdom,rank,min_level,reward_xp,reward_gold,false,null,true,null
from mission_catalog
on conflict(slug) do update set
  name=excluded.name,description=excluded.description,objective=excluded.objective,
  kingdom=excluded.kingdom,rank=excluded.rank,min_level=excluded.min_level,
  reward_xp=excluded.reward_xp,reward_gold=excluded.reward_gold,
  active=true,available_after=null,updated_at=now();

update public.v2_missions
set active=false,updated_at=now()
where not is_rank_trial
  and kingdom in ('aokigahara','darkya','oymyakon','lesedi','namida','skypiece')
  and not exists(select 1 from mission_catalog catalog where catalog.slug=v2_missions.slug);

