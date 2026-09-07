begin;

-- Cada local recebe um elenco, um objeto de interesse, um conflito, uma pista e
-- uma escolha próprios. As ações continuam reconhecíveis no quadro da Guilda,
-- mas deixam de ser o mesmo briefing com o nome do destino substituído.
with location_profiles(
  kingdom, location_index, custodian, focus, disruption, clue, dilemma
) as (values
  ('aokigahara', 1, 'a guardiã cega Maíra, que reconhece cada raiz pelo som', 'um nó de madeira que guarda a memória das canções do bosque', 'uma das raízes passou a repetir a voz de viajantes desaparecidos', 'as notas falsas surgem sempre depois que marcas de machado aparecem na casca', 'se o trecho doente deve ser silenciado ou preservado para revelar quem o feriu'),
  ('aokigahara', 2, 'a curandeira Lume, responsável pelo cultivo noturno', 'pétalas de erva-lunar que precisam ser colhidas antes do amanhecer', 'alguém vem expondo os canteiros ao sol e arruinando as plantas medicinais', 'pegadas cobertas de pólen levam a um terraço oficialmente abandonado', 'se a última colheita deve atender os doentes ou servir de isca para o sabotador'),
  ('aokigahara', 3, 'o carpinteiro Oren, último reparador da travessia', 'uma tábua entalhada com os nomes das famílias das copas', 'a ponte começou a soltar tábuas mesmo sem vento forte', 'as cordas foram cortadas por dentro, no ponto onde só os moradores passam', 'se a ponte deve ser fechada, isolando uma comunidade, ou mantida aberta sob risco'),
  ('aokigahara', 4, 'a micologista Rubra, imune aos esporos comuns', 'um fungo-coração capaz de neutralizar venenos raros', 'os cogumelos gigantes estão liberando esporos que provocam a mesma lembrança em todos', 'entre as colônias há botas recentes e frascos quebrados da Guilda', 'se o fungo-coração deve ser retirado para uma cura ou mantido para sustentar a gruta'),
  ('aokigahara', 5, 'o noviço Cael, encarregado das oferendas do santuário', 'uma gota de seiva dourada destinada a um ritual de cura', 'a raiz sagrada secou logo após a visita de um dignitário', 'resíduos de sal alquímico formam um círculo sob o altar', 'se a seiva restante deve salvar uma pessoa agora ou ser usada para restaurar a raiz'),
  ('aokigahara', 6, 'a maestrina Silene, que conduz o coro das flores', 'sementes das flores graves que orientam viajantes na neblina', 'uma faixa inteira do vale emudeceu e o silêncio avança a cada noite', 'as flores caladas estão voltadas para uma fenda recém-aberta', 'se a fenda deve ser selada ou explorada antes que o vale perca sua música'),
  ('aokigahara', 7, 'a mercadora Âmbar, mediadora entre extratores e alquimistas', 'frascos de resina azul cuja origem ninguém consegue comprovar', 'compradores adoecem depois de usar um lote vendido como medicinal', 'os selos são autênticos, mas as rolhas carregam pó do Distrito dos Curtumes', 'se o mercado deve ser fechado ou mantido aberto para seguir a cadeia de falsificação'),
  ('aokigahara', 8, 'o batedor Ivo, que mapeia o caminho todas as manhãs', 'um cipó-guia que aponta para água limpa', 'a trilha passou a conduzir grupos diferentes à mesma clareira sem saída', 'pequenos sinos presos aos cipós foram movidos por mãos humanas', 'se os cipós devem ser cortados para abrir passagem ou seguidos até quem os manipula'),
  ('aokigahara', 9, 'a anciã Nara, depositária do catálogo das espécies perdidas', 'uma semente luminosa que germinou fora de sua estação', 'a nascente começou a devolver sementes com símbolos gravados', 'um dos símbolos coincide com o brasão de uma família dada como extinta', 'se a semente deve ser plantada, guardada ou entregue aos supostos herdeiros'),
  ('aokigahara', 10, 'o sacerdote Verde Taren, que discorda do restante do círculo', 'uma máscara ritual coberta por brotos novos', 'as raízes interrompem toda cerimônia quando um dos sacerdotes fala', 'a máscara reage à presença de seiva corrompida escondida sob as pedras', 'se a corrupção deve ser revelada em público ou tratada sem romper a confiança do círculo'),

  ('darkya', 1, 'a mestre das comportas Dália, que conhece o aqueduto desde criança', 'um filtro de carvão capaz de limpar a água dos bairros altos', 'a vazão caiu enquanto a chuva ficou mais intensa', 'moedas recentes foram encontradas dentro de uma válvula travada', 'se a água deve ser desviada dos nobres para abastecer os bairros baixos'),
  ('darkya', 2, 'o enólogo Corvin, herdeiro endividado da vinícola', 'um barril da safra rubra reservado para um tratado comercial', 'a adega aqueceu durante a madrugada e parte do vinho começou a fermentar novamente', 'penas negras manchadas de fuligem formam um rastro até uma parede falsa', 'se o tratado deve ser protegido ou a passagem clandestina revelada aos trabalhadores'),
  ('darkya', 3, 'a sineira Bruna, responsável pelos alertas de tempestade', 'o badalo do sino central, forjado com ferro meteórico', 'os sinos tocaram sem vento e provocaram pânico na estrada', 'cada toque coincide com uma luz vista sob o desfiladeiro', 'se a ponte deve ser evacuada ou usada para atrair quem responde aos sinos'),
  ('darkya', 4, 'o taverneiro Manso, que acolhe viajantes durante temporais', 'um livro de relatos deixado por gerações de hóspedes', 'um desconhecido oferece dinheiro para arrancar páginas sobre uma antiga enchente', 'a tinta das páginas procuradas reaparece quando molhada pela chuva', 'se o segredo deve ser entregue para proteger a taverna ou divulgado à cidade'),
  ('darkya', 5, 'a curtumeira Joana, porta-voz das oficinas do canal', 'um lote de couro impermeável destinado às equipes de resgate', 'uma espuma tóxica está queimando peles e mãos dos artesãos', 'o despejo vem de um cano que não aparece nas plantas do distrito', 'se a produção deve parar durante a tempestade ou continuar para equipar os resgatistas'),
  ('darkya', 6, 'o cocheiro Sal, único sobrevivente da última viagem', 'uma caixa selada que não pode ser molhada nem aberta', 'três carruagens sumiram entre dois postos separados por uma hora', 'marcas de rodas terminam diante de uma área de lama intacta', 'se o selo da caixa deve ser quebrado para descobrir por que ela está sendo caçada'),
  ('darkya', 7, 'a engenheira Volta, que herdou diagramas incompletos da torre', 'um acumulador antigo ainda carregado por centenas de tempestades', 'o para-raios começou a lançar descargas em direção à cidade', 'as descargas desenham no chão o mapa de túneis esquecidos', 'se a torre deve ser desligada ou mantida ativa para localizar o mecanismo subterrâneo'),
  ('darkya', 8, 'a estoquista Mara, responsável pelas mantas do inverno', 'fardos de lã negra que retêm calor mesmo encharcados', 'o depósito amanheceu trancado por dentro e com parte da carga desaparecida', 'fios de lã seguem pelas vigas até uma antiga saída de ventilação', 'se os invasores devem ser perseguidos ou a lã restante levada primeiro aos desabrigados'),
  ('darkya', 9, 'o operador Nilo, que ouve mudanças no fluxo pelos canos', 'a chave da comporta inferior do canal', 'a água começou a subir nos túneis onde famílias se refugiam', 'riscos recentes indicam que alguém abriu uma passagem para contrabandistas', 'se a comporta deve inundar a rota clandestina ou preservar o abrigo das famílias'),
  ('darkya', 10, 'a capitã Ferris, comandante da guarda do portão', 'um manifesto de entrada com nomes apagados pela chuva', 'as luzes âmbar se apagam sempre que uma carruagem sem brasão se aproxima', 'o ferro do portão guarda impressões de mãos do lado de dentro', 'se o portão deve ser fechado contra a tempestade ou aberto para investigar a carruagem'),

  ('oymyakon', 1, 'a mineira Boreal Ina, cuja equipe está presa no turno profundo', 'um diamante que pulsa nas mesmas cores da aurora', 'o gelo fecha os túneis mais rápido do que os mineiros conseguem escavar', 'o cristal pulsa antes de cada novo bloqueio, como se respondesse a alguém', 'se o diamante deve ser removido para salvar a equipe ou deixado sustentando a galeria'),
  ('oymyakon', 2, 'o piloto Eirik, conhecedor do corredor entre as agulhas', 'uma boia térmica que mantém livre a entrada do porto', 'as formações de gelo mudaram de posição e cercaram uma embarcação', 'fragmentos nas agulhas mostram cortes regulares, feitos por ferramentas', 'se o navio deve ser libertado agora ou seguido até a rota secreta que tentou usar'),
  ('oymyakon', 3, 'a acústica Sura, que estuda a resposta dos cristais ao som', 'um cristal azul rachado que repete palavras horas depois', 'ecos falsos estão separando grupos dentro da caverna', 'uma melodia curta faz todos os cristais apontarem para uma parede opaca', 'se a parede deve ser rompida ou o acesso isolado até compreender o que responde do outro lado'),
  ('oymyakon', 4, 'a guia Neva, que mantém as cordas de orientação', 'um marco de pedra arrancado pela nevasca', 'viajantes chegam ao mesmo ponto apesar de seguirem direções opostas', 'as cordas foram trocadas por outras novas e sem marcas de gelo', 'se o grupo deve confiar nos marcos antigos ou seguir as luzes móveis da tempestade'),
  ('oymyakon', 5, 'a arquivista Vitra, protetora das histórias projetadas nos vitrais', 'um painel colorido que registra um pacto apagado dos livros', 'uma família exige retirar o vitral antes de uma cerimônia pública', 'sob luz azul, a imagem revela uma figura ainda viva na fortaleza', 'se o registro deve ser exibido ou ocultado para evitar um conflito entre famílias'),
  ('oymyakon', 6, 'o extrator Orik, especialista em trabalhar sem rachar geleiras', 'uma pepita presa no centro de uma coluna transparente', 'garimpeiros clandestinos aqueceram o veio e abriram fissuras', 'uma ferramenta abandonada traz o selo da própria administração da mina', 'se o ouro deve ser salvo ou derretido para vedar a rachadura que ameaça a comunidade'),
  ('oymyakon', 7, 'a mecânica Anka, chefe da doca durante o inverno', 'uma corrente de ancoragem feita para suportar gelo móvel', 'um quebra-gelo regressou vazio, com o motor ainda quente', 'marcas no convés indicam que a tripulação deixou o navio em ordem, não em pânico', 'se a embarcação deve partir em busca da tripulação ou permanecer protegendo o porto'),
  ('oymyakon', 8, 'o vigia Branco Pavel, encarregado da única passagem do vale', 'um fragmento da muralha que continua crescendo depois de separado', 'as paredes de gelo estão fechando a saída em vez de reconstruí-la', 'rostos parecem surgir nas camadas mais recentes quando a lua aparece', 'se o gelo deve ser quebrado ou ouvido antes que a passagem desapareça'),
  ('oymyakon', 9, 'a comandante Petra, que mantém aquecidas as galerias da fortaleza', 'um braseiro subterrâneo alimentado por pedra vulcânica', 'o calor está sendo desviado e as torres começam a congelar', 'pegadas molhadas levam a aposentos lacrados desde a última guerra', 'se o calor deve voltar às defesas ou ser enviado aos civis refugiados nas galerias'),
  ('oymyakon', 10, 'o antigo mineiro Kol, que afirma ouvir ferramentas sob o desabamento', 'um lampião aceso encontrado além dos trilhos congelados', 'batidas regulares respondem a quem entra no túnel', 'o carvão nas paredes foi removido formando letras de um pedido de socorro', 'se o desabamento deve ser aberto apesar do risco ou selado antes que algo saia'),

  ('lesedi', 1, 'a oasiana Zahra, responsável pela divisão da água', 'uma fruta de vidro rachada que ainda guarda água perfeitamente limpa', 'as frutas amadurecem vazias enquanto o nível do oásis permanece normal', 'pequenos tubos de cerâmica foram enterrados entre as raízes', 'se a água desviada deve voltar às plantações ou abastecer um acampamento escondido'),
  ('lesedi', 2, 'o mestre-caravaneiro Samir, que perdeu a dianteira do comboio', 'um cofre de açafrão azul destinado ao Mercado que Nunca Dorme', 'o aroma da caravana está atraindo criaturas muito antes da passagem', 'sacos comuns foram perfurados e misturados a uma especiaria proibida', 'se a carga deve ser abandonada ou usada para descobrir quem armou a perseguição'),
  ('lesedi', 3, 'a pedreira Nádia, que conhece os sinais sob o arenito', 'um bloco solar coberto por inscrições anteriores ao reino', 'as escavações revelaram uma porta exatamente sob a área de trabalho', 'as marcas recentes sobre as inscrições imitam o símbolo de uma casa mercante', 'se a pedreira deve parar para preservar o templo ou abrir caminho para uma obra urgente'),
  ('lesedi', 4, 'o vidreiro Amon, mestre dos fornos de luz azul', 'uma lâmina de vidro de mana que não reflete a Estrela', 'o forno passou a produzir sombras sólidas junto com as peças', 'cada sombra repete o gesto de um aprendiz desaparecido', 'se o forno deve ser apagado ou mantido aceso para trazer o aprendiz de volta'),
  ('lesedi', 5, 'a arqueóloga Safiya, que segue os rastros metálicos na areia', 'uma carapaça dourada gravada com o mapa de ruínas soterradas', 'os escaravelhos mudaram a rota e avançam sobre um acampamento', 'o enxame evita apenas as pedras retiradas recentemente de uma tumba', 'se as pedras devem ser devolvidas ou usadas para afastar o enxame dos viajantes'),
  ('lesedi', 6, 'a mediadora Nur, que resolve disputas entre caravanas', 'um livro-caixa com compras feitas por alguém oficialmente morto', 'todos os lampiões se apagam ao redor da mesma banca', 'cada recibo leva a um vendedor diferente que jura nunca ter feito a venda', 'se o comprador deve ser exposto ou seguido para revelar uma rede maior'),
  ('lesedi', 7, 'a sacerdotisa Hessa, encarregada dos espelhos do templo', 'um espelho que concentra a luz em uma câmara lacrada', 'a Estrela de Mana deixou de iluminar o altar ao meio-dia', 'um dos espelhos foi virado para apontar além das muralhas', 'se o alinhamento deve ser restaurado ou seguido até quem recebe a luz roubada'),
  ('lesedi', 8, 'o ceramista Idris, capaz de ler histórias nas pinturas quebradas', 'uma ânfora monumental que parece intacta apenas ao entardecer', 'vozes surgem dentro dos vasos e repetem o nome de visitantes', 'fragmentos recém-colados mostram uma rota que não existe nos mapas atuais', 'se a ânfora deve ser aberta ou preservada até que todas as vozes sejam identificadas'),
  ('lesedi', 9, 'a perfumista Yasmin, guardiã das fórmulas da rota', 'ânforas de óleo de mirra azul destinadas a um rito funerário', 'carregamentos chegam com o lacre intacto e o perfume substituído por água', 'um rastro aromático invisível ao sol aparece sob a luz da lua', 'se a entrega deve seguir com o óleo restante ou ser usada para alcançar os falsificadores'),
  ('lesedi', 10, 'a guardiã Salma, que distribui água e remédios às famílias', 'folhas de mirra-da-areia que florescem apenas junto ao poço', 'as ervas estão murchando enquanto pessoas desconhecidas retiram água à noite', 'fibras medicinais e pegadas infantis levam a um abrigo fora da rota', 'se a pouca água deve salvar o jardim medicinal ou sustentar quem vive escondido no deserto'),

  ('namida', 1, 'a coralista Lumi, que lê a saúde das águas pelas cores', 'um ramo de coral violeta capaz de fechar pequenas fraturas', 'os terraços perderam a luz em um desenho circular', 'no centro do desenho há uma pérola quente e coberta de símbolos', 'se a pérola deve ser retirada ou mantida enquanto a escuridão se espalha'),
  ('namida', 2, 'o condutor Marin, responsável pelo trânsito entre os bairros', 'um cardume prateado que conhece correntes seguras', 'os peixes passaram a nadar contra a corrente e bloquear as embarcações', 'escamas deixadas nas paredes formam setas para um canal interditado', 'se o canal deve ser aberto ou os cardumes afastados para manter a cidade em movimento'),
  ('namida', 3, 'a vigia Talassa, que mede a pressão na antiga redoma', 'um medidor de cristal retirado da primeira torre', 'a torre registra impactos do lado de dentro da barreira', 'cada impacto coincide com a troca de turno de um mesmo guarda', 'se a redoma deve ser reforçada ou aberta para descobrir o que está preso entre as camadas'),
  ('namida', 4, 'a cultivadora Alga Íris, responsável pelas podas profundas', 'uma alga azul que produz ar quando tocada por luz', 'a floresta cresce sobre casas e prende moradores durante a noite', 'os caules evitam uma estátua recém-trazida do fundo', 'se a estátua deve ser devolvida ou as algas cortadas apesar da perda de oxigênio'),
  ('namida', 5, 'a musicista Concha Mira, afinadora da praça', 'uma concha que repete a voz de quem mente diante dela', 'as conchas começaram a cantar pedidos de socorro durante as celebrações', 'uma das vozes pertence a alguém presente na praça', 'se a cerimônia deve continuar para identificar a voz ou ser interrompida para evitar pânico'),
  ('namida', 6, 'o mergulhador Frio Neris, sobrevivente de uma corrente abissal', 'uma bússola de pressão que aponta para baixo', 'correntes geladas arrastam calor e luz dos bairros próximos', 'objetos desaparecidos voltam cobertos por areia de uma profundidade impossível', 'se a fenda deve ser fechada ou atravessada para procurar os desaparecidos'),
  ('namida', 7, 'a cuidadora Sora, protetora dos filhotes do berçário', 'um cavalo-marinho recém-nascido com marcas da antiga redoma', 'os animais adultos abandonam os tanques sempre que as luzes baixam', 'os filhotes seguem um som que só pode ser ouvido através das paredes', 'se o berçário deve ser evacuado ou usado para localizar a origem do chamado'),
  ('namida', 8, 'a camareira Pérola Iana, conhecedora das passagens reais', 'uma pérola de comando ausente da coroa cerimonial', 'portas do palácio se fecham diante de membros específicos da corte', 'grãos de nácar formam um caminho até aposentos inundados e proibidos', 'se o roubo deve ser anunciado ou investigado em segredo para preservar a sucessão'),
  ('namida', 9, 'o cartógrafo Claro Davi, que atualiza as rotas após cada maré', 'uma placa de orientação que aparece em dois pontos ao mesmo tempo', 'viajantes atravessam o túnel e retornam sem perceber ao início', 'bolhas presas ao teto repetem conversas de horas antes', 'se o túnel deve ser fechado ou percorrido ao contrário para quebrar o ciclo'),
  ('namida', 10, 'a guardiã Recife Maura, líder do posto exterior', 'um tridente de coral que desperta as defesas antigas', 'as estátuas dos Guardiões apontam suas armas para a cidade', 'marcas recentes no tridente correspondem às mãos de um recruta desaparecido', 'se as defesas devem ser destruídas ou reativadas sob novo comando'),

  ('skypiece', 1, 'a tecelã Aris, responsável pelos cabos da travessia', 'um fio de arco-íris que só existe durante a chuva', 'uma das cores desapareceu e a ponte perdeu estabilidade', 'fragmentos da cor ausente caem sobre uma ilha fora da rota', 'se a ponte deve ser fechada ou atravessada antes que a cor desapareça por completo'),
  ('skypiece', 2, 'o pedreiro Ciro, que talha quartzo sem quebrar sua levitação', 'um bloco branco que flutua contra o vento', 'pedras extraídas retornam sozinhas à parede durante a noite', 'marcas sob os blocos formam o contorno de uma porta gigantesca', 'se a extração deve continuar ou a porta ser libertada das rochas'),
  ('skypiece', 3, 'a mensageira Nuvem Lia, única a concluir a rota nesta semana', 'um marco de condensação usado para solidificar a estrada', 'trechos firmes se desfazem sob viajantes específicos', 'as falhas coincidem com selos de passagem emitidos pelo mesmo escrivão', 'se os viajantes devem ser detidos ou guiados por uma rota que ninguém testou'),
  ('skypiece', 4, 'o jardineiro Brumo, cultivador de plantas que bebem névoa', 'uma flor transparente capaz de revelar correntes de ar', 'a névoa rasteira está subindo e apagando construções inteiras da vista', 'as flores se inclinam para uma casa que não consta no registro da ilha', 'se a névoa deve ser dispersada ou usada para entrar na casa escondida'),
  ('skypiece', 5, 'a cristalógrafa Prisma, responsável pela torre de sinalização', 'um prisma translúcido que transmite mensagens entre ilhas', 'a torre envia pedidos de socorro que nenhuma ilha admite ter feito', 'uma resposta surge gravada no prisma antes de ser enviada', 'se a transmissão deve ser interrompida ou respondida para localizar a voz desconhecida'),
  ('skypiece', 6, 'o pastor Eólio, que conduz criaturas planadoras', 'uma pena alaranjada que permanece imóvel durante vendavais', 'os ventos mudaram e empurram rebanhos para fora da ilha', 'penas iguais formam um círculo ao redor de uma ruína descoberta', 'se os animais devem ser presos ou seguidos através da tempestade'),
  ('skypiece', 7, 'a astrônoma Aurora Cel, conselheira do palácio', 'um mapa celeste que reposiciona ilhas durante a madrugada', 'o palácio amanhece alguns metros mais baixo a cada dia', 'o mapa mostra uma ilha apagada sustentando as demais', 'se a ilha perdida deve ser procurada ou o palácio evacuado antes da próxima queda'),
  ('skypiece', 8, 'a celeireira Cora, responsável pelas reservas das ilhas', 'sementes leves guardadas em nuvens seladas', 'as nuvens de armazenamento começaram a chover grãos sobre o vazio', 'um pó azul nas comportas pertence ao Santuário do Cristal', 'se as reservas devem ser recolhidas agora ou seguidas até quem alterou as nuvens'),
  ('skypiece', 9, 'o monge Azul Nilo, protetor das lascas sagradas', 'um fragmento do Cristal Azul que vibra perto de corrupção', 'peregrinos adormecem diante do altar e compartilham o mesmo sonho', 'no sonho, alguém pede que o fragmento seja levado ao ancoradouro', 'se o cristal deve deixar o santuário ou os sonhadores devem ser despertados à força'),
  ('skypiece', 10, 'a ancoradora Vega, que registra a deriva de cada ilha', 'uma âncora celeste cuja corrente desaparece dentro das nuvens', 'ilhas menores estão soltando amarras sem qualquer rompimento', 'todas derivam para um ponto vazio marcado em mapas antigos', 'se as ilhas devem ser presas à força ou acompanhadas até o destino desconhecido')
), rank_profiles(rank, rank_opening) as (values
  ('E', 'A ocorrência ainda é localizada e permite conversar, observar e testar uma solução antes que alguém se machuque.'),
  ('D', 'Um segundo grupo chegou com interesses próprios, e qualquer demora pode transformar desconfiança em confronto.'),
  ('C', 'Várias pessoas dependem do desfecho, enquanto tempo e recursos já não permitem proteger todas as alternativas.'),
  ('B', 'A crise ameaça repercutir por todo o reino, e a Guilda espera liderança mesmo quando nenhuma escolha preserva tudo.')
), generated as (
  select
    mission.id,
    mission.rank,
    substring(mission.name from '.*: (.*)$') as location,
    substring(mission.slug from '-([0-9]{2})-[0-9]{2}$')::integer as action_index,
    profile.*,
    upper(left(profile.custodian, 1)) || substring(profile.custodian from 2) as custodian_cap,
    upper(left(profile.focus, 1)) || substring(profile.focus from 2) as focus_cap,
    rank_profile.rank_opening
  from public.v2_missions mission
  join location_profiles profile
    on profile.kingdom = mission.kingdom
   and profile.location_index = substring(mission.slug from '-[0-9]{2}-([0-9]{2})$')::integer
  join rank_profiles rank_profile on rank_profile.rank = mission.rank
  where mission.is_rank_trial = false
    and mission.created_by is null
    and mission.slug ~ '^(aokigahara|darkya|oymyakon|lesedi|namida|skypiece)-(e|d|c|b)-[0-9]{2}-[0-9]{2}$'
), rewritten as (
  select
    generated.id,
    case generated.action_index
      when 1 then format('Em %s, a Guilda recebeu um alerta. Segundo %s, %s. Durante a primeira ronda, %s. A patrulha precisa descobrir quem se beneficia do medo e decidir %s. %s', location, custodian, disruption, clue, dilemma, rank_opening)
      when 2 then format('Uma entrega deve chegar a %s para atender %s, e proteger %s, mas %s. No caminho, %s. A carga pode resolver a urgência, embora obrigue o grupo a decidir %s. %s', location, custodian, focus, disruption, clue, dilemma, rank_opening)
      when 3 then format('A pedido de %s, a Guilda deve obter %s em %s. A coleta se tornou perigosa porque %s. Além disso, %s. Retirar o recurso sem destruir o local exigirá decidir %s. %s', custodian, focus, location, disruption, clue, dilemma, rank_opening)
      when 4 then format('A Guilda deve escoltar %s, através de %s, junto de %s. A viagem seria discreta, porém %s. Quando %s, proteger o viajante também significa decidir %s. %s', custodian, location, focus, disruption, clue, dilemma, rank_opening)
      when 5 then format('A investigação em %s começa com o relato de %s: %s. A principal pista é inquietante: %s. Descobrir a causa exigirá confrontar versões diferentes e decidir %s. %s', location, custodian, disruption, clue, dilemma, rank_opening)
      when 6 then format('A Guilda recebeu o alerta de %s: pessoas sob sua responsabilidade desapareceram em %s enquanto tentavam proteger %s. Desde então, %s. A busca encontra uma pista concreta — %s — e obriga o grupo a decidir %s. %s', custodian, location, focus, disruption, clue, dilemma, rank_opening)
      when 7 then format('Uma ameaça precisa ser contida em %s: %s. Sob os cuidados de %s, está %s, enquanto %s. Impedir que o problema avance exigirá decidir %s. %s', location, disruption, custodian, focus, clue, dilemma, rank_opening)
      when 8 then format('%s desapareceu em %s durante a ocorrência em que %s. Segundo %s, sua recuperação é urgente, mas a busca revela que %s. Recuperar o objeto sem agravar o conflito exigirá decidir %s. %s', focus_cap, location, disruption, custodian, clue, dilemma, rank_opening)
      when 9 then format('A pedido de %s, a Guilda organiza uma vigília em %s para proteger %s. O posto está em alerta porque %s, e os primeiros sinais mostram que %s. Preparar a defesa exige decidir %s antes da chegada da ameaça. %s', custodian, location, focus, disruption, clue, dilemma, rank_opening)
      when 10 then format('Uma expedição a %s começou após um relato de %s: %s. O grupo deve localizar %s e interpretar uma pista inesperada: %s. A descoberta exigirá decidir %s. %s', location, custodian, disruption, focus, clue, dilemma, rank_opening)
    end as description,
    case generated.action_index
      when 1 then format('Na cena, patrulhe %s, use a pista local e encerre mostrando %s.', location, dilemma)
      when 2 then format('Na cena, atravesse %s com a carga, introduza o perigo — %s — e encerre com a entrega ou uma perda que tenha consequência.', location, disruption)
      when 3 then format('Na cena, procure o recurso em %s, mostre a dificuldade de obtê-lo sem dano e encerre decidindo %s.', location, dilemma)
      when 4 then format('Na cena, dê voz ao viajante durante a travessia de %s, apresente um perigo e encerre decidindo %s.', location, dilemma)
      when 5 then format('Na cena, interrogue envolvidos em %s, conecte as pistas a uma causa e encerre com uma prova, mostrando %s.', location, dilemma)
      when 6 then format('Na cena, siga os rastros em %s, revele o destino dos desaparecidos e encerre o resgate mostrando %s.', location, dilemma)
      when 7 then format('Na cena, mostre a ameaça avançando por %s, a reação dos moradores e a tentativa de contê-la enquanto o personagem decide %s.', location, dilemma)
      when 8 then format('Na cena, procure o objeto em %s, confronte quem o tomou ou protege e encerre com sua recuperação, renúncia ou troca.', location)
      when 9 then format('Na cena, prepare a defesa em %s, transforme a pista local em sinal de perigo e mostre o que foi protegido e a que preço.', location)
      when 10 then format('Na cena, explore %s, faça uma descoberta ligada ao conflito local e encerre decidindo %s.', location, dilemma)
    end as objective
  from generated
)
update public.v2_missions mission
set
  description = rewritten.description,
  objective = rewritten.objective,
  updated_at = now()
