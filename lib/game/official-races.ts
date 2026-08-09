import type { RacePayload } from "@/lib/game/races";

export interface OfficialRaceDefinition {
  name: string;
  slug: string;
  payload: RacePayload;
}

/**
 * Catálogo oficial enviado pelo fundador. Escalas diretas usam multiplicadores;
 * porcentagens continuam reservadas a bônus, reduções, resistências e condições.
 */
export const officialRaces = [
  {
    name: "Aengel",
    slug: "aengel",
    payload: {
      description:
        "Os Aengels são uma raça de suporte e proteção que recompensa planejamento, posicionamento e uso correto de suas habilidades. Eles acumulam Radiância ao ajudar aliados ou atingir inimigos com habilidades raciais, podendo gastar esse recurso para fortalecer seus poderes.\nApesar de serem naturalmente resistentes, não foram feitos para suportar todo o combate sozinhos. Seu verdadeiro potencial aparece quando alternam entre cura, proteção e julgamento.\n\nDescrição\nOs Aengels são descendentes da Luz Primordial, uma força celestial que existia antes mesmo da formação dos primeiros reinos de Wonderland. Segundo suas tradições, os primeiros Aengels foram enviados ao mundo como guardiões do equilíbrio, encarregados de impedir que as forças da criação e da destruição consumissem umas às outras.\nPossuem aparência predominantemente humana, mas são reconhecidos por suas asas, olhos luminosos e marcas douradas que percorrem o corpo. A quantidade, o formato e a coloração das asas variam conforme a linhagem. Alguns possuem penas brancas ou douradas, enquanto outros manifestam asas acinzentadas, azuladas ou completamente negras.\nSua sociedade valoriza disciplina, honra, responsabilidade e autocontrole. Muitos Aengels tornam-se guardiões, sacerdotes, juízes ou conselheiros. Entretanto, nem todos servem à mesma visão de justiça. Alguns protegem os mortais, outros acreditam que somente uma ordem absoluta poderá salvar Wonderland.\nPor serem descendentes da Luz, e não seres divinos perfeitos, Aengels podem cometer erros, abandonar suas ordens ou até mesmo se corromper.\n\nEstilo de Jogo\nFunção principal: Suporte e proteção;\nFunções secundárias: Controle e dano mágico;\nPontos fortes: Curas, escudos, proteção de aliados e versatilidade;\nPontos fracos: Depende de preparação e gerenciamento de Radiância;\nAtributos recomendados: ARC, RES, DEF e INT.\n\nCuriosidades\nAs asas dos Aengels refletem sua personalidade e sua linhagem, e não necessariamente sua bondade.\nAsas negras não significam corrupção. Elas podem representar luto, severidade, linhagens noturnas ou conexão com aspectos mais silenciosos da Luz.\nUm Aengel pode esconder suas asas, mas normalmente não consegue ocultar completamente suas marcas celestiais.\nSuas penas perdem o brilho quando são arrancadas e se desfazem lentamente em partículas luminosas.\nAengels não são imortais, embora envelheçam mais lentamente que os humanos.\nQuando um Aengel viola profundamente seus próprios juramentos, suas asas podem perder parte da cor ou da luminosidade.\nA sociedade Aengel não possui uma única interpretação de justiça. Essa diferença já provocou guerras entre suas próprias ordens.\nAlguns Aengels abandonam sua missão celestial para viver entre os mortais, sendo chamados de Desvinculados.\nA corrupção de um Aengel não é necessariamente permanente, assim como um Aengel considerado puro não está imune à crueldade.",
      imageUrl: "",
      difficulty: 4,
      baseHp: 450,
      baseMana: 100,
      attributeBonuses: {
        FOR: 1,
        DEF: 3,
        RES: 3,
        INI: 2,
        INT: 2,
        ARC: 4,
      },
      mechanics: [
        {
          name: "Radiância",
          description:
            "O Aengel pode acumular até 5 pontos de Radiância.\nEle recebe 1 ponto de Radiância quando:\nCura, protege com um escudo ou fortalece outro aliado;\nAtinge um inimigo com uma habilidade racial;\nAtiva uma habilidade racial de proteção em resposta a um ataque.\nO Aengel só pode receber 1 ponto de Radiância por turno, salvo quando uma habilidade determinar o contrário.\nA Radiância acumulada pode ser consumida para fortalecer determinadas habilidades. Todos os pontos desaparecem ao final do combate.",
        },
      ],
      traits: [
        {
          name: "Luz Celestial",
          description:
            "As curas e os escudos criados pelo Aengel são 10% mais eficientes.\nSempre que curar ou conceder um escudo a um aliado que esteja com menos de 50% do HP, o Aengel recebe 1 ponto adicional de Radiância.\nEsse ganho adicional só pode acontecer uma vez por rodada e não ultrapassa o limite máximo de Radiância.",
        },
        {
          name: "Asas da Vigília",
          description:
            "Quando um aliado receber dano, o Aengel poderá gastar 1 ponto de Radiância para redirecionar para si 25% do dano final que seria recebido pelo aliado.\nO dano redirecionado não pode ser reduzido novamente e não pode diminuir o HP do Aengel para menos de 1.\nTipo: Reação;\nLimite: Uma vez por rodada;\nCusto: 1 ponto de Radiância.\nFora de combate, suas asas permitem voar por curtas distâncias e alcançar locais elevados. Entretanto, elas não são resistentes o suficiente para viagens prolongadas carregando outras pessoas.",
        },
      ],
      progression: [
        {
          level: 1,
          title: "Toque da Alvorada",
          description:
            "O Aengel concentra a Luz Primordial e escolhe entre utilizá-la para conceder vida ou executar um julgamento.\nBenevolência\nCura um aliado em valor equivalente a 1x ARC do Aengel.\nAo gastar 1 ponto de Radiância, a cura passa a ser equivalente a 1,4x ARC.\nJulgamento\nAtinge um inimigo, causando dano mágico equivalente a:\n1x INT + 0,5x ARC\nAo gastar 1 ponto de Radiância, o alvo também fica Revelado por 2 turnos. Um alvo Revelado não pode ocultar sua presença por meios comuns, e ilusões criadas por ele tornam-se perceptíveis.\nTipo: Ativa;\nCusto: 25 de Mana;\nRecarga: 1 turno;\nAlcance: Um alvo;\nRadiância: Pode gastar 1 ponto.",
        },
        {
          level: 20,
          title: "Halo Protetor",
          description:
            "O Aengel cria um halo sobre um aliado, concedendo um escudo equivalente a 1,5x ARC por 2 turnos.\nEnquanto o escudo permanecer ativo, o alvo recebe 10% menos dano mágico.\nO Aengel pode gastar até 2 pontos de Radiância:\n1 ponto: O escudo passa a ser equivalente a 1,8x ARC;\n2 pontos: Um segundo aliado recebe um escudo equivalente a 0,8x ARC.\nTipo: Ativa;\nCusto: 40 de Mana;\nRecarga: 3 turnos;\nDuração: 2 turnos;\nRadiância: Pode gastar até 2 pontos.",
        },
        {
          level: 40,
          title: "Selo da Penitência",
          description:
            "O Aengel marca um inimigo com um selo celestial por 3 turnos.\nO alvo selado causa 15% menos dano. Sempre que ele causar dano a um aliado do Aengel, o portador do selo recebe dano mágico equivalente a 0,4x ARC.\nO dano do selo só pode ser ativado uma vez por turno.\nAo gastar 2 pontos de Radiância, a primeira habilidade canalizada pelo alvo durante o efeito será interrompida. Depois disso, o restante do selo continua funcionando normalmente.\nTipo: Ativa — Debuff;\nCusto: 50 de Mana;\nRecarga: 4 turnos;\nDuração: 3 turnos;\nRadiância: Pode gastar 2 pontos.",
        },
        {
          level: 60,
          title: "Chamado do Firmamento",
          description:
            "O Aengel abre suas asas e faz a luz celestial cair sobre o campo, curando todos os aliados em valor equivalente a 0,8x ARC.\nO Aengel pode consumir até 3 pontos de Radiância. Para cada ponto consumido, poderá escolher um aliado para receber um escudo equivalente a 0,6x ARC por 2 turnos.\nCaso consuma os 3 pontos, também poderá remover um efeito negativo de cada aliado protegido pelo escudo. Efeitos considerados absolutos ou incuráveis não podem ser removidos.\nTipo: Ativa — Cura coletiva;\nCusto: 80 de Mana;\nRecarga: 5 turnos;\nDuração dos escudos: 2 turnos;\nRadiância: Pode gastar até 3 pontos.",
        },
        {
          level: 80,
          title: "Veredito da Luz Primordial",
          description:
            "O Aengel reúne sua Radiância e profere um julgamento contra um inimigo.\nA habilidade exige pelo menos 3 pontos de Radiância e causa dano mágico equivalente a:\n1,6x INT + 1x ARC\nPara cada ponto de Radiância consumido, o dano aumenta em 0,2x ARC.\nEfeitos adicionais:\n3 pontos: O alvo recebe 20% menos cura por 2 turnos;\n4 pontos: O alvo também causa 15% menos dano por 2 turnos;\n5 pontos: O Veredito interrompe habilidades canalizadas e remove um benefício mágico do alvo.\nTodos os pontos de Radiância acumulados são consumidos.\nTipo: Ativa — Julgamento;\nCusto: 70 de Mana;\nRecarga: 5 turnos;\nRequisito: Pelo menos 3 pontos de Radiância.",
        },
        {
          level: 100,
          title: "Ascensão Serafínica",
          description:
            "O Aengel desperta temporariamente sua herança ancestral. Novas asas de luz surgem atrás de seu corpo, suas marcas celestiais tornam-se intensas e sua presença cobre o campo de batalha.\nAo ativar a transformação:\nRecupera HP equivalente a 1x ARC;\nRecebe imediatamente 3 pontos de Radiância;\nRemove de si um efeito negativo;\nRecebe um escudo equivalente a 1,5x ARC.\nDurante os próximos 3 turnos:\nSuas curas e seus escudos são 25% mais eficientes;\nO primeiro gasto de Radiância de cada turno é reduzido em 1 ponto;\nSempre que utilizar uma habilidade racial, o aliado com a menor porcentagem de HP recebe um escudo equivalente a 0,4x ARC;\nAsas da Vigília passa a redirecionar 40% do dano, em vez de 25%.\nAo final da transformação, o Aengel entra em Exaustão Celestial por 2 turnos. Durante esse período, não poderá gerar Radiância nem utilizar novamente a Ascensão.\nTipo: Transformação racial máxima;\nCusto: 120 de Mana;\nRecarga: Uma vez por combate;\nDuração: 3 turnos;\nExaustão: 2 turnos.",
        },
      ],
    },
  },
  {
    name: "Draconato",
    slug: "draconato",
    payload: {
      description:
        "Os Draconatos são combatentes híbridos capazes de alternar entre resistência, agressividade e grandes explosões de dano elemental. Sua principal mecânica é o Acúmulo Dracônico, que fortalece o personagem enquanto suas cargas são mantidas, mas também pode ser consumido para potencializar habilidades.\nDominar um Draconato exige saber quando preservar suas cargas para permanecer fortalecido e quando sacrificá-las para executar um ataque decisivo.\n\nDescrição\nOs Draconatos descendem dos Dragões Primordiais, criaturas ancestrais que dominavam os céus de Wonderland antes do surgimento dos primeiros reinos. Eles nasceram quando fragmentos da essência desses dragões se misturaram aos povos mortais, criando linhagens capazes de carregar parte de seu poder.\nPossuem corpos humanoides cobertos parcialmente por escamas, além de chifres, garras, presas e caudas. Alguns apresentam asas atrofiadas, enquanto indivíduos mais poderosos podem desenvolver asas funcionais. A cor das escamas normalmente está relacionada ao elemento herdado de sua linhagem.\nA cultura draconata valoriza força, honra, coragem e superação. Para eles, a verdadeira força não está apenas em derrotar o inimigo, mas em sobreviver às próprias fraquezas. Suas comunidades costumam ser organizadas em clãs, cada um descendente de um Dragão Primordial diferente.\nMuitos Draconatos tornam-se guerreiros, guardiões, conquistadores ou caçadores de criaturas colossais. Entretanto, também existem estudiosos que dedicam a vida a compreender sua herança e impedir que os antigos dragões retornem.\n\nEstilo de Jogo\nFunção principal: DPS físico ou mágico;\nFunções secundárias: Tanque e controle;\nPontos fortes: Resistência, dano explosivo e adaptação elemental;\nPontos fracos: Alto consumo de recursos e dependência de preparação;\nAtributos recomendados: FOR, RES, DEF e INT.\n\nLinhagem Elemental\nDurante a criação do personagem, o jogador deve escolher o elemento de sua linhagem dracônica. Essa escolha é permanente e altera os efeitos de suas habilidades raciais.\nLinhagem\nEfeito elemental\nFogo\nIncendeia o inimigo, causando dano durante os turnos seguintes.\nGelo\nReduz a INI e dificulta a movimentação do alvo.\nTrovão\nA eletricidade salta para um segundo inimigo ou causa dano adicional contra um alvo isolado.\nTerra\nConcede proteção ao Draconato após utilizar o elemento.\nVento\nAumenta a INI e permite reposicionamento após o ataque.\nVeneno\nEnfraquece as curas e regenerações recebidas pelo inimigo.\n\nA linhagem determina apenas a natureza elemental do Draconato. Ela não define sua personalidade, alinhamento ou cultura.\n\nCuriosidades\nDraconatos não são dragões em forma humana, mas descendentes mortais que carregam fragmentos de sua essência.\nA cor das escamas geralmente indica a linhagem elemental, mas misturas entre clãs podem produzir colorações incomuns.\nSeus chifres crescem lentamente durante toda a vida e são considerados símbolos de honra e experiência.\nQuebrar voluntariamente os próprios chifres é uma antiga forma de demonstrar vergonha, luto ou abandono de um clã.\nDraconatos conseguem consumir alimentos comuns, mas possuem grande preferência por carnes, minerais e comidas intensamente temperadas.\nAlguns dormem sobre coleções de objetos importantes, imitando inconscientemente o hábito dos dragões de proteger seus tesouros.\nO “tesouro” de um Draconato não precisa ser ouro. Pode ser uma coleção de armas, livros, lembranças ou qualquer coisa que considere preciosa.\nDraconatos de linhagens diferentes podem pertencer ao mesmo clã.\nO aparecimento de asas funcionais é raro e geralmente ocorre apenas após grande amadurecimento de sua essência ancestral.\nExistem rumores sobre Draconatos capazes de despertar dois elementos, mas essas histórias são tratadas como lendas ou presságios de uma possível calamidade.",
      imageUrl: "",
      difficulty: 5,
      baseHp: 650,
      baseMana: 50,
      attributeBonuses: {
        FOR: 5,
        DEF: 3,
        RES: 3,
        INI: 1,
        INT: 2,
        ARC: 1,
      },
      mechanics: [
        {
          name: "Acúmulo Dracônico",
          description:
            "O Draconato pode armazenar até 5 Cargas Dracônicas.\nEle recebe 1 carga quando:\nCausa dano direto com uma habilidade;\nRecebe de uma única fonte dano igual ou superior a 10% do seu HP máximo;\nAtiva uma habilidade racial defensiva.\nNormalmente, somente 1 Carga Dracônica pode ser obtida por turno.\nCada carga mantida concede:\n+2% de dano causado;\n2% de redução de dano recebido.\nCom 5 cargas, o Draconato recebe um total de 10% de aumento de dano e 10% de redução de dano. Entretanto, suas habilidades mais poderosas exigem que essas cargas sejam consumidas.\nTodas as cargas desaparecem ao final do combate.",
        },
      ],
      traits: [
        {
          name: "Escamas Ancestrais",
          description:
            "As escamas do Draconato reduzem em 8% o dano físico recebido.\nAlém disso, ele possui 20% de resistência contra o elemento correspondente à sua Linhagem Elemental.\nEssa resistência não concede imunidade aos efeitos secundários do elemento.",
        },
        {
          name: "Coração do Dragão",
          description:
            "A primeira vez em cada combate que o Draconato ficar com 50% ou menos do HP máximo, seu coração ancestral desperta.\nEle recebe imediatamente:\n2 Cargas Dracônicas;\n10% de aumento de FOR e INT por 2 turnos;\nRedução de 1 turno na duração de medo, intimidação ou efeitos semelhantes que estejam afetando-o.\nEsse efeito só pode ser ativado uma vez por combate.",
        },
      ],
      progression: [
        {
          level: 1,
          title: "Sopro Elemental",
          description:
            "O Draconato libera sua energia ancestral em uma poderosa rajada, atingindo até três inimigos próximos.\nO sopro causa dano elemental equivalente a:\n1,2x do maior atributo entre FOR e INT\nO Draconato pode consumir até 2 Cargas Dracônicas. Cada carga aumenta o dano em 0,2x do atributo utilizado.\nO ataque também aplica o efeito de sua linhagem:\nFogo: Causa 0,25x do atributo utilizado como dano adicional durante 2 turnos;\nGelo: Reduz a INI dos alvos em 20% durante 2 turnos;\nTrovão: O raio salta para um segundo alvo, causando 0,6x do dano original. Contra um único inimigo, causa 15% de dano adicional;\nTerra: O Draconato recebe um escudo equivalente a 0,6x RES;\nVento: O Draconato recebe 20% de INI e pode se reposicionar após o ataque;\nVeneno: Os alvos recebem 25% menos cura e regeneração durante 2 turnos.\nTipo: Ativa — Elemental;\nCusto: 35 de Mana;\nRecarga: 2 turnos;\nRadiância: Pode consumir até 2 Cargas Dracônicas.",
        },
        {
          level: 20,
          title: "Couraça do Ancestral",
          description:
            "O Draconato endurece suas escamas e assume uma postura defensiva por 2 turnos.\nDurante o efeito:\nRecebe 20% menos dano;\nNão pode ser derrubado ou deslocado por efeitos comuns;\nRecebe 1 Carga Dracônica ao ativar a habilidade.\nEle também pode consumir até 2 cargas adicionais. Para cada carga consumida, a redução de dano aumenta em 5%.\nCom duas cargas consumidas, a redução total chega a 30%.\nTipo: Ativa — Defensiva;\nCusto: 40 de Mana;\nRecarga: 4 turnos;\nDuração: 2 turnos;\nCargas: Gera 1 e pode consumir até 2.",
        },
        {
          level: 40,
          title: "Investida Tirânica",
          description:
            "O Draconato avança violentamente contra um inimigo, utilizando seus chifres, garras ou arma para golpeá-lo.\nCausa dano físico equivalente a:\n1,5x FOR\nSe o inimigo estiver sofrendo um efeito da Linhagem Elemental do Draconato, o ataque causa 0,3x FOR como dano adicional.\nO Draconato pode consumir 2 Cargas Dracônicas para quebrar a postura do alvo:\nReduz a DEF em 15% por 2 turnos;\nInterrompe habilidades canalizadas;\nDerruba o alvo caso ele já esteja afetado pelo elemento do Draconato.\nCriaturas muito maiores que o Draconato não podem ser derrubadas, mas ainda sofrem os demais efeitos.\nTipo: Ativa — Ataque físico;\nCusto: 45 de Mana;\nRecarga: 3 turnos;\nCargas: Pode consumir 2.",
        },
        {
          level: 60,
          title: "Rugido de Soberania",
          description:
            "O Draconato libera um rugido carregado com a autoridade dos Dragões Primordiais.\nTodos os inimigos afetados sofrem:\n15% de redução no dano causado;\n15% de redução de INI;\nIncapacidade de receber benefícios de coragem ou inspiração durante 2 turnos.\nO Draconato poderá escolher um dos inimigos afetados para receber a condição Desafiado. Durante 1 turno, esse inimigo causa 20% menos dano contra qualquer personagem que não seja o Draconato.\nO Draconato pode consumir até 3 Cargas Dracônicas. Para cada carga, a duração da redução de dano e INI aumenta em 1 turno para um inimigo escolhido.\nTipo: Ativa — Controle;\nCusto: 60 de Mana;\nRecarga: 5 turnos;\nCargas: Pode consumir até 3.",
        },
        {
          level: 80,
          title: "Cataclismo Elemental",
          description:
            "O Draconato concentra toda a força de sua linhagem e libera uma devastadora explosão elemental.\nA habilidade exige pelo menos 3 Cargas Dracônicas e atinge todos os inimigos em uma grande área, causando:\n1,8x do maior atributo entre FOR e INT\nPara cada carga consumida, o dano aumenta em 0,25x do atributo utilizado.\nO Cataclismo também fortalece o efeito da Linhagem Elemental:\nFogo: A queimadura causa 0,4x do atributo utilizado por 2 turnos;\nGelo: Os alvos perdem 30% de INI e não podem se reposicionar por 1 turno;\nTrovão: Cada alvo atingido libera um raio contra outro inimigo, causando 0,3x do dano original;\nTerra: O Draconato e o aliado com menor HP recebem um escudo equivalente a 1x RES;\nVento: Os alvos são afastados e o Draconato recebe 30% de INI por 2 turnos;\nVeneno: Os alvos recebem 40% menos cura e regeneração por 3 turnos.\nTodas as Cargas Dracônicas acumuladas são consumidas.\nTipo: Ativa — Explosão elemental;\nCusto: 90 de Mana;\nRecarga: 6 turnos;\nRequisito: Pelo menos 3 Cargas Dracônicas.",
        },
        {
          level: 100,
          title: "Avatar do Dragão Primordial",
          description:
            "O Draconato desperta a manifestação máxima de sua linhagem. Seu corpo aumenta, suas escamas tornam-se mais resistentes e grandes asas elementais surgem em suas costas.\nAo se transformar:\nRecupera HP equivalente a 15% do HP máximo;\nRecebe imediatamente 5 Cargas Dracônicas;\nRemove de si efeitos de medo, paralisia e intimidação;\nLibera uma explosão que causa 0,8x do maior atributo entre FOR e INT a todos os inimigos próximos.\nDurante os próximos 3 turnos:\nRecebe 20% de aumento de FOR e INT;\nSuas asas permitem que ele ignore obstáculos terrestres e efeitos comuns de imobilização;\nPode receber até 2 Cargas Dracônicas por turno;\nO Sopro Elemental tem sua recarga reduzida em 1 turno;\nO primeiro Sopro Elemental utilizado durante a transformação não consome Mana;\nConsumir cargas não remove imediatamente os bônus de dano e redução concedidos por elas. Esses bônus permanecem até o começo do próximo turno do Draconato.\nAo final da transformação, o Draconato entra em Exaustão Ancestral durante 2 turnos:\nNão pode gerar Cargas Dracônicas;\nCausa 10% menos dano;\nNão pode utilizar novamente o Avatar do Dragão Primordial.\nTipo: Transformação racial máxima;\nCusto: 120 de Mana;\nRecarga: Uma vez por combate;\nDuração: 3 turnos;\nExaustão: 2 turnos.",
        },
      ],
    },
  },
  {
    name: "Lobisomem",
    slug: "lobisomem",
    payload: {
      description:
        "Os Lobisomens são combatentes físicos agressivos que se tornam mais perigosos conforme são feridos. Seu estilo de jogo muda de acordo com a porcentagem de HP, alternando entre velocidade, poder ofensivo e sobrevivência.\nPossuem grande mobilidade, regeneração e capacidade de perseguir inimigos. Entretanto, precisam controlar cuidadosamente o próprio HP e escolher o momento certo para ceder aos instintos da fera.\n\nDescrição\nOs Lobisomens são descendentes dos primeiros mortais afetados pela Maldição da Lua, uma força ancestral cuja verdadeira origem permanece desconhecida. Algumas histórias afirmam que a maldição foi criada por uma divindade lunar; outras dizem que nasceu do sangue de uma criatura primordial.\nEm sua forma humana, podem parecer pessoas comuns, embora frequentemente apresentem olhos brilhantes, caninos acentuados, unhas resistentes e sentidos muito mais desenvolvidos. Quando revelam sua natureza, assumem uma forma lupina humanoide coberta por pelos, com garras, presas e força física monstruosa.\nSua cultura é construída ao redor do conceito de matilha. Para um Lobisomem, uma matilha não precisa ser formada por membros da mesma raça: qualquer pessoa reconhecida como família pode ocupar esse lugar.\nAlguns vivem em comunidades isoladas, enquanto outros escondem sua natureza entre os mortais. Embora sejam frequentemente tratados como monstros, a maioria dos Lobisomens é perfeitamente capaz de controlar seus instintos. Aqueles que se entregam completamente à maldição são conhecidos como Desvairados.\n\nEstilo de Jogo\nFunção principal: DPS físico;\nFunções secundárias: Perseguidor e resistente;\nPontos fortes: Mobilidade, regeneração, perseguição e dano físico;\nPontos fracos: Combate a distância, vulnerabilidade à prata e dependência do HP;\nAtributos recomendados: FOR, RES, INI e DEF.\n\nCuriosidades\nNem todo Lobisomem nasceu com a maldição. Alguns foram transformados por mordidas, rituais ou contato com relíquias lunares.\nLobisomens nascidos de outros Lobisomens costumam possuir maior controle sobre suas transformações.\nA lua cheia fortalece emoções e instintos, mas não obriga automaticamente um Lobisomem experiente a perder o controle.\nO pelo pode apresentar diferentes cores, padrões e marcas relacionadas à linhagem familiar.\nUma matilha pode incluir humanos, elfos, Aengels e membros de outras raças.\nO líder de uma matilha não é necessariamente o mais forte. Experiência, confiança e capacidade de proteção também são importantes.\nA mordida de um Lobisomem não transforma automaticamente outra pessoa. A transmissão depende da natureza da maldição e das condições da vítima.\nAlguns Lobisomens carregam amuletos de prata como demonstração de autocontrole e coragem.\nEles possuem temperatura corporal naturalmente elevada e necessitam de mais alimento que a maioria das raças.\nLobisomens conseguem reconhecer membros de sua matilha pelo cheiro, mesmo após muitos anos separados.",
      imageUrl: "",
      difficulty: 4,
      baseHp: 700,
      baseMana: 0,
      attributeBonuses: {
        FOR: 5,
        DEF: 2,
        RES: 4,
        INI: 3,
        INT: 0,
        ARC: 1,
      },
      mechanics: [
        {
          name: "Instinto da Fera",
          description:
            "No início de cada turno, o Lobisomem assume um estado instintivo de acordo com sua porcentagem atual de HP.\nSomente um estado pode permanecer ativo por vez.\nLobo à Espreita — Entre 71% e 100% do HP\nEnquanto estiver saudável, o Lobisomem prioriza velocidade e preparação.\nRecebe 15% de INI;\nSeu primeiro deslocamento não pode ser interrompido por reações comuns;\nO primeiro ataque racial que acertar um inimigo aplica Presa Marcada.\nFera em Caçada — Entre 31% e 70% do HP\nQuando está ferido, seus instintos ofensivos tornam-se mais intensos.\nCausa 12% mais dano físico;\nCausa 10% de dano adicional contra sua Presa Marcada;\nAo derrubar a Presa Marcada, recupera 5% do HP máximo.\nA recuperação só pode acontecer uma vez por turno.\nFera Acuada — Entre 1% e 30% do HP\nÀ beira da morte, o instinto de sobrevivência assume o controle.\nRecebe 15% menos dano;\nSua regeneração natural é duplicada;\nEfeitos de medo e intimidação têm sua duração reduzida em 1 turno.\nOs estados são atualizados no início do turno. Receber cura ou dano durante o próprio turno não altera o estado até o começo do turno seguinte.\nCondição — Presa Marcada\nO Lobisomem pode manter apenas uma Presa Marcada por vez.\nDurante 3 turnos:\nO Lobisomem consegue rastrear o cheiro e a direção do alvo;\nOcultação comum não interrompe a perseguição;\nAlgumas habilidades raciais recebem efeitos adicionais contra a Presa.\nMarcar um novo inimigo remove a marca anterior.",
        },
      ],
      traits: [
        {
          name: "Regeneração Licantropa",
          description:
            "No início de cada turno, o Lobisomem recupera 3% do HP máximo.\nNa condição Fera Acuada, a recuperação aumenta para 6% do HP máximo.\nA regeneração é interrompida por 2 turnos quando o Lobisomem recebe dano causado por uma arma de prata alquímica.\nEfeitos comuns de redução de cura também diminuem a Regeneração Licantropa.",
        },
        {
          name: "Faro Sobrenatural",
          description:
            "O Lobisomem possui olfato e audição extremamente desenvolvidos.\nFora de combate, consegue:\nRastrear criaturas pelo cheiro;\nPerceber sangue, venenos e odores incomuns;\nIdentificar aproximadamente quantas criaturas passaram por determinado local;\nReconhecer pessoas com quem já teve contato próximo.\nDurante o combate:\nRecebe 10% de INI quando enfrenta um inimigo com menos de 50% do HP;\nSua Presa Marcada não pode esconder sua presença por meios comuns;\nIlusões ainda podem enganá-lo visualmente, mas não reproduzem perfeitamente odores.\nFraqueza Racial — Prata Alquímica\nArmas revestidas ou forjadas com prata alquímica são capazes de atravessar as defesas sobrenaturais do Lobisomem.\nAtaques realizados com esse material:\nIgnoram 15% da DEF do Lobisomem;\nInterrompem a Regeneração Licantropa por 2 turnos;\nImpedem que ele remova sangramentos por meios raciais durante esse período.\nPrata comum não produz esses efeitos. O material precisa ser preparado por um alquimista ou ferreiro especializado.",
        },
      ],
      progression: [
        {
          level: 1,
          title: "Garras do Predador",
          description:
            "O Lobisomem ataca um inimigo com suas garras, causando dano físico equivalente a:\n1,3x FOR\nO inimigo atingido torna-se sua Presa Marcada durante 3 turnos.\nCaso o alvo já seja a Presa Marcada, o ataque causa 0,3x FOR como dano adicional e aplica Sangramento equivalente a 0,2x FOR durante 2 turnos.\nO Sangramento não se acumula, mas sua duração pode ser renovada.\nTipo: Ativa — Ataque físico;\nCusto: Não possui;\nRecarga: 1 turno;\nDuração da marca: 3 turnos.",
        },
        {
          level: 20,
          title: "Salto Predatório",
          description:
            "O Lobisomem salta em direção a um inimigo, ignorando obstáculos terrestres comuns, e causa dano físico equivalente a:\n1,1x FOR\nContra a Presa Marcada, o ataque causa 0,4x FOR como dano adicional.\nApós acertar a Presa Marcada, o Lobisomem pode escolher um dos efeitos:\nDerrubar o alvo;\nReduzir a DEF do alvo em 15% até o próximo ataque recebido;\nReposicionar-se imediatamente após o golpe.\nCriaturas muito maiores não podem ser derrubadas, mas ainda podem sofrer a redução de DEF.\nTipo: Ativa — Mobilidade e ataque;\nCusto: Não possui;\nRecarga: 3 turnos.",
        },
        {
          level: 40,
          title: "Uivo da Matilha",
          description:
            "O Lobisomem libera um poderoso uivo, despertando os instintos de seus companheiros.\nDurante 2 turnos, ele e seus aliados recebem:\n15% de resistência contra medo e intimidação;\n10% de aumento de dano contra a Presa Marcada;\n15% de INI enquanto estiverem se aproximando ou atacando a Presa.\nAo ser ativado, o Uivo também remove um efeito comum de medo do Lobisomem e de um aliado escolhido.\nCaso esteja lutando sem aliados, o Lobisomem recebe também 10% de redução de dano durante a duração.\nTipo: Ativa — Fortalecimento coletivo;\nCusto: Não possui;\nRecarga: 5 turnos;\nDuração: 2 turnos.",
        },
        {
          level: 60,
          title: "Regeneração Monstruosa",
          description:
            "O Lobisomem força seu organismo a reconstruir rapidamente seus ferimentos.\nRecupera:\n15% do HP máximo + 0,8x RES\nA habilidade também remove um efeito comum de Sangramento ou Veneno.\nO efeito muda conforme o Instinto da Fera:\nLobo à Espreita: Recebe 20% de INI por 1 turno;\nFera em Caçada: Seu próximo ataque causa 0,25x FOR como dano adicional;\nFera Acuada: A cura aumenta para 25% do HP máximo + 0,8x RES.\nA habilidade não pode ser utilizada enquanto a Regeneração Licantropa estiver interrompida por prata alquímica.\nTipo: Ativa — Regeneração;\nCusto: Não possui;\nRecarga: 5 turnos.",
        },
        {
          level: 80,
          title: "Frenesi da Lua Sangrenta",
          description:
            "O Lobisomem abandona momentaneamente suas limitações e desfere três ataques consecutivos.\nCada golpe causa:\n0,7x FOR como dano físico\nContra a Presa Marcada, cada golpe causa 0,8x FOR.\nO efeito adicional depende da condição atual:\nLobo à Espreita: O primeiro golpe não pode ser evitado por reações comuns;\nFera em Caçada: O último golpe causa 0,3x FOR como dano adicional;\nFera Acuada: O Lobisomem recupera HP equivalente a 20% do dano total causado.\nSe a Presa Marcada for derrubada durante o Frenesi, a recarga do Salto Predatório é imediatamente encerrada.\nTipo: Ativa — Ataque múltiplo;\nCusto: Não possui;\nRecarga: 5 turnos.",
        },
        {
          level: 100,
          title: "Avatar da Lua Cheia",
          description:
            "O Lobisomem entrega-se temporariamente ao poder máximo da Maldição da Lua, assumindo uma forma lupina colossal.\nAo se transformar:\nRecupera 15% do HP máximo;\nRemove efeitos comuns de medo, veneno e imobilização;\nEscolhe um inimigo para se tornar sua Presa Marcada;\nLibera um uivo que reduz em 15% o dano causado pela Presa durante 2 turnos.\nDurante os próximos 3 turnos:\nRecebe 20% de FOR;\nRecebe 15% de RES e INI;\nA Regeneração Licantropa recupera 6% do HP máximo em qualquer estado;\nNa condição Fera Acuada, a regeneração aumenta para 10%;\nGarras do Predador causa 0,3x FOR como dano adicional;\nSalto Predatório tem sua recarga reduzida em 1 turno;\nDerrubar a Presa Marcada permite marcar imediatamente outro inimigo.\nA primeira vez que receber um dano que reduziria seu HP a 0 durante a transformação, o Lobisomem permanece com 1 de HP, recupera 10% do HP máximo e a transformação termina imediatamente.\nEsse efeito de sobrevivência não pode ser ativado se o dano tiver sido causado por prata alquímica.\nAo final da transformação, o Lobisomem entra em Exaustão Lunar por 2 turnos:\nSua Regeneração Licantropa fica desativada;\nSua INI é reduzida em 15%;\nNão pode utilizar novamente o Avatar da Lua Cheia.\nTipo: Transformação racial máxima;\nCusto: Não possui;\nRecarga: Uma vez por combate;\nDuração: 3 turnos;\nExaustão: 2 turnos.",
        },
      ],
    },
  },
  {
    name: "Kitsune",
    slug: "kitsune",
    payload: {
      description:
        "Os Kitsunes são especialistas em ilusões, manipulação e controle do campo de batalha. Em vez de vencer pela força bruta, eles acumulam Fios de Engano sobre os inimigos e combinam suas próprias habilidades para provocar diferentes colapsos mentais.\nPossuem grande mobilidade, Mana elevada e inúmeras possibilidades estratégicas. Entretanto, têm pouco HP e exigem planejamento para sobreviver e alcançar seu verdadeiro potencial.\n\nDescrição\nOs Kitsunes são espíritos ancestrais que adquiriram forma física após séculos absorvendo a energia mágica de Wonderland. Embora possam assumir diferentes aparências, são facilmente reconhecidos por suas orelhas de raposa, olhos brilhantes e caudas espirituais.\nCada cauda representa o amadurecimento de sua alma. Kitsunes jovens normalmente manifestam apenas uma, enquanto os mais antigos podem alcançar as lendárias nove caudas. O surgimento de uma nova cauda não depende somente de idade ou poder, mas também de experiências, conhecimento e desenvolvimento espiritual.\nSua cultura valoriza inteligência, liberdade, curiosidade e domínio emocional. Histórias, segredos e promessas são tratados como verdadeiros tesouros. Muitos vivem como conselheiros, artistas, investigadores, comerciantes ou guardiões de conhecimentos esquecidos.\nApesar de serem frequentemente vistos como trapaceiros, nem todos utilizam seus poderes com crueldade. Alguns empregam ilusões para proteger pessoas, esconder lugares sagrados ou revelar verdades que os olhos comuns seriam incapazes de enxergar.\n\nEstilo de Jogo\nFunção principal: Controle e dano mágico;\nFunções secundárias: Suporte, infiltração e manipulação;\nPontos fortes: Ilusões, debuffs, mobilidade e combos;\nPontos fracos: HP baixo, pouca defesa física e dependência de preparação;\nAtributos recomendados: INT, INI e ARC.\n\nCuriosidades\nCada nova cauda representa o amadurecimento espiritual do Kitsune, não apenas seu poder.\nUma nova cauda pode surgir após uma grande descoberta, perda, promessa ou transformação emocional.\nKitsunes muito habilidosos conseguem esconder todas as suas caudas, mas emoções intensas podem fazê-las reaparecer.\nAs chamas Kitsunebi não são fogo comum. Elas queimam Mana, espírito e percepção.\nKitsunes costumam guardar nomes verdadeiros em segredo, pois acreditam que nomes carregam parte da essência de uma pessoa.\nPresentear um Kitsune com uma história que ele nunca ouviu é considerado uma grande demonstração de respeito.\nEles raramente quebram promessas feitas voluntariamente, mas são conhecidos por interpretar as palavras de maneira inesperada.\nNem todo Kitsune é brincalhão ou manipulador. Alguns são extremamente sérios e tratam ilusões como uma arte sagrada.\nA forma de raposa pode variar desde o tamanho de um animal comum até uma grande criatura espiritual.\nKitsunes de nove caudas são extremamente raros. Muitos passam a vida inteira sem encontrar um.\nAlgumas culturas os tratam como mensageiros divinos, enquanto outras os caçam por medo de seus poderes.\nAs caudas são extremamente sensíveis, e tocá-las sem permissão é considerado uma grave invasão de intimidade.",
      imageUrl: "",
      difficulty: 5,
      baseHp: 300,
      baseMana: 200,
      attributeBonuses: {
        FOR: 0,
        DEF: 1,
        RES: 2,
        INI: 4,
        INT: 5,
        ARC: 3,
      },
      mechanics: [
        {
          name: "Fios de Engano",
          description:
            "As habilidades raciais do Kitsune aplicam Fios de Engano sobre os inimigos.\nCada alvo pode acumular até 3 Fios de Engano. Ao alcançar o terceiro fio, o Kitsune pode consumir todos eles para provocar um dos seguintes Colapsos Ilusórios:\nRuptura\nA ilusão se rompe violentamente dentro da mente do alvo, causando dano mágico equivalente a:\n0,8x INT\nDúvida\nO alvo deixa de confiar nos próprios sentidos. A próxima habilidade ofensiva utilizada por ele causa 25% menos dano.\nO efeito dura até 2 turnos caso o alvo não ataque.\nDesorientação\nO alvo perde completamente a noção de espaço e tempo:\nPerde 25% de INI;\nNão pode utilizar reações;\nNão pode realizar reposicionamentos voluntários.\nO efeito dura 1 turno.\nCada inimigo só pode sofrer um Colapso Ilusório por rodada. Depois que o colapso é ativado, todos os Fios de Engano daquele alvo são removidos.\nOs fios duram 3 turnos, e aplicar um novo fio renova a duração de todos os anteriores.\nLimitações das Ilusões\nAs ilusões dos Kitsunes manipulam sentidos, emoções e percepção, mas não concedem controle absoluto sobre a mente.\nCriaturas sem consciência não podem sofrer Fascinação ou Dúvida;\nAlvos sem sentidos comuns ainda podem ser atingidos pelo dano mágico das chamas;\nVisão verdadeira permite identificar uma ilusão, mas não desfaz automaticamente seus efeitos mágicos;\nSofrer dano pode romper determinadas formas de Fascinação;\nChefes e criaturas colossais podem resistir a controles completos, recebendo versões reduzidas dos efeitos.",
        },
      ],
      traits: [
        {
          name: "Mente dos Nove Véus",
          description:
            "O Kitsune possui grande resistência contra manipulação mental.\nRecebe 20% de resistência contra medo, encanto e ilusões;\nA duração desses efeitos é reduzida em 1 turno;\nConsegue perceber pequenas falhas em ilusões comuns após observá-las atentamente.\nA primeira vez em cada combate que o Kitsune resistir ou escapar de um efeito mental, o responsável pelo efeito recebe 1 Fio de Engano.",
        },
        {
          name: "Passos Entre Véus",
          description:
            "Sempre que provocar um Colapso Ilusório, o Kitsune poderá se reposicionar sem consumir uma ação.\nApós o reposicionamento, recebe 20% de INI até o início do próximo turno.\nEsse efeito só pode acontecer uma vez por rodada.",
        },
        {
          name: "Metamorfose Vulpar",
          description:
            "Por serem espíritos ancestrais, Kitsunes podem alterar sua aparência.\nEles podem assumir três formas:\nUma aparência humanoide;\nUma forma híbrida com orelhas e caudas;\nUma forma de raposa.\nA transformação altera tamanho, voz, cheiro e características físicas, mas não concede atributos adicionais em combate.\nO Kitsune também pode criar alterações menores, como mudar cor dos olhos, cabelo, roupas aparentes ou traços do rosto. Danos graves, inconsciência ou efeitos que anulam magia podem revelar sua verdadeira forma.",
        },
      ],
      progression: [
        {
          level: 1,
          title: "Kitsunebi: Chama do Engano",
          description:
            "O Kitsune conjura uma chama espiritual e a lança contra um inimigo, causando dano mágico equivalente a:\n1,1x INT + 0,4x ARC\nO alvo recebe 1 Fio de Engano.\nCaso a habilidade aplique o terceiro fio e provoque Ruptura, o dano do Colapso aumenta de 0,8x para 1,1x INT.\nA chama pode assumir qualquer coloração escolhida pelo Kitsune, mas isso não modifica seu efeito.\nTipo: Ativa — Dano mágico;\nCusto: 30 de Mana;\nRecarga: 1 turno;\nFios: Aplica 1.",
        },
        {
          level: 20,
          title: "Reflexos da Raposa",
          description:
            "O Kitsune cria duas cópias ilusórias de si mesmo durante 2 turnos.\nEnquanto as cópias estiverem presentes:\nO primeiro ataque de alvo único contra o Kitsune tem seu dano reduzido em 50%;\nO segundo ataque de alvo único tem seu dano reduzido em 25%;\nCada ataque reduzido destrói uma das cópias;\nO atacante recebe 1 Fio de Engano sempre que destruir uma cópia.\nAtaques em área não têm o dano reduzido e destroem uma das cópias imediatamente.\nO Kitsune pode gastar 30 de Mana adicional para criar uma terceira cópia. Ela reduz em 25% o dano de um terceiro ataque.\nTipo: Ativa — Ilusão defensiva;\nCusto: 50 de Mana;\nCusto adicional: 30 de Mana;\nRecarga: 4 turnos;\nDuração: 2 turnos.",
        },
        {
          level: 40,
          title: "Sussurro Enfeitiçado",
          description:
            "O Kitsune invade suavemente os pensamentos de um inimigo e implanta uma falsa sensação de confiança.\nO alvo recebe 1 Fio de Engano e fica Fascinado durante 1 turno.\nEnquanto estiver Fascinado:\nNão pode escolher o Kitsune como alvo principal de uma habilidade ofensiva de alvo único;\nCausa 15% menos dano contra os aliados do Kitsune;\nNão pode realizar ataques de oportunidade contra o Kitsune.\nA Fascinação termina imediatamente caso o Kitsune cause dano direto ao alvo.\nSe o Sussurro aplicar o terceiro Fio de Engano, o Kitsune pode consumir os fios para dar um comando simples ao alvo, como:\nAfaste-se;\nAproxime-se;\nSolte o objeto que está segurando;\nOlhe em outra direção;\nInterrompa sua movimentação.\nO comando não pode obrigar o alvo a atacar, ferir a si mesmo ou realizar uma ação suicida.\nContra criaturas imunes à Fascinação, a habilidade apenas reduz o dano causado em 15% e aplica o Fio de Engano.\nTipo: Ativa — Encantamento;\nCusto: 55 de Mana;\nRecarga: 4 turnos;\nDuração: 1 turno;\nFios: Aplica 1.",
        },
        {
          level: 60,
          title: "Labirinto de Espelhos",
          description:
            "O Kitsune transforma o campo em um labirinto de imagens, caminhos falsos e reflexos distorcidos durante 3 turnos.\nAo ativar a habilidade, todos os inimigos recebem 1 Fio de Engano.\nEnquanto o Labirinto permanecer ativo:\nInimigos perdem 20% de INI;\nO primeiro ataque causado por cada inimigo durante seu turno causa 15% menos dano;\nInimigos não podem impedir o reposicionamento do Kitsune por reações comuns;\nSempre que um inimigo atacar uma ilusão, recebe outro Fio de Engano.\nCada inimigo só pode receber 1 Fio adicional por rodada através do Labirinto.\nCriaturas que identificarem a ilusão deixam de sofrer a redução de INI, mas continuam vendo os reflexos e caminhos falsos até o término da habilidade.\nTipo: Ativa — Controle de campo;\nCusto: 85 de Mana;\nRecarga: 6 turnos;\nDuração: 3 turnos.",
        },
        {
          level: 80,
          title: "Dança das Chamas Errantes",
          description:
            "O Kitsune invoca diversas chamas espirituais que perseguem todos os inimigos no campo.\nCada inimigo atingido recebe dano mágico equivalente a:\n1,5x INT + 0,7x ARC\nApós causar o dano, o Kitsune pode consumir todos os Fios de Engano presentes nos alvos.\nPara cada fio consumido, o inimigo recebe dano adicional equivalente a 0,25x INT.\nCaso sejam consumidos 3 fios do mesmo inimigo, o Kitsune escolhe um efeito adicional:\nIncêndio Espiritual: Causa 0,4x INT durante 2 turnos;\nMente Fragmentada: O próximo ataque do alvo causa 30% menos dano;\nVéu Rompido: O alvo perde 20% da RES contra dano mágico durante 2 turnos.\nConsumir os fios dessa maneira não ativa um Colapso Ilusório comum.\nTipo: Ativa — Explosão mágica;\nCusto: 100 de Mana;\nRecarga: 6 turnos;\nFios: Consome todos os fios dos alvos.",
        },
        {
          level: 100,
          title: "Manifestação das Nove Caudas",
          description:
            "O Kitsune desperta temporariamente a forma máxima de sua alma. Nove caudas espirituais surgem atrás de seu corpo enquanto inúmeras chamas e ilusões cobrem o campo de batalha.\nAo se transformar:\nRecebe 20% de INT, ARC e INI;\nCria imediatamente três cópias de Reflexos da Raposa;\nTodos os inimigos recebem 1 Fio de Engano;\nRemove de si um efeito de medo, encanto ou confusão.\nDurante os próximos 3 turnos:\nHabilidades raciais aplicam 2 Fios de Engano em vez de 1;\nAo provocar um Colapso Ilusório, o Kitsune pode escolher dois efeitos diferentes;\nPassos Entre Véus pode ser ativado duas vezes por rodada;\nA primeira habilidade racial utilizada em cada turno custa 30% menos Mana;\nInimigos não podem esconder sua presença do Kitsune por meios comuns.\nO mesmo efeito de Colapso não pode ser escolhido duas vezes na mesma ativação.\nQuando a transformação termina, cada inimigo ainda afetado por Fios de Engano recebe dano mágico equivalente a 0,4x INT por fio acumulado. Depois disso, todos os fios são removidos.\nO Kitsune entra em Exaustão Espiritual por 2 turnos:\nNão pode aplicar Fios de Engano;\nPerde 15% de INI;\nNão pode utilizar novamente a Manifestação das Nove Caudas.\nTipo: Transformação racial máxima;\nCusto: 150 de Mana;\nRecarga: Uma vez por combate;\nDuração: 3 turnos;\nExaustão: 2 turnos.",
        },
      ],
    },
  },
  {
    name: "Leonis",
    slug: "leonis",
    payload: {
      description:
        "Os Leonis são combatentes de linha de frente que unem força física, liderança e proteção coletiva. Seu potencial aumenta quando lutam ao lado de aliados escolhidos como membros de seu bando.\nSeu estilo de jogo envolve ataques coordenados, proteção por reação e gerenciamento de Bravura. São mais simples que raças como Kitsune e Draconato, mas ainda exigem atenção ao posicionamento e às ações dos companheiros.\n\nDescrição\nOs Leonis descendem dos Leões do Primeiro Sol, grandes feras espirituais que protegiam as planícies de Wonderland antes da formação dos primeiros reinos. Quando essas criaturas desapareceram, parte de sua essência permaneceu entre os povos mortais, dando origem aos primeiros Leonis.\nPossuem corpos humanoides com características felinas: garras, presas, caudas, orelhas e pelos que podem variar entre tons dourados, castanhos, brancos, avermelhados ou negros. Muitos desenvolvem jubas, mas seu tamanho e formato não estão relacionados ao gênero, e sim à linhagem e à maturidade.\nA cultura Leonis valoriza coragem, lealdade, responsabilidade e proteção da comunidade. Para eles, força sem propósito não passa de violência. Um verdadeiro líder deve ser capaz de caminhar à frente de seu povo e assumir os riscos de suas próprias decisões.\nEmbora muitos sejam guerreiros, guardiões ou comandantes, os Leonis também são conhecidos como diplomatas, contadores de histórias e preservadores de tradições. Seus líderes não são necessariamente escolhidos por sangue: respeito e confiança precisam ser conquistados.\n\nEstilo de Jogo\nFunção principal: Combatente físico;\nFunções secundárias: Tanque e suporte ofensivo;\nPontos fortes: Liderança, proteção, ataques coordenados e resistência;\nPontos fracos: Menor eficiência quando isolado e poucas opções de longo alcance;\nAtributos recomendados: FOR, DEF, RES e ARC.\n\nCuriosidades\nA juba dos Leonis não está relacionada ao gênero. Alguns possuem grandes jubas, enquanto outros não desenvolvem nenhuma.\nAs jubas podem ser trançadas, tingidas ou decoradas para representar feitos importantes.\nLeonis costumam registrar sua história por meio de músicas, cicatrizes, joias e histórias recitadas.\nTocar a juba de um Leonis sem permissão é considerado um gesto extremamente desrespeitoso.\nUm bando Leonis pode incluir membros de qualquer raça.\nPara eles, abandonar um companheiro por covardia é uma das piores formas de desonra.\nDesafiar um líder não é necessariamente um crime. O desafio pode ser aceito como parte legítima da cultura.\nNem todos os conflitos de liderança são resolvidos em combate. Debates públicos e provas de sabedoria também são comuns.\nLeonis enxergam bem em ambientes pouco iluminados, mas não em escuridão completa.\nSeus rugidos podem ser ouvidos a grandes distâncias e são utilizados para transmitir alertas.\nLeonis de pelagem branca são raros e frequentemente associados a presságios ou antigas linhagens.\nMuitos Leonis escolhem um objeto para representar seu bando, como um estandarte, medalhão ou fragmento de arma.",
      imageUrl: "",
      difficulty: 3,
      baseHp: 600,
      baseMana: 0,
      attributeBonuses: {
        FOR: 4,
        DEF: 3,
        RES: 3,
        INI: 2,
        INT: 1,
        ARC: 2,
      },
      mechanics: [
        {
          name: "Vínculo do Bando",
          description:
            "No início de cada combate, o Leonis pode escolher até dois aliados como seus Companheiros do Bando.\nO vínculo permanece até o final do combate ou até que o Leonis fique inconsciente.\nQuando um membro do bando ataca um inimigo que já foi atingido por outro membro durante a mesma rodada, realiza um Ataque Coordenado e causa 10% de dano adicional.\nCada membro só pode receber esse bônus uma vez por rodada.\nO próprio Leonis é considerado um membro do bando, mas não pode substituir os Companheiros escolhidos durante o combate.\nRecurso Racial — Bravura\nO Leonis pode acumular até 3 pontos de Bravura e começa cada combate com 1 ponto.\nEle recebe 1 ponto quando:\nUm Companheiro do Bando fica com menos de 50% do HP por causa de um ataque inimigo;\nProtege um companheiro utilizando uma habilidade racial;\nResiste a medo ou intimidação;\nAtinge um inimigo que tenha ferido um de seus companheiros desde seu último turno.\nNormalmente, o Leonis só pode receber 1 ponto de Bravura por rodada.\nA Bravura acumulada pode ser utilizada para fortalecer rugidos, proteger aliados ou organizar ataques coletivos. Todos os pontos desaparecem ao final do combate.",
        },
      ],
      traits: [
        {
          name: "Coração Indomável",
          description:
            "O Leonis possui grande resistência contra efeitos que tentam abalar sua coragem.\nRecebe 25% de resistência contra medo e intimidação;\nA duração desses efeitos é reduzida em 1 turno;\nAo resistir completamente a um desses efeitos, recebe 1 ponto de Bravura.\nA Bravura concedida por esta passiva respeita o limite de uma geração por rodada.",
        },
        {
          name: "Presença do Soberano",
          description:
            "Enquanto puderem ver ou ouvir o Leonis, seus Companheiros do Bando recebem:\n15% de resistência contra medo e intimidação;\n10% de redução contra o primeiro dano recebido em cada rodada.\nA redução não se acumula caso existam vários Leonis no mesmo grupo. Se o Leonis ficar inconsciente, os benefícios são suspensos até que ele desperte.",
        },
      ],
      progression: [
        {
          level: 1,
          title: "Garra do Regente",
          description:
            "O Leonis golpeia um inimigo com suas garras, sua arma ou um ataque corporal, causando dano físico equivalente a:\n1,4x FOR\nSe o alvo tiver causado dano a um Companheiro do Bando desde o último turno do Leonis, o ataque causa 0,3x FOR como dano adicional.\nAo atingir um inimigo nessas condições, o Leonis recebe 1 ponto de Bravura.\nTipo: Ativa — Ataque físico;\nCusto: Não possui;\nRecarga: 1 turno;\nBravura: Pode gerar 1 ponto.",
        },
        {
          level: 20,
          title: "Rugido Encorajador",
          description:
            "O Leonis libera um rugido poderoso que restaura a coragem de seu bando.\nDurante 2 turnos, o Leonis e seus Companheiros recebem:\n15% de INI;\n10% de aumento no dano causado;\n20% de resistência adicional contra medo.\nO Leonis pode gastar 1 ponto de Bravura para também remover um efeito comum de medo ou intimidação de todos os membros afetados.\nSe nenhum membro estiver sob esses efeitos, o ponto pode ser utilizado para conceder a cada um um escudo equivalente a:\n0,5x ARC + 0,3x RES do Leonis\nTipo: Ativa — Fortalecimento;\nCusto: Não possui;\nRecarga: 4 turnos;\nDuração: 2 turnos;\nBravura: Pode consumir 1 ponto.",
        },
        {
          level: 40,
          title: "Guardião do Bando",
          description:
            "Quando um Companheiro do Bando for atingido por um ataque, o Leonis pode avançar para protegê-lo.\nO Leonis redireciona para si o dano restante do ataque e recebe 25% menos dano dessa fonte.\nApós interceptar o golpe, poderá realizar imediatamente um contra-ataque contra o agressor, causando:\n0,9x FOR\nO contra-ataque somente acontece se o inimigo estiver ao alcance. Caso contrário, o Leonis apenas realiza a proteção.\nTipo: Reação — Proteção;\nCusto: 1 ponto de Bravura;\nRecarga: 3 turnos;\nLimite: Uma vez por rodada.",
        },
        {
          level: 60,
          title: "Desafio do Leão",
          description:
            "O Leonis escolhe um inimigo e o desafia diante de todos.\nDurante 2 turnos:\nO inimigo causa 20% menos dano contra personagens que não sejam o Leonis;\nO Leonis recebe 15% de DEF e RES contra os ataques desse inimigo;\nSempre que o inimigo atacar um Companheiro do Bando, o Leonis recebe 1 ponto de Bravura.\nA Bravura ainda respeita o limite normal de geração por rodada.\nO Leonis pode gastar 1 ponto de Bravura ao ativar a habilidade para impedir que o inimigo se esconda ou fuja por meios comuns durante 1 turno.\nChefes ou criaturas imunes a provocações ainda sofrem a redução de dano, mas não são obrigados a permanecer no confronto.\nTipo: Ativa — Provocação;\nCusto: Não possui;\nRecarga: 4 turnos;\nDuração: 2 turnos;\nBravura: Pode consumir 1 ponto.",
        },
        {
          level: 80,
          title: "Caçada do Horizonte Dourado",
          description:
            "O Leonis aponta um inimigo como a presa prioritária de seu bando e avança contra ele, causando dano físico equivalente a:\n1,8x FOR + 0,5x ARC\nDurante os próximos 2 turnos, o alvo fica marcado pela Caçada Dourada.\nContra ele:\nO Leonis e seus Companheiros recebem 15% de INI;\nAtaques Coordenados causam 20% de dano adicional, em vez de 10%;\nO primeiro ataque de cada membro do bando ignora 10% da DEF;\nO alvo não consegue esconder sua presença do bando por meios comuns.\nA habilidade exige 2 pontos de Bravura.\nTipo: Ativa — Ataque e marcação;\nCusto: 2 pontos de Bravura;\nRecarga: 6 turnos;\nDuração da marca: 2 turnos.",
        },
        {
          level: 100,
          title: "Avatar do Primeiro Sol",
          description:
            "O Leonis desperta o poder ancestral dos grandes leões que deram origem à sua raça. Sua juba se transforma em luz dourada e sua presença cobre o campo de batalha.\nAo ativar a transformação:\nRecupera 15% do HP máximo;\nRecebe imediatamente 3 pontos de Bravura;\nRemove de si efeitos comuns de medo, intimidação e enfraquecimento;\nTodos os Companheiros do Bando recebem um escudo equivalente a 1x ARC do Leonis.\nDurante os próximos 3 turnos:\nO Leonis recebe 20% de FOR, DEF e RES;\nSeus Companheiros causam 10% mais dano;\nSeus Companheiros recebem 10% menos dano;\nAtaques Coordenados causam 20% de dano adicional;\nGuardião do Bando não consome Bravura, mas ainda só pode ser ativado uma vez por rodada;\nQuando utiliza uma reação para proteger um companheiro, o Leonis recebe um escudo equivalente a 0,6x ARC;\nRugido Encorajador pode ser utilizado uma vez sem considerar sua recarga.\nA primeira vez que um Companheiro do Bando receber um dano que reduziria seu HP a 0 durante a transformação, o Leonis poderá consumir todos os seus pontos de Bravura para mantê-lo com 1 de HP.\nSão necessários pelo menos 2 pontos de Bravura para ativar essa proteção. Ela só pode acontecer uma vez por transformação.\nAo final, o Leonis entra em Exaustão Solar por 2 turnos:\nNão pode gerar Bravura;\nPerde os bônus concedidos aos companheiros;\nNão pode utilizar novamente o Avatar do Primeiro Sol.\nTipo: Transformação racial máxima;\nCusto: Não possui;\nRecarga: Uma vez por combate;\nDuração: 3 turnos;\nExaustão: 2 turnos.",
        },
      ],
    },
  },
  {
    name: "Tiefling",
    slug: "tiefling",
    payload: {
      description:
        "Os Tieflings são conjuradores híbridos especializados em maldições, contratos e magia infernal. Suas habilidades geram Dívida Infernal, um recurso que fortalece seus poderes, mas também reduz sua capacidade de receber cura e pode começar a consumir seu HP.\nSeu estilo exige equilíbrio entre acumular poder e transferir a dívida para os inimigos antes que o preço se torne alto demais.\n\nDescrição\nOs Tieflings descendem de mortais que, em algum momento da história, tiveram suas linhagens alteradas pelo contato com entidades infernais. Isso pode ter acontecido por meio de pactos, maldições, guerras planares ou exposição prolongada à energia do Inferno.\nEles possuem aparência humanoide, mas apresentam características como chifres, caudas, presas, olhos luminosos e pele de cores incomuns. Alguns também possuem cascos, garras, marcas infernais ou pequenas asas incapazes de sustentar voo.\nA aparência de um Tiefling não determina seu caráter. Muitos passam a vida lutando contra a desconfiança de outras raças, mesmo sem jamais terem realizado um pacto. Outros aceitam sua herança e utilizam os poderes infernais como ferramentas, acreditando que a origem de uma habilidade não define a maneira como ela será usada.\nNão existe uma única sociedade Tiefling. Alguns formam pequenas comunidades para proteger uns aos outros, enquanto outros vivem misturados entre os povos de Wonderland. Por dominarem a linguagem dos pactos, são frequentemente procurados como diplomatas, estudiosos de maldições, advogados, ocultistas ou negociadores.\n\nEstilo de Jogo\nFunção principal: DPS mágico e controle;\nFunções secundárias: Suporte e enfraquecimento;\nPontos fortes: Maldições, mobilidade e dano mágico crescente;\nPontos fracos: HP baixo, pouca defesa física e risco provocado pela Dívida;\nAtributos recomendados: INT, ARC e INI.\n\nCuriosidades\nNem todo Tiefling possui um ancestral infernal direto. Algumas linhagens surgiram por causa de maldições ou exposição planar.\nO formato dos chifres costuma variar de acordo com a linhagem familiar.\nChifres quebrados podem crescer novamente, mas o processo é lento e doloroso.\nAs marcas infernais tornam-se mais visíveis quando o Tiefling utiliza magia ou sente emoções intensas.\nA cauda é uma extensão natural do corpo e pode demonstrar emoções involuntariamente.\nNem todos possuem pele vermelha. Existem Tieflings de pele azulada, acinzentada, roxa, negra ou semelhante à humana.\nTieflings conseguem sentir quando um contrato possui magia, mas não conhecem automaticamente todas as suas cláusulas.\nUm acordo verbal não se torna mágico sozinho. Para isso, é necessário um ritual ou poder específico.\nMuitos estudam leis e idiomas para impedir que outras pessoas sejam enganadas por entidades infernais.\nAlguns removem ou escondem os próprios chifres para evitar perseguição.\nOutros os decoram com joias, inscrições e correntes como demonstração de orgulho.\nTieflings não são naturalmente malignos, assim como Aengels não são naturalmente bondosos.",
      imageUrl: "",
      difficulty: 4,
      baseHp: 400,
      baseMana: 150,
      attributeBonuses: {
        FOR: 1,
        DEF: 1,
        RES: 2,
        INI: 3,
        INT: 4,
        ARC: 4,
      },
      mechanics: [
        {
          name: "Dívida Infernal",
          description:
            "O Tiefling pode acumular até 5 pontos de Dívida Infernal.\nSempre que utiliza uma habilidade racial que não consome Dívida, recebe 1 ponto depois que a habilidade é resolvida.\nCada ponto acumulado concede:\n3% de aumento no dano mágico racial;\n3% de aumento na eficiência dos debuffs raciais;\n3% de redução nas curas recebidas pelo Tiefling.\nCom 5 pontos, o Tiefling recebe 15% de aumento nos efeitos raciais, mas também recebe 15% menos cura.\nDívida Vencida\nEnquanto permanecer com 5 pontos de Dívida, o Tiefling sofre dano verdadeiro equivalente a 5% do HP máximo no final de cada um de seus turnos.\nEsse dano:\nNão pode ser reduzido;\nNão pode diminuir o HP do Tiefling para menos de 1;\nTermina assim que a Dívida fica abaixo de 5 pontos.\nHabilidades que consomem Dívida não geram um novo ponto durante a mesma utilização.\nToda a Dívida desaparece ao final do combate.",
        },
      ],
      traits: [
        {
          name: "Sangue Infernal",
          description:
            "O corpo do Tiefling é naturalmente adaptado às energias do Inferno.\nRecebe 20% de resistência contra dano de fogo;\nA duração de queimaduras é reduzida em 1 turno;\nRecebe 15% de resistência contra maldições.\nA primeira vez em cada combate que resistir completamente a uma queimadura ou maldição, recupera 10% da Mana máxima.",
        },
        {
          name: "Palavras Vinculantes",
          description:
            "As maldições raciais do Tiefling ignoram 10% da RES dos inimigos.\nQuando uma maldição racial permanece até o final de sua duração, o Tiefling recupera 15 de Mana.\nSe um inimigo remover uma dessas maldições antes do término, o Tiefling reduz em 1 turno a recarga de sua habilidade racial com maior tempo restante.\nCada efeito só pode acontecer uma vez por rodada.",
        },
      ],
      progression: [
        {
          level: 1,
          title: "Brasa da Condenação",
          description:
            "O Tiefling lança uma chama infernal contra um inimigo, causando dano mágico equivalente a:\n1,1x INT + 0,4x ARC\nO alvo também recebe uma Queimadura Infernal equivalente a 0,2x INT durante 2 turnos.\nCaso o Tiefling esteja com 4 ou 5 pontos de Dívida, a queimadura também reduz em 15% as curas recebidas pelo alvo.\nTipo: Ativa — Dano mágico;\nCusto: 30 de Mana;\nRecarga: 1 turno;\nDívida: Gera 1 ponto.",
        },
        {
          level: 20,
          title: "Cláusula da Ruína",
          description:
            "O Tiefling inscreve uma cláusula infernal sobre um inimigo durante 3 turnos.\nSempre que o alvo utilizar uma habilidade, deverá pagar os Juros da Ruína, recebendo dano mágico equivalente a:\n0,4x ARC\nOs juros só podem ser ativados uma vez por turno.\nAo utilizar a habilidade, o Tiefling pode consumir 1 ponto de Dívida para acrescentar uma cláusula adicional:\nO alvo causa 15% menos dano;\nBenefícios recebidos por ele duram 1 turno a menos;\nOs Juros da Ruína aumentam para 0,6x ARC.\nO Tiefling deve escolher apenas uma cláusula adicional.\nTipo: Ativa — Maldição;\nCusto: 50 de Mana;\nRecarga: 4 turnos;\nDuração: 3 turnos;\nDívida: Gera 1 ponto ou consome 1 para fortalecer o efeito.",
        },
        {
          level: 40,
          title: "Passo do Enxofre",
          description:
            "O Tiefling desaparece em uma explosão de fumaça e reaparece em outro ponto que consiga enxergar.\nUma cópia flamejante permanece em sua posição anterior até o início de seu próximo turno. O primeiro ataque de alvo único contra o Tiefling tem o dano reduzido em 50%, destruindo a cópia.\nO inimigo que destruir a cópia recebe dano mágico equivalente a:\n0,6x INT\nFuga Contratual\nAo ser escolhido como alvo de um ataque de alvo único, o Tiefling pode utilizar a habilidade como reação e consumir 2 pontos de Dívida.\nNesse caso, ele se teleporta antes do impacto e evita completamente o ataque.\nAtaques em área, habilidades inevitáveis ou efeitos que impedem teletransporte não podem ser evitados dessa maneira.\nTipo: Ativa ou reação — Mobilidade;\nCusto: 40 de Mana;\nRecarga: 4 turnos;\nDívida: Gera 1 ponto quando usada normalmente ou consome 2 como reação.",
        },
        {
          level: 60,
          title: "Contrato Escarlate",
          description:
            "O Tiefling cria um contrato de sangue com um personagem durante 3 turnos. Ao utilizar a habilidade, deve escolher entre duas formas.\nPacto de Proteção\nO Tiefling vincula seu sangue ao de um aliado.\nDurante o contrato:\nO aliado causa 15% mais dano;\nO aliado recebe 15% mais cura;\n20% do dano final recebido pelo aliado é redirecionado ao Tiefling.\nO dano redirecionado não pode ser reduzido novamente e pode deixar o Tiefling inconsciente.\nPacto de Condenação\nO Tiefling vincula sua essência à de um inimigo.\nDurante o contrato:\nO alvo recebe 25% menos cura;\nSempre que causar dano, recebe como dano mágico 15% do dano final causado;\nO dano refletido só pode acontecer uma vez por turno.\nChefes e criaturas colossais recebem apenas 10% do próprio dano como retorno.\nTipo: Ativa — Contrato;\nCusto: 70 de Mana;\nRecarga: 5 turnos;\nDívida: Consome 2 pontos;\nDuração: 3 turnos.",
        },
        {
          level: 80,
          title: "Cobrança Infernal",
          description:
            "O Tiefling transfere toda a sua Dívida acumulada para os inimigos e exige o pagamento imediato.\nA habilidade exige pelo menos 3 pontos e causa a todos os inimigos:\n1,6x INT + 0,8x ARC\nPara cada ponto consumido, o dano aumenta em 0,25x INT.\nEfeitos adicionais são ativados conforme a quantidade de Dívida:\n3 pontos: Aplica Queimadura equivalente a 0,3x INT por 2 turnos;\n4 pontos: Os alvos recebem 30% menos cura por 2 turnos;\n5 pontos: Remove um benefício mágico de cada alvo e impede que recebam novos benefícios por 1 turno.\nToda a Dívida acumulada é consumida.\nTipo: Ativa — Explosão infernal;\nCusto: 100 de Mana;\nRecarga: 6 turnos;\nRequisito: Pelo menos 3 pontos de Dívida.",
        },
        {
          level: 100,
          title: "Ascensão do Sangue Infernal",
          description:
            "O Tiefling desperta completamente sua herança. Seus chifres crescem, marcas infernais cobrem seu corpo e grandes asas de fogo surgem atrás dele.\nAo se transformar:\nRecebe imediatamente 5 pontos de Dívida;\nRecupera 15% da Mana máxima;\nRemove de si uma maldição ou efeito de enfraquecimento;\nLibera uma explosão que causa 0,8x INT a todos os inimigos próximos.\nDurante os próximos 3 turnos:\nRecebe 20% de INT, ARC e INI;\nNão sofre a redução de cura causada pela Dívida;\nNão recebe dano por Dívida Vencida;\nTodas as habilidades raciais são consideradas como se estivessem fortalecidas por 5 pontos;\nA Dívida retorna para 5 no início de cada turno;\nA primeira maldição aplicada em cada turno atinge um segundo inimigo com 50% da eficiência;\nPasso do Enxofre pode ser utilizado como reação consumindo apenas 1 ponto de Dívida.\nQuando a transformação termina:\nToda a Dívida é removida;\nO Tiefling sofre dano verdadeiro equivalente a 10% do HP atual;\nEntra em Exaustão Infernal durante 2 turnos.\nDurante a Exaustão:\nNão pode gerar Dívida;\nCausa 10% menos dano mágico;\nNão pode utilizar novamente a Ascensão.\nTipo: Transformação racial máxima;\nCusto: 150 de Mana;\nRecarga: Uma vez por combate;\nDuração: 3 turnos;\nExaustão: 2 turnos.",
        },
      ],
    },
  },
  {
    name: "Vampiro",
    slug: "vampiro",
    payload: {
      description:
        "Os Vampiros são predadores híbridos que combinam força física, velocidade, controle mental e hemomancia. Sua principal mecânica é a Reserva de Sangue, utilizada para alimentar regeneração, transformações e habilidades defensivas.\nUm Vampiro bem alimentado é resistente e difícil de eliminar. Entretanto, gastar sangue de forma imprudente provoca Fome Bestial, deixando-o mais agressivo, porém vulnerável. A luz solar e a dificuldade de extrair sangue de determinadas criaturas também exigem preparação.\n\nDescrição\nOs Vampiros surgiram após a Maldição Carmesim, um antigo ritual que tentou utilizar sangue mortal para alcançar a imortalidade. O ritual falhou, criando seres suspensos entre a vida e a morte, condenados a consumir a essência vital de outras criaturas.\nAlguns Vampiros nasceram em linhagens antigas, enquanto outros foram transformados por rituais, troca de sangue ou pela vontade de um Vampiro poderoso. Uma simples mordida não é suficiente para realizar a transformação.\nSua aparência normalmente permanece semelhante à que possuíam antes da maldição, mas sua pele se torna fria, seus caninos crescem e seus olhos podem adquirir tons vermelhos, dourados, negros ou prateados. Quando sentem fome, veias escuras e características bestiais podem surgir ao redor dos olhos.\nOs Vampiros não possuem uma cultura única. Alguns organizam-se em casas nobres, cortes e linhagens. Outros rejeitam essas estruturas e vivem como caçadores, estudiosos ou viajantes. Existem até comunidades que sobrevivem por meio de doações voluntárias e reservas alquímicas.\nEmbora muitos povos os considerem monstros, a necessidade de sangue não determina sua personalidade. O verdadeiro perigo está na maneira como cada Vampiro escolhe controlar sua fome.\n\nEstilo de Jogo\nFunção principal: DPS físico ou híbrido;\nFunções secundárias: Controle, mobilidade e regeneração;\nPontos fortes: Sustentação, velocidade, perseguição e controle mental;\nPontos fracos: Luz solar, fome e inimigos sem sangue;\nAtributos recomendados: FOR, INI, RES, INT e ARC.\n\nCuriosidades\nUma simples mordida não transforma alguém em Vampiro. É necessário um ritual ou troca voluntária de sangue.\nVampiros ainda possuem reflexo e podem aparecer em espelhos comuns.\nAlguns espelhos encantados são capazes de revelar sua natureza amaldiçoada.\nAlho não causa dano, mas o cheiro intenso pode incomodar seus sentidos.\nEstacas não eliminam Vampiros instantaneamente. Elas são utilizadas para impedir a regeneração de um Vampiro já incapacitado.\nSangue animal pode aliviar a fome, mas possui menos energia que o sangue de criaturas conscientes.\nSangue armazenado pode ser utilizado, desde que seja preservado por alquimia ou magia.\nVampiros não precisam matar para se alimentar.\nCasas vampíricas frequentemente registram suas linhagens e transformações em grandes arquivos genealógicos.\nVampiros antigos podem desenvolver características únicas, como asas, sombras independentes ou olhos adicionais.\nEntrar em uma residência não exige convite, embora algumas barreiras mágicas utilizem essa crença como regra.\nAlguns Vampiros mantêm relações respeitosas com seus doadores, enquanto outros tratam mortais como recursos.\nA cor dos olhos costuma mudar quando a Reserva de Sangue está próxima de acabar.\nUm Vampiro pode permanecer consciente por séculos, mas períodos prolongados sem sangue podem fazê-lo entrar em um estado de hibernação.",
      imageUrl: "",
      difficulty: 5,
      baseHp: 500,
      baseMana: 100,
      attributeBonuses: {
        FOR: 3,
        DEF: 1,
        RES: 3,
        INI: 4,
        INT: 2,
        ARC: 2,
      },
      mechanics: [
        {
          name: "Reserva de Sangue",
          description:
            "O Vampiro pode armazenar até 5 pontos de Sangue e normalmente começa cada combate com 3 pontos.\nEle recebe 1 ponto quando:\nUtiliza Mordida Carmesim contra uma criatura viva;\nDrena um inimigo por meio de uma habilidade racial;\nDerruba uma criatura viva que esteja sofrendo Sangramento.\nNormalmente, somente 1 ponto de Sangue pode ser obtido por turno, salvo quando uma habilidade determinar o contrário.\nO Vampiro não pode extrair sangue de:\nConstrutos;\nMortos-vivos;\nElementais;\nCriaturas sem corpo físico;\nSeres que não possuam sangue ou essência vital equivalente.\nToda a Reserva de Sangue desaparece após um período prolongado sem alimentação. Fora de combate, a quantidade disponível será determinada conforme a alimentação recente do personagem.\nSangue Pleno\nEnquanto possuir 5 pontos de Sangue, o Vampiro recupera 2% do HP máximo no início de cada turno.\nEssa regeneração não consome Sangue, mas é interrompida por luz solar direta.\nFome Bestial\nAo ficar com 0 pontos, o Vampiro entra em Fome Bestial:\nCausa 10% mais dano físico;\nPerde 15% de DEF e RES;\nRecebe 20% menos cura;\nNão pode utilizar habilidades que exijam Sangue.\nA Fome termina assim que recuperar pelo menos 1 ponto.",
        },
      ],
      traits: [
        {
          name: "Corpo Amaldiçoado",
          description:
            "O organismo do Vampiro não funciona como o de um mortal comum.\nRecebe 30% de resistência contra venenos e doenças;\nA duração de Sangramentos comuns é reduzida em 1 turno;\nNão precisa respirar;\nPode sobreviver sem comida ou água comum, mas ainda necessita de sangue;\nSeu envelhecimento natural é extremamente lento.\nO Vampiro ainda pode ser curado normalmente por magia, poções e habilidades, salvo quando algum efeito determinar o contrário.",
        },
        {
          name: "Predador da Penumbra",
          description:
            "Em ambientes escuros ou com pouca iluminação, o Vampiro recebe:\n15% de INI;\nVisão perfeita na escuridão comum;\nCapacidade de perceber criaturas feridas pelo cheiro do sangue;\n10% de aumento na eficiência das curas raciais.\nInimigos vivos com menos de 50% do HP não conseguem esconder sua presença do Vampiro por meios comuns.\nOs bônus de INI e cura não funcionam sob luz solar direta.\nFraqueza Racial — Luz Solar\nQuando exposto diretamente à luz do sol, o Vampiro sofre:\nRedução de 20% na INI;\nInterrupção de Sangue Pleno;\nRedução de 50% nas curas recebidas por habilidades raciais;\nIncapacidade de utilizar Predador da Penumbra.\nApós permanecer sob luz solar direta durante 2 rodadas consecutivas, passa a sofrer dano verdadeiro equivalente a 5% do HP máximo no final de cada turno.\nO dano não pode reduzir seu HP para menos de 1, mas continua enquanto permanecer exposto.\nRoupas apropriadas, construções, magia de sombra e proteções alquímicas podem impedir a exposição direta. A luz criada por magia comum não conta como luz solar, salvo quando a habilidade indicar natureza solar ou sagrada.",
        },
      ],
      progression: [
        {
          level: 1,
          title: "Mordida Carmesim",
          description:
            "O Vampiro morde um inimigo ao alcance, causando dano físico equivalente a:\n1,2x FOR\nSe o alvo estiver sofrendo Sangramento, imobilizado ou sob um efeito de controle, o ataque causa 0,4x FOR como dano adicional.\nContra criaturas vivas, o Vampiro:\nRecupera HP equivalente a 40% do dano causado;\nRecebe 1 ponto de Sangue.\nContra criaturas sem sangue, a Mordida causa dano, mas não concede cura ou Reserva de Sangue.\nTipo: Ativa — Ataque físico;\nCusto: Não possui;\nRecarga: 2 turnos;\nSangue: Gera 1 ponto.",
        },
        {
          level: 20,
          title: "Passo Nebuloso",
          description:
            "O Vampiro transforma parte do corpo em névoa e se desloca rapidamente.\nA habilidade pode ser utilizada de duas maneiras:\nDeslocamento\nO Vampiro atravessa inimigos, grades, pequenas aberturas e obstáculos comuns, reposicionando-se sem sofrer reações.\nNévoa Defensiva\nQuando for atingido, pode usar a habilidade como reação:\nReduz o dano de alvo único em 60%;\nReduz o dano de ataques em área em 30%;\nPode se reposicionar após receber o dano;\nNão pode ser derrubado ou imobilizado por esse ataque.\nAtaques inevitáveis ou que anulem transformações não podem ser reduzidos.\nTipo: Ativa ou reação — Mobilidade;\nCusto: 1 ponto de Sangue;\nRecarga: 3 turnos.",
        },
        {
          level: 40,
          title: "Olhar Hipnótico",
          description:
            "O Vampiro prende um inimigo em seu olhar e invade temporariamente sua vontade.\nO alvo fica Hipnotizado durante 1 turno:\nNão pode atacar o Vampiro;\nNão pode utilizar reações contra ele;\nPode receber um comando simples de movimentação ou interação;\nNão pode ser obrigado a ferir a si mesmo ou seus aliados.\nO efeito termina imediatamente se o Vampiro ou um aliado causar dano direto ao alvo.\nO Vampiro pode consumir 1 ponto de Sangue adicional para afetar um segundo inimigo com 50% da duração e eficiência.\nChefes ou criaturas resistentes ao controle não ficam completamente Hipnotizados. Em vez disso, causam 20% menos dano contra o Vampiro e perdem 20% de INI por 1 turno.\nA habilidade exige que o alvo consiga ver os olhos do Vampiro.\nTipo: Ativa — Controle mental;\nCusto: 50 de Mana;\nRecarga: 4 turnos;\nSangue: Pode consumir 1 ponto adicional.",
        },
        {
          level: 60,
          title: "Manto da Noite",
          description:
            "O Vampiro cobre uma região com escuridão sobrenatural durante 3 turnos.\nEnquanto estiver dentro do Manto, recebe:\n20% de INI;\n15% de redução de dano;\nTodos os benefícios de Predador da Penumbra;\nCapacidade de utilizar Passo Nebuloso sem gastar Sangue uma vez durante a duração.\nInimigos sem visão mágica sofrem:\nRedução de 15% na INI;\nRedução de 10% no dano causado contra o Vampiro;\nIncapacidade de realizar reações contra Passo Nebuloso.\nOs aliados do Vampiro conseguem enxergar apenas silhuetas dentro da escuridão. Eles não recebem penalidades para identificar companheiros, mas ainda podem ter dificuldade para localizar inimigos.\nTipo: Ativa — Controle de campo;\nCusto: 70 de Mana e 2 pontos de Sangue;\nRecarga: 5 turnos;\nDuração: 3 turnos.",
        },
        {
          level: 80,
          title: "Banquete Carmesim",
          description:
            "O Vampiro invoca correntes de sangue que atravessam até três inimigos, causando dano mágico equivalente a:\n1,6x INT + 1x ARC\nInimigos que estejam sofrendo Sangramento recebem 0,3x INT como dano adicional.\nO Vampiro recupera HP equivalente a 30% do dano total causado, limitado a 25% de seu HP máximo.\nPara cada criatura viva atingida, recebe 1 ponto de Sangue, até o máximo de 3 pontos.\nCriaturas sem sangue ainda recebem o dano mágico, mas não concedem cura ou Reserva de Sangue.\nTipo: Ativa — Hemomancia;\nCusto: 100 de Mana;\nRecarga: 6 turnos;\nSangue: Pode gerar até 3 pontos.",
        },
        {
          level: 100,
          title: "Ascensão do Sangue Antigo",
          description:
            "O Vampiro desperta o poder máximo de sua linhagem. Sua aparência torna-se mais bestial, grandes asas surgem atrás de seu corpo e uma aura carmesim cobre o campo.\nAo se transformar:\nRecupera 20% do HP máximo;\nRecebe imediatamente 5 pontos de Sangue;\nRemove de si efeitos comuns de medo, veneno e imobilização;\nTodos os inimigos vivos próximos começam a sofrer Sangramento equivalente a 0,3x FOR durante 2 turnos.\nDurante os próximos 3 turnos:\nRecebe 20% de FOR e INT;\nRecebe 15% de RES e INI;\nPode voar e ignorar obstáculos terrestres;\nCustos raciais de Sangue são reduzidos em 1, até o mínimo de 0;\nMordida Carmesim tem sua recarga encerrada no início de cada turno;\nA cura da Mordida aumenta de 40% para 60% do dano causado;\nRecebe 1 ponto de Sangue no início de cada turno;\nAs penalidades da luz solar ficam temporariamente suspensas.\nA primeira vez que receber um dano que reduziria seu HP a 0 durante a transformação, o Vampiro poderá consumir todos os seus 5 pontos de Sangue para permanecer com 1 de HP e recuperar 15% do HP máximo.\nCaso não possua 5 pontos, o efeito não poderá ser ativado.\nAo final da transformação:\nSua Reserva de Sangue é reduzida a 0;\nEntra imediatamente em Fome Bestial;\nSofre Exaustão Carmesim durante 2 turnos.\nDurante a Exaustão:\nNão pode recuperar Sangue;\nNão pode utilizar habilidades de transformação;\nRecebe 10% menos cura.\nTipo: Transformação racial máxima;\nCusto: 130 de Mana;\nRecarga: Uma vez por combate;\nDuração: 3 turnos;\nExaustão: 2 turnos.",
        },
      ],
    },
  },
  {
    name: "Elfo",
    slug: "elfo",
    payload: {
      description:
        "Os Elfos são combatentes versáteis que combinam precisão, magia ancestral, mobilidade e suporte. Sua mecânica de Concentração Élfica recompensa personagens que evitam interrupções e mantêm uma posição segura durante o combate.\nPodem se especializar em ataques físicos, magia ou suporte, mas possuem HP e DEF relativamente baixos. Um Elfo precisa controlar o campo e evitar ser pressionado para manter todo o seu potencial.\n\nDescrição\nOs Elfos estão entre os povos mortais mais antigos de Wonderland. Segundo suas tradições, seus primeiros ancestrais surgiram quando a magia do mundo se acumulou nas florestas, rios e estrelas, adquirindo consciência e assumindo forma física.\nPossuem corpos esguios, orelhas alongadas e sentidos extremamente desenvolvidos. Seus olhos podem apresentar cores incomuns, e alguns manifestam marcas naturais semelhantes a folhas, constelações ou linhas de energia mágica.\nA cultura élfica valoriza conhecimento, arte, paciência e preservação. Por viverem durante séculos, os Elfos possuem uma percepção diferente do tempo: decisões aparentemente simples podem ser discutidas durante anos, enquanto amizades e rivalidades podem atravessar gerações.\nNem todos vivem em florestas. Existem comunidades élficas em grandes cidades, montanhas, desertos e regiões costeiras. Alguns preservam tradições antigas, enquanto outros acreditam que sua raça precisa acompanhar as mudanças de Wonderland.\nElfos costumam atuar como arqueiros, magos, curandeiros, exploradores, diplomatas e guardiões de locais onde a magia se encontra instável.\n\nEstilo de Jogo\nFunção principal: DPS físico ou mágico;\nFunções secundárias: Suporte e controle;\nPontos fortes: Precisão, mobilidade, magia e versatilidade;\nPontos fracos: HP moderado, baixa DEF e perda de poder quando pressionado;\nAtributos recomendados: INI, INT, ARC ou FOR.\n\nCuriosidades\nElfos podem viver por vários séculos, mas não são imortais.\nSeu envelhecimento desacelera após alcançarem a maturidade.\nAs orelhas élficas possuem grande sensibilidade e podem se movimentar levemente em resposta a sons.\nNem todos os Elfos vivem em florestas ou possuem ligação direta com a natureza.\nExistem comunidades élficas adaptadas a desertos, montanhas, cidades e regiões costeiras.\nElfos costumam registrar memórias importantes por meio de músicas, pinturas, joias e árvores encantadas.\nAlguns evitam escrever nomes de pessoas falecidas, acreditando que as histórias preservam melhor sua essência.\nRelacionamentos com povos de vida curta podem ser difíceis, mas não são incomuns.\nMuitos Elfos mantêm cartas, presentes e objetos de amigos que morreram há séculos.\nPara eles, vinte anos podem parecer pouco tempo, mas isso não significa que sejam incapazes de tomar decisões rápidas.\nAs marcas que aparecem durante o Legado da Primeira Era são diferentes em cada linhagem.\nElfos raramente esquecem uma promessa, uma amizade ou uma ofensa importante.",
      imageUrl: "",
      difficulty: 3,
      baseHp: 400,
      baseMana: 150,
      attributeBonuses: {
        FOR: 2,
        DEF: 1,
        RES: 2,
        INI: 4,
        INT: 3,
        ARC: 3,
      },
      mechanics: [
        {
          name: "Concentração Élfica",
          description:
            "O Elfo pode acumular até 3 pontos de Concentração.\nEle recebe 1 ponto após:\nCompletar uma ação sem ser interrompido;\nEvitar completamente um ataque;\nPassar um turno sem receber dano direto.\nSomente 1 ponto pode ser recebido por turno.\nCada ponto de Concentração concede:\n5% de INI;\n3% de aumento no dano das habilidades raciais;\n3% de aumento nas curas e escudos raciais.\nAo atingir 3 pontos, o Elfo entra em Sintonia Perfeita, permitindo que determinadas habilidades recebam efeitos especiais.\nSempre que sofrer dano direto, perde 1 ponto. Caso seja atordoado, derrubado ou tenha uma habilidade interrompida, perde todos os pontos.\nToda a Concentração desaparece ao final do combate.",
        },
      ],
      traits: [
        {
          name: "Sentidos Élficos",
          description:
            "Os sentidos dos Elfos são muito mais desenvolvidos que os de mortais comuns.\nRecebem 15% de INI durante a primeira rodada;\nEnxergam perfeitamente em ambientes de pouca iluminação;\nRecebem 20% de resistência contra ataques surpresa;\nConseguem perceber movimentos, sons e alterações sutis no ambiente.\nInvisibilidade e silêncio mágico ainda podem enganar seus sentidos.",
        },
        {
          name: "Mente de Séculos",
          description:
            "A longevidade e a disciplina mental tornam os Elfos resistentes à manipulação.\nRecebem 20% de resistência contra encanto e ilusões;\nA duração desses efeitos é reduzida em 1 turno;\nPrecisam de apenas 4 horas de meditação para obter os benefícios de um descanso comum.\nDurante a meditação, o Elfo permanece consciente dos sons e movimentos ao seu redor, mas ainda pode ser surpreendido por efeitos mágicos.",
        },
      ],
      progression: [
        {
          level: 1,
          title: "Flecha Etérea",
          description:
            "O Elfo cria um projétil de energia ancestral e o dispara contra um inimigo.\nO jogador escolhe a natureza do ataque:\nFlecha Física\nCausa dano físico equivalente a:\n1,3x FOR + 0,3x ARC\nFlecha Arcana\nCausa dano mágico equivalente a:\n1,2x INT + 0,4x ARC\nAo atingir Sintonia Perfeita, o Elfo pode consumir os 3 pontos de Concentração para criar uma segunda flecha.\nA segunda flecha causa 0,6x do dano original e pode atingir o mesmo inimigo ou outro alvo.\nTipo: Ativa — Ataque físico ou mágico;\nCusto: 30 de Mana;\nRecarga: 1 turno;\nConcentração: Pode consumir 3 pontos.",
        },
        {
          level: 20,
          title: "Passo sem Rastros",
          description:
            "O Elfo movimenta-se com extrema leveza e desaparece momentaneamente da percepção dos inimigos.\nAo utilizar a habilidade:\nPode se reposicionar sem provocar reações;\nIgnora obstáculos terrestres comuns;\nRecebe 20% de INI até o início do próximo turno;\nApaga rastros, sons e odores deixados durante o movimento.\nEvasão Instintiva\nAo ser escolhido como alvo de um ataque, o Elfo pode utilizar a habilidade como reação e consumir 2 pontos de Concentração.\nNesse caso:\nReduz o dano recebido em 50%;\nPode se reposicionar após o ataque;\nNão pode ser derrubado ou imobilizado por essa fonte.\nAtaques inevitáveis e efeitos em área ainda causam dano normalmente.\nTipo: Ativa ou reação — Mobilidade;\nCusto: 25 de Mana;\nRecarga: 3 turnos;\nConcentração: Gera 1 quando usada normalmente ou consome 2 como reação.",
        },
        {
          level: 40,
          title: "Graça do Bosque Antigo",
          description:
            "O Elfo invoca a energia vital dos primeiros bosques para restaurar um aliado.\nO alvo recupera:\n1,2x ARC\nDurante os próximos 2 turnos, também recupera 0,3x ARC no início de cada turno.\nSe estiver em Sintonia Perfeita, o Elfo pode consumir os 3 pontos de Concentração para escolher um efeito:\nRemover um efeito negativo comum;\nConceder um escudo equivalente a 1x ARC;\nFazer a cura inicial atingir um segundo aliado com 60% da eficiência.\nTipo: Ativa — Cura;\nCusto: 55 de Mana;\nRecarga: 4 turnos;\nRegeneração: 2 turnos;\nConcentração: Pode consumir 3 pontos.",
        },
        {
          level: 60,
          title: "Laços de Luz e Raiz",
          description:
            "O Elfo faz raízes cobertas por energia arcana surgirem ao redor de até três inimigos.\nCada alvo recebe dano mágico equivalente a:\n0,8x INT + 0,6x ARC\nOs inimigos ficam Imobilizados durante 1 turno. Depois que a imobilização termina, perdem 20% de INI por mais 1 turno.\nSe o Elfo consumir 3 pontos de Concentração:\nO dano aumenta em 0,4x INT;\nA imobilização dura 2 turnos;\nOs alvos não podem utilizar reações durante o primeiro turno.\nChefes e criaturas colossais não ficam completamente imobilizados. Em vez disso, perdem 30% de INI e não podem se reposicionar por reações.\nTipo: Ativa — Controle;\nCusto: 75 de Mana;\nRecarga: 5 turnos;\nConcentração: Pode consumir 3 pontos.",
        },
        {
          level: 80,
          title: "Chuva das Estrelas Ancestrais",
          description:
            "O Elfo invoca uma chuva de flechas físicas e projéteis astrais sobre o campo.\nNo momento da ativação, escolhe se o dano principal será físico ou mágico.\nA habilidade causa a todos os inimigos:\n1,7x do maior atributo entre FOR e INT + 0,8x ARC\nUm inimigo escolhido como alvo principal recebe 0,5x do atributo utilizado como dano adicional.\nO Elfo pode consumir até 3 pontos de Concentração. Para cada ponto consumido:\nO dano aumenta em 0,15x do atributo utilizado;\nA habilidade ignora 5% da DEF ou RES dos inimigos.\nCom 3 pontos, o alvo principal também fica Exposto, recebendo 15% mais dano do próximo ataque que o atingir.\nTipo: Ativa — Ataque coletivo;\nCusto: 100 de Mana;\nRecarga: 6 turnos;\nConcentração: Pode consumir até 3 pontos.",
        },
        {
          level: 100,
          title: "Legado da Primeira Era",
          description:
            "O Elfo desperta as memórias mágicas preservadas em sua linhagem. Marcas ancestrais surgem em seu corpo enquanto folhas, estrelas e fragmentos de energia orbitam ao seu redor.\nAo despertar:\nRecebe imediatamente 3 pontos de Concentração;\nRecupera 15% da Mana máxima;\nRemove de si um efeito de encanto, ilusão ou enfraquecimento;\nPode se reposicionar sem provocar reações.\nDurante os próximos 3 turnos:\nRecebe 20% no maior atributo entre FOR e INT;\nRecebe 20% de ARC;\nRecebe 15% de INI e RES;\nA Concentração não pode ser reduzida para menos de 1;\nA primeira habilidade racial utilizada em cada turno não consome Concentração;\nFlecha Etérea cria sua segunda flecha sem precisar de Sintonia Perfeita;\nGraça do Bosque Antigo aplica a regeneração a um segundo aliado;\nLaços de Luz e Raiz afeta um inimigo adicional;\nPasso sem Rastros pode ser utilizado uma vez sem considerar sua recarga.\nAo final do Legado, o Elfo perde toda a Concentração e entra em Exaustão Ancestral por 2 turnos:\nNão pode gerar Concentração;\nPerde 15% de INI;\nNão pode utilizar novamente o Legado da Primeira Era.\nTipo: Despertar racial máximo;\nCusto: 140 de Mana;\nRecarga: Uma vez por combate;\nDuração: 3 turnos;\nExaustão: 2 turnos.",
        },
      ],
    },
  },
  {
    name: "Fada",
    slug: "fada",
    payload: {
      description:
        "As Fadas são criaturas extremamente frágeis que compensam seu baixo HP com mobilidade aérea, magia, cura e controle. Suas habilidades alternam entre Encantos, voltados a ajudar aliados, e Travessuras, utilizadas para prejudicar inimigos.\nDominar uma Fada exige posicionamento cuidadoso e alternância entre os dois tipos de magia para gerar Pó Feérico mais rapidamente. Embora possam transformar completamente um combate, são facilmente derrotadas caso sejam alcançadas.\n\nDescrição\nAs Fadas nasceram no Véu Feérico, uma dimensão formada pela união entre magia, natureza, sonhos e emoções. As primeiras surgiram quando os sentimentos dos mortais atravessaram o Véu e adquiriram consciência.\nPor causa disso, cada Fada carrega uma ligação especial com alguma manifestação do mundo, como flores, tempestades, luar, estações, música, sonhos ou memórias.\nSua altura normalmente varia entre vinte e sessenta centímetros, embora algumas linhagens possam ser maiores. Possuem asas que lembram borboletas, libélulas, folhas, cristais ou fragmentos de luz. A aparência de suas asas muda conforme sua origem e estado emocional.\nAs sociedades feéricas são organizadas em círculos, cortes e pequenos domínios escondidos. Suas regras podem parecer estranhas para outros povos: presentes, nomes, promessas e gestos de hospitalidade possuem grande importância.\nApesar da fama de criaturas alegres e inocentes, Fadas podem ser bondosas, caprichosas, vingativas ou assustadoramente antigas. Para elas, uma brincadeira pode durar alguns minutos ou atravessar várias gerações.\n\nEstilo de Jogo\nFunção principal: Suporte e controle;\nFunções secundárias: DPS mágico e mobilidade;\nPontos fortes: Cura, buffs, debuffs, voo e versatilidade;\nPontos fracos: HP extremamente baixo, pouca defesa e vulnerabilidade ao ferro frio;\nAtributos recomendados: ARC, INT e INI.\n\nCuriosidades\nAs asas de uma Fada mudam de brilho conforme suas emoções.\nAlgumas Fadas nascem de flores, árvores, sonhos, canções ou fenômenos naturais.\nO verdadeiro nome de uma Fada possui grande importância e raramente é revelado.\nAceitar um presente feérico não cria automaticamente uma dívida mágica, mas algumas Cortes utilizam rituais capazes de fazer isso.\nFadas têm dificuldade para mentir diretamente, mas são excelentes em esconder informações e utilizar duplo sentido.\nO tempo pode passar de forma diferente dentro de regiões próximas ao Véu Feérico.\nAlgumas Fadas envelhecem como mortais, enquanto outras permanecem jovens por séculos.\nO tamanho reduzido não significa que sejam crianças.\nSuas roupas e objetos pessoais normalmente são criados com materiais mágicos extremamente leves.\nFadas podem se alimentar de comida comum, mas muitas preferem frutas, doces, néctar e emoções positivas.\nUma Fada enfurecida pode ter suas asas e magia alteradas temporariamente.\nCírculos de cogumelos podem marcar entradas naturais para o Véu, embora nem todos funcionem como portais.\nA destruição do local ou elemento ao qual uma Fada está ligada pode enfraquecê-la emocionalmente.\nAlgumas Fadas colecionam objetos que mortais considerariam insignificantes, como botões, chaves, cartas e memórias.",
      imageUrl: "",
      difficulty: 5,
      baseHp: 200,
      baseMana: 250,
      attributeBonuses: {
        FOR: 0,
        DEF: 1,
        RES: 1,
        INI: 4,
        INT: 4,
        ARC: 5,
      },
      mechanics: [
        {
          name: "Pó Feérico",
          description:
            "A Fada pode acumular até 5 pontos de Pó Feérico e começa cada combate com 2 pontos.\nEla recebe 1 ponto quando:\nUtiliza uma habilidade racial em um alvo diferente de si mesma;\nConcede um buff ou escudo a um aliado;\nAplica um debuff ou controle a um inimigo.\nNormalmente, apenas 1 ponto pode ser recebido por turno.\nO Pó Feérico pode ser consumido para fortalecer habilidades, aumentar curas ou criar efeitos adicionais. Habilidades que consomem Pó não geram um novo ponto durante a mesma utilização.\nTodos os pontos desaparecem ao final do combate.",
        },
        {
          name: "Ritmo Feérico",
          description:
            "As habilidades da Fada são classificadas como:\nEncanto: Cura, proteção, fortalecimento e mobilidade;\nTravessura: Dano, enfraquecimento, ilusão e controle.\nQuando a Fada utiliza uma habilidade de categoria diferente da última habilidade racial usada, entra em Harmonia Feérica:\nRecebe 1 Pó Feérico adicional;\nA habilidade atual tem sua eficiência aumentada em 10%.\nA Harmonia só pode acontecer uma vez por rodada. Repetir a mesma categoria continua funcionando normalmente, mas não concede o bônus.",
        },
      ],
      traits: [
        {
          name: "Asas Feéricas",
          description:
            "A Fada pode voar livremente e ignorar obstáculos terrestres comuns.\nEla pode:\nPermanecer no ar durante o combate;\nAtravessar pequenas aberturas;\nAlcançar posições elevadas;\nReposicionar-se sem sofrer penalidades de terreno terrestre.\nCaso receba de uma única fonte dano igual ou superior a 20% do seu HP máximo, suas asas ficam desestabilizadas. A Fada é forçada a pousar e não pode voar até o final do próximo turno.\nEfeitos que prendam ou danifiquem diretamente suas asas também podem impedir o voo.",
        },
        {
          name: "Essência Encantada",
          description:
            "A natureza mágica das Fadas concede:\n20% de resistência contra encanto, ilusão e sono;\nRedução de 1 turno na duração desses efeitos;\nCapacidade de sentir magia feérica e alterações no Véu;\nCapacidade de perceber emoções intensas em criaturas próximas.\nEssa percepção não revela pensamentos nem determina se alguém está mentindo.",
        },
        {
          name: "Glamour Mutável",
          description:
            "A Fada pode criar um Glamour ao redor do próprio corpo, assumindo uma aparência humanoide de tamanho comum.\nO Glamour altera sua aparência, voz, roupas aparentes e tamanho percebido, mas não modifica seus atributos, peso ou força física.\nContato direto, efeitos que anulem magia ou danos intensos podem revelar momentaneamente sua forma verdadeira.\nFraqueza Racial — Ferro Frio\nFerro frio é um material preparado para interromper a energia do Véu Feérico.\nQuando a Fada recebe dano direto de uma arma feita com ferro frio:\nO ataque ignora 15% de sua DEF ou RES;\nEla não pode gerar Pó Feérico até o final do próximo turno;\nSuas asas perdem o poder mágico, obrigando-a a permanecer no chão até o final do próximo turno;\nGlamour Mutável é temporariamente revelado.\nFerro comum não produz esses efeitos. O material precisa ser preparado por métodos específicos.",
        },
      ],
      progression: [
        {
          level: 1,
          title: "Faísca Prismática",
          description:
            "A Fada cria uma pequena esfera de magia colorida e escolhe como utilizá-la.\nLuz Restauradora — Encanto\nCura um aliado em valor equivalente a:\n1x ARC\nO alvo também recebe 10% de INI até o início do próximo turno.\nBrilho Irritante — Travessura\nAtinge um inimigo, causando dano mágico equivalente a:\n0,9x INT + 0,6x ARC\nO alvo perde 10% de INI até o início do próximo turno.\nAo consumir 1 Pó Feérico, a cura ou o dano aumenta em 0,4x ARC.\nTipo: Ativa — Encanto ou Travessura;\nCusto: 30 de Mana;\nRecarga: 1 turno;\nPó Feérico: Pode consumir 1 ponto.",
        },
        {
          level: 20,
          title: "Pó das Mil Cores",
          description:
            "A Fada espalha um pó brilhante sobre um personagem e escolhe um dos efeitos.\nBrilho Protetor — Encanto\nUm aliado recebe um escudo equivalente a:\n1,2x ARC\nTambém recebe 20% de INI durante 1 turno.\nNuvem Ofuscante — Travessura\nUm inimigo fica ofuscado durante 1 turno:\nSua próxima habilidade ofensiva causa 25% menos dano;\nNão pode utilizar reações;\nPerde 15% de INI.\nAo consumir 1 Pó Feérico:\nO escudo aumenta para 1,8x ARC; ou\nA redução de dano do inimigo aumenta para 40%.\nTipo: Ativa — Encanto ou Travessura;\nCusto: 45 de Mana;\nRecarga: 3 turnos;\nPó Feérico: Pode consumir 1 ponto.",
        },
        {
          level: 40,
          title: "Portal de Pétalas",
          description:
            "A Fada abre uma passagem momentânea através do Véu e transporta a si mesma e um aliado para outro ponto que consiga enxergar.\nOs dois personagens:\nPodem se reposicionar sem provocar reações;\nRecebem um escudo equivalente a 0,6x ARC;\nIgnoram obstáculos terrestres durante o transporte.\nResgate Feérico\nQuando um aliado for escolhido como alvo de uma habilidade de alvo único, a Fada poderá consumir 2 pontos de Pó para utilizar o Portal como reação.\nNesse caso, o aliado é retirado antes do impacto e evita completamente a habilidade.\nAtaques em área, habilidades inevitáveis ou efeitos que bloqueiem teletransporte não podem ser evitados.\nTipo: Ativa ou reação — Encanto;\nCusto: 60 de Mana;\nRecarga: 5 turnos;\nPó Feérico: Consome 2 pontos quando usada como reação.",
        },
        {
          level: 60,
          title: "Baile do Sono Dourado",
          description:
            "A Fada espalha música e partículas mágicas sobre todos os inimigos.\nOs alvos recebem dano mágico equivalente a:\n0,8x INT + 0,6x ARC\nTambém ficam Sonolentos durante 2 turnos:\nPerdem 20% de INI;\nCausam 15% menos dano;\nNão podem receber bônus de coragem ou inspiração.\nUm inimigo que já esteja sofrendo algum debuff racial da Fada adormece durante 1 turno.\nO sono termina ao receber dano direto. Depois de despertar, o alvo ainda permanece Sonolento pelo restante da duração.\nA Fada pode consumir 2 pontos de Pó para fazer com que todos os inimigos afetados adormeçam, mesmo que não possuam outro debuff.\nChefes e criaturas imunes ao sono não adormecem. Em vez disso, perdem 30% de INI e causam 25% menos dano durante 1 turno.\nTipo: Ativa — Travessura;\nCusto: 85 de Mana;\nRecarga: 5 turnos;\nDuração: 2 turnos;\nPó Feérico: Pode consumir 2 pontos.",
        },
        {
          level: 80,
          title: "Milagre Caprichoso",
          description:
            "A Fada concentra todo o Pó Feérico acumulado e realiza um grande fenômeno mágico.\nA habilidade exige pelo menos 3 pontos de Pó e consome todos os pontos acumulados.\nA Fada escolhe uma manifestação:\nAurora Benevolente — Encanto\nTodos os aliados recuperam:\n1,2x ARC + 0,2x ARC por ponto de Pó consumido\nTambém recebem um escudo equivalente a 0,5x ARC por ponto consumido.\nCom 5 pontos, a Fada remove um efeito negativo comum de cada aliado.\nTempestade Travessa — Travessura\nTodos os inimigos recebem:\n1,4x INT + 0,8x ARC\nPara cada ponto consumido, o dano aumenta em 0,2x INT.\nCom 5 pontos, os inimigos também:\nPerdem suas reações por 1 turno;\nTêm um benefício mágico removido;\nRecebem 25% menos cura durante 2 turnos.\nTipo: Ativa — Encanto ou Travessura;\nCusto: 110 de Mana;\nRecarga: 6 turnos;\nRequisito: Pelo menos 3 pontos de Pó.",
        },
        {
          level: 100,
          title: "Manifestação do Coração Feérico",
          description:
            "A Fada abre completamente sua conexão com o Véu. Seu corpo passa a irradiar magia pura e suas asas assumem uma forma majestosa.\nAo se transformar:\nRecebe imediatamente 5 pontos de Pó Feérico;\nRecupera 20% da Mana máxima;\nRemove de si um efeito de controle;\nCria um escudo equivalente a 2x ARC;\nAbre pequenas passagens feéricas ao redor do campo.\nDurante os próximos 3 turnos:\nRecebe 20% de INT, ARC e INI;\nO primeiro ponto de Pó consumido em cada turno não é removido;\nHarmonia Feérica pode acontecer duas vezes por rodada;\nO bônus da Harmonia aumenta de 10% para 20%;\nFaísca Prismática atinge um segundo alvo com 60% da eficiência;\nA Fada pode reposicionar um aliado após utilizar um Encanto;\nApós utilizar uma Travessura, o inimigo afetado perde 10% de RES por 1 turno;\nSuas asas não podem ser desativadas por dano comum.\nQuando a transformação termina, a Fada perde todo o Pó Feérico e entra em Melancolia Feérica por 2 turnos:\nNão pode gerar Pó;\nPerde 15% de INI;\nSuas curas e seus danos raciais ficam 10% menos eficientes;\nNão pode utilizar novamente a Manifestação.\nTipo: Transformação racial máxima;\nCusto: 160 de Mana;\nRecarga: Uma vez por combate;\nDuração: 3 turnos;\nMelancolia: 2 turnos.",
        },
      ],
    },
  },
  {
    name: "Humano",
    slug: "humano",
    payload: {
      description:
        "Os Humanos são a raça mais versátil de Wonderland. Não possuem asas, regeneração sobrenatural ou uma afinidade mágica natural, mas compensam essas limitações com adaptação, determinação e capacidade de superar situações adversas.\nSeu estilo de jogo permite fortalecer praticamente qualquer classe. Humanos podem assumir posturas ofensivas, defensivas ou táticas, utilizando Determinação para aprimorar ataques, proteções e habilidades de suporte.\n\nDescrição\nA verdadeira origem dos Humanos permanece desconhecida. Diferentemente de outras raças, eles não reivindicam descendência de dragões, espíritos, divindades ou forças primordiais. Algumas teorias afirmam que surgiram naturalmente com o desenvolvimento do mundo; outras acreditam que foram criados para representar todas as possibilidades mortais.\nFisicamente, apresentam uma enorme variedade de alturas, tons de pele, cabelos, olhos e características corporais. Não possuem uma aparência única capaz de representar toda a raça.\nTambém não existe uma única cultura humana. Seus costumes variam conforme o reino, a religião, o clima, a história e as condições sociais de cada região. Dois povos humanos podem ser tão diferentes entre si quanto comunidades pertencentes a raças completamente distintas.\nSua vida relativamente curta cria um forte senso de urgência. Humanos constroem reinos, desafiam tradições e perseguem objetivos que outras raças levariam séculos para considerar. Essa ambição pode torná-los grandes heróis, inventores e líderes, mas também conquistadores perigosos.\nNo mundo de Wonderland, Humanos são encontrados em praticamente todos os territórios e ocupam as mais diferentes funções.\n\nEstilo de Jogo\nFunção principal: Adaptável;\nFunções secundárias: Qualquer função;\nPontos fortes: Versatilidade, resistência mental e recuperação diante de dificuldades;\nPontos fracos: Ausência de vantagens naturais extremas;\nAtributos recomendados: Dependem da classe escolhida.\n\nCuriosidades\nHumanos não possuem uma cultura única; suas tradições mudam completamente entre diferentes regiões.\nSua capacidade de adaptação permitiu que construíssem comunidades em praticamente todos os ambientes.\nEmbora vivam menos que muitas raças, aprendem e se desenvolvem rapidamente.\nHumanos podem dominar magia tão bem quanto qualquer povo naturalmente mágico, mas precisam conquistá-la por estudo ou treinamento.\nSão conhecidos por misturar costumes, técnicas e conhecimentos de culturas diferentes.\nMuitas invenções surgiram de tentativas humanas de reproduzir capacidades naturais de outras raças.\nAlguns povos consideram sua ambição uma virtude; outros a enxergam como uma das maiores ameaças de Wonderland.\nHumanos formam alianças e rivalidades com enorme rapidez.\nReinos humanos costumam mudar de governo, território e tradição em poucas gerações.\nPor não possuírem uma natureza sobrenatural específica, são menos afetados por artefatos que atacam uma linhagem determinada.\nÉ comum que aventureiros humanos sejam lembrados por títulos conquistados, e não pela família em que nasceram.\nA maior característica dos Humanos não é aquilo que são ao nascer, mas aquilo que decidem se tornar.",
      imageUrl: "",
      difficulty: 2,
      baseHp: 550,
      baseMana: 0,
      attributeBonuses: {
        FOR: 3,
        DEF: 2,
        RES: 3,
        INI: 3,
        INT: 2,
        ARC: 2,
      },
      mechanics: [
        {
          name: "Determinação",
          description:
            "O Humano pode acumular até 3 pontos de Determinação e começa cada combate com 1 ponto.\nDurante cada combate, recebe 1 ponto na primeira vez que:\nFica com 75% ou menos do HP;\nFica com 40% ou menos do HP;\nResiste a um efeito de controle;\nUm aliado é reduzido a 0 de HP.\nCada condição só pode gerar Determinação uma vez por combate. Normalmente, apenas 1 ponto pode ser recebido por rodada.\nA Determinação pode ser utilizada para fortalecer ações, resistir a ataques fatais e superar temporariamente os próprios limites.\nTodos os pontos desaparecem ao final do combate.",
        },
      ],
      traits: [
        {
          name: "Adaptabilidade",
          description:
            "Depois de receber dano, o Humano pode adaptar sua postura ao tipo daquela fonte.\nEle recebe 10% de resistência contra o tipo de dano escolhido até o final do combate.\nExemplos:\nDano físico;\nFogo;\nGelo;\nEletricidade;\nDano mágico;\nVeneno.\nO Humano só pode manter uma adaptação por vez. Escolher um novo tipo substitui o anterior.\nA resistência não pode ser escolhida contra dano verdadeiro e só pode ser alterada uma vez por rodada.",
        },
        {
          name: "Determinação Inabalável",
          description:
            "O Humano recebe 15% de resistência contra medo, intimidação e efeitos que tentem obrigá-lo a desistir ou abandonar o combate.\nSempre que gastar seu último ponto de Determinação:\nRecebe 15% de INI até o início do próximo turno;\nReduz em 1 turno a duração de um efeito negativo que esteja sofrendo.\nA redução não remove efeitos considerados absolutos ou incuráveis.",
        },
      ],
      progression: [
        {
          level: 1,
          title: "Esforço Decisivo",
          description:
            "O Humano utiliza sua Determinação para fortalecer uma ação no momento em que ela é realizada.\nO jogador escolhe uma das seguintes aplicações:\nOfensiva\nApós acertar um ataque ou habilidade, causa dano adicional equivalente a:\n0,4x do maior atributo entre FOR e INT\nO dano adicional possui o mesmo tipo do ataque original.\nDefensiva\nAo receber dano, reduz o valor final em 20%.\nEssa opção é utilizada como reação.\nSuporte\nAo utilizar uma cura ou escudo, aumenta seu valor em:\n0,4x ARC\nTambém pode escolher aumentar em 1 turno a duração de um buff aplicado, em vez de aumentar seu valor.\nTipo: Reação — Aprimoramento;\nCusto: 1 ponto de Determinação;\nRecarga: 2 turnos.",
        },
        {
          level: 20,
          title: "Postura Adaptável",
          description:
            "O Humano analisa a situação e assume uma postura adequada durante 2 turnos.\nPostura Ofensiva\nCausa 15% mais dano;\nSeus ataques ignoram 5% da DEF ou RES.\nPostura Defensiva\nRecebe 15% menos dano;\nRecebe 20% de resistência contra derrubadas e deslocamentos.\nPostura Tática\nRecebe 20% de INI;\nCuras, escudos, buffs e debuffs ficam 10% mais eficientes.\nApenas uma postura pode permanecer ativa.\nO Humano pode gastar 1 ponto de Determinação no início do próprio turno para trocar de postura sem utilizar uma ação e renovar a duração.\nTipo: Ativa — Postura;\nCusto: Não possui;\nRecarga: 4 turnos;\nDuração: 2 turnos;\nDeterminação: Pode consumir 1 ponto para trocar.",
        },
        {
          level: 40,
          title: "Ainda Não Acabou",
          description:
            "Quando receber um dano que reduziria seu HP a 0, o Humano pode recusar-se a cair.\nAo ativar a habilidade:\nPermanece com 1 de HP;\nRecebe um escudo equivalente a 1x RES;\nRemove de si um efeito comum de medo, atordoamento ou imobilização;\nRecebe 20% de INI até o final do próximo turno.\nA habilidade não pode impedir efeitos de execução ou situações em que o corpo seja completamente destruído.\nTipo: Reação — Sobrevivência;\nCusto: 2 pontos de Determinação;\nRecarga: Uma vez por combate.",
        },
        {
          level: 60,
          title: "União dos Povos",
          description:
            "O Humano inspira seus aliados, lembrando-os de tudo pelo que estão lutando.\nDurante 2 turnos, todos os aliados recebem:\n10% de aumento no dano causado;\n10% de redução no dano recebido;\n15% de INI;\n20% de resistência contra medo e intimidação.\nO Humano pode gastar 1 ponto de Determinação para remover um efeito comum de medo ou intimidação de cada aliado afetado.\nCaso esteja lutando sozinho, os bônus de dano e redução recebidos pelo Humano aumentam para 15%.\nTipo: Ativa — Fortalecimento coletivo;\nCusto: Não possui;\nRecarga: 5 turnos;\nDuração: 2 turnos;\nDeterminação: Pode consumir 1 ponto.",
        },
        {
          level: 80,
          title: "Além dos Limites",
          description:
            "O Humano reúne toda a sua força de vontade e realiza imediatamente uma ação adicional.\nA ação adicional:\nPossui 70% da eficiência normal;\nMantém seus custos normais de Mana ou outros recursos;\nAtiva normalmente a recarga da habilidade utilizada;\nNão pode ser uma habilidade máxima;\nNão pode utilizar novamente Além dos Limites.\nApós realizar a ação, o Humano sofre Sobrecarga Física até o final do próximo turno:\nPerde 20% de INI;\nNão pode receber novas ações adicionais;\nRecebe 10% menos cura.\nTipo: Ativa — Ação adicional;\nCusto: 3 pontos de Determinação;\nRecarga: Uma vez por combate;\nSobrecarga: 1 turno.",
        },
        {
          level: 100,
          title: "Vontade da Humanidade",
          description:
            "O Humano desperta todo o potencial de sua natureza mortal. Não assume outra forma nem invoca uma linhagem ancestral: ele simplesmente ultrapassa aquilo que acreditava ser seu limite.\nAo ativar a habilidade:\nRecupera 20% do HP máximo;\nRecupera 15% da Mana máxima;\nRecebe imediatamente 3 pontos de Determinação;\nRemove de si um efeito negativo comum;\nPode escolher novamente a resistência de Adaptabilidade.\nDurante os próximos 3 turnos:\nFOR, DEF, RES, INI, INT e ARC aumentam em 15%;\nPode manter duas resistências de Adaptabilidade ao mesmo tempo;\nO primeiro ponto de Determinação gasto em cada turno não é consumido;\nEsforço Decisivo pode ser utilizado uma vez por turno sem considerar sua recarga;\nTrocar de Postura Adaptável não consome Determinação;\nAo resistir a um efeito negativo, recupera 5% do HP máximo;\nA primeira vez que ficaria com 0 de HP, permanece com 1, mesmo que Ainda Não Acabou já tenha sido utilizado.\nO efeito de sobrevivência da habilidade só pode acontecer uma vez.\nAo final, o Humano entra em Exaustão Mortal durante 2 turnos:\nSeus atributos são reduzidos em 10%;\nNão pode gerar Determinação;\nNão pode utilizar ações adicionais;\nNão pode utilizar novamente Vontade da Humanidade.\nTipo: Superação racial máxima;\nCusto: Não possui;\nRecarga: Uma vez por combate;\nDuração: 3 turnos;\nExaustão: 2 turnos.",
        },
      ],
    },
  },
  {
    name: "Orc",
    slug: "orc",
    payload: {
      description:
        "Os Orcs são combatentes resistentes que se tornam mais perigosos conforme o combate se prolonga. Sua principal mecânica é o Ímpeto de Batalha, acumulado ao causar dano, suportar ataques e resistir a efeitos de controle.\nSeu estilo é direto, mas não completamente simples: preservar o Ímpeto concede bônus constantes, enquanto consumi-lo permite utilizar poderosos ataques e habilidades defensivas.\n\nDescrição\nOs Orcs descendem dos povos que sobreviveram às primeiras grandes guerras de Wonderland. Enquanto outras civilizações se protegiam atrás de muralhas ou magia, os ancestrais dos Orcs precisaram atravessar territórios destruídos, enfrentar criaturas e reconstruir suas comunidades inúmeras vezes.\nCom o passar das gerações, seus corpos tornaram-se resistentes, musculosos e adaptados às condições mais severas. Possuem presas inferiores desenvolvidas, orelhas pontiagudas e pele que pode apresentar tons de verde, cinza, marrom, vermelho ou até azul.\nA sociedade Orc é geralmente organizada em clãs, mas cada um possui tradições próprias. Alguns valorizam guerreiros, enquanto outros são liderados por ferreiros, curandeiros, caçadores, anciões ou contadores de histórias.\nPara os Orcs, força não representa apenas poder físico. Ser forte significa cumprir responsabilidades, proteger a comunidade e suportar as consequências das próprias decisões.\nEmbora muitos povos os tratem como selvagens, os Orcs possuem grandes conhecimentos de sobrevivência, metalurgia, construção e medicina de campo. Suas histórias são preservadas oralmente, fazendo com que seus narradores ocupem posições de enorme respeito.\n\nEstilo de Jogo\nFunção principal: Combatente físico;\nFunções secundárias: Tanque e suporte ofensivo;\nPontos fortes: HP elevado, resistência, dano físico e controle de linha de frente;\nPontos fracos: INI baixa, pouca afinidade mágica e dependência de combate contínuo;\nAtributos recomendados: FOR, RES e DEF.\n\nCuriosidades\nA cor da pele dos Orcs varia conforme linhagem, território e exposição mágica.\nSuas presas crescem lentamente durante toda a vida e exigem cuidados frequentes.\nPresas quebradas podem ser reparadas com peças de metal, pedra ou osso.\nOrcs não possuem inteligência inferior às outras raças. Essa ideia surgiu de preconceitos mantidos por povos rivais.\nMuitos clãs preservam sua história por meio de músicas, tatuagens e narrativas orais.\nCicatrizes podem representar grandes conquistas, mas nem todo Orc sente orgulho delas.\nFerreiros Orcs são conhecidos por criar equipamentos extremamente resistentes.\nUm clã pode adotar membros de qualquer raça.\nSer expulso de um clã não impede que um Orc construa ou seja aceito por outro.\nAlguns Orcs utilizam nomes compostos por feitos, lugares ou pessoas importantes.\nConflitos entre clãs nem sempre são resolvidos por combate. Competições, debates e trocas de presentes também são comuns.\nOrcs possuem grande respeito por quem continua lutando apesar do medo.\nDemonstrar emoções não é considerado fraqueza em muitas culturas Orcs.\nPara um Orc, a verdadeira força é medida principalmente por aquilo que alguém consegue proteger.",
      imageUrl: "",
      difficulty: 3,
      baseHp: 750,
      baseMana: 0,
      attributeBonuses: {
        FOR: 5,
        DEF: 3,
        RES: 4,
        INI: 1,
        INT: 1,
        ARC: 1,
      },
      mechanics: [
        {
          name: "Ímpeto de Batalha",
          description:
            "O Orc pode acumular até 4 pontos de Ímpeto.\nEle recebe 1 ponto quando:\nCausa dano direto a um inimigo;\nRecebe de uma única fonte dano equivalente a 10% ou mais do HP máximo;\nResiste a medo, atordoamento, derrubada ou deslocamento;\nProtege um aliado de um ataque.\nNormalmente, somente 1 ponto pode ser recebido por turno.\nCada ponto mantido concede:\n3% de aumento no dano físico;\n3% de resistência contra efeitos de controle.\nCom 4 pontos, o Orc recebe 12% de aumento no dano físico e 12% de resistência contra controle.\nCaso passe uma rodada inteira sem causar ou receber dano, perde 2 pontos de Ímpeto.\nAlgumas habilidades consomem Ímpeto para produzir efeitos mais poderosos. Todos os pontos desaparecem ao final do combate.",
        },
      ],
      traits: [
        {
          name: "Constituição Titânica",
          description:
            "O organismo Orc é extremamente resistente.\nCuras recebidas são 10% mais eficientes;\nRecebe 20% de resistência contra venenos e doenças;\nA duração de Sangramentos comuns é reduzida em 1 turno;\nSuporta peso e esforço físico por períodos maiores que outras raças.\nA eficiência adicional afeta curas, regenerações e poções, mas não funciona sobre escudos.",
        },
        {
          name: "Vontade de Ferro",
          description:
            "O Orc recebe 25% de resistência contra:\nMedo;\nIntimidação;\nDerrubada;\nDeslocamento forçado.\nA duração desses efeitos é reduzida em 1 turno. Quando resistir completamente a um deles, recebe 1 ponto de Ímpeto.",
        },
      ],
      progression: [
        {
          level: 1,
          title: "Golpe Demolidor",
          description:
            "O Orc desfere um ataque carregado de força bruta, causando dano físico equivalente a:\n1,5x FOR\nCom pelo menos 2 pontos de Ímpeto, o ataque ignora 10% da DEF do alvo.\nO Orc pode consumir 2 pontos para aplicar Fratura durante 2 turnos:\nA DEF do alvo é reduzida em 15%;\nEscudos recebidos pelo alvo ficam 20% menos eficientes;\nA próxima tentativa de resistir a uma derrubada recebe 20% de penalidade.\nTipo: Ativa — Ataque físico;\nCusto: Não possui;\nRecarga: 1 turno;\nÍmpeto: Pode consumir 2 pontos.",
        },
        {
          level: 20,
          title: "Marcha Imparável",
          description:
            "O Orc avança violentamente contra um inimigo, atravessando obstáculos e tentativas de contenção.\nAo alcançar o alvo, causa dano físico equivalente a:\n1,2x FOR\nDurante o avanço:\nNão pode ser interrompido por reações comuns;\nIgnora terreno difícil;\nRecebe 30% de resistência contra imobilização e deslocamento.\nO Orc pode consumir 1 ponto de Ímpeto para derrubar o alvo. Caso a criatura seja muito grande para ser derrubada, ela perde 20% de INI durante 1 turno.\nSe percorrer uma grande distância antes do impacto, o ataque causa 0,3x FOR como dano adicional.\nTipo: Ativa — Mobilidade e ataque;\nCusto: Não possui;\nRecarga: 3 turnos;\nÍmpeto: Pode consumir 1 ponto.",
        },
        {
          level: 40,
          title: "Postura Inabalável",
          description:
            "O Orc firma os pés no chão e se prepara para suportar qualquer ataque durante 2 turnos.\nEnquanto a postura estiver ativa:\nRecebe 20% menos dano;\nNão pode ser derrubado ou deslocado por efeitos comuns;\nA primeira vez que receber dano em cada turno, recebe um escudo equivalente a 0,4x RES;\nNão perde Ímpeto por passar uma rodada sem atacar.\nA habilidade exige 2 pontos de Ímpeto.\nTipo: Ativa — Defensiva;\nCusto: 2 pontos de Ímpeto;\nRecarga: 4 turnos;\nDuração: 2 turnos.",
        },
        {
          level: 60,
          title: "Grito do Clã",
          description:
            "O Orc libera um poderoso grito de guerra, fortalecendo a determinação de todos os seus aliados.\nDurante 2 turnos, os personagens afetados recebem:\n10% de aumento no dano causado;\n20% de resistência contra medo e intimidação;\n15% de resistência contra derrubadas e deslocamentos;\n10% de aumento nas curas recebidas.\nO Orc pode consumir até 2 pontos de Ímpeto:\n1 ponto: Remove um efeito comum de medo dos aliados;\n2 pontos: Os aliados também recebem 10% de redução de dano por 2 turnos.\nCaso esteja lutando sozinho, o Orc recebe todos os benefícios e recupera 5% do HP máximo.\nTipo: Ativa — Fortalecimento coletivo;\nCusto: Não possui;\nRecarga: 5 turnos;\nDuração: 2 turnos;\nÍmpeto: Pode consumir até 2 pontos.",
        },
        {
          level: 80,
          title: "Golpe Quebra-Terra",
          description:
            "O Orc concentra toda a força acumulada e golpeia o chão, um inimigo ou uma estrutura.\nO alvo principal recebe:\n2x FOR\nTodos os outros inimigos próximos recebem:\n1,2x FOR\nA habilidade exige pelo menos 2 pontos de Ímpeto e consome todos os pontos acumulados.\nPara cada ponto consumido:\nO alvo principal recebe 0,3x FOR como dano adicional;\nOs demais inimigos recebem 0,15x FOR como dano adicional.\nCom 4 pontos consumidos:\nO alvo principal é derrubado;\nOs demais inimigos perdem 25% de INI;\nA área atingida torna-se terreno difícil por 2 turnos;\nBarreiras e escudos recebem 50% de dano adicional.\nCriaturas colossais não são derrubadas, mas têm habilidades canalizadas interrompidas.\nTipo: Ativa — Ataque em área;\nCusto: Todo o Ímpeto acumulado;\nRecarga: 6 turnos;\nRequisito: Pelo menos 2 pontos.",
        },
        {
          level: 100,
          title: "Lenda Viva do Primeiro Clã",
          description:
            "O Orc desperta a força de todos aqueles que lutaram antes dele. Marcas de guerra surgem sobre seu corpo enquanto sua presença inspira aliados e intimida inimigos.\nAo ativar a habilidade:\nRecupera 20% do HP máximo;\nRecebe imediatamente 4 pontos de Ímpeto;\nRemove de si efeitos comuns de medo, atordoamento e imobilização;\nLibera um grito que reduz em 15% o dano causado pelos inimigos próximos durante 1 turno.\nDurante os próximos 3 turnos:\nRecebe 20% de FOR e RES;\nRecebe 15% de DEF;\nPode gerar até 2 pontos de Ímpeto por turno;\nSeu Ímpeto não pode ser reduzido para menos de 2;\nAtaques físicos contra um alvo atingem um segundo inimigo próximo com 40% da eficiência;\nMarcha Imparável não pode ser interrompida;\nPostura Inabalável pode ser ativada uma vez sem consumir Ímpeto;\nGrito do Clã pode ser utilizado uma vez sem considerar sua recarga.\nA primeira vez que receber um dano que reduziria seu HP a 0 durante a habilidade, o Orc:\nPermanece com 1 de HP;\nRecupera 10% do HP máximo;\nRecebe um escudo equivalente a 1,5x RES;\nPerde todo o Ímpeto acima de 2.\nEsse efeito só pode acontecer uma vez.\nAo final, o Orc perde todo o Ímpeto e entra em Exaustão de Guerra por 2 turnos:\nNão pode gerar Ímpeto;\nCausa 10% menos dano;\nPerde 20% de INI;\nNão pode utilizar novamente Lenda Viva do Primeiro Clã.\nTipo: Superação racial máxima;\nCusto: Não possui;\nRecarga: Uma vez por combate;\nDuração: 3 turnos;\nExaustão: 2 turnos.",
        },
      ],
    },
  },
] satisfies OfficialRaceDefinition[];
