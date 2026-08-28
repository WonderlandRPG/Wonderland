create table if not exists public.v2_creatures(
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  category text not null,
  rank text not null check(rank in ('E','D','C','B','A','S','EX')),
  size text not null,
  disposition text not null,
  behavior text not null,
  weaknesses text[] not null default '{}',
  habitats text[] not null default '{}',
  description text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.v2_mission_creatures(
  mission_id uuid not null references public.v2_missions(id) on delete cascade,
  creature_id uuid not null references public.v2_creatures(id) on delete restrict,
  role text not null default 'target' check(role in ('target','threat','guardian','witness')),
  quantity_min integer not null default 1 check(quantity_min>0),
  quantity_max integer not null default 1 check(quantity_max>=quantity_min),
  notes text not null default '',
  primary key(mission_id,creature_id)
);

alter table public.v2_creatures enable row level security;
alter table public.v2_mission_creatures enable row level security;
grant select on public.v2_creatures,public.v2_mission_creatures to anon,authenticated;
grant insert,update,delete on public.v2_creatures,public.v2_mission_creatures to authenticated;
drop policy if exists "bestiary public read" on public.v2_creatures;
create policy "bestiary public read" on public.v2_creatures for select to anon,authenticated
using(active or (select public.v2_is_admin()));
drop policy if exists "bestiary admin manage" on public.v2_creatures;
create policy "bestiary admin insert" on public.v2_creatures for insert to authenticated with check((select public.v2_is_admin()));
create policy "bestiary admin update" on public.v2_creatures for update to authenticated using((select public.v2_is_admin())) with check((select public.v2_is_admin()));
create policy "bestiary admin delete" on public.v2_creatures for delete to authenticated using((select public.v2_is_admin()));
drop policy if exists "mission creatures public read" on public.v2_mission_creatures;
create policy "mission creatures public read" on public.v2_mission_creatures for select to anon,authenticated using(true);
drop policy if exists "mission creatures admin manage" on public.v2_mission_creatures;
create policy "mission creatures admin insert" on public.v2_mission_creatures for insert to authenticated with check((select public.v2_is_admin()));
create policy "mission creatures admin update" on public.v2_mission_creatures for update to authenticated using((select public.v2_is_admin())) with check((select public.v2_is_admin()));
create policy "mission creatures admin delete" on public.v2_mission_creatures for delete to authenticated using((select public.v2_is_admin()));

insert into public.v2_creatures(slug,name,category,rank,size,disposition,behavior,weaknesses,habitats,description) values
('slime-gota','Slime-gota','Gosma','E','Minúsculo','Curioso e evasivo','Absorve restos orgânicos e foge de vibrações fortes; raramente ataca.','{"sal","calor seco"}','{"porões","jardins úmidos"}','Uma pequena gosma translúcida usada por estudiosos para identificar contaminações.'),
('mariposa-lunar','Mariposa Lunar','Inseto mágico','E','Minúsculo','Dócil','Segue fontes de Mana e se reúne ao redor de luz azulada.','{"luz solar direta","fumaça de ervas"}','{"bosques","torres antigas"}','Inseto luminoso inofensivo cujas asas refletem pequenas correntes de Mana.'),
('caracol-cristal','Caracol de Cristal','Fera mágica','E','Pequeno','Pacífico','Recolhe-se na concha ao ouvir ruídos e deixa um rastro mineral brilhante.','{"vibração suave","água morna"}','{"cavernas","jardins minerais"}','Molusco lento de concha cristalina, procurado sem violência por alquimistas.'),
('coelho-nuvem','Coelho-nuvem','Fera','E','Pequeno','Arisco','Salta longas distâncias quando assustado e se esconde em vegetação clara.','{"alimento doce","redes macias"}','{"campos","ilhas flutuantes"}','Pequena fera de pelagem leve que parece se desfazer em névoa durante os saltos.'),
('cogumelo-andarilho','Cogumelo Andarilho','Planta','E','Pequeno','Indiferente','Muda lentamente de lugar em busca de sombra e umidade.','{"luz intensa","solo seco"}','{"florestas","adegas"}','Fungo ambulante inofensivo que espalha esporos coloridos ao caminhar.'),
('besouro-lanterna','Besouro-lanterna','Inseto','E','Minúsculo','Dócil','Acende o abdômen ao anoitecer e segue outros indivíduos em fila.','{"sinos agudos","folhas cítricas"}','{"praças","campos cultivados"}','Besouro usado por comunidades rurais como iluminação natural temporária.'),
('caranguejo-musgo','Caranguejo de Musgo','Aquático','E','Pequeno','Defensivo','Imobiliza-se e imita pedras cobertas de vegetação quando percebe pessoas.','{"água limpa","iscas de alga"}','{"riachos","recifes rasos"}','Crustáceo pequeno que transporta sementes e musgos sobre a carapaça.'),
('fada-polen','Fada do Pólen','Feérico','E','Minúsculo','Brincalhona','Esconde ferramentas leves e devolve tudo quando recebe flores frescas.','{"ferro frio","lavanda"}','{"jardins","pomares"}','Espírito diminuto ligado à polinização, travesso mas incapaz de causar ferimentos sérios.'),
('mini-mimico','Mímico de Bolso','Monstruosidade','E','Minúsculo','Assustado','Imita caixas pequenas e fecha a tampa quando alguém se aproxima.','{"giz branco","som de moedas"}','{"armazéns","bibliotecas"}','Parente minúsculo dos mímicos, mais interessado em objetos brilhantes do que em carne.'),
('espirito-goteira','Espírito de Goteira','Espírito','E','Pequeno','Melancólico','Surge onde existe vazamento e repete sons domésticos até o reparo.','{"recipientes de cobre","ambiente seco"}','{"casas antigas","aquedutos"}','Manifestação inofensiva que costuma indicar danos escondidos em encanamentos.'),

('rato-toupeira','Rato-topeira','Fera','D','Pequeno','Territorial','Ataca em grupo quando o ninho é ameaçado e cava rotas de fuga.','{"luz forte","odores cítricos"}','{"praças","túneis"}','Roedor escavador capaz de destruir jardins, pisos e depósitos.'),
('aranha-caverna','Aranha de Caverna','Artrópode','D','Pequeno','Predatória','Espera em teias baixas e recua diante de fogo controlado.','{"fogo","fumaça"}','{"cavernas","porões"}','Aranha venenosa que caça pequenos animais em locais escuros.'),
('goblin-catador','Goblin Catador','Humanoide','D','Pequeno','Oportunista','Rouba comida e ferramentas, fugindo quando perde vantagem numérica.','{"luz intensa","barulho coordenado"}','{"ruínas","estradas"}','Goblin jovem que vive de pequenos furtos e armadilhas improvisadas.'),
('kobold-batedor','Kobold Batedor','Dracônico','D','Pequeno','Desconfiado','Marca caminhos com pedras e conduz perseguidores até armadilhas simples.','{"frio","retirada das armadilhas"}','{"minas","túneis"}','Dracônico pequeno especializado em vigiar territórios subterrâneos.'),
('lobo-cinzento','Lobo Cinzento','Fera','D','Médio','Protetor da matilha','Cerca alvos isolados, mas evita grupos compactos e fogo.','{"fogo","sons metálicos"}','{"florestas","planícies"}','Predador comum que se torna perigoso quando faminto ou protegendo filhotes.'),
('esqueleto-errante','Esqueleto Errante','Morto-vivo','D','Médio','Hostil','Repete a última patrulha que fazia em vida e reage a movimento.','{"dano contundente","luz sagrada"}','{"cemitérios","ruínas"}','Restos reanimados por Mana residual, sem inteligência verdadeira.'),
('imp-menor','Imp Menor','Demoníaco','D','Pequeno','Malicioso','Provoca, rouba objetos e desaparece em fumaça quando encurralado.','{"prata","símbolos sagrados"}','{"torres","becos"}','Demônio inferior atraído por promessas, segredos e pequenos atos de crueldade.'),
('javali-couraçado','Javali Couraçado','Fera','D','Médio','Agressivo','Investe em linha reta e demora a mudar de direção.','{"flancos","terreno lamacento"}','{"bosques","fazendas"}','Javali de pele espessa que destrói plantações durante migrações.'),
('gosma-acida','Gosma Ácida','Gosma','D','Pequeno','Reativa','Avança sobre metal e matéria orgânica, dividindo-se sob cortes.','{"frio","sal alcalino"}','{"esgotos","laboratórios"}','Gosma corrosiva criada pelo descarte incorreto de reagentes alquímicos.'),
('vespa-carrasco','Vespa-carrasco','Inseto gigante','D','Pequeno','Defensiva','Protege o ninho em enxame e persegue calor corporal por curta distância.','{"fumaça","frio"}','{"telhados","árvores ocas"}','Vespa de ferrão doloroso que constrói ninhos perto de fontes de alimento.'),

('urso-coruja','Urso-coruja','Monstruosidade','C','Grande','Territorial','Avança contra quem se aproxima do ninho e usa visão noturna excelente.','{"sons agudos","flancos desprotegidos"}','{"florestas","cavernas"}','Predador de corpo ursino e cabeça de coruja, forte demais para contenção comum.'),
('grifo-jovem','Grifo Jovem','Fera mágica','C','Grande','Orgulhoso','Ataca de cima, protege território elevado e recua se tiver as asas imobilizadas.','{"redes reforçadas","espaços fechados"}','{"montanhas","ilhas flutuantes"}','Grifo ainda imaturo, capaz de carregar pessoas e animais de médio porte.'),
('ogro-das-colinas','Ogro das Colinas','Gigante','C','Grande','Brutal','Confia na força, persegue o alvo mais barulhento e ignora armadilhas visíveis.','{"agilidade","ilusões"}','{"colinas","ruínas"}','Gigante pouco inteligente que saqueia caravanas e celeiros.'),
('troll-do-brejo','Troll do Brejo','Gigante','C','Grande','Hostil','Regenera ferimentos rapidamente e tenta arrastar vítimas para a água.','{"fogo","ácido"}','{"pântanos","rios escuros"}','Predador regenerativo de pele lodosa e braços desproporcionais.'),
('basilisco-jovem','Basilisco Jovem','Monstruosidade','C','Médio','Predatório','Imobiliza presas com o olhar ainda incompleto e ataca de emboscada.','{"espelhos","vendas sobre os olhos"}','{"desertos","cavernas"}','Réptil mágico cuja petrificação ainda é lenta, mas extremamente perigosa.'),
('escorpiao-gigante','Escorpião Gigante','Artrópode','C','Grande','Defensivo','Mantém as pinças à frente e usa o ferrão contra quem ataca pelos flancos.','{"frio","articulações"}','{"desertos","pedreiras"}','Escorpião de carapaça resistente capaz de tombar carroças.'),
('ankheg','Ankheg','Monstruosidade','C','Grande','Caçador subterrâneo','Detecta passos pelo solo, emerge sob o alvo e cospe ácido.','{"vibrações falsas","frio"}','{"campos","túneis"}','Inseto escavador colossal que abre crateras sob rotas movimentadas.'),
('wight-vigia','Wight Vigia','Morto-vivo','C','Médio','Calculista','Drena vigor de alvos isolados e comanda esqueletos próximos.','{"luz sagrada","prata"}','{"criptas","fortalezas"}','Morto-vivo consciente criado para proteger sepulturas e relíquias.'),
('crocodilo-runa','Crocodilo Rúnico','Fera mágica','C','Grande','Paciente','Permanece imóvel na água e ativa runas defensivas quando ferido.','{"ventre","eletricidade"}','{"rios","canais"}','Réptil marcado por runas naturais que endurecem sua couraça.'),
('manticora-jovem','Manticora Jovem','Monstruosidade','C','Grande','Agressiva','Dispara espinhos à distância antes de atacar com garras.','{"escudos","cauda"}','{"desfiladeiros","savanas"}','Manticora inexperiente, ainda incapaz de controlar totalmente os próprios espinhos.'),

('minotauro-labirinto','Minotauro do Labirinto','Monstruosidade','B','Grande','Implacável','Memoriza rotas, investe em corredores e caça pelo cheiro.','{"espaços abertos","ilusões olfativas"}','{"labirintos","ruínas"}','Guardião brutal que jamais se perde dentro do próprio território.'),
('quimera','Quimera','Monstruosidade','B','Grande','Extremamente hostil','Alterna fogo, garras e mordidas; cada cabeça reage de forma independente.','{"gelo","desorientação das cabeças"}','{"montanhas","ermos"}','Fusão mágica de leão, cabra e dragão criada como arma viva.'),
('vampiro-menor','Vampiro Menor','Morto-vivo','B','Médio','Manipulador','Evita confronto direto, encanta vítimas e ataca quando estão isoladas.','{"luz solar","prata","água corrente"}','{"cidades","mansões"}','Morto-vivo inteligente que ainda serve a um vampiro mais antigo.'),
('banshee','Banshee','Morto-vivo','B','Médio','Rancorosa','Seu lamento enfraquece grupos e atravessa barreiras comuns.','{"silêncio mágico","lembrança pessoal"}','{"ruínas","bosques assombrados"}','Espírito preso a uma perda violenta, capaz de derrubar expedições com a voz.'),
('golem-pedra','Golem de Pedra','Construto','B','Grande','Obediente','Segue ordens literais e ignora dor, veneno e medo.','{"runas de comando","dano trovejante"}','{"templos","fortalezas"}','Construto pesado animado para proteger locais e pessoas específicas.'),
('elemental-tempestade','Elemental da Tempestade','Elemental','B','Grande','Instável','Move-se entre rajadas, acumula eletricidade e persegue objetos metálicos.','{"terra","isolamento elétrico"}','{"torres","céus tempestuosos"}','Manifestação viva de vento e relâmpago condensados.'),
('oni-vermelho','Oni Vermelho','Gigante','B','Grande','Cruel','Disfarça-se de viajante, testa a força do grupo e usa magia sombria.','{"ferro frio","descoberta do nome verdadeiro"}','{"estradas","fortalezas"}','Gigante demoníaco inteligente que caça guerreiros dignos.'),
('drider','Drider','Aberração','B','Grande','Tático','Controla o terreno com teias e ataca alvos imobilizados à distância.','{"fogo","luz intensa"}','{"cavernas","cidades subterrâneas"}','Criatura de torso humanoide e corpo aracnídeo, especialista em emboscadas.'),
('observador-menor','Observador Menor','Aberração','B','Médio','Paranoico','Mantém distância e dispara raios diferentes conforme a ameaça.','{"pontos cegos","reflexos"}','{"torres arcanas","abismos"}','Parente menor dos observadores, ainda assim perigoso e imprevisível.'),
('serpente-marinha','Serpente Marinha','Aquático','B','Enorme','Territorial','Enrola embarcações e mergulha quando sofre ataques concentrados.','{"eletricidade","guelras"}','{"mares","canais profundos"}','Predador aquático capaz de afundar barcos mercantes.'),

('dragao-adulto','Dragão Adulto','Dragão','A','Enorme','Dominante','Controla o campo pelo voo, sopro elemental e inteligência superior.','{"elemento oposto","membranas das asas"}','{"montanhas","vulcões"}','Dragão plenamente desenvolvido, senhor de território e tesouro próprios.'),
('lich','Lich','Morto-vivo','A','Médio','Calculista','Prepara contingências, comanda mortos e protege a própria filactéria.','{"filactéria","magia sagrada"}','{"criptas","torres"}','Arquimago que aprisionou a alma para continuar existindo após a morte.'),
('hidra','Hidra','Monstruosidade','A','Enorme','Voraz','Ataca vários alvos e regenera duas cabeças quando uma é cortada sem cauterização.','{"fogo","ataques simultâneos"}','{"pântanos","lagos"}','Réptil de múltiplas cabeças capaz de destruir patrulhas inteiras.'),
('cavaleiro-morte','Cavaleiro da Morte','Morto-vivo','A','Grande','Disciplinado','Usa táticas militares, aura de medo e golpes que drenam vitalidade.','{"arma sagrada","ruptura do juramento"}','{"campos de batalha","fortalezas"}','Campeão morto-vivo ligado a um juramento corrompido.'),
('observador','Observador','Aberração','A','Grande','Paranoico e genial','Anula magia pelo olho central e combina raios de controle e destruição.','{"ponto cego inferior","espelhos"}','{"abismos","cidadelas"}','Aberração flutuante que considera todas as outras formas de vida inferiores.'),
('fênix','Fênix','Celestial','A','Grande','Altiva','Manipula fogo, cura-se nas chamas e renasce se suas cinzas não forem seladas.','{"frio absoluto","selamento das cinzas"}','{"vulcões","templos solares"}','Ave imortal de fogo cuja passagem pode incendiar regiões inteiras.'),
('demonio-guerra','Demônio da Guerra','Demoníaco','A','Grande','Sádico','Fortalece-se com violência ao redor e força inimigos a lutar entre si.','{"prata consagrada","calma mágica"}','{"fendas","campos de batalha"}','Demônio superior atraído por guerras prolongadas.'),
('esfinge','Esfinge','Celestial','A','Grande','Enigmática','Testa intrusos com enigmas e altera espaço ao redor do próprio templo.','{"resposta verdadeira","símbolo de autoridade"}','{"desertos","templos"}','Guardião ancestral que pune quem tenta vencer seus testes pela força.'),
('colosso-ferro','Colosso de Ferro','Construto','A','Colossal','Programado','Avança sem recuar e recebe ordens de um núcleo rúnico protegido.','{"núcleo rúnico","eletricidade"}','{"fortalezas","cidades antigas"}','Máquina de guerra alta como uma torre, criada por civilização desaparecida.'),
('leviata-jovem','Leviatã Jovem','Aquático','A','Colossal','Predatório','Cria redemoinhos, caça pelo som e ataca estruturas flutuantes.','{"silêncio","órgãos luminescentes"}','{"oceanos","fendas marinhas"}','Filhote de uma linhagem oceânica capaz de devastar portos.'),

('dragao-anciao','Dragão Ancião','Dragão','S','Colossal','Soberano','Prevê estratégias, altera o clima e usa séculos de experiência em combate.','{"artefato dracônico rival","ferida ancestral"}','{"cadeias montanhosas","reinos em ruínas"}','Dragão com poder suficiente para impor tributos a um Reino inteiro.'),
('kraken','Kraken','Aquático','S','Colossal','Devastador','Ataca várias embarcações, cria tempestades e arrasta estruturas para o fundo.','{"olhos","relâmpago concentrado"}','{"oceanos","cidades submersas"}','Monstro abissal cujos tentáculos podem cercar um porto.'),
('arquilich','Arquilich','Morto-vivo','S','Médio','Estrategista milenar','Mantém múltiplas filactérias, exércitos mortos e planos dentro de planos.','{"filactérias simultâneas","nome mortal"}','{"reinos mortos","planos sombrios"}','Lich antigo cuja influência atravessa fronteiras e gera guerras.'),
('lorde-abissal','Lorde Abissal','Demoníaco','S','Enorme','Conquistador','Abre fendas, convoca legiões e corrompe o terreno ao redor.','{"arma celestial","fechamento da fenda"}','{"abismos","cidades sitiadas"}','General demoníaco capaz de liderar uma invasão planar.'),
('tita-tempestade','Titã da Tempestade','Gigante','S','Colossal','Indiferente','Cada movimento altera ventos e relâmpagos numa região inteira.','{"âncoras de terra","runa primordial"}','{"céus","picos"}','Gigante primordial tratado como calamidade natural viva.'),
('cerebro-anciao','Cérebro Ancião','Aberração','S','Enorme','Dominador','Lê pensamentos, controla comunidades e coordena servos sem falar.','{"isolamento mental","sal psíquico"}','{"cidades subterrâneas","colônias aberrantes"}','Mente coletiva ancestral que transforma populações em extensões de si.'),
('roc-tempestade','Roc da Tempestade','Fera mítica','S','Colossal','Territorial','Carrega criaturas enormes, cria tornados com as asas e caça entre nuvens.','{"asas","isca aterrada"}','{"ilhas flutuantes","montanhas"}','Ave colossal capaz de capturar dragões jovens.'),
('serpente-mundo','Serpente do Mundo','Fera mítica','S','Colossal','Adormecida e catastrófica','Seu despertar causa terremotos; quando alerta, cerca cidades com o corpo.','{"runas de sono","escamas ventrais"}','{"subsolo","mares profundos"}','Serpente antiga cujo corpo atravessa territórios inteiros.'),
('elemental-primordial','Elemental Primordial','Elemental','S','Colossal','Incontrolável','Transforma permanentemente o ambiente no próprio elemento.','{"coração elemental","elemento oposto"}','{"nexos de Mana","regiões devastadas"}','Força elemental anterior aos Reinos, impossível de conter por meios comuns.'),
('anjo-caido','Anjo Caído','Celestial','S','Grande','Fanático','Impõe julgamentos, silencia magia e converte seguidores pela presença.','{"nome verdadeiro","relíquia de redenção"}','{"templos destruídos","céus partidos"}','Celestial corrompido que acredita ter autoridade para condenar povos inteiros.'),

('devorador-mundos','Devorador de Mundos','Entidade cósmica','EX','Incomensurável','Incompreensível','Consome matéria, memória e Mana; não reconhece indivíduos como ameaça.','{"fragmentos do mundo natal","ritual dos seis Reinos"}','{"vazio","fronteiras da realidade"}','Entidade cuja aproximação apaga regiões dos mapas e das lembranças.'),
('dragao-realidade','Dragão da Realidade','Dragão cósmico','EX','Incomensurável','Soberano absoluto','Reescreve regras físicas e cria versões alternativas do campo de batalha.','{"nome original","paradoxo estabilizado"}','{"planos partidos","linhas temporais"}','Dragão que existe simultaneamente em diferentes versões da história.'),
('fragmento-deus-morto','Fragmento do Deus Morto','Divindade','EX','Colossal','Sonâmbulo','Seus sonhos ganham forma e sua dor altera povos inteiros.','{"memória divina","rito de despedida"}','{"templos impossíveis","mundo dos sonhos"}','Parte consciente de uma divindade que morreu antes da história registrada.'),
('leviata-abissal','Leviatã Abissal','Entidade abissal','EX','Incomensurável','Faminto','Abre oceanos onde não existiam e engole cidades junto com o terreno.','{"farol primordial","coração exposto"}','{"abismo","oceanos entre planos"}','Criatura anterior à separação entre terra, mar e vazio.'),
('devorador-tempo','Devorador do Tempo','Aberração temporal','EX','Variável','Predatório','Apaga acontecimentos para se alimentar e surge antes do próprio ataque.','{"âncora temporal","lembranças compartilhadas"}','{"anomalias","eras perdidas"}','Predador que consome anos inteiros da existência de uma região.'),
('rei-sem-rosto','Rei sem Rosto','Entidade feérica','EX','Variável','Manipulador','Rouba identidades, substitui governantes e transforma promessas em leis físicas.','{"nome recusado","coroa quebrada"}','{"corte impossível","espelhos"}','Soberano feérico cuja verdadeira face jamais foi registrada.'),
('maquina-primeira','A Máquina Primeira','Construto divino','EX','Colossal','Lógica absoluta','Reorganiza seres vivos como peças defeituosas e aprende com cada tentativa contra ela.','{"comando de origem","contradição lógica"}','{"cidade mecânica","núcleo do mundo"}','Construto que afirma ter participado da criação das leis de Wonderland.'),
('raiz-do-fim','A Raiz do Fim','Planta cósmica','EX','Incomensurável','Expansiva','Cresce através de dimensões, copia ecossistemas e sufoca toda Mana concorrente.','{"semente original","fogo estelar"}','{"florestas impossíveis","fendas"}','Raiz de uma árvore exterior à realidade que tenta transformar o mundo em extensão própria.'),
('coro-vazio','Coro do Vazio','Enxame cósmico','EX','Incomensurável','Coletivo','Milhões de vozes apagam vontade individual e remodelam matéria pelo canto.','{"silêncio perfeito","voz discordante"}','{"vazio","cidades silenciosas"}','Enxame sem corpos definidos que converte civilizações em uma única consciência.'),
('guardiao-ultima-porta','Guardião da Última Porta','Entidade liminar','EX','Colossal','Imparcial','Bloqueia a passagem entre existência e inexistência e testa toda intenção.','{"chave dos seis selos","verdade absoluta"}','{"fim dos caminhos","portais finais"}','Guardião que surge quando uma escolha pode mudar definitivamente a história do mundo.')
on conflict(slug) do update set
  name=excluded.name,category=excluded.category,rank=excluded.rank,size=excluded.size,
  disposition=excluded.disposition,behavior=excluded.behavior,weaknesses=excluded.weaknesses,
  habitats=excluded.habitats,description=excluded.description,active=true,updated_at=now();

create index if not exists v2_creatures_rank_category_idx on public.v2_creatures(rank,category) where active;
create index if not exists v2_mission_creatures_creature_idx on public.v2_mission_creatures(creature_id);

-- Somente famílias de missão cujo conflito permite criaturas recebem encontros.
with candidates as (
  select m.id,m.rank,m.slug,
    row_number() over(partition by m.rank order by m.kingdom,m.slug) creature_position
  from public.v2_missions m
  where m.active and not m.is_rank_trial and (
    (m.rank='D' and split_part(m.slug,'-',3)::integer in (1,3,4,5,6,7,8,9,10)) or
    (m.rank='C' and split_part(m.slug,'-',3)::integer in (1,3,4,5,6,10)) or
    (m.rank='B' and split_part(m.slug,'-',3)::integer in (3,5,7,8)) or
    (m.rank='A' and split_part(m.slug,'-',3)::integer in (2,3,6,7,9,10)) or
    (m.rank='S' and split_part(m.slug,'-',3)::integer in (3,4,6,7,9)) or
    (m.rank='EX' and split_part(m.slug,'-',3)::integer in (1,3,4,6,7,8,10))
  )
), ranked_creatures as (
  select c.id,c.rank,c.name,c.behavior,c.weaknesses,
    row_number() over(partition by c.rank order by c.name) creature_position,
    count(*) over(partition by c.rank) creature_count
  from public.v2_creatures c where c.active and c.rank<>'E'
), matches as (
  select candidate.id mission_id,creature.id creature_id,creature.name,creature.behavior,creature.weaknesses
  from candidates candidate join ranked_creatures creature
    on creature.rank=candidate.rank
    and creature.creature_position=((candidate.creature_position-1)%creature.creature_count)+1
)
insert into public.v2_mission_creatures(mission_id,creature_id,role,quantity_min,quantity_max,notes)
select mission_id,creature_id,'target',1,case when cardinality(weaknesses)>2 then 1 else 2 end,
  'Consulte o Bestiário antes de narrar o encontro.'
from matches on conflict(mission_id,creature_id) do update set notes=excluded.notes;

with encounter as (
  select mc.mission_id,c.name,c.behavior,c.weaknesses
  from public.v2_mission_creatures mc join public.v2_creatures c on c.id=mc.creature_id
)
update public.v2_missions m set
  description=m.description||' Relatos da Guilda identificam '||encounter.name||' no local. '||encounter.behavior,
  objective=m.objective||' Use o Bestiário para explorar uma fraqueza conhecida de '||encounter.name||'.',
  updated_at=now()
from encounter
where m.id=encounter.mission_id and m.description not like '%Relatos da Guilda identificam%';

-- O jogador vê uma missão de cada família por semana, nunca duas cópias do mesmo acontecimento.
create or replace function public.v2_get_mission_board(p_character_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare chosen public.v2_characters; active_assignment jsonb; completed_count integer; needed integer; locked_until timestamptz; mission_list jsonb;
begin
  select * into chosen from public.v2_characters where id=p_character_id and user_id=(select auth.uid());
  if chosen.id is null then raise exception 'Personagem não encontrado' using errcode='P0002'; end if;
  select jsonb_build_object('id',a.id,'missionId',m.id,'name',m.name,'rank',m.rank,'kingdom',m.kingdom,'objective',m.objective,'acceptedAt',a.accepted_at,'isRankTrial',m.is_rank_trial)
  into active_assignment from public.v2_mission_assignments a join public.v2_missions m on m.id=a.mission_id where a.character_id=chosen.id and a.status='in_progress' limit 1;
  select count(*)::integer into completed_count from public.v2_mission_assignments a join public.v2_missions m on m.id=a.mission_id where a.character_id=chosen.id and a.status='completed' and not m.is_rank_trial and m.rank=chosen.adventure_rank;
  select required_completions into needed from public.v2_rank_mission_requirements where rank=chosen.adventure_rank;
  select max(retry_after) into locked_until from public.v2_mission_assignments where character_id=chosen.id and status='failed' and retry_after>now();
  with eligible as (
    select m.*,row_number() over(partition by split_part(m.slug,'-',3) order by md5(m.id::text||chosen.id::text||date_trunc('week',now())::text)) family_position
    from public.v2_missions m where m.active and m.kingdom=chosen.kingdom and m.rank=chosen.adventure_rank and not m.is_rank_trial
      and (m.available_after is null or m.available_after<=now()) and chosen.level>=m.min_level
      and not exists(select 1 from public.v2_mission_assignments recent where recent.character_id=chosen.id and recent.mission_id=m.id and recent.status='completed' and recent.resolved_at>now()-interval '7 days')
  ), weekly_selection as (
    select * from eligible where family_position=1 order by md5(id::text||chosen.id::text||date_trunc('week',now())::text) limit 10
  ), visible as (
    select id,slug,name,description,objective,kingdom,rank,min_level,reward_xp,reward_gold,is_rank_trial,promotion_rank from weekly_selection
    union all
    select m.id,m.slug,m.name,m.description,m.objective,m.kingdom,m.rank,m.min_level,m.reward_xp,m.reward_gold,m.is_rank_trial,m.promotion_rank
    from public.v2_missions m where m.active and m.kingdom=chosen.kingdom and m.rank=chosen.adventure_rank and m.is_rank_trial and completed_count>=coalesce(needed,2147483647) and chosen.level>=m.min_level
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',m.id,'slug',m.slug,'name',m.name,'description',m.description,'objective',m.objective,'rank',m.rank,'kingdom',m.kingdom,'minLevel',m.min_level,
    'rewardXp',m.reward_xp,'rewardGold',m.reward_gold,'isRankTrial',m.is_rank_trial,'promotionRank',m.promotion_rank,
    'creature',(select jsonb_build_object('slug',c.slug,'name',c.name,'rank',c.rank,'category',c.category,'weaknesses',c.weaknesses)
      from public.v2_mission_creatures mc join public.v2_creatures c on c.id=mc.creature_id where mc.mission_id=m.id limit 1)
  ) order by m.is_rank_trial desc,m.name),'[]'::jsonb) into mission_list from visible m;
  return jsonb_build_object('character',jsonb_build_object('id',chosen.id,'name',chosen.name,'rank',chosen.adventure_rank,'level',chosen.level,'kingdom',chosen.kingdom,'imageUrl',chosen.image_url),
    'missions',mission_list,'activeAssignment',active_assignment,'completedForRank',completed_count,'requiredForTrial',needed,'lockedUntil',locked_until,'canManage',public.v2_is_mission_manager());
end; $$;

revoke all on function public.v2_get_mission_board(uuid) from public,anon;
grant execute on function public.v2_get_mission_board(uuid) to authenticated;