from rewritten
where mission.id = rewritten.id;

do $$
declare
  generated_count integer;
  rewritten_count integer;
begin
  select count(*) into generated_count
  from public.v2_missions
  where is_rank_trial = false
    and created_by is null
    and slug ~ '^(aokigahara|darkya|oymyakon|lesedi|namida|skypiece)-(e|d|c|b)-[0-9]{2}-[0-9]{2}$';

  select count(*) into rewritten_count
  from public.v2_missions
  where is_rank_trial = false
    and created_by is null
    and slug ~ '^(aokigahara|darkya|oymyakon|lesedi|namida|skypiece)-(e|d|c|b)-[0-9]{2}-[0-9]{2}$'
    and objective like 'Na cena,%';

  if generated_count <> 2400 or rewritten_count <> generated_count then
    raise exception 'Reescrita incompleta: % de % missões receberam direção de cena', rewritten_count, generated_count;
  end if;

  if exists (
    select 1
    from public.v2_missions
    where is_rank_trial = false
      and created_by is null
      and slug ~ '^(aokigahara|darkya|oymyakon|lesedi|namida|skypiece)-(e|d|c|b)-[0-9]{2}-[0-9]{2}$'
    group by description, objective
    having count(*) > 1
  ) then
    raise exception 'Ainda existem missões geradas com descrição e objetivo idênticos';
  end if;
end;
$$;

commit;
