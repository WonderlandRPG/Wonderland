"use strict";

/* Dados completos do Códice de Raças de Wonderland. */
window.WONDERLAND_RACES = [
  {
    "id": "humano",
    "name": "Humano",
    "icon": "✦",
    "theme": {
      "accent": "#d6b56b",
      "secondary": "#6e829a"
    },
    "archetype": "Raça adaptável",
    "tagline": "A maior característica dos Humanos não é aquilo que são ao nascer, mas aquilo que decidem se tornar.",
    "difficulty": 2,
    "roles": [
      "Adaptável",
      "Ofensivo",
      "Defensivo",
      "Tático"
    ],
    "description": [
      "A verdadeira origem dos Humanos permanece desconhecida. Diferentemente de outras raças, eles não reivindicam descendência de dragões, espíritos, divindades ou forças primordiais. Algumas teorias afirmam que surgiram naturalmente com o desenvolvimento do mundo; outras acreditam que foram criados para representar todas as possibilidades mortais.",
      "Fisicamente, apresentam uma enorme variedade de alturas, tons de pele, cabelos, olhos e características corporais. Não possuem uma aparência única capaz de representar toda a raça.",
      "Também não existe uma única cultura humana. Seus costumes variam conforme o reino, a religião, o clima, a história e as condições sociais de cada região. Dois povos humanos podem ser tão diferentes entre si quanto comunidades pertencentes a raças completamente distintas.",
      "Sua vida relativamente curta cria um forte senso de urgência. Humanos constroem reinos, desafiam tradições e perseguem objetivos que outras raças levariam séculos para considerar. Essa ambição pode torná-los grandes heróis, inventores e líderes, mas também conquistadores perigosos.",
      "No mundo de Wonderland, Humanos são encontrados em praticamente todos os territórios e ocupam as mais diferentes funções."
    ],
    "playstyle": {
      "main": "Adaptável",
      "secondary": "Qualquer função",
      "strengths": "Versatilidade, resistência mental e recuperação diante de dificuldades",
      "weaknesses": "Ausência de vantagens naturais extremas",
      "recommended": [
        "Dependem da classe escolhida"
      ]
    },
    "stats": {
      "hp": 550,
      "mana": "Sem bônus",
      "attributes": {
        "FOR": 3,
        "DEF": 2,
        "RES": 3,
        "INI": 3,
        "INT": 2,
        "ARC": 2
      }
    },
    "mechanics": [
      {
        "title": "Determinação",
        "content": "<p>O Humano pode acumular até <strong>3 pontos de Determinação</strong> e começa cada combate com 1 ponto.</p><p>Durante cada combate, recebe 1 ponto na primeira vez que:</p><ul><li>Fica com 75% ou menos do HP;</li><li>Fica com 40% ou menos do HP;</li><li>Resiste a um efeito de controle;</li><li>Um aliado é reduzido a 0 de HP.</li></ul><p>Cada condição só pode gerar Determinação uma vez por combate. Normalmente, apenas 1 ponto pode ser recebido por rodada.</p><p>A Determinação pode ser utilizada para fortalecer ações, resistir a ataques fatais e superar temporariamente os próprios limites. Todos os pontos desaparecem ao final do combate.</p>"
      }
    ],
    "traits": [
      {
        "label": "Passiva I",
        "title": "Adaptabilidade",
        "content": "<p>Depois de receber dano, o Humano pode adaptar sua postura ao tipo daquela fonte.</p><p>Recebe <strong>10% de resistência</strong> contra o tipo escolhido até o final do combate. Exemplos: dano físico, fogo, gelo, eletricidade, dano mágico ou veneno.</p><p>O Humano só pode manter uma adaptação por vez. Escolher um novo tipo substitui o anterior. A resistência não pode ser escolhida contra dano verdadeiro e só pode ser alterada uma vez por rodada.</p>"
      },
      {
        "label": "Passiva II",
        "title": "Determinação Inabalável",
        "content": "<p>O Humano recebe <strong>15% de resistência</strong> contra medo, intimidação e efeitos que tentem obrigá-lo a desistir ou abandonar o combate.</p><p>Sempre que gastar seu último ponto de Determinação:</p><ul><li>Recebe 15% de INI até o início do próximo turno;</li><li>Reduz em 1 turno a duração de um efeito negativo que esteja sofrendo.</li></ul><p>A redução não remove efeitos considerados absolutos ou incuráveis.</p>"
      }
    ],
    "weakness": null,
    "progression": [
      {
        "level": 1,
        "name": "Esforço Decisivo",
        "category": "Reação — Aprimoramento",
        "content": "<p>O Humano utiliza sua Determinação para fortalecer uma ação no momento em que ela é realizada.</p><p><strong>Ofensiva:</strong> após acertar um ataque ou habilidade, causa dano adicional equivalente a:</p><div class=\"skill-formula\">40% do maior atributo entre FOR e INT</div><p>O dano adicional possui o mesmo tipo do ataque original.</p><p><strong>Defensiva:</strong> ao receber dano, reduz o valor final em 20%. Essa opção é utilizada como reação.</p><p><strong>Suporte:</strong> ao utilizar uma cura ou escudo, aumenta seu valor em 40% do ARC. Também pode escolher aumentar em 1 turno a duração de um buff aplicado, em vez de aumentar seu valor.</p>",
        "meta": [
          "Custo: 1 Determinação",
          "Recarga: 2 turnos"
        ]
      },
      {
        "level": 20,
        "name": "Postura Adaptável",
        "category": "Ativa — Postura",
        "content": "<p>O Humano analisa a situação e assume uma postura adequada durante 2 turnos.</p><p><strong>Postura Ofensiva</strong></p><ul><li>Causa 15% mais dano;</li><li>Seus ataques ignoram 5% da DEF ou RES.</li></ul><p><strong>Postura Defensiva</strong></p><ul><li>Recebe 15% menos dano;</li><li>Recebe 20% de resistência contra derrubadas e deslocamentos.</li></ul><p><strong>Postura Tática</strong></p><ul><li>Recebe 20% de INI;</li><li>Curas, escudos, buffs e debuffs ficam 10% mais eficientes.</li></ul><p>Apenas uma postura pode permanecer ativa. O Humano pode gastar 1 ponto de Determinação no início do próprio turno para trocar de postura sem utilizar uma ação e renovar a duração.</p>",
        "meta": [
          "Sem custo",
          "Recarga: 4 turnos",
          "Duração: 2 turnos",
          "Pode consumir 1 Determinação"
        ]
      },
      {
        "level": 40,
        "name": "Ainda Não Acabou",
        "category": "Reação — Sobrevivência",
        "content": "<p>Quando receber um dano que reduziria seu HP a 0, o Humano pode recusar-se a cair.</p><p>Ao ativar:</p><ul><li>Permanece com 1 de HP;</li><li>Recebe um escudo equivalente a 100% da RES;</li><li>Remove de si um efeito comum de medo, atordoamento ou imobilização;</li><li>Recebe 20% de INI até o final do próximo turno.</li></ul><p>A habilidade não pode impedir efeitos de execução ou situações em que o corpo seja completamente destruído.</p>",
        "meta": [
          "Custo: 2 Determinações",
          "Uma vez por combate"
        ]
      },
      {
        "level": 60,
        "name": "União dos Povos",
        "category": "Ativa — Fortalecimento coletivo",
        "content": "<p>O Humano inspira seus aliados durante 2 turnos.</p><p>Todos os aliados recebem:</p><ul><li>10% de aumento no dano causado;</li><li>10% de redução no dano recebido;</li><li>15% de INI;</li><li>20% de resistência contra medo e intimidação.</li></ul><p>Pode gastar 1 ponto de Determinação para remover um efeito comum de medo ou intimidação de cada aliado afetado.</p><p>Caso esteja lutando sozinho, os bônus de dano e redução recebidos pelo Humano aumentam para 15%.</p>",
        "meta": [
          "Sem custo",
          "Recarga: 5 turnos",
          "Duração: 2 turnos",
          "Pode consumir 1 Determinação"
        ]
      },
      {
        "level": 80,
        "name": "Além dos Limites",
        "category": "Ativa — Ação adicional",
        "content": "<p>O Humano reúne toda a sua força de vontade e realiza imediatamente uma ação adicional.</p><p>A ação adicional:</p><ul><li>Possui 70% da eficiência normal;</li><li>Mantém seus custos normais de Mana ou outros recursos;</li><li>Ativa normalmente a recarga da habilidade utilizada;</li><li>Não pode ser uma habilidade máxima;</li><li>Não pode utilizar novamente Além dos Limites.</li></ul><p>Após a ação, sofre <strong>Sobrecarga Física</strong> até o final do próximo turno:</p><ul><li>Perde 20% de INI;</li><li>Não pode receber novas ações adicionais;</li><li>Recebe 10% menos cura.</li></ul>",
        "meta": [
          "Custo: 3 Determinações",
          "Uma vez por combate",
          "Sobrecarga: 1 turno"
        ]
      },
      {
        "level": 100,
        "name": "Vontade da Humanidade",
        "category": "Superação racial máxima",
        "content": "<p>O Humano desperta todo o potencial de sua natureza mortal.</p><p>Ao ativar:</p><ul><li>Recupera 20% do HP máximo;</li><li>Recupera 15% da Mana máxima;</li><li>Recebe imediatamente 3 pontos de Determinação;</li><li>Remove de si um efeito negativo comum;</li><li>Pode escolher novamente a resistência de Adaptabilidade.</li></ul><p>Durante os próximos 3 turnos:</p><ul><li>FOR, DEF, RES, INI, INT e ARC aumentam em 15%;</li><li>Pode manter duas resistências de Adaptabilidade;</li><li>O primeiro ponto de Determinação gasto em cada turno não é consumido;</li><li>Esforço Decisivo pode ser utilizado uma vez por turno sem considerar sua recarga;</li><li>Trocar de Postura Adaptável não consome Determinação;</li><li>Ao resistir a um efeito negativo, recupera 5% do HP máximo;</li><li>A primeira vez que ficaria com 0 de HP, permanece com 1, mesmo que Ainda Não Acabou já tenha sido utilizado.</li></ul><p>Ao final, entra em <strong>Exaustão Mortal</strong> durante 2 turnos:</p><ul><li>Seus atributos são reduzidos em 10%;</li><li>Não pode gerar Determinação;</li><li>Não pode utilizar ações adicionais;</li><li>Não pode utilizar novamente Vontade da Humanidade.</li></ul>",
        "meta": [
          "Sem custo",
          "Uma vez por combate",
          "Duração: 3 turnos",
          "Exaustão: 2 turnos"
        ]
      }
    ],
    "curiosities": [
      "Humanos não possuem uma cultura única; suas tradições mudam completamente entre diferentes regiões.",
      "Sua capacidade de adaptação permitiu que construíssem comunidades em praticamente todos os ambientes.",
      "Embora vivam menos que muitas raças, aprendem e se desenvolvem rapidamente.",
      "Humanos podem dominar magia tão bem quanto qualquer povo naturalmente mágico, mas precisam conquistá-la por estudo ou treinamento.",
      "São conhecidos por misturar costumes, técnicas e conhecimentos de culturas diferentes.",
      "Muitas invenções surgiram de tentativas humanas de reproduzir capacidades naturais de outras raças.",
      "Alguns povos consideram sua ambição uma virtude; outros a enxergam como uma das maiores ameaças de Wonderland.",
      "Humanos formam alianças e rivalidades com enorme rapidez.",
      "Reinos humanos costumam mudar de governo, território e tradição em poucas gerações.",
      "Por não possuírem uma natureza sobrenatural específica, são menos afetados por artefatos que atacam uma linhagem determinada.",
      "É comum que aventureiros humanos sejam lembrados por títulos conquistados, e não pela família em que nasceram.",
      "A maior característica dos Humanos não é aquilo que são ao nascer, mas aquilo que decidem se tornar."
    ]
  },
  {
    "id": "aengel",
    "name": "Aengel",
    "icon": "✧",
    "theme": {
      "accent": "#f3d27b",
      "secondary": "#79cfff"
    },
    "archetype": "Guardião celestial",
    "tagline": "Descendentes da Luz Primordial que alternam entre cura, proteção e julgamento.",
    "difficulty": 4,
    "roles": [
      "Suporte",
      "Proteção",
      "Controle",
      "Dano mágico"
    ],
    "description": [
      "Os Aengels descendem da Luz Primordial, uma força celestial anterior à formação dos primeiros reinos de Wonderland. Segundo suas tradições, os primeiros Aengels foram enviados ao mundo como guardiões do equilíbrio.",
      "Possuem aparência predominantemente humana, mas são reconhecidos por asas, olhos luminosos e marcas douradas. A quantidade, o formato e a coloração das asas variam conforme a linhagem.",
      "Sua sociedade valoriza disciplina, honra, responsabilidade e autocontrole. Muitos tornam-se guardiões, sacerdotes, juízes ou conselheiros.",
      "Nem todos defendem a mesma visão de justiça. Alguns protegem os mortais, enquanto outros acreditam que somente uma ordem absoluta poderá salvar Wonderland."
    ],
    "playstyle": {
      "main": "Suporte e proteção",
      "secondary": "Controle e dano mágico",
      "strengths": "Curas, escudos, proteção de aliados e versatilidade",
      "weaknesses": "Dependência de preparação e gerenciamento de Radiância",
      "recommended": [
        "ARC",
        "RES",
        "DEF",
        "INT"
      ]
    },
    "stats": {
      "hp": 450,
      "mana": "+100",
      "attributes": {
        "FOR": 1,
        "DEF": 3,
        "RES": 3,
        "INI": 2,
        "INT": 2,
        "ARC": 4
      }
    },
    "mechanics": [
      {
        "title": "Radiância",
        "content": "<p>O Aengel pode acumular até <strong>5 pontos de Radiância</strong>.</p><p>Recebe 1 ponto quando:</p><ul><li>Cura, protege com escudo ou fortalece outro aliado;</li><li>Atinge um inimigo com habilidade racial;</li><li>Utiliza uma reação racial para proteger alguém.</li></ul><p>Normalmente, somente 1 ponto pode ser obtido por turno. A Radiância pode ser consumida para fortalecer habilidades e desaparece ao final do combate.</p>"
      }
    ],
    "traits": [
      {
        "label": "Passiva I",
        "title": "Luz Celestial",
        "content": "<p>Curas e escudos raciais são <strong>10% mais eficientes</strong>.</p><p>Uma vez por rodada, ao ajudar um aliado com menos de 50% do HP, recebe 1 Radiância adicional.</p>"
      },
      {
        "label": "Passiva II — Reação",
        "title": "Asas da Vigília",
        "content": "<p>Quando um aliado recebe dano, o Aengel pode gastar 1 Radiância para redirecionar para si <strong>25% do dano final</strong>.</p><p>O dano redirecionado não pode ser reduzido novamente e não pode diminuir o HP do Aengel para menos de 1.</p><p>Pode acontecer uma vez por rodada. Fora de combate, as asas permitem voos curtos e acesso a posições elevadas.</p>"
      }
    ],
    "weakness": null,
    "progression": [
      {
        "level": 1,
        "name": "Toque da Alvorada",
        "category": "Ativa — Cura ou julgamento",
        "content": "<p>O Aengel escolhe entre Benevolência e Julgamento.</p><p><strong>Benevolência</strong></p><div class=\"skill-formula\">100% do ARC como cura</div><p>Ao gastar 1 Radiância, a cura passa para 140% do ARC.</p><p><strong>Julgamento</strong></p><div class=\"skill-formula\">100% da INT + 50% do ARC como dano mágico</div><p>Ao gastar 1 Radiância, o alvo fica Revelado por 2 turnos, não podendo ocultar sua presença por meios comuns.</p>",
        "meta": [
          "Custo: 25 Mana",
          "Recarga: 1 turno",
          "Pode gastar 1 Radiância"
        ]
      },
      {
        "level": 20,
        "name": "Halo Protetor",
        "category": "Ativa — Proteção",
        "content": "<p>Concede escudo equivalente a:</p><div class=\"skill-formula\">150% do ARC</div><p>O escudo dura 2 turnos e concede 10% de redução contra dano mágico.</p><p>Pode gastar até 2 Radiâncias:</p><ul><li>1 ponto: o escudo aumenta para 180% do ARC;</li><li>2 pontos: um segundo aliado recebe escudo equivalente a 80% do ARC.</li></ul>",
        "meta": [
          "Custo: 40 Mana",
          "Recarga: 3 turnos",
          "Duração: 2 turnos"
        ]
      },
      {
        "level": 40,
        "name": "Selo da Penitência",
        "category": "Ativa — Debuff",
        "content": "<p>Marca um inimigo durante 3 turnos.</p><p>Enquanto estiver marcado:</p><ul><li>Causa 15% menos dano;</li><li>Sempre que causar dano a um aliado, recebe 40% do ARC como dano mágico;</li><li>O retorno só acontece uma vez por turno.</li></ul><p>Ao gastar 2 Radiâncias, a primeira habilidade canalizada pelo alvo é interrompida.</p>",
        "meta": [
          "Custo: 50 Mana",
          "Recarga: 4 turnos",
          "Duração: 3 turnos"
        ]
      },
      {
        "level": 60,
        "name": "Chamado do Firmamento",
        "category": "Ativa — Cura coletiva",
        "content": "<p>Cura todos os aliados em:</p><div class=\"skill-formula\">80% do ARC</div><p>Pode consumir até 3 Radiâncias. Para cada ponto, escolhe um aliado para receber escudo equivalente a 60% do ARC por 2 turnos.</p><p>Ao consumir os 3 pontos, remove também um efeito negativo comum de cada aliado protegido.</p>",
        "meta": [
          "Custo: 80 Mana",
          "Recarga: 5 turnos",
          "Pode consumir até 3 Radiâncias"
        ]
      },
      {
        "level": 80,
        "name": "Veredito da Luz Primordial",
        "category": "Ativa — Julgamento",
        "content": "<p>Exige pelo menos 3 Radiâncias.</p><div class=\"skill-formula\">160% da INT + 100% do ARC</div><p>Para cada ponto consumido, o dano aumenta em 20% do ARC.</p><p>Efeitos:</p><ul><li>3 pontos: alvo recebe 20% menos cura por 2 turnos;</li><li>4 pontos: também causa 15% menos dano por 2 turnos;</li><li>5 pontos: interrompe canalização e remove um benefício mágico.</li></ul><p>Toda a Radiância acumulada é consumida.</p>",
        "meta": [
          "Custo: 70 Mana",
          "Recarga: 5 turnos",
          "Requisito: 3 Radiâncias"
        ]
      },
      {
        "level": 100,
        "name": "Ascensão Serafínica",
        "category": "Transformação racial máxima",
        "content": "<p>O Aengel manifesta novas asas e cobre o campo com luz celestial.</p><p>Ao ativar:</p><ul><li>Recupera HP equivalente a 100% do ARC;</li><li>Recebe 3 Radiâncias;</li><li>Remove um efeito negativo;</li><li>Recebe escudo equivalente a 150% do ARC.</li></ul><p>Durante 3 turnos:</p><ul><li>Curas e escudos são 25% mais eficientes;</li><li>O primeiro gasto de Radiância de cada turno é reduzido em 1;</li><li>Ao usar habilidade racial, o aliado com menor porcentagem de HP recebe escudo de 40% do ARC;</li><li>Asas da Vigília redireciona 40% do dano.</li></ul><p>Ao final, sofre Exaustão Celestial por 2 turnos e não pode gerar Radiância.</p>",
        "meta": [
          "Custo: 120 Mana",
          "Uma vez por combate",
          "Duração: 3 turnos",
          "Exaustão: 2 turnos"
        ]
      }
    ],
    "curiosities": [
      "As asas dos Aengels refletem personalidade e linhagem, não necessariamente bondade.",
      "Asas negras podem representar luto, severidade ou linhagens noturnas.",
      "Um Aengel pode esconder as asas, mas raramente oculta completamente suas marcas celestiais.",
      "Penas arrancadas perdem o brilho e se desfazem lentamente em partículas luminosas.",
      "Aengels não são imortais, embora envelheçam mais lentamente que Humanos.",
      "Violar profundamente os próprios juramentos pode reduzir a luminosidade das asas.",
      "Ordens Aengel possuem interpretações diferentes sobre justiça.",
      "Aengels que abandonam sua missão para viver entre mortais são chamados de Desvinculados.",
      "A corrupção não é necessariamente permanente, assim como a pureza não impede a crueldade."
    ]
  },
  {
    "id": "draconato",
    "name": "Draconato",
    "icon": "◆",
    "theme": {
      "accent": "#e36b3d",
      "secondary": "#7a241d"
    },
    "archetype": "Herdeiro primordial",
    "tagline": "Preservar cargas mantém o poder; consumi-las transforma preparação em cataclismo.",
    "difficulty": 5,
    "roles": [
      "DPS físico",
      "DPS mágico",
      "Tanque",
      "Controle"
    ],
    "description": [
      "Os Draconatos descendem dos Dragões Primordiais, criaturas ancestrais que dominavam os céus de Wonderland antes do surgimento dos primeiros reinos. Eles nasceram quando fragmentos da essência desses dragões se misturaram aos povos mortais.",
      "Possuem corpos humanoides cobertos parcialmente por escamas, além de chifres, garras, presas e caudas. Alguns apresentam asas atrofiadas, enquanto indivíduos mais poderosos podem desenvolver asas funcionais.",
      "A cultura draconata valoriza força, honra, coragem e superação. Para eles, a verdadeira força não está apenas em derrotar o inimigo, mas em sobreviver às próprias fraquezas.",
      "Suas comunidades costumam ser organizadas em clãs, cada um descendente de um Dragão Primordial diferente. Muitos tornam-se guerreiros, guardiões, conquistadores ou caçadores de criaturas colossais."
    ],
    "playstyle": {
      "main": "DPS físico ou mágico",
      "secondary": "Tanque e controle",
      "strengths": "Resistência, dano explosivo e adaptação elemental",
      "weaknesses": "Alto consumo de recursos e dependência de preparação",
      "recommended": [
        "FOR",
        "RES",
        "DEF",
        "INT"
      ]
    },
    "stats": {
      "hp": 650,
      "mana": "+50",
      "attributes": {
        "FOR": 5,
        "DEF": 3,
        "RES": 3,
        "INI": 1,
        "INT": 2,
        "ARC": 1
      }
    },
    "mechanics": [
      {
        "title": "Linhagem Elemental",
        "content": "<p>Durante a criação, o jogador escolhe permanentemente uma linhagem.</p><ul><li><strong>Fogo:</strong> causa dano durante os turnos seguintes;</li><li><strong>Gelo:</strong> reduz INI e dificulta movimentação;</li><li><strong>Trovão:</strong> salta para outro inimigo ou causa dano adicional contra alvo isolado;</li><li><strong>Terra:</strong> concede proteção ao Draconato;</li><li><strong>Vento:</strong> aumenta INI e permite reposicionamento;</li><li><strong>Veneno:</strong> enfraquece curas e regenerações.</li></ul><p>A linhagem determina somente a natureza elemental, não personalidade, alinhamento ou cultura.</p>"
      },
      {
        "title": "Acúmulo Dracônico",
        "content": "<p>O Draconato pode armazenar até <strong>5 Cargas Dracônicas</strong>.</p><p>Recebe 1 carga quando:</p><ul><li>Causa dano direto com uma habilidade;</li><li>Recebe de uma fonte dano igual ou superior a 10% do HP máximo;</li><li>Ativa uma habilidade racial defensiva.</li></ul><p>Normalmente, apenas 1 carga por turno.</p><p>Cada carga mantida concede:</p><ul><li>2% de aumento no dano causado;</li><li>2% de redução no dano recebido.</li></ul><p>Com 5 cargas, recebe 10% em ambos. Todas desaparecem ao final do combate.</p>"
      }
    ],
    "traits": [
      {
        "label": "Passiva I",
        "title": "Escamas Ancestrais",
        "content": "<p>As escamas reduzem em <strong>8% o dano físico recebido</strong>.</p><p>Também possui 20% de resistência contra o elemento de sua linhagem. Essa resistência não concede imunidade aos efeitos secundários.</p>"
      },
      {
        "label": "Passiva II",
        "title": "Coração do Dragão",
        "content": "<p>Na primeira vez em cada combate que ficar com 50% ou menos do HP máximo:</p><ul><li>Recebe 2 Cargas Dracônicas;</li><li>Recebe 10% de FOR e INT por 2 turnos;</li><li>Reduz em 1 turno medo, intimidação ou efeito semelhante ativo.</li></ul><p>Ativa somente uma vez por combate.</p>"
      }
    ],
    "weakness": null,
    "progression": [
      {
        "level": 1,
        "name": "Sopro Elemental",
        "category": "Ativa — Elemental",
        "content": "<p>Libera uma rajada contra até três inimigos.</p><div class=\"skill-formula\">120% do maior atributo entre FOR e INT</div><p>Pode consumir até 2 Cargas. Cada uma aumenta o dano em 20% do atributo utilizado.</p><p>Efeito da linhagem:</p><ul><li>Fogo: 25% do atributo como dano adicional por 2 turnos;</li><li>Gelo: reduz INI em 20% por 2 turnos;</li><li>Trovão: salta para segundo alvo com 60% do dano; contra alvo único, +15% de dano;</li><li>Terra: escudo de 60% da RES;</li><li>Vento: +20% de INI e reposicionamento após o ataque;</li><li>Veneno: alvos recebem 25% menos cura e regeneração por 2 turnos.</li></ul>",
        "meta": [
          "Custo: 35 Mana",
          "Recarga: 2 turnos",
          "Pode consumir até 2 Cargas Dracônicas"
        ]
      },
      {
        "level": 20,
        "name": "Couraça do Ancestral",
        "category": "Ativa — Defensiva",
        "content": "<p>Endurece as escamas durante 2 turnos:</p><ul><li>Recebe 20% menos dano;</li><li>Não pode ser derrubado ou deslocado por efeitos comuns;</li><li>Recebe 1 Carga Dracônica ao ativar.</li></ul><p>Pode consumir até 2 cargas adicionais. Cada carga aumenta a redução de dano em 5%, chegando a 30%.</p>",
        "meta": [
          "Custo: 40 Mana",
          "Recarga: 4 turnos",
          "Duração: 2 turnos",
          "Gera 1 e pode consumir até 2 Cargas"
        ]
      },
      {
        "level": 40,
        "name": "Investida Tirânica",
        "category": "Ativa — Ataque físico",
        "content": "<p>Avança violentamente contra um inimigo.</p><div class=\"skill-formula\">150% da FOR</div><p>Se o alvo estiver sofrendo um efeito da Linhagem Elemental, causa 30% da FOR como dano adicional.</p><p>Pode consumir 2 Cargas para:</p><ul><li>Reduzir a DEF em 15% por 2 turnos;</li><li>Interromper habilidades canalizadas;</li><li>Derrubar o alvo caso ele já esteja afetado pelo elemento.</li></ul><p>Criaturas muito maiores não são derrubadas, mas sofrem os demais efeitos.</p>",
        "meta": [
          "Custo: 45 Mana",
          "Recarga: 3 turnos",
          "Pode consumir 2 Cargas"
        ]
      },
      {
        "level": 60,
        "name": "Rugido de Soberania",
        "category": "Ativa — Controle",
        "content": "<p>Todos os inimigos afetados sofrem:</p><ul><li>15% de redução no dano causado;</li><li>15% de redução de INI;</li><li>Não podem receber benefícios de coragem ou inspiração durante 2 turnos.</li></ul><p>Um inimigo pode receber <strong>Desafiado</strong> por 1 turno e causa 20% menos dano contra personagens que não sejam o Draconato.</p><p>Pode consumir até 3 Cargas. Cada carga aumenta em 1 turno a duração da redução de dano e INI para um inimigo escolhido.</p>",
        "meta": [
          "Custo: 60 Mana",
          "Recarga: 5 turnos",
          "Pode consumir até 3 Cargas"
        ]
      },
      {
        "level": 80,
        "name": "Cataclismo Elemental",
        "category": "Ativa — Explosão elemental",
        "content": "<p>Exige pelo menos 3 Cargas e atinge todos os inimigos em grande área.</p><div class=\"skill-formula\">180% do maior atributo entre FOR e INT</div><p>Cada carga consumida aumenta o dano em 25% do atributo.</p><p>Efeitos:</p><ul><li>Fogo: queimadura de 40% do atributo por 2 turnos;</li><li>Gelo: -30% de INI e sem reposicionamento por 1 turno;</li><li>Trovão: cada alvo libera raio que causa 30% do dano original;</li><li>Terra: Draconato e aliado com menor HP recebem escudo de 100% da RES;</li><li>Vento: afasta alvos e concede 30% de INI ao Draconato por 2 turnos;</li><li>Veneno: -40% de cura e regeneração por 3 turnos.</li></ul><p>Todas as Cargas acumuladas são consumidas.</p>",
        "meta": [
          "Custo: 90 Mana",
          "Recarga: 6 turnos",
          "Requisito: 3 Cargas"
        ]
      },
      {
        "level": 100,
        "name": "Avatar do Dragão Primordial",
        "category": "Transformação racial máxima",
        "content": "<p>O corpo aumenta, as escamas se fortalecem e asas elementais surgem.</p><p>Ao se transformar:</p><ul><li>Recupera 15% do HP máximo;</li><li>Recebe 5 Cargas;</li><li>Remove medo, paralisia e intimidação;</li><li>Causa 80% do maior atributo entre FOR e INT a inimigos próximos.</li></ul><p>Durante 3 turnos:</p><ul><li>Recebe 20% de FOR e INT;</li><li>Ignora obstáculos terrestres e imobilização comum;</li><li>Pode receber até 2 Cargas por turno;</li><li>Sopro Elemental tem recarga reduzida em 1;</li><li>O primeiro Sopro não consome Mana;</li><li>Consumir cargas mantém seus bônus até o começo do próximo turno.</li></ul><p>Ao final, sofre Exaustão Ancestral por 2 turnos:</p><ul><li>Não pode gerar Cargas;</li><li>Causa 10% menos dano;</li><li>Não pode utilizar novamente a transformação.</li></ul>",
        "meta": [
          "Custo: 120 Mana",
          "Uma vez por combate",
          "Duração: 3 turnos",
          "Exaustão: 2 turnos"
        ]
      }
    ],
    "curiosities": [
      "Draconatos não são dragões em forma humana, mas descendentes mortais que carregam fragmentos de sua essência.",
      "A cor das escamas geralmente indica a linhagem elemental, mas misturas entre clãs podem produzir cores incomuns.",
      "Seus chifres crescem lentamente durante toda a vida e simbolizam honra e experiência.",
      "Quebrar voluntariamente os próprios chifres pode representar vergonha, luto ou abandono de um clã.",
      "Preferem carnes, minerais e alimentos intensamente temperados.",
      "Alguns dormem sobre coleções de objetos importantes, imitando inconscientemente os dragões.",
      "O tesouro de um Draconato pode ser uma coleção de armas, livros, lembranças ou qualquer coisa preciosa.",
      "Draconatos de linhagens diferentes podem pertencer ao mesmo clã.",
      "Asas funcionais são raras e surgem após grande amadurecimento da essência ancestral.",
      "Há rumores sobre Draconatos capazes de despertar dois elementos."
    ]
  },
  {
    "id": "lobisomem",
    "name": "Lobisomem",
    "icon": "◐",
    "theme": {
      "accent": "#9fc0d4",
      "secondary": "#334a5b"
    },
    "archetype": "Predador lunar",
    "tagline": "Quanto mais ferido, mais seus instintos alteram a forma de caçar, sobreviver e destruir.",
    "difficulty": 4,
    "roles": [
      "DPS físico",
      "Perseguidor",
      "Resistente"
    ],
    "description": [
      "Os Lobisomens descendem dos primeiros mortais afetados pela Maldição da Lua, uma força ancestral cuja verdadeira origem permanece desconhecida.",
      "Em sua forma humana, podem parecer pessoas comuns, embora frequentemente apresentem olhos brilhantes, caninos acentuados, unhas resistentes e sentidos muito mais desenvolvidos. Quando revelam sua natureza, assumem forma lupina humanoide.",
      "Sua cultura é construída ao redor do conceito de matilha. Uma matilha não precisa ser formada por membros da mesma raça: qualquer pessoa reconhecida como família pode ocupar esse lugar.",
      "Alguns vivem em comunidades isoladas, enquanto outros escondem sua natureza entre os mortais. Aqueles que se entregam completamente à maldição são conhecidos como Desvairados."
    ],
    "playstyle": {
      "main": "DPS físico",
      "secondary": "Perseguidor e resistente",
      "strengths": "Mobilidade, regeneração, perseguição e dano físico",
      "weaknesses": "Combate a distância, prata alquímica e dependência do HP",
      "recommended": [
        "FOR",
        "RES",
        "INI",
        "DEF"
      ]
    },
    "stats": {
      "hp": 700,
      "mana": "Sem bônus",
      "attributes": {
        "FOR": 5,
        "DEF": 2,
        "RES": 4,
        "INI": 3,
        "INT": 0,
        "ARC": 1
      }
    },
    "mechanics": [
      {
        "title": "Instinto da Fera",
        "content": "<p>No início de cada turno, assume um estado conforme sua porcentagem atual de HP.</p><p><strong>Lobo à Espreita — 71% a 100%</strong></p><ul><li>Recebe 15% de INI;</li><li>Primeiro deslocamento não pode ser interrompido por reações comuns;</li><li>Primeiro ataque racial aplica Presa Marcada.</li></ul><p><strong>Fera em Caçada — 31% a 70%</strong></p><ul><li>Causa 12% mais dano físico;</li><li>Causa 10% adicional contra Presa Marcada;</li><li>Ao derrubar a Presa, recupera 5% do HP máximo, uma vez por turno.</li></ul><p><strong>Fera Acuada — 1% a 30%</strong></p><ul><li>Recebe 15% menos dano;</li><li>Regeneração natural duplicada;</li><li>Medo e intimidação duram 1 turno a menos.</li></ul><p>O estado só é atualizado no início do turno.</p>"
      },
      {
        "title": "Presa Marcada",
        "content": "<p>Mantém apenas uma Presa Marcada por vez.</p><p>Durante 3 turnos:</p><ul><li>Rastreia cheiro e direção do alvo;</li><li>Ocultação comum não interrompe a perseguição;</li><li>Habilidades raciais recebem efeitos adicionais.</li></ul><p>Marcar novo inimigo remove a marca anterior.</p>"
      }
    ],
    "traits": [
      {
        "label": "Passiva I",
        "title": "Regeneração Licantropa",
        "content": "<p>No início de cada turno, recupera <strong>3% do HP máximo</strong>.</p><p>Em Fera Acuada, recupera 6%.</p><p>Dano de prata alquímica interrompe a regeneração por 2 turnos. Reduções comuns de cura também diminuem a recuperação.</p>"
      },
      {
        "label": "Passiva II",
        "title": "Faro Sobrenatural",
        "content": "<p>Fora de combate:</p><ul><li>Rastreia criaturas pelo cheiro;</li><li>Percebe sangue, venenos e odores incomuns;</li><li>Estima quantas criaturas passaram por um local;</li><li>Reconhece pessoas pelo cheiro.</li></ul><p>Em combate:</p><ul><li>Recebe 10% de INI contra inimigo abaixo de 50% do HP;</li><li>Presa Marcada não oculta sua presença por meios comuns;</li><li>Ilusões visuais podem enganá-lo, mas não reproduzem odores perfeitamente.</li></ul>"
      }
    ],
    "weakness": {
      "title": "Prata Alquímica",
      "content": "<p>Ataques realizados com prata alquímica:</p><ul><li>Ignoram 15% da DEF;</li><li>Interrompem a Regeneração Licantropa por 2 turnos;</li><li>Impedem a remoção racial de Sangramentos nesse período.</li></ul><p>Prata comum não produz esses efeitos.</p>"
    },
    "progression": [
      {
        "level": 1,
        "name": "Garras do Predador",
        "category": "Ativa — Ataque físico",
        "content": "<div class=\"skill-formula\">130% da FOR</div><p>O inimigo torna-se Presa Marcada durante 3 turnos.</p><p>Se já for a Presa, causa mais 30% da FOR e aplica Sangramento equivalente a 20% da FOR durante 2 turnos.</p><p>O Sangramento não se acumula, mas a duração pode ser renovada.</p>",
        "meta": [
          "Sem custo",
          "Recarga: 1 turno",
          "Marca: 3 turnos"
        ]
      },
      {
        "level": 20,
        "name": "Salto Predatório",
        "category": "Ativa — Mobilidade e ataque",
        "content": "<p>Ignora obstáculos terrestres comuns e causa:</p><div class=\"skill-formula\">110% da FOR</div><p>Contra a Presa Marcada, causa mais 40% da FOR.</p><p>Após acertar a Presa, escolhe:</p><ul><li>Derrubar o alvo;</li><li>Reduzir a DEF em 15% até o próximo ataque recebido;</li><li>Reposicionar-se imediatamente.</li></ul><p>Criaturas muito maiores não são derrubadas, mas podem sofrer a redução de DEF.</p>",
        "meta": [
          "Sem custo",
          "Recarga: 3 turnos"
        ]
      },
      {
        "level": 40,
        "name": "Uivo da Matilha",
        "category": "Ativa — Fortalecimento coletivo",
        "content": "<p>Durante 2 turnos, o Lobisomem e seus aliados recebem:</p><ul><li>15% de resistência contra medo e intimidação;</li><li>10% de dano contra a Presa Marcada;</li><li>15% de INI ao se aproximar ou atacar a Presa.</li></ul><p>Remove medo comum do Lobisomem e de um aliado. Se estiver sozinho, também recebe 10% de redução de dano.</p>",
        "meta": [
          "Sem custo",
          "Recarga: 5 turnos",
          "Duração: 2 turnos"
        ]
      },
      {
        "level": 60,
        "name": "Regeneração Monstruosa",
        "category": "Ativa — Regeneração",
        "content": "<div class=\"skill-formula\">15% do HP máximo + 80% da RES</div><p>Remove Sangramento ou Veneno comum.</p><p>O efeito muda conforme o estado:</p><ul><li>Lobo à Espreita: +20% de INI por 1 turno;</li><li>Fera em Caçada: próximo ataque causa +25% da FOR;</li><li>Fera Acuada: cura aumenta para 25% do HP máximo + 80% da RES.</li></ul><p>Não pode ser utilizada enquanto a regeneração estiver interrompida por prata alquímica.</p>",
        "meta": [
          "Sem custo",
          "Recarga: 5 turnos"
        ]
      },
      {
        "level": 80,
        "name": "Frenesi da Lua Sangrenta",
        "category": "Ativa — Ataque múltiplo",
        "content": "<p>Desfere três ataques consecutivos.</p><div class=\"skill-formula\">Cada golpe: 70% da FOR</div><p>Contra a Presa Marcada, cada golpe causa 80% da FOR.</p><p>Efeito adicional:</p><ul><li>Lobo à Espreita: primeiro golpe não pode ser evitado por reações comuns;</li><li>Fera em Caçada: último golpe causa +30% da FOR;</li><li>Fera Acuada: recupera 20% do dano total causado.</li></ul><p>Se a Presa for derrubada, a recarga de Salto Predatório é encerrada.</p>",
        "meta": [
          "Sem custo",
          "Recarga: 5 turnos"
        ]
      },
      {
        "level": 100,
        "name": "Avatar da Lua Cheia",
        "category": "Transformação racial máxima",
        "content": "<p>Assume temporariamente uma forma lupina colossal.</p><p>Ao se transformar:</p><ul><li>Recupera 15% do HP máximo;</li><li>Remove medo, veneno e imobilização;</li><li>Escolhe uma Presa Marcada;</li><li>Reduz em 15% o dano causado pela Presa durante 2 turnos.</li></ul><p>Durante 3 turnos:</p><ul><li>Recebe 20% de FOR;</li><li>Recebe 15% de RES e INI;</li><li>Regeneração recupera 6% em qualquer estado e 10% em Fera Acuada;</li><li>Garras do Predador causa +30% da FOR;</li><li>Salto Predatório tem recarga reduzida em 1;</li><li>Derrubar a Presa permite marcar outro inimigo.</li></ul><p>Uma vez, se seria reduzido a 0, permanece com 1, recupera 10% do HP máximo e encerra a transformação. Não funciona contra prata alquímica.</p><p>Depois, sofre Exaustão Lunar por 2 turnos: regeneração desativada e -15% de INI.</p>",
        "meta": [
          "Sem custo",
          "Uma vez por combate",
          "Duração: 3 turnos",
          "Exaustão: 2 turnos"
        ]
      }
    ],
    "curiosities": [
      "Nem todo Lobisomem nasceu com a maldição; alguns foram transformados por mordidas, rituais ou relíquias lunares.",
      "Lobisomens nascidos de outros Lobisomens costumam controlar melhor suas transformações.",
      "A lua cheia fortalece emoções e instintos, mas não obriga um Lobisomem experiente a perder o controle.",
      "O pelo pode apresentar diferentes cores, padrões e marcas de linhagem.",
      "Uma matilha pode incluir Humanos, Elfos, Aengels e outras raças.",
      "O líder não é necessariamente o mais forte; experiência, confiança e proteção também importam.",
      "A mordida não transforma automaticamente outra pessoa.",
      "Alguns carregam amuletos de prata como demonstração de autocontrole.",
      "Possuem temperatura corporal elevada e necessitam de mais alimento.",
      "Reconhecem membros da matilha pelo cheiro mesmo após muitos anos separados."
    ]
  },{
  "id": "kitsune",
  "name": "Kitsune",
  "icon": "◇",
  "theme": {
    "accent": "#f48bc8",
    "secondary": "#8850d7"
  },
  "archetype": "Tecelão de ilusões",
  "tagline": "Fios de Engano transformam preparação, percepção e manipulação em colapsos mentais.",
  "difficulty": 5,
  "roles": [
    "Controle",
    "Dano mágico",
    "Suporte",
    "Infiltração"
  ],
  "description": [
    "Os Kitsunes são espíritos ancestrais que adquiriram forma física após séculos absorvendo a energia mágica de Wonderland. Embora possam assumir diferentes aparências, são reconhecidos por orelhas de raposa, olhos brilhantes e caudas espirituais.",
    "Cada cauda representa o amadurecimento da alma. Kitsunes jovens normalmente manifestam apenas uma, enquanto os mais antigos podem alcançar as lendárias nove caudas.",
    "Sua cultura valoriza inteligência, liberdade, curiosidade e domínio emocional. Histórias, segredos e promessas são tratados como verdadeiros tesouros.",
    "Apesar de serem frequentemente vistos como trapaceiros, nem todos utilizam seus poderes com crueldade. Alguns empregam ilusões para proteger pessoas, esconder lugares sagrados ou revelar verdades."
  ],
  "playstyle": {
    "main": "Controle e dano mágico",
    "secondary": "Suporte, infiltração e manipulação",
    "strengths": "Ilusões, debuffs, mobilidade e combos",
    "weaknesses": "HP baixo, pouca defesa física e dependência de preparação",
    "recommended": [
      "INT",
      "INI",
      "ARC"
    ]
  },
  "stats": {
    "hp": 300,
    "mana": "+200",
    "attributes": {
      "FOR": 0,
      "DEF": 1,
      "RES": 2,
      "INI": 4,
      "INT": 5,
      "ARC": 3
    }
  },
  "mechanics": [
    {
      "title": "Fios de Engano",
      "content": "<p>Habilidades raciais aplicam Fios de Engano. Cada alvo acumula até 3.</p><p>Ao alcançar o terceiro fio, o Kitsune pode consumir todos para provocar um Colapso:</p><ul><li><strong>Ruptura:</strong> 80% da INT como dano mágico;</li><li><strong>Dúvida:</strong> a próxima habilidade ofensiva causa 25% menos dano, por até 2 turnos;</li><li><strong>Desorientação:</strong> perde 25% de INI, não utiliza reações e não realiza reposicionamento voluntário por 1 turno.</li></ul><p>Cada inimigo sofre apenas um Colapso por rodada. Os fios duram 3 turnos e um novo fio renova todos.</p>"
    },
    {
      "title": "Limitações das Ilusões",
      "content": "<p>As ilusões manipulam sentidos, emoções e percepção, mas não concedem controle absoluto.</p><ul><li>Criaturas sem consciência não sofrem Fascinação ou Dúvida;</li><li>Alvos sem sentidos comuns ainda recebem o dano mágico das chamas;</li><li>Visão verdadeira identifica a ilusão, mas não desfaz automaticamente seus efeitos;</li><li>Sofrer dano pode romper determinadas Fascinações;</li><li>Chefes e criaturas colossais podem receber versões reduzidas dos controles.</li></ul>"
    }
  ],
  "traits": [
    {
      "label": "Passiva I",
      "title": "Mente dos Nove Véus",
      "content": "<p>Recebe 20% de resistência contra medo, encanto e ilusões. A duração desses efeitos é reduzida em 1 turno.</p><p>Consegue perceber falhas em ilusões comuns após observá-las atentamente.</p><p>Na primeira vez em cada combate que resistir ou escapar de um efeito mental, o responsável recebe 1 Fio de Engano.</p>"
    },
    {
      "label": "Passiva II",
      "title": "Passos Entre Véus",
      "content": "<p>Sempre que provocar um Colapso Ilusório, pode se reposicionar sem consumir uma ação.</p><p>Depois, recebe 20% de INI até o início do próximo turno.</p><p>Pode acontecer uma vez por rodada.</p>"
    },
    {
      "label": "Passiva III",
      "title": "Metamorfose Vulpar",
      "content": "<p>Pode assumir:</p><ul><li>Aparência humanoide;</li><li>Forma híbrida com orelhas e caudas;</li><li>Forma de raposa.</li></ul><p>A transformação altera tamanho, voz, cheiro e características físicas, mas não concede atributos de combate.</p><p>Também pode alterar olhos, cabelos, roupas aparentes e traços do rosto. Dano grave, inconsciência ou anulação de magia podem revelar sua forma verdadeira.</p>"
    }
  ],
  "weakness": null,
  "progression": [
    {
      "level": 1,
      "name": "Kitsunebi: Chama do Engano",
      "category": "Ativa — Dano mágico",
      "content": "<div class=\"skill-formula\">110% da INT + 40% do ARC</div><p>O alvo recebe 1 Fio de Engano.</p><p>Se aplicar o terceiro fio e provocar Ruptura, o dano do Colapso aumenta de 80% para 110% da INT.</p><p>A chama pode assumir qualquer coloração, sem alterar seu efeito.</p>",
      "meta": [
        "Custo: 30 Mana",
        "Recarga: 1 turno",
        "Aplica 1 Fio"
      ]
    },
    {
      "level": 20,
      "name": "Reflexos da Raposa",
      "category": "Ativa — Ilusão defensiva",
      "content": "<p>Cria duas cópias durante 2 turnos:</p><ul><li>Primeiro ataque de alvo único tem dano reduzido em 50%;</li><li>Segundo ataque tem dano reduzido em 25%;</li><li>Cada ataque reduzido destrói uma cópia;</li><li>O atacante recebe 1 Fio sempre que destruir uma cópia.</li></ul><p>Ataques em área não têm dano reduzido e destroem uma cópia imediatamente.</p><p>Pode gastar 30 Mana adicional para criar terceira cópia, que reduz em 25% um terceiro ataque.</p>",
      "meta": [
        "Custo: 50 Mana",
        "Adicional: 30 Mana",
        "Recarga: 4 turnos",
        "Duração: 2 turnos"
      ]
    },
    {
      "level": 40,
      "name": "Sussurro Enfeitiçado",
      "category": "Ativa — Encantamento",
      "content": "<p>Aplica 1 Fio e deixa o alvo Fascinado durante 1 turno.</p><p>Enquanto Fascinado:</p><ul><li>Não pode escolher o Kitsune como alvo principal de habilidade ofensiva de alvo único;</li><li>Causa 15% menos dano contra aliados do Kitsune;</li><li>Não realiza ataques de oportunidade contra o Kitsune.</li></ul><p>A Fascinação termina se o Kitsune causar dano direto.</p><p>Se aplicar o terceiro Fio, pode consumi-los para dar um comando simples. O comando não pode obrigar ataque, automutilação ou ação suicida.</p><p>Contra imunidade à Fascinação, apenas reduz o dano em 15% e aplica o Fio.</p>",
      "meta": [
        "Custo: 55 Mana",
        "Recarga: 4 turnos",
        "Duração: 1 turno",
        "Aplica 1 Fio"
      ]
    },
    {
      "level": 60,
      "name": "Labirinto de Espelhos",
      "category": "Ativa — Controle de campo",
      "content": "<p>Transforma o campo durante 3 turnos e aplica 1 Fio a todos os inimigos.</p><p>Enquanto ativo:</p><ul><li>Inimigos perdem 20% de INI;</li><li>O primeiro ataque de cada inimigo por turno causa 15% menos dano;</li><li>Inimigos não impedem o reposicionamento do Kitsune por reações comuns;</li><li>Atacar uma ilusão aplica outro Fio, uma vez por rodada.</li></ul><p>Quem identifica a ilusão deixa de sofrer a redução de INI, mas continua vendo reflexos e caminhos falsos.</p>",
      "meta": [
        "Custo: 85 Mana",
        "Recarga: 6 turnos",
        "Duração: 3 turnos"
      ]
    },
    {
      "level": 80,
      "name": "Dança das Chamas Errantes",
      "category": "Ativa — Explosão mágica",
      "content": "<p>Atinge todos os inimigos:</p><div class=\"skill-formula\">150% da INT + 70% do ARC</div><p>Depois, pode consumir todos os Fios. Cada fio causa mais 25% da INT.</p><p>Com 3 fios do mesmo alvo, escolhe:</p><ul><li><strong>Incêndio Espiritual:</strong> 40% da INT por 2 turnos;</li><li><strong>Mente Fragmentada:</strong> próximo ataque causa 30% menos dano;</li><li><strong>Véu Rompido:</strong> perde 20% da RES contra dano mágico por 2 turnos.</li></ul><p>Consumir fios dessa maneira não ativa um Colapso comum.</p>",
      "meta": [
        "Custo: 100 Mana",
        "Recarga: 6 turnos",
        "Consome todos os Fios"
      ]
    },
    {
      "level": 100,
      "name": "Manifestação das Nove Caudas",
      "category": "Transformação racial máxima",
      "content": "<p>Nove caudas espirituais e inúmeras chamas cobrem o campo.</p><p>Ao se transformar:</p><ul><li>Recebe 20% de INT, ARC e INI;</li><li>Cria três cópias de Reflexos da Raposa;</li><li>Todos os inimigos recebem 1 Fio;</li><li>Remove medo, encanto ou confusão.</li></ul><p>Durante 3 turnos:</p><ul><li>Habilidades raciais aplicam 2 Fios em vez de 1;</li><li>Colapsos permitem escolher dois efeitos diferentes;</li><li>Passos Entre Véus pode ativar duas vezes por rodada;</li><li>Primeira habilidade racial de cada turno custa 30% menos Mana;</li><li>Inimigos não ocultam sua presença por meios comuns.</li></ul><p>O mesmo efeito de Colapso não pode ser escolhido duas vezes.</p><p>Ao final, cada inimigo sofre 40% da INT por Fio restante. Todos os fios são removidos.</p><p>Sofre Exaustão Espiritual por 2 turnos:</p><ul><li>Não pode aplicar Fios;</li><li>Perde 15% de INI;</li><li>Não pode utilizar novamente a transformação.</li></ul>",
      "meta": [
        "Custo: 150 Mana",
        "Uma vez por combate",
        "Duração: 3 turnos",
        "Exaustão: 2 turnos"
      ]
    }
  ],
  "curiosities": [
    "Cada nova cauda representa amadurecimento espiritual, não apenas poder.",
    "Uma cauda pode surgir após descoberta, perda, promessa ou transformação emocional.",
    "Kitsunes habilidosos escondem as caudas, mas emoções intensas podem fazê-las reaparecer.",
    "Kitsunebi não é fogo comum; queima Mana, espírito e percepção.",
    "Nomes verdadeiros são guardados porque carregariam parte da essência da pessoa.",
    "Presentear um Kitsune com uma história inédita é grande demonstração de respeito.",
    "Raramente quebram promessas voluntárias, mas interpretam palavras de modo inesperado.",
    "Nem todo Kitsune é brincalhão; alguns tratam ilusões como arte sagrada.",
    "A forma de raposa pode variar de animal comum a grande criatura espiritual.",
    "Kitsunes de nove caudas são extremamente raros.",
    "Algumas culturas os tratam como mensageiros divinos; outras os caçam.",
    "Tocar as caudas sem permissão é grave invasão de intimidade."
  ]
},
{
  "id": "leonis",
  "name": "Leonis",
  "icon": "☀",
  "theme": {
    "accent": "#f2bb45",
    "secondary": "#9c4f24"
  },
  "archetype": "Soberano do bando",
  "tagline": "Liderança, coragem e ataques coordenados transformam aliados em uma verdadeira força de caça.",
  "difficulty": 3,
  "roles": [
    "Combatente físico",
    "Tanque",
    "Suporte ofensivo"
  ],
  "description": [
    "Os Leonis descendem dos Leões do Primeiro Sol, grandes feras espirituais que protegiam as planícies de Wonderland antes da formação dos primeiros reinos.",
    "Possuem corpos humanoides com características felinas: garras, presas, caudas, orelhas e pelos em diferentes tons. Muitos desenvolvem jubas, mas seu tamanho e formato estão ligados à linhagem e maturidade, não ao gênero.",
    "A cultura Leonis valoriza coragem, lealdade, responsabilidade e proteção da comunidade. Para eles, força sem propósito não passa de violência.",
    "Embora muitos sejam guerreiros, guardiões ou comandantes, também são conhecidos como diplomatas, contadores de histórias e preservadores de tradições. Liderança precisa ser conquistada."
  ],
  "playstyle": {
    "main": "Combatente físico",
    "secondary": "Tanque e suporte ofensivo",
    "strengths": "Liderança, proteção, ataques coordenados e resistência",
    "weaknesses": "Menor eficiência quando isolado e poucas opções de longo alcance",
    "recommended": [
      "FOR",
      "DEF",
      "RES",
      "ARC"
    ]
  },
  "stats": {
    "hp": 600,
    "mana": "Sem bônus",
    "attributes": {
      "FOR": 4,
      "DEF": 3,
      "RES": 3,
      "INI": 2,
      "INT": 1,
      "ARC": 2
    }
  },
  "mechanics": [
    {
      "title": "Vínculo do Bando",
      "content": "<p>No início de cada combate, escolhe até dois aliados como Companheiros do Bando.</p><p>Quando um membro ataca um inimigo já atingido por outro membro na mesma rodada, realiza <strong>Ataque Coordenado</strong> e causa 10% de dano adicional.</p><p>Cada membro recebe esse bônus uma vez por rodada. O próprio Leonis também é membro do bando. Os Companheiros não podem ser substituídos durante o combate.</p>"
    },
    {
      "title": "Bravura",
      "content": "<p>Acumula até <strong>3 pontos de Bravura</strong> e começa cada combate com 1.</p><p>Recebe 1 ponto quando:</p><ul><li>Companheiro fica abaixo de 50% do HP por ataque inimigo;</li><li>Protege um companheiro com habilidade racial;</li><li>Resiste a medo ou intimidação;</li><li>Atinge inimigo que feriu um companheiro desde seu último turno.</li></ul><p>Normalmente, gera apenas 1 ponto por rodada. Todos desaparecem ao final do combate.</p>"
    }
  ],
  "traits": [
    {
      "label": "Passiva I",
      "title": "Coração Indomável",
      "content": "<p>Recebe 25% de resistência contra medo e intimidação. A duração desses efeitos é reduzida em 1 turno.</p><p>Ao resistir completamente, recebe 1 Bravura, respeitando o limite de geração por rodada.</p>"
    },
    {
      "label": "Passiva II",
      "title": "Presença do Soberano",
      "content": "<p>Enquanto puderem vê-lo ou ouvi-lo, os Companheiros recebem:</p><ul><li>15% de resistência contra medo e intimidação;</li><li>10% de redução contra o primeiro dano recebido em cada rodada.</li></ul><p>Não se acumula com vários Leonis. Os benefícios são suspensos enquanto o Leonis estiver inconsciente.</p>"
    }
  ],
  "weakness": null,
  "progression": [
    {
      "level": 1,
      "name": "Garra do Regente",
      "category": "Ativa — Ataque físico",
      "content": "<div class=\"skill-formula\">140% da FOR</div><p>Se o alvo causou dano a um Companheiro desde o último turno do Leonis, causa mais 30% da FOR.</p><p>Ao atingir nessas condições, recebe 1 Bravura.</p>",
      "meta": [
        "Sem custo",
        "Recarga: 1 turno",
        "Pode gerar 1 Bravura"
      ]
    },
    {
      "level": 20,
      "name": "Rugido Encorajador",
      "category": "Ativa — Fortalecimento",
      "content": "<p>Durante 2 turnos, o Leonis e seus Companheiros recebem:</p><ul><li>15% de INI;</li><li>10% de aumento no dano;</li><li>20% de resistência adicional contra medo.</li></ul><p>Pode gastar 1 Bravura para remover medo ou intimidação comum de todos.</p><p>Se ninguém estiver afetado, concede escudo a cada um:</p><div class=\"skill-formula\">50% do ARC + 30% da RES do Leonis</div>",
      "meta": [
        "Sem custo",
        "Recarga: 4 turnos",
        "Duração: 2 turnos",
        "Pode consumir 1 Bravura"
      ]
    },
    {
      "level": 40,
      "name": "Guardião do Bando",
      "category": "Reação — Proteção",
      "content": "<p>Quando um Companheiro é atingido, redireciona para si o dano restante e recebe 25% menos dano dessa fonte.</p><p>Depois, pode contra-atacar se o agressor estiver ao alcance:</p><div class=\"skill-formula\">90% da FOR</div>",
      "meta": [
        "Custo: 1 Bravura",
        "Recarga: 3 turnos",
        "Limite: uma vez por rodada"
      ]
    },
    {
      "level": 60,
      "name": "Desafio do Leão",
      "category": "Ativa — Provocação",
      "content": "<p>Durante 2 turnos:</p><ul><li>O inimigo causa 20% menos dano contra personagens que não sejam o Leonis;</li><li>O Leonis recebe 15% de DEF e RES contra os ataques desse inimigo;</li><li>Sempre que o inimigo atacar um Companheiro, o Leonis recebe 1 Bravura, respeitando o limite normal.</li></ul><p>Pode gastar 1 Bravura para impedir ocultação ou fuga comum por 1 turno.</p><p>Chefes imunes a provocações ainda sofrem a redução de dano.</p>",
      "meta": [
        "Sem custo",
        "Recarga: 4 turnos",
        "Duração: 2 turnos",
        "Pode consumir 1 Bravura"
      ]
    },
    {
      "level": 80,
      "name": "Caçada do Horizonte Dourado",
      "category": "Ativa — Ataque e marcação",
      "content": "<div class=\"skill-formula\">180% da FOR + 50% do ARC</div><p>Marca o alvo pela Caçada Dourada durante 2 turnos.</p><p>Contra ele:</p><ul><li>Leonis e Companheiros recebem 15% de INI;</li><li>Ataques Coordenados causam 20% adicional;</li><li>Primeiro ataque de cada membro ignora 10% da DEF;</li><li>O alvo não oculta sua presença por meios comuns.</li></ul>",
      "meta": [
        "Custo: 2 Bravuras",
        "Recarga: 6 turnos",
        "Marca: 2 turnos"
      ]
    },
    {
      "level": 100,
      "name": "Avatar do Primeiro Sol",
      "category": "Transformação racial máxima",
      "content": "<p>A juba se transforma em luz dourada e a presença cobre o campo.</p><p>Ao ativar:</p><ul><li>Recupera 15% do HP máximo;</li><li>Recebe 3 Bravuras;</li><li>Remove medo, intimidação e enfraquecimento;</li><li>Companheiros recebem escudo de 100% do ARC.</li></ul><p>Durante 3 turnos:</p><ul><li>Recebe 20% de FOR, DEF e RES;</li><li>Companheiros causam 10% mais dano e recebem 10% menos dano;</li><li>Ataques Coordenados causam 20% adicional;</li><li>Guardião do Bando não consome Bravura;</li><li>Ao proteger, recebe escudo de 60% do ARC;</li><li>Rugido Encorajador pode ser utilizado uma vez sem considerar recarga.</li></ul><p>Uma vez, pode consumir toda a Bravura, com mínimo de 2, para manter um Companheiro com 1 de HP.</p><p>Ao final, sofre Exaustão Solar por 2 turnos e não pode gerar Bravura.</p>",
      "meta": [
        "Sem custo",
        "Uma vez por combate",
        "Duração: 3 turnos",
        "Exaustão: 2 turnos"
      ]
    }
  ],
  "curiosities": [
    "A juba dos Leonis não está relacionada ao gênero.",
    "Jubas podem ser trançadas, tingidas ou decoradas para representar feitos importantes.",
    "Leonis registram sua história por músicas, cicatrizes, joias e histórias recitadas.",
    "Tocar a juba sem permissão é extremamente desrespeitoso.",
    "Um bando Leonis pode incluir membros de qualquer raça.",
    "Abandonar um companheiro por covardia é uma das piores formas de desonra.",
    "Desafiar um líder pode ser parte legítima da cultura.",
    "Conflitos de liderança também são resolvidos por debates e provas de sabedoria.",
    "Leonis enxergam bem em pouca luz, mas não em escuridão completa.",
    "Seus rugidos são utilizados para transmitir alertas a grandes distâncias.",
    "Leonis de pelagem branca são raros e associados a presságios ou antigas linhagens.",
    "Muitos escolhem um objeto para representar seu bando."
  ]
},
{
  "id": "tiefling",
  "name": "Tiefling",
  "icon": "◈",
  "theme": {
    "accent": "#d36cff",
    "secondary": "#7a1d45"
  },
  "archetype": "Portador de contratos",
  "tagline": "A Dívida Infernal concede poder crescente, mas cobra seu preço quando permanece sem pagamento.",
  "difficulty": 4,
  "roles": [
    "DPS mágico",
    "Controle",
    "Suporte",
    "Debuff"
  ],
  "description": [
    "Os Tieflings descendem de mortais cujas linhagens foram alteradas pelo contato com entidades infernais. Isso pode ter acontecido por pactos, maldições, guerras planares ou exposição prolongada à energia do Inferno.",
    "Possuem aparência humanoide, mas apresentam chifres, caudas, presas, olhos luminosos e peles de cores incomuns. Alguns possuem cascos, garras, marcas infernais ou pequenas asas incapazes de sustentar voo.",
    "A aparência de um Tiefling não determina seu caráter. Muitos passam a vida lutando contra a desconfiança, mesmo sem jamais terem realizado um pacto.",
    "Não existe uma única sociedade Tiefling. Alguns formam comunidades para se proteger, enquanto outros vivem misturados entre os povos. São procurados como diplomatas, estudiosos de maldições, advogados, ocultistas e negociadores."
  ],
  "playstyle": {
    "main": "DPS mágico e controle",
    "secondary": "Suporte e enfraquecimento",
    "strengths": "Maldições, mobilidade e dano mágico crescente",
    "weaknesses": "HP baixo, pouca defesa física e risco provocado pela Dívida",
    "recommended": [
      "INT",
      "ARC",
      "INI"
    ]
  },
  "stats": {
    "hp": 400,
    "mana": "+150",
    "attributes": {
      "FOR": 1,
      "DEF": 1,
      "RES": 2,
      "INI": 3,
      "INT": 4,
      "ARC": 4
    }
  },
  "mechanics": [
    {
      "title": "Dívida Infernal",
      "content": "<p>Acumula até <strong>5 pontos de Dívida</strong>.</p><p>Sempre que utiliza habilidade racial que não consome Dívida, recebe 1 ponto depois da resolução.</p><p>Cada ponto concede:</p><ul><li>3% de aumento no dano mágico racial;</li><li>3% de eficiência dos debuffs raciais;</li><li>3% de redução nas curas recebidas.</li></ul><p>Habilidades que consomem Dívida não geram novo ponto. Toda a Dívida desaparece ao final do combate.</p>"
    },
    {
      "title": "Dívida Vencida",
      "content": "<p>Enquanto permanecer com 5 pontos, sofre dano verdadeiro equivalente a <strong>5% do HP máximo</strong> no final de cada turno.</p><p>O dano:</p><ul><li>Não pode ser reduzido;</li><li>Não reduz o HP para menos de 1;</li><li>Termina assim que a Dívida fica abaixo de 5.</li></ul>"
    }
  ],
  "traits": [
    {
      "label": "Passiva I",
      "title": "Sangue Infernal",
      "content": "<p>Recebe 20% de resistência contra dano de fogo. Queimaduras duram 1 turno a menos e maldições enfrentam 15% de resistência.</p><p>Na primeira vez em cada combate que resistir completamente a uma queimadura ou maldição, recupera 10% da Mana máxima.</p>"
    },
    {
      "label": "Passiva II",
      "title": "Palavras Vinculantes",
      "content": "<p>Maldições raciais ignoram 10% da RES dos inimigos.</p><p>Quando uma maldição racial permanece até o final, recupera 15 Mana.</p><p>Se for removida antes, reduz em 1 turno a recarga da habilidade racial com maior tempo restante.</p><p>Cada efeito só pode acontecer uma vez por rodada.</p>"
    }
  ],
  "weakness": null,
  "progression": [
    {
      "level": 1,
      "name": "Brasa da Condenação",
      "category": "Ativa — Dano mágico",
      "content": "<div class=\"skill-formula\">110% da INT + 40% do ARC</div><p>Aplica Queimadura Infernal equivalente a 20% da INT durante 2 turnos.</p><p>Com 4 ou 5 Dívidas, a queimadura também reduz em 15% as curas recebidas pelo alvo.</p>",
      "meta": [
        "Custo: 30 Mana",
        "Recarga: 1 turno",
        "Gera 1 Dívida"
      ]
    },
    {
      "level": 20,
      "name": "Cláusula da Ruína",
      "category": "Ativa — Maldição",
      "content": "<p>Durante 3 turnos, sempre que o alvo utiliza uma habilidade, paga Juros da Ruína:</p><div class=\"skill-formula\">40% do ARC como dano mágico</div><p>Os juros ativam uma vez por turno.</p><p>Pode consumir 1 Dívida para escolher uma cláusula adicional:</p><ul><li>O alvo causa 15% menos dano;</li><li>Benefícios recebidos duram 1 turno a menos;</li><li>Os Juros aumentam para 60% do ARC.</li></ul>",
      "meta": [
        "Custo: 50 Mana",
        "Recarga: 4 turnos",
        "Duração: 3 turnos",
        "Gera 1 ou consome 1 Dívida"
      ]
    },
    {
      "level": 40,
      "name": "Passo do Enxofre",
      "category": "Ativa ou reação — Mobilidade",
      "content": "<p>Teleporta-se para um ponto visível. Uma cópia flamejante permanece na posição anterior.</p><p>O primeiro ataque de alvo único tem dano reduzido em 50%, destrói a cópia e causa:</p><div class=\"skill-formula\">60% da INT</div><p><strong>Fuga Contratual:</strong> ao ser alvo de ataque de alvo único, pode usar como reação e consumir 2 Dívidas para evitar completamente o ataque.</p><p>Não evita ataques em área, habilidades inevitáveis ou efeitos que bloqueiem teletransporte.</p>",
      "meta": [
        "Custo: 40 Mana",
        "Recarga: 4 turnos",
        "Gera 1 normalmente ou consome 2 como reação"
      ]
    },
    {
      "level": 60,
      "name": "Contrato Escarlate",
      "category": "Ativa — Contrato",
      "content": "<p>Escolhe uma forma durante 3 turnos.</p><p><strong>Pacto de Proteção</strong></p><ul><li>Aliado causa 15% mais dano;</li><li>Aliado recebe 15% mais cura;</li><li>20% do dano final do aliado é redirecionado ao Tiefling.</li></ul><p><strong>Pacto de Condenação</strong></p><ul><li>Alvo recebe 25% menos cura;</li><li>Ao causar dano, recebe como dano mágico 15% do dano final causado, uma vez por turno;</li><li>Chefes e colossais recebem 10%.</li></ul>",
      "meta": [
        "Custo: 70 Mana",
        "Recarga: 5 turnos",
        "Consome 2 Dívidas",
        "Duração: 3 turnos"
      ]
    },
    {
      "level": 80,
      "name": "Cobrança Infernal",
      "category": "Ativa — Explosão infernal",
      "content": "<p>Exige pelo menos 3 Dívidas e causa a todos os inimigos:</p><div class=\"skill-formula\">160% da INT + 80% do ARC</div><p>Cada ponto consumido aumenta o dano em 25% da INT.</p><p>Efeitos:</p><ul><li>3 pontos: queimadura de 30% da INT por 2 turnos;</li><li>4 pontos: alvos recebem 30% menos cura por 2 turnos;</li><li>5 pontos: remove um benefício mágico e impede novos benefícios por 1 turno.</li></ul><p>Toda a Dívida é consumida.</p>",
      "meta": [
        "Custo: 100 Mana",
        "Recarga: 6 turnos",
        "Requisito: 3 Dívidas"
      ]
    },
    {
      "level": 100,
      "name": "Ascensão do Sangue Infernal",
      "category": "Transformação racial máxima",
      "content": "<p>Ao se transformar:</p><ul><li>Recebe 5 Dívidas;</li><li>Recupera 15% da Mana máxima;</li><li>Remove maldição ou enfraquecimento;</li><li>Causa 80% da INT a inimigos próximos.</li></ul><p>Durante 3 turnos:</p><ul><li>Recebe 20% de INT, ARC e INI;</li><li>Não sofre redução de cura nem dano por Dívida Vencida;</li><li>Todas as habilidades contam como fortalecidas por 5 pontos;</li><li>A Dívida retorna para 5 no início de cada turno;</li><li>A primeira maldição por turno atinge segundo inimigo com 50% da eficiência;</li><li>Passo do Enxofre como reação consome apenas 1 Dívida.</li></ul><p>Ao final:</p><ul><li>Toda a Dívida é removida;</li><li>Sofre 10% do HP atual como dano verdadeiro;</li><li>Entra em Exaustão Infernal por 2 turnos: não gera Dívida e causa 10% menos dano mágico.</li></ul>",
      "meta": [
        "Custo: 150 Mana",
        "Uma vez por combate",
        "Duração: 3 turnos",
        "Exaustão: 2 turnos"
      ]
    }
  ],
  "curiosities": [
    "Nem todo Tiefling possui ancestral infernal direto; algumas linhagens surgiram por maldições ou exposição planar.",
    "O formato dos chifres varia conforme a linhagem familiar.",
    "Chifres quebrados crescem novamente, mas lentamente e com dor.",
    "Marcas infernais ficam mais visíveis durante magia ou emoções intensas.",
    "A cauda demonstra emoções involuntariamente.",
    "Existem Tieflings de pele azulada, acinzentada, roxa, negra ou semelhante à humana.",
    "Conseguem sentir magia em contratos, mas não conhecem automaticamente todas as cláusulas.",
    "Acordos verbais só se tornam mágicos com ritual ou poder específico.",
    "Muitos estudam leis e idiomas para impedir enganos infernais.",
    "Alguns escondem os chifres; outros os decoram com orgulho.",
    "Tieflings não são naturalmente malignos, assim como Aengels não são naturalmente bondosos."
  ]
},{
  "id": "vampiro",
  "name": "Vampiro",
  "icon": "♢",
  "theme": {
    "accent": "#d64c5d",
    "secondary": "#4b0d1d"
  },
  "archetype": "Predador carmesim",
  "tagline": "Sangue alimenta regeneração, névoa, hemomancia e sobrevivência — mas a fome cobra vulnerabilidade.",
  "difficulty": 5,
  "roles": [
    "DPS físico",
    "Híbrido",
    "Controle",
    "Regeneração"
  ],
  "description": [
    "Os Vampiros surgiram após a Maldição Carmesim, um antigo ritual que tentou utilizar sangue mortal para alcançar a imortalidade. O ritual falhou, criando seres suspensos entre a vida e a morte.",
    "Alguns nasceram em linhagens antigas, enquanto outros foram transformados por rituais, troca de sangue ou vontade de um Vampiro poderoso. Uma simples mordida não é suficiente.",
    "Sua aparência normalmente permanece semelhante à anterior, mas a pele se torna fria, os caninos crescem e os olhos podem adquirir tons vermelhos, dourados, negros ou prateados.",
    "Não possuem uma cultura única. Alguns se organizam em casas nobres e cortes; outros vivem como caçadores, estudiosos ou viajantes. Há comunidades que sobrevivem por meio de doações voluntárias e reservas alquímicas.",
    "A necessidade de sangue não determina sua personalidade. O verdadeiro perigo está em como escolhem controlar a fome."
  ],
  "playstyle": {
    "main": "DPS físico ou híbrido",
    "secondary": "Controle, mobilidade e regeneração",
    "strengths": "Sustentação, velocidade, perseguição e controle mental",
    "weaknesses": "Luz solar, fome e inimigos sem sangue",
    "recommended": [
      "FOR",
      "INI",
      "RES",
      "INT",
      "ARC"
    ]
  },
  "stats": {
    "hp": 500,
    "mana": "+100",
    "attributes": {
      "FOR": 3,
      "DEF": 1,
      "RES": 3,
      "INI": 4,
      "INT": 2,
      "ARC": 2
    }
  },
  "mechanics": [
    {
      "title": "Reserva de Sangue",
      "content": "<p>Armazena até <strong>5 pontos de Sangue</strong> e normalmente começa cada combate com 3.</p><p>Recebe 1 ponto ao:</p><ul><li>Utilizar Mordida Carmesim contra criatura viva;</li><li>Drenar inimigo por habilidade racial;</li><li>Derrubar criatura viva sob Sangramento.</li></ul><p>Normalmente, apenas 1 ponto por turno.</p><p>Não extrai sangue de construtos, mortos-vivos, elementais, criaturas sem corpo físico ou seres sem sangue ou essência vital equivalente.</p><p>Fora de combate, a quantidade depende da alimentação recente.</p>"
    },
    {
      "title": "Sangue Pleno e Fome Bestial",
      "content": "<p><strong>Sangue Pleno:</strong> com 5 pontos, recupera 2% do HP máximo no início de cada turno. Não consome Sangue e é interrompido pela luz solar.</p><p><strong>Fome Bestial:</strong> com 0 pontos:</p><ul><li>Causa 10% mais dano físico;</li><li>Perde 15% de DEF e RES;</li><li>Recebe 20% menos cura;</li><li>Não utiliza habilidades que exigem Sangue.</li></ul><p>A Fome termina ao recuperar pelo menos 1 ponto.</p>"
    }
  ],
  "traits": [
    {
      "label": "Passiva I",
      "title": "Corpo Amaldiçoado",
      "content": "<p>Recebe 30% de resistência contra venenos e doenças. Sangramentos comuns duram 1 turno a menos.</p><p>Não precisa respirar e pode sobreviver sem comida ou água comum, mas ainda necessita de sangue. Seu envelhecimento natural é extremamente lento.</p><p>Ainda pode ser curado normalmente por magia, poções e habilidades.</p>"
    },
    {
      "label": "Passiva II",
      "title": "Predador da Penumbra",
      "content": "<p>Em ambientes escuros ou pouco iluminados:</p><ul><li>Recebe 15% de INI;</li><li>Possui visão perfeita na escuridão comum;</li><li>Percebe criaturas feridas pelo cheiro do sangue;</li><li>Curas raciais ficam 10% mais eficientes.</li></ul><p>Inimigos vivos abaixo de 50% do HP não ocultam sua presença por meios comuns.</p><p>Os bônus não funcionam sob luz solar direta.</p>"
    }
  ],
  "weakness": {
    "title": "Luz Solar",
    "content": "<p>Sob luz solar direta:</p><ul><li>Perde 20% de INI;</li><li>Sangue Pleno é interrompido;</li><li>Curas raciais recebidas são reduzidas em 50%;</li><li>Predador da Penumbra fica inativo.</li></ul><p>Após 2 rodadas consecutivas, sofre 5% do HP máximo como dano verdadeiro no final de cada turno. O dano não reduz o HP abaixo de 1.</p><p>Roupas apropriadas, construções, sombra mágica e proteções alquímicas podem impedir a exposição. Luz mágica comum não conta como solar, salvo indicação.</p>"
  },
  "progression": [
    {
      "level": 1,
      "name": "Mordida Carmesim",
      "category": "Ativa — Ataque físico",
      "content": "<div class=\"skill-formula\">120% da FOR</div><p>Se o alvo estiver sob Sangramento, imobilizado ou controlado, causa mais 40% da FOR.</p><p>Contra criatura viva:</p><ul><li>Recupera 40% do dano causado;</li><li>Recebe 1 Sangue.</li></ul><p>Contra criatura sem sangue, causa dano, mas não cura nem gera Sangue.</p>",
      "meta": [
        "Sem custo",
        "Recarga: 2 turnos",
        "Gera 1 Sangue"
      ]
    },
    {
      "level": 20,
      "name": "Passo Nebuloso",
      "category": "Ativa ou reação — Mobilidade",
      "content": "<p><strong>Deslocamento:</strong> atravessa inimigos, grades, pequenas aberturas e obstáculos comuns sem sofrer reações.</p><p><strong>Névoa Defensiva:</strong> como reação:</p><ul><li>Reduz dano de alvo único em 60%;</li><li>Reduz dano em área em 30%;</li><li>Pode se reposicionar depois do dano;</li><li>Não pode ser derrubado ou imobilizado por essa fonte.</li></ul><p>Ataques inevitáveis ou que anulam transformações não são reduzidos.</p>",
      "meta": [
        "Custo: 1 Sangue",
        "Recarga: 3 turnos"
      ]
    },
    {
      "level": 40,
      "name": "Olhar Hipnótico",
      "category": "Ativa — Controle mental",
      "content": "<p>Hipnotiza um inimigo por 1 turno:</p><ul><li>Não pode atacar o Vampiro;</li><li>Não utiliza reações contra ele;</li><li>Pode receber comando simples de movimento ou interação;</li><li>Não pode ser obrigado a ferir a si mesmo ou aliados.</li></ul><p>O efeito termina se o Vampiro ou aliado causar dano direto.</p><p>Pode consumir 1 Sangue adicional para afetar segundo inimigo com 50% da duração e eficiência.</p><p>Chefes resistentes causam 20% menos dano contra o Vampiro e perdem 20% de INI por 1 turno.</p><p>O alvo precisa enxergar os olhos do Vampiro.</p>",
      "meta": [
        "Custo: 50 Mana",
        "Recarga: 4 turnos",
        "Pode consumir 1 Sangue"
      ]
    },
    {
      "level": 60,
      "name": "Manto da Noite",
      "category": "Ativa — Controle de campo",
      "content": "<p>Cobre uma região com escuridão sobrenatural durante 3 turnos.</p><p>Dentro do Manto, o Vampiro recebe:</p><ul><li>20% de INI;</li><li>15% de redução de dano;</li><li>Todos os benefícios de Predador da Penumbra;</li><li>Um uso de Passo Nebuloso sem gastar Sangue.</li></ul><p>Inimigos sem visão mágica:</p><ul><li>Perdem 15% de INI;</li><li>Causam 10% menos dano contra o Vampiro;</li><li>Não realizam reações contra Passo Nebuloso.</li></ul><p>Aliados enxergam silhuetas e identificam companheiros, mas podem ter dificuldade para localizar inimigos.</p>",
      "meta": [
        "Custo: 70 Mana + 2 Sangues",
        "Recarga: 5 turnos",
        "Duração: 3 turnos"
      ]
    },
    {
      "level": 80,
      "name": "Banquete Carmesim",
      "category": "Ativa — Hemomancia",
      "content": "<p>Atinge até três inimigos:</p><div class=\"skill-formula\">160% da INT + 100% do ARC</div><p>Alvos sob Sangramento recebem mais 30% da INT.</p><p>Recupera 30% do dano total, limitado a 25% do HP máximo.</p><p>Para cada criatura viva atingida, recebe 1 Sangue, até 3. Criaturas sem sangue não concedem cura ou recurso.</p>",
      "meta": [
        "Custo: 100 Mana",
        "Recarga: 6 turnos",
        "Pode gerar até 3 Sangues"
      ]
    },
    {
      "level": 100,
      "name": "Ascensão do Sangue Antigo",
      "category": "Transformação racial máxima",
      "content": "<p>Ao se transformar:</p><ul><li>Recupera 20% do HP máximo;</li><li>Recebe 5 Sangues;</li><li>Remove medo, veneno e imobilização;</li><li>Inimigos vivos próximos sofrem Sangramento de 30% da FOR por 2 turnos.</li></ul><p>Durante 3 turnos:</p><ul><li>Recebe 20% de FOR e INT;</li><li>Recebe 15% de RES e INI;</li><li>Pode voar e ignorar obstáculos terrestres;</li><li>Custos de Sangue são reduzidos em 1;</li><li>Mordida Carmesim tem a recarga encerrada no início de cada turno;</li><li>A cura da Mordida aumenta de 40% para 60%;</li><li>Recebe 1 Sangue no início de cada turno;</li><li>Penalidades solares ficam suspensas.</li></ul><p>Uma vez, pode consumir 5 Sangues para permanecer com 1 de HP e recuperar 15% do HP máximo.</p><p>Ao final:</p><ul><li>Reserva de Sangue é reduzida a 0;</li><li>Entra em Fome Bestial;</li><li>Sofre Exaustão Carmesim por 2 turnos: não recupera Sangue, não usa transformação e recebe 10% menos cura.</li></ul>",
      "meta": [
        "Custo: 130 Mana",
        "Uma vez por combate",
        "Duração: 3 turnos",
        "Exaustão: 2 turnos"
      ]
    }
  ],
  "curiosities": [
    "Uma simples mordida não transforma alguém; é necessário ritual ou troca voluntária de sangue.",
    "Vampiros possuem reflexo e aparecem em espelhos comuns.",
    "Alguns espelhos encantados revelam sua natureza amaldiçoada.",
    "Alho não causa dano, mas o cheiro intenso incomoda seus sentidos.",
    "Estacas não eliminam instantaneamente; impedem regeneração de um Vampiro incapacitado.",
    "Sangue animal alivia a fome, mas possui menos energia.",
    "Sangue armazenado funciona quando preservado por alquimia ou magia.",
    "Vampiros não precisam matar para se alimentar.",
    "Casas vampíricas registram linhagens e transformações em arquivos genealógicos.",
    "Vampiros antigos podem desenvolver asas, sombras independentes ou olhos adicionais.",
    "Entrar em residência não exige convite, embora barreiras mágicas possam usar essa crença.",
    "Alguns mantêm relações respeitosas com doadores; outros tratam mortais como recursos.",
    "A cor dos olhos costuma mudar quando a Reserva está acabando.",
    "Sem sangue por muito tempo, podem entrar em hibernação."
  ]
},
{
  "id": "elfo",
  "name": "Elfo",
  "icon": "❈",
  "theme": {
    "accent": "#75d19a",
    "secondary": "#2d6f59"
  },
  "archetype": "Herdeiro ancestral",
  "tagline": "Concentração transforma precisão, magia e posicionamento seguro em Sintonia Perfeita.",
  "difficulty": 3,
  "roles": [
    "DPS físico",
    "DPS mágico",
    "Suporte",
    "Controle"
  ],
  "description": [
    "Os Elfos estão entre os povos mortais mais antigos de Wonderland. Segundo suas tradições, seus primeiros ancestrais surgiram quando a magia do mundo se acumulou nas florestas, rios e estrelas, adquirindo consciência.",
    "Possuem corpos esguios, orelhas alongadas e sentidos extremamente desenvolvidos. Seus olhos podem apresentar cores incomuns, e alguns manifestam marcas semelhantes a folhas, constelações ou linhas de energia.",
    "A cultura élfica valoriza conhecimento, arte, paciência e preservação. Por viverem durante séculos, possuem uma percepção diferente do tempo.",
    "Nem todos vivem em florestas. Existem comunidades em cidades, montanhas, desertos e regiões costeiras.",
    "Elfos costumam atuar como arqueiros, magos, curandeiros, exploradores, diplomatas e guardiões de locais onde a magia se encontra instável."
  ],
  "playstyle": {
    "main": "DPS físico ou mágico",
    "secondary": "Suporte e controle",
    "strengths": "Precisão, mobilidade, magia e versatilidade",
    "weaknesses": "HP moderado, baixa DEF e perda de poder quando pressionado",
    "recommended": [
      "INI",
      "INT",
      "ARC",
      "FOR"
    ]
  },
  "stats": {
    "hp": 400,
    "mana": "+150",
    "attributes": {
      "FOR": 2,
      "DEF": 1,
      "RES": 2,
      "INI": 4,
      "INT": 3,
      "ARC": 3
    }
  },
  "mechanics": [
    {
      "title": "Concentração Élfica",
      "content": "<p>Acumula até <strong>3 pontos de Concentração</strong>.</p><p>Recebe 1 ponto após:</p><ul><li>Completar uma ação sem ser interrompido;</li><li>Evitar completamente um ataque;</li><li>Passar um turno sem receber dano direto.</li></ul><p>Somente 1 ponto por turno.</p><p>Cada ponto concede:</p><ul><li>5% de INI;</li><li>3% de aumento no dano racial;</li><li>3% de aumento nas curas e escudos raciais.</li></ul><p>Com 3 pontos, entra em <strong>Sintonia Perfeita</strong>.</p><p>Ao sofrer dano direto, perde 1 ponto. Ao ser atordoado, derrubado ou interrompido, perde todos.</p>"
    }
  ],
  "traits": [
    {
      "label": "Passiva I",
      "title": "Sentidos Élficos",
      "content": "<p>Recebe 15% de INI durante a primeira rodada, enxerga perfeitamente em pouca iluminação e possui 20% de resistência contra ataques surpresa.</p><p>Consegue perceber movimentos, sons e alterações sutis no ambiente. Invisibilidade e silêncio mágico ainda podem enganá-lo.</p>"
    },
    {
      "label": "Passiva II",
      "title": "Mente de Séculos",
      "content": "<p>Recebe 20% de resistência contra encanto e ilusões. A duração desses efeitos é reduzida em 1 turno.</p><p>Precisa de apenas 4 horas de meditação para obter os benefícios de um descanso comum.</p><p>Durante a meditação, permanece consciente dos sons e movimentos, mas ainda pode ser surpreendido por magia.</p>"
    }
  ],
  "weakness": null,
  "progression": [
    {
      "level": 1,
      "name": "Flecha Etérea",
      "category": "Ativa — Ataque físico ou mágico",
      "content": "<p>Escolhe a natureza do ataque.</p><p><strong>Flecha Física</strong></p><div class=\"skill-formula\">130% da FOR + 30% do ARC</div><p><strong>Flecha Arcana</strong></p><div class=\"skill-formula\">120% da INT + 40% do ARC</div><p>Em Sintonia Perfeita, pode consumir 3 pontos para criar uma segunda flecha com 60% do dano original, no mesmo ou em outro alvo.</p>",
      "meta": [
        "Custo: 30 Mana",
        "Recarga: 1 turno",
        "Pode consumir 3 Concentrações"
      ]
    },
    {
      "level": 20,
      "name": "Passo sem Rastros",
      "category": "Ativa ou reação — Mobilidade",
      "content": "<p>Ao utilizar:</p><ul><li>Reposiciona sem provocar reações;</li><li>Ignora obstáculos terrestres comuns;</li><li>Recebe 20% de INI até o próximo turno;</li><li>Apaga rastros, sons e odores do movimento.</li></ul><p><strong>Evasão Instintiva:</strong> como reação, consome 2 Concentrações:</p><ul><li>Reduz o dano em 50%;</li><li>Pode se reposicionar após o ataque;</li><li>Não pode ser derrubado ou imobilizado por essa fonte.</li></ul><p>Ataques inevitáveis e efeitos em área ainda causam dano normalmente.</p>",
      "meta": [
        "Custo: 25 Mana",
        "Recarga: 3 turnos",
        "Gera 1 normalmente ou consome 2 como reação"
      ]
    },
    {
      "level": 40,
      "name": "Graça do Bosque Antigo",
      "category": "Ativa — Cura",
      "content": "<p>Cura inicial:</p><div class=\"skill-formula\">120% do ARC</div><p>Durante 2 turnos, recupera 30% do ARC no início de cada turno.</p><p>Em Sintonia Perfeita, pode consumir 3 pontos para:</p><ul><li>Remover um efeito negativo comum;</li><li>Conceder escudo de 100% do ARC;</li><li>Fazer a cura inicial atingir segundo aliado com 60% da eficiência.</li></ul>",
      "meta": [
        "Custo: 55 Mana",
        "Recarga: 4 turnos",
        "Regeneração: 2 turnos",
        "Pode consumir 3 Concentrações"
      ]
    },
    {
      "level": 60,
      "name": "Laços de Luz e Raiz",
      "category": "Ativa — Controle",
      "content": "<p>Atinge até três inimigos:</p><div class=\"skill-formula\">80% da INT + 60% do ARC</div><p>Os inimigos ficam Imobilizados por 1 turno e depois perdem 20% de INI por mais 1 turno.</p><p>Ao consumir 3 Concentrações:</p><ul><li>Dano aumenta em 40% da INT;</li><li>Imobilização dura 2 turnos;</li><li>Alvos não utilizam reações durante o primeiro turno.</li></ul><p>Chefes e colossais perdem 30% de INI e não podem se reposicionar por reações.</p>",
      "meta": [
        "Custo: 75 Mana",
        "Recarga: 5 turnos",
        "Pode consumir 3 Concentrações"
      ]
    },
    {
      "level": 80,
      "name": "Chuva das Estrelas Ancestrais",
      "category": "Ativa — Ataque coletivo",
      "content": "<p>Escolhe dano físico ou mágico e atinge todos os inimigos:</p><div class=\"skill-formula\">170% do maior atributo entre FOR e INT + 80% do ARC</div><p>Um alvo principal recebe mais 50% do atributo utilizado.</p><p>Pode consumir até 3 Concentrações. Cada uma:</p><ul><li>Aumenta o dano em 15% do atributo;</li><li>Ignora 5% da DEF ou RES.</li></ul><p>Com 3 pontos, o alvo principal fica Exposto e recebe 15% mais dano do próximo ataque.</p>",
      "meta": [
        "Custo: 100 Mana",
        "Recarga: 6 turnos",
        "Pode consumir até 3 Concentrações"
      ]
    },
    {
      "level": 100,
      "name": "Legado da Primeira Era",
      "category": "Despertar racial máximo",
      "content": "<p>Ao despertar:</p><ul><li>Recebe 3 Concentrações;</li><li>Recupera 15% da Mana máxima;</li><li>Remove encanto, ilusão ou enfraquecimento;</li><li>Pode se reposicionar sem reações.</li></ul><p>Durante 3 turnos:</p><ul><li>Recebe 20% no maior atributo entre FOR e INT;</li><li>Recebe 20% de ARC;</li><li>Recebe 15% de INI e RES;</li><li>Concentração não cai abaixo de 1;</li><li>Primeira habilidade racial por turno não consome Concentração;</li><li>Flecha Etérea cria segunda flecha;</li><li>Graça aplica regeneração a segundo aliado;</li><li>Laços afeta um inimigo adicional;</li><li>Passo sem Rastros pode ser usado uma vez sem considerar recarga.</li></ul><p>Ao final, perde toda a Concentração e sofre Exaustão Ancestral por 2 turnos: não gera recurso e perde 15% de INI.</p>",
      "meta": [
        "Custo: 140 Mana",
        "Uma vez por combate",
        "Duração: 3 turnos",
        "Exaustão: 2 turnos"
      ]
    }
  ],
  "curiosities": [
    "Elfos podem viver por vários séculos, mas não são imortais.",
    "Seu envelhecimento desacelera após alcançarem a maturidade.",
    "As orelhas élficas possuem grande sensibilidade e podem se movimentar levemente em resposta a sons.",
    "Nem todos vivem em florestas ou possuem ligação direta com a natureza.",
    "Existem comunidades élficas adaptadas a desertos, montanhas, cidades e regiões costeiras.",
    "Elfos registram memórias por músicas, pinturas, joias e árvores encantadas.",
    "Alguns evitam escrever nomes de falecidos, acreditando que histórias preservam melhor sua essência.",
    "Relacionamentos com povos de vida curta podem ser difíceis, mas não são incomuns.",
    "Muitos mantêm cartas e objetos de amigos mortos há séculos.",
    "Vinte anos podem parecer pouco, mas isso não os impede de tomar decisões rápidas.",
    "As marcas do Legado da Primeira Era são diferentes em cada linhagem.",
    "Elfos raramente esquecem uma promessa, amizade ou ofensa importante."
  ]
},
{
  "id": "fada",
  "name": "Fada",
  "icon": "✺",
  "theme": {
    "accent": "#88e9ff",
    "secondary": "#c978ff"
  },
  "archetype": "Espírito do Véu",
  "tagline": "Encantos e Travessuras alternados criam Harmonia Feérica e transformam fragilidade em controle.",
  "difficulty": 5,
  "roles": [
    "Suporte",
    "Controle",
    "DPS mágico",
    "Mobilidade"
  ],
  "description": [
    "As Fadas nasceram no Véu Feérico, dimensão formada pela união entre magia, natureza, sonhos e emoções. As primeiras surgiram quando os sentimentos dos mortais atravessaram o Véu e adquiriram consciência.",
    "Cada Fada carrega uma ligação especial com alguma manifestação do mundo, como flores, tempestades, luar, estações, música, sonhos ou memórias.",
    "Sua altura normalmente varia entre vinte e sessenta centímetros. Possuem asas que lembram borboletas, libélulas, folhas, cristais ou fragmentos de luz.",
    "As sociedades feéricas são organizadas em círculos, cortes e domínios escondidos. Presentes, nomes, promessas e hospitalidade possuem grande importância.",
    "Apesar da fama de alegres e inocentes, Fadas podem ser bondosas, caprichosas, vingativas ou assustadoramente antigas."
  ],
  "playstyle": {
    "main": "Suporte e controle",
    "secondary": "DPS mágico e mobilidade",
    "strengths": "Cura, buffs, debuffs, voo e versatilidade",
    "weaknesses": "HP extremamente baixo, pouca defesa e ferro frio",
    "recommended": [
      "ARC",
      "INT",
      "INI"
    ]
  },
  "stats": {
    "hp": 200,
    "mana": "+250",
    "attributes": {
      "FOR": 0,
      "DEF": 1,
      "RES": 1,
      "INI": 4,
      "INT": 4,
      "ARC": 5
    }
  },
  "mechanics": [
    {
      "title": "Pó Feérico",
      "content": "<p>Acumula até <strong>5 pontos de Pó Feérico</strong> e começa cada combate com 2.</p><p>Recebe 1 ponto quando:</p><ul><li>Utiliza habilidade racial em alvo diferente de si;</li><li>Concede buff ou escudo a aliado;</li><li>Aplica debuff ou controle a inimigo.</li></ul><p>Normalmente, apenas 1 ponto por turno. Habilidades que consomem Pó não geram novo ponto na mesma utilização.</p>"
    },
    {
      "title": "Ritmo Feérico",
      "content": "<p>As habilidades são classificadas como:</p><p><strong>Encanto:</strong> cura, proteção, fortalecimento e mobilidade.</p><p><strong>Travessura:</strong> dano, enfraquecimento, ilusão e controle.</p><p>Ao utilizar categoria diferente da última habilidade racial, entra em Harmonia Feérica:</p><ul><li>Recebe 1 Pó adicional;</li><li>A habilidade atual fica 10% mais eficiente.</li></ul><p>A Harmonia acontece uma vez por rodada.</p>"
    }
  ],
  "traits": [
    {
      "label": "Passiva I",
      "title": "Asas Feéricas",
      "content": "<p>Pode voar livremente, permanecer no ar, atravessar pequenas aberturas, alcançar posições elevadas e ignorar terreno terrestre.</p><p>Ao receber de uma fonte dano igual ou superior a 20% do HP máximo, é forçada a pousar e não pode voar até o final do próximo turno.</p><p>Efeitos que prendam ou danifiquem as asas também podem impedir o voo.</p>"
    },
    {
      "label": "Passiva II",
      "title": "Essência Encantada",
      "content": "<p>Recebe 20% de resistência contra encanto, ilusão e sono. A duração desses efeitos é reduzida em 1 turno.</p><p>Consegue sentir magia feérica, alterações no Véu e emoções intensas próximas.</p><p>Essa percepção não revela pensamentos nem determina mentiras.</p>"
    },
    {
      "label": "Passiva III",
      "title": "Glamour Mutável",
      "content": "<p>Pode criar aparência humanoide de tamanho comum, alterando aparência, voz, roupas e tamanho percebido.</p><p>Não modifica atributos, peso ou força física. Contato direto, anulação de magia ou dano intenso podem revelar a forma verdadeira.</p>"
    }
  ],
  "weakness": {
    "title": "Ferro Frio",
    "content": "<p>Ao receber dano direto de arma de ferro frio:</p><ul><li>O ataque ignora 15% da DEF ou RES;</li><li>Não pode gerar Pó até o final do próximo turno;</li><li>As asas perdem poder e obrigam a permanecer no chão;</li><li>Glamour Mutável é revelado.</li></ul><p>Ferro comum não produz esses efeitos.</p>"
  },
  "progression": [
    {
      "level": 1,
      "name": "Faísca Prismática",
      "category": "Ativa — Encanto ou Travessura",
      "content": "<p><strong>Luz Restauradora — Encanto</strong></p><div class=\"skill-formula\">100% do ARC como cura</div><p>O alvo recebe 10% de INI até o próximo turno.</p><p><strong>Brilho Irritante — Travessura</strong></p><div class=\"skill-formula\">90% da INT + 60% do ARC</div><p>O alvo perde 10% de INI até o próximo turno.</p><p>Ao consumir 1 Pó, cura ou dano aumenta em 40% do ARC.</p>",
      "meta": [
        "Custo: 30 Mana",
        "Recarga: 1 turno",
        "Pode consumir 1 Pó"
      ]
    },
    {
      "level": 20,
      "name": "Pó das Mil Cores",
      "category": "Ativa — Encanto ou Travessura",
      "content": "<p><strong>Brilho Protetor — Encanto</strong></p><ul><li>Escudo de 120% do ARC;</li><li>Recebe 20% de INI por 1 turno.</li></ul><p><strong>Nuvem Ofuscante — Travessura</strong></p><ul><li>Próxima habilidade ofensiva causa 25% menos dano;</li><li>Não pode utilizar reações;</li><li>Perde 15% de INI por 1 turno.</li></ul><p>Ao consumir 1 Pó:</p><ul><li>Escudo aumenta para 180% do ARC; ou</li><li>Redução de dano aumenta para 40%.</li></ul>",
      "meta": [
        "Custo: 45 Mana",
        "Recarga: 3 turnos",
        "Pode consumir 1 Pó"
      ]
    },
    {
      "level": 40,
      "name": "Portal de Pétalas",
      "category": "Ativa ou reação — Encanto",
      "content": "<p>Transporta a Fada e um aliado para um ponto visível.</p><p>Ambos:</p><ul><li>Reposicionam sem provocar reações;</li><li>Recebem escudo de 60% do ARC;</li><li>Ignoram obstáculos terrestres durante o transporte.</li></ul><p><strong>Resgate Feérico:</strong> quando aliado é alvo de habilidade de alvo único, consome 2 Pó para retirá-lo antes do impacto e evitar completamente.</p><p>Não evita ataques em área, habilidades inevitáveis ou bloqueio de teletransporte.</p>",
      "meta": [
        "Custo: 60 Mana",
        "Recarga: 5 turnos",
        "Reação consome 2 Pó"
      ]
    },
    {
      "level": 60,
      "name": "Baile do Sono Dourado",
      "category": "Ativa — Travessura",
      "content": "<p>Atinge todos os inimigos:</p><div class=\"skill-formula\">80% da INT + 60% do ARC</div><p>Ficam Sonolentos por 2 turnos:</p><ul><li>Perdem 20% de INI;</li><li>Causam 15% menos dano;</li><li>Não recebem bônus de coragem ou inspiração.</li></ul><p>Quem já sofre debuff racial da Fada adormece por 1 turno. O sono termina ao receber dano direto.</p><p>Pode consumir 2 Pó para fazer todos adormecerem.</p><p>Chefes imunes perdem 30% de INI e causam 25% menos dano por 1 turno.</p>",
      "meta": [
        "Custo: 85 Mana",
        "Recarga: 5 turnos",
        "Duração: 2 turnos",
        "Pode consumir 2 Pó"
      ]
    },
    {
      "level": 80,
      "name": "Milagre Caprichoso",
      "category": "Ativa — Encanto ou Travessura",
      "content": "<p>Exige pelo menos 3 Pó e consome todos.</p><p><strong>Aurora Benevolente</strong></p><div class=\"skill-formula\">120% do ARC + 20% do ARC por Pó consumido</div><p>Também concede escudo de 50% do ARC por ponto. Com 5, remove um efeito negativo comum de cada aliado.</p><p><strong>Tempestade Travessa</strong></p><div class=\"skill-formula\">140% da INT + 80% do ARC + 20% da INT por Pó</div><p>Com 5:</p><ul><li>Inimigos perdem reações por 1 turno;</li><li>Um benefício mágico é removido;</li><li>Recebem 25% menos cura por 2 turnos.</li></ul>",
      "meta": [
        "Custo: 110 Mana",
        "Recarga: 6 turnos",
        "Requisito: 3 Pó"
      ]
    },
    {
      "level": 100,
      "name": "Manifestação do Coração Feérico",
      "category": "Transformação racial máxima",
      "content": "<p>Ao se transformar:</p><ul><li>Recebe 5 Pó;</li><li>Recupera 20% da Mana máxima;</li><li>Remove um efeito de controle;</li><li>Cria escudo de 200% do ARC;</li><li>Abre passagens feéricas pelo campo.</li></ul><p>Durante 3 turnos:</p><ul><li>Recebe 20% de INT, ARC e INI;</li><li>Primeiro Pó consumido por turno não é removido;</li><li>Harmonia ativa duas vezes por rodada;</li><li>Bônus da Harmonia aumenta para 20%;</li><li>Faísca Prismática atinge segundo alvo com 60% da eficiência;</li><li>Encanto permite reposicionar um aliado;</li><li>Travessura reduz RES do inimigo em 10% por 1 turno;</li><li>Asas não são desativadas por dano comum.</li></ul><p>Ao final, perde todo o Pó e sofre Melancolia Feérica por 2 turnos:</p><ul><li>Não pode gerar Pó;</li><li>Perde 15% de INI;</li><li>Curas e danos raciais ficam 10% menos eficientes.</li></ul>",
      "meta": [
        "Custo: 160 Mana",
        "Uma vez por combate",
        "Duração: 3 turnos",
        "Melancolia: 2 turnos"
      ]
    }
  ],
  "curiosities": [
    "As asas de uma Fada mudam de brilho conforme suas emoções.",
    "Algumas Fadas nascem de flores, árvores, sonhos, canções ou fenômenos naturais.",
    "O verdadeiro nome possui grande importância e raramente é revelado.",
    "Aceitar presente feérico não cria automaticamente uma dívida, embora algumas Cortes usem rituais para isso.",
    "Fadas têm dificuldade para mentir diretamente, mas dominam omissões e duplo sentido.",
    "O tempo pode passar de forma diferente perto do Véu Feérico.",
    "Algumas envelhecem como mortais; outras permanecem jovens por séculos.",
    "O tamanho reduzido não significa que sejam crianças.",
    "Roupas e objetos costumam ser feitos de materiais mágicos muito leves.",
    "Podem comer comida comum, mas muitas preferem frutas, doces, néctar e emoções positivas.",
    "Uma Fada enfurecida pode alterar temporariamente asas e magia.",
    "Círculos de cogumelos podem marcar entradas para o Véu.",
    "Destruir o local ao qual uma Fada está ligada pode enfraquecê-la emocionalmente.",
    "Algumas colecionam botões, chaves, cartas e memórias."
  ]
},
{
  "id": "orc",
  "name": "Orc",
  "icon": "▲",
  "theme": {
    "accent": "#9ac36b",
    "secondary": "#4f6f31"
  },
  "archetype": "Força do primeiro clã",
  "tagline": "Ímpeto preservado mantém pressão constante; consumido, transforma resistência em golpes devastadores.",
  "difficulty": 3,
  "roles": [
    "Combatente físico",
    "Tanque",
    "Suporte ofensivo"
  ],
  "description": [
    "Os Orcs descendem dos povos que sobreviveram às primeiras grandes guerras de Wonderland. Enquanto outras civilizações se protegiam atrás de muralhas ou magia, seus ancestrais atravessaram territórios destruídos e reconstruíram comunidades inúmeras vezes.",
    "Com o passar das gerações, seus corpos tornaram-se resistentes, musculosos e adaptados às condições severas. Possuem presas inferiores desenvolvidas, orelhas pontiagudas e pele de diversas cores.",
    "A sociedade costuma se organizar em clãs, cada um com tradições próprias. Alguns valorizam guerreiros; outros são liderados por ferreiros, curandeiros, caçadores, anciões ou contadores de histórias.",
    "Para os Orcs, força não é apenas poder físico. Ser forte significa cumprir responsabilidades, proteger a comunidade e suportar consequências.",
    "Embora muitos os tratem como selvagens, possuem conhecimentos de sobrevivência, metalurgia, construção e medicina de campo."
  ],
  "playstyle": {
    "main": "Combatente físico",
    "secondary": "Tanque e suporte ofensivo",
    "strengths": "HP elevado, resistência, dano físico e controle de linha de frente",
    "weaknesses": "INI baixa, pouca afinidade mágica e dependência de combate contínuo",
    "recommended": [
      "FOR",
      "RES",
      "DEF"
    ]
  },
  "stats": {
    "hp": 750,
    "mana": "Sem bônus",
    "attributes": {
      "FOR": 5,
      "DEF": 3,
      "RES": 4,
      "INI": 1,
      "INT": 1,
      "ARC": 1
    }
  },
  "mechanics": [
    {
      "title": "Ímpeto de Batalha",
      "content": "<p>Acumula até <strong>4 pontos de Ímpeto</strong>.</p><p>Recebe 1 ponto quando:</p><ul><li>Causa dano direto;</li><li>Recebe de uma fonte dano igual ou superior a 10% do HP máximo;</li><li>Resiste a medo, atordoamento, derrubada ou deslocamento;</li><li>Protege um aliado.</li></ul><p>Normalmente, apenas 1 ponto por turno.</p><p>Cada ponto mantido concede:</p><ul><li>3% de aumento no dano físico;</li><li>3% de resistência contra controle.</li></ul><p>Ao passar uma rodada inteira sem causar ou receber dano, perde 2 pontos.</p>"
    }
  ],
  "traits": [
    {
      "label": "Passiva I",
      "title": "Constituição Titânica",
      "content": "<p>Curas recebidas são 10% mais eficientes.</p><p>Recebe 20% de resistência contra venenos e doenças. Sangramentos comuns duram 1 turno a menos.</p><p>Suporta peso e esforço físico por períodos maiores. A eficiência adicional afeta curas, regenerações e poções, mas não escudos.</p>"
    },
    {
      "label": "Passiva II",
      "title": "Vontade de Ferro",
      "content": "<p>Recebe 25% de resistência contra:</p><ul><li>Medo;</li><li>Intimidação;</li><li>Derrubada;</li><li>Deslocamento forçado.</li></ul><p>A duração desses efeitos é reduzida em 1 turno. Ao resistir completamente, recebe 1 Ímpeto.</p>"
    }
  ],
  "weakness": null,
  "progression": [
    {
      "level": 1,
      "name": "Golpe Demolidor",
      "category": "Ativa — Ataque físico",
      "content": "<div class=\"skill-formula\">150% da FOR</div><p>Com pelo menos 2 Ímpetos, ignora 10% da DEF.</p><p>Pode consumir 2 para aplicar Fratura durante 2 turnos:</p><ul><li>DEF do alvo reduzida em 15%;</li><li>Escudos recebidos ficam 20% menos eficientes;</li><li>Próxima resistência a derrubada recebe 20% de penalidade.</li></ul>",
      "meta": [
        "Sem custo",
        "Recarga: 1 turno",
        "Pode consumir 2 Ímpetos"
      ]
    },
    {
      "level": 20,
      "name": "Marcha Imparável",
      "category": "Ativa — Mobilidade e ataque",
      "content": "<p>Avança violentamente:</p><ul><li>Não pode ser interrompido por reações comuns;</li><li>Ignora terreno difícil;</li><li>Recebe 30% de resistência contra imobilização e deslocamento.</li></ul><p>Ao alcançar o alvo:</p><div class=\"skill-formula\">120% da FOR</div><p>Pode consumir 1 Ímpeto para derrubar. Alvo muito grande perde 20% de INI por 1 turno.</p><p>Após percorrer grande distância, causa mais 30% da FOR.</p>",
      "meta": [
        "Sem custo",
        "Recarga: 3 turnos",
        "Pode consumir 1 Ímpeto"
      ]
    },
    {
      "level": 40,
      "name": "Postura Inabalável",
      "category": "Ativa — Defensiva",
      "content": "<p>Durante 2 turnos:</p><ul><li>Recebe 20% menos dano;</li><li>Não pode ser derrubado ou deslocado por efeitos comuns;</li><li>Na primeira vez que recebe dano em cada turno, ganha escudo de 40% da RES;</li><li>Não perde Ímpeto por passar rodada sem atacar.</li></ul>",
      "meta": [
        "Custo: 2 Ímpetos",
        "Recarga: 4 turnos",
        "Duração: 2 turnos"
      ]
    },
    {
      "level": 60,
      "name": "Grito do Clã",
      "category": "Ativa — Fortalecimento coletivo",
      "content": "<p>Durante 2 turnos, aliados recebem:</p><ul><li>10% de aumento no dano;</li><li>20% de resistência contra medo e intimidação;</li><li>15% contra derrubadas e deslocamentos;</li><li>10% de aumento nas curas recebidas.</li></ul><p>Pode consumir até 2 Ímpetos:</p><ul><li>1 ponto: remove medo comum;</li><li>2 pontos: concede também 10% de redução de dano.</li></ul><p>Se estiver sozinho, recebe todos os benefícios e recupera 5% do HP máximo.</p>",
      "meta": [
        "Sem custo",
        "Recarga: 5 turnos",
        "Duração: 2 turnos",
        "Pode consumir até 2 Ímpetos"
      ]
    },
    {
      "level": 80,
      "name": "Golpe Quebra-Terra",
      "category": "Ativa — Ataque em área",
      "content": "<p>Alvo principal:</p><div class=\"skill-formula\">200% da FOR</div><p>Outros inimigos próximos:</p><div class=\"skill-formula\">120% da FOR</div><p>Exige 2 Ímpetos e consome todos. Cada ponto adiciona:</p><ul><li>30% da FOR no alvo principal;</li><li>15% da FOR nos demais.</li></ul><p>Com 4 pontos:</p><ul><li>Alvo principal é derrubado;</li><li>Demais inimigos perdem 25% de INI;</li><li>Área torna-se terreno difícil por 2 turnos;</li><li>Barreiras e escudos recebem 50% de dano adicional.</li></ul><p>Criaturas colossais não são derrubadas, mas têm canalizações interrompidas.</p>",
      "meta": [
        "Custo: todo o Ímpeto",
        "Recarga: 6 turnos",
        "Requisito: 2 Ímpetos"
      ]
    },
    {
      "level": 100,
      "name": "Lenda Viva do Primeiro Clã",
      "category": "Superação racial máxima",
      "content": "<p>Ao ativar:</p><ul><li>Recupera 20% do HP máximo;</li><li>Recebe 4 Ímpetos;</li><li>Remove medo, atordoamento e imobilização;</li><li>Inimigos próximos causam 15% menos dano por 1 turno.</li></ul><p>Durante 3 turnos:</p><ul><li>Recebe 20% de FOR e RES;</li><li>Recebe 15% de DEF;</li><li>Pode gerar até 2 Ímpetos por turno;</li><li>Ímpeto não pode cair abaixo de 2;</li><li>Ataques físicos atingem segundo inimigo com 40% da eficiência;</li><li>Marcha Imparável não pode ser interrompida;</li><li>Postura Inabalável pode ser ativada uma vez sem custo;</li><li>Grito do Clã pode ser utilizado uma vez sem considerar recarga.</li></ul><p>Uma vez, ao ser reduzido a 0:</p><ul><li>Permanece com 1 de HP;</li><li>Recupera 10% do HP máximo;</li><li>Recebe escudo de 150% da RES;</li><li>Perde todo o Ímpeto acima de 2.</li></ul><p>Ao final, perde todo o Ímpeto e sofre Exaustão de Guerra por 2 turnos:</p><ul><li>Não pode gerar Ímpeto;</li><li>Causa 10% menos dano;</li><li>Perde 20% de INI.</li></ul>",
      "meta": [
        "Sem custo",
        "Uma vez por combate",
        "Duração: 3 turnos",
        "Exaustão: 2 turnos"
      ]
    }
  ],
  "curiosities": [
    "A cor da pele varia conforme linhagem, território e exposição mágica.",
    "Presas crescem durante toda a vida e exigem cuidados.",
    "Presas quebradas podem ser reparadas com metal, pedra ou osso.",
    "Orcs não possuem inteligência inferior; essa ideia nasceu de preconceitos rivais.",
    "Clãs preservam história por músicas, tatuagens e narrativas orais.",
    "Cicatrizes podem representar conquistas, mas nem todo Orc sente orgulho delas.",
    "Ferreiros Orcs criam equipamentos extremamente resistentes.",
    "Um clã pode adotar membros de qualquer raça.",
    "Ser expulso não impede construir ou integrar outro clã.",
    "Alguns usam nomes compostos por feitos, lugares ou pessoas importantes.",
    "Conflitos também são resolvidos por competições, debates e trocas de presentes.",
    "Orcs respeitam quem continua lutando apesar do medo.",
    "Demonstrar emoções não é fraqueza em muitas culturas Orcs.",
    "A verdadeira força é medida principalmente pelo que alguém consegue proteger."
  ]
}
];