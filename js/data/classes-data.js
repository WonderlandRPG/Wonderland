const classes = {
    barbaro: {
        id: "barbaro",
        nome: "Bárbaro",
        dificuldade: "★★★☆☆",
        cargo: "Híbrido (DPS Físico / Tanque)",
        imagem: "assets/images/classes/barbaro.webp",
        icone: "assets/images/classes/barbaro.webp",
        descricao: "O Bárbaro transforma dor, perigo e agressividade em poder. Seu combate gira ao redor da Fúria, usada para golpes devastadores ou para ativar estados de sobrevivência extrema.",
        especializacao: { titulo: "Híbrido (DPS Físico / Tanque)", descricao: "Atua na linha de frente, pressiona inimigos e protege aliados com provocações e controle territorial." },
        estilo: { principal: "Dano físico elevado e pressão corpo a corpo.", secundaria: "Resistência e controle territorial.", fortes: "Dano alto, durabilidade e força quando está ferido.", fracos: "Pouco alcance e vulnerabilidade a controle e mobilidade inimiga.", atributos: "FOR, RES e DEF, com INI como suporte." },
        recurso: { nome: "Fúria", descricao: "Acumula até 100 pontos ao atacar e sofrer dano. Abaixo de 40% da vida, a geração aumenta em 50%." },
        passivas: [{ nome: "Instinto de Fúria", descricao: "Ao consumir 100 de Fúria, entra em Fúria Selvagem por dois turnos: +20% de dano físico, -15% de dano recebido e imunidade a Medo." }],
        progressao: [
            { nivel: "Nível 1", nome: "Corte Brutal", descricao: "Causa 120% de FOR, gera 15 de Fúria e passa a 140% de FOR abaixo de 40% da vida. Alcance: 1. Recarga: nenhuma." },
            { nivel: "Nível 1", nome: "Golpe Demolidor", descricao: "Causa 90% de FOR e 40% de dano adicional contra escudos. Gera 10 de Fúria. Recarga: 2 turnos." },
            { nivel: "Nível 3", nome: "Investida Selvagem", descricao: "Avança até 3 quadrados, causa 100% de FOR e empurra. Se houver colisão, Atordoa. Recarga: 3 turnos." },
            { nivel: "Nível 3", nome: "Passo do Predador", descricao: "Move-se 2 quadrados sem provocar reações e recebe 10 de Fúria ao terminar adjacente a um inimigo. Recarga: 2 turnos." },
            { nivel: "Nível 7", nome: "Rugido Provocador", descricao: "Provoca inimigos em raio 2 por um turno e reduz o dano deles contra aliados em 15%. Recarga: 5 turnos." },
            { nivel: "Nível 7", nome: "Presença Ameaçadora", descricao: "Inimigos adjacentes causam 10% menos dano contra outros personagens." },
            { nivel: "Nível 10", nome: "Golpe Quebra-Ossos", descricao: "Causa 170% de FOR e reduz a DEF do alvo em 25% por dois turnos. Custo: 25 de Fúria. Recarga: 3 turnos." },
            { nivel: "Nível 10", nome: "Esmagamento Descendente", descricao: "Causa 130% de FOR ou 170% contra alvos controlados. Custo: 20 de Fúria. Recarga: 3 turnos." }
        ],
        complexidade: { grau: "Médio", descricao: "Exige gerenciamento de Fúria e domínio do momento certo para atacar ou sobreviver." },
        caminhos: [
            { id: "berserker-sanguinario", nome: "Berserker Sanguinário", especializacao: "DPS Físico", complexidade: "Difícil", descricao: "Transforma vida perdida em poder destrutivo.", passiva: { nome: "Sede de Sangue", descricao: "Para cada 10% de vida faltante, causa 3% mais dano, até 21%." }, habilidades: [
                { nivel: "Nível 50", nome: "Dilacerar", descricao: "Três golpes de 70% de FOR; o terceiro aplica Hemorragia." },
                { nivel: "Nível 50", nome: "Avanço Predatório", descricao: "Avança até 5 quadrados, marca o alvo e causa 20% mais dano contra ele." },
                { nivel: "Nível 70", nome: "Banho de Sangue", descricao: "Cura 25% do dano físico causado por dois turnos." },
                { nivel: "Nível 70", nome: "Esmagar Crânio", descricao: "Causa 240% de FOR ou 340% contra alvos abaixo de 25% da vida." },
                { nivel: "Nível 100", nome: "Ultimate — Êxtase da Carnificina", descricao: "Por três turnos, +35% de dano, +2 de deslocamento e cura baseada no dano causado." },
                { nivel: "Nível 100", nome: "Carnificina Incontrolável", descricao: "O primeiro ataque de cada turno não consome Fúria e causa 20% mais dano." }
            ]},
            { id: "colosso-indomavel", nome: "Colosso Indomável", especializacao: "Tanque / Controle", complexidade: "Médio", descricao: "Bloqueia passagens, provoca inimigos e protege aliados.", passiva: { nome: "Corpo de Montanha", descricao: "+20% de vida máxima e até 15% de redução de dano por Fortitude." }, habilidades: [
                { nivel: "Nível 50", nome: "Ombro de Montanha", descricao: "Avança, causa dano, empurra e Atordoa em colisões." },
                { nivel: "Nível 50", nome: "Desafio Absoluto", descricao: "Provoca em raio 3 e recebe escudo por inimigo afetado." },
                { nivel: "Nível 70", nome: "Guarda Interposta", descricao: "Redireciona 70% do dano de um aliado para si." },
                { nivel: "Nível 70", nome: "Impacto Sísmico", descricao: "Causa dano em cone, puxa e Imobiliza inimigos próximos." },
                { nivel: "Nível 100", nome: "Ultimate — Muralha Viva", descricao: "Provoca em área, reduz o dano recebido e protege aliados próximos." },
                { nivel: "Nível 100", nome: "Fortaleza Inquebrável", descricao: "Fica imune a críticos e recebe um grande escudo de RES." }
            ]}
        ],
        curiosidades: ["O nível 50 define permanentemente o Caminho escolhido."]
    },

    alquimista: {
        id: "alquimista", nome: "Alquimista", dificuldade: "★★★★☆", cargo: "Suporte / Controle",
        imagem: "assets/images/classes/alquimista.webp", icone: "assets/images/classes/alquimista.webp",
        descricao: "O Alquimista combina reagentes para criar bombas, elixires e mutações temporárias, adaptando-se a cada batalha.",
        especializacao: { titulo: "Suporte Tático / Dano em Área", descricao: "Controla o ritmo da luta com preparações, zonas perigosas e consumíveis únicos." },
        estilo: { principal: "Controle de área e utilidade.", secundaria: "Dano mágico e cura situacional.", fortes: "Versatilidade, preparo e efeitos em área.", fracos: "Depende de posicionamento e recursos preparados.", atributos: "INT, ARC e INI." },
        recurso: { nome: "Reagentes", descricao: "Gera reagentes ao usar fórmulas e os consome para potencializar misturas." },
        passivas: [{ nome: "Mistura Instável", descricao: "A primeira fórmula diferente usada em cada turno gera 1 Reagente adicional." }],
        progressao: [
            { nivel: "Nível 1", nome: "Frasco Incendiário", descricao: "Explode em raio 1, causando 100% de INT e aplicando Queimadura por dois turnos." },
            { nivel: "Nível 1", nome: "Elixir Restaurador", descricao: "Cura 90% de ARC e remove um efeito leve negativo." },
            { nivel: "Nível 5", nome: "Bomba Criogênica", descricao: "Causa 110% de INT e aplica Lentidão de 40%." },
            { nivel: "Nível 5", nome: "Catalisador Rápido", descricao: "Reduz em um turno a recarga de uma fórmula própria." }
        ],
        complexidade: { grau: "Alto", descricao: "Exige planejamento de recursos, combinação de efeitos e leitura do campo." },
        caminhos: [
            { id: "mestre-explosivos", nome: "Mestre dos Explosivos", especializacao: "DPS em Área", complexidade: "Difícil", descricao: "Especializa-se em bombas de alto impacto.", passiva: { nome: "Carga Ampliada", descricao: "Explosões atingem uma área maior e causam 10% mais dano." }, habilidades: [
                { nivel: "Nível 50", nome: "Bomba de Fragmentação", descricao: "Explode duas vezes em áreas adjacentes." },
                { nivel: "Nível 50", nome: "Nuvem Corrosiva", descricao: "Cria uma zona que reduz DEF e RES." },
                { nivel: "Nível 70", nome: "Mina Volátil", descricao: "Arma uma explosão acionada por movimento inimigo." },
                { nivel: "Nível 70", nome: "Reação em Cadeia", descricao: "Detona efeitos alquímicos ativos em sequência." },
                { nivel: "Nível 100", nome: "Ultimate — Sol Engarrafado", descricao: "Cria uma explosão massiva que deixa a área incendiada." },
                { nivel: "Nível 100", nome: "Colapso Químico", descricao: "Converte todos os reagentes em dano adicional." }
            ]},
            { id: "medico-mutageno", nome: "Médico Mutagênico", especializacao: "Suporte / Cura", complexidade: "Mestre", descricao: "Usa mutações e elixires para fortalecer aliados.", passiva: { nome: "Dose Adaptativa", descricao: "Curas também concedem um bônus temporário apropriado ao alvo." }, habilidades: [
                { nivel: "Nível 50", nome: "Soro Regenerativo", descricao: "Cura ao longo de três turnos." },
                { nivel: "Nível 50", nome: "Antídoto Universal", descricao: "Remove dois efeitos negativos." },
                { nivel: "Nível 70", nome: "Mutação Defensiva", descricao: "Concede DEF e RES temporárias." },
                { nivel: "Nível 70", nome: "Mutação Predatória", descricao: "Concede FOR/INT e deslocamento." },
                { nivel: "Nível 100", nome: "Ultimate — Panaceia", descricao: "Cura o grupo, remove controles e concede escudos." },
                { nivel: "Nível 100", nome: "Evolução Forçada", descricao: "Um aliado recebe múltiplos bônus por três turnos." }
            ]}
        ], curiosidades: ["É a classe mais dependente de preparação."]
    },

    arqueiro: {
        id: "arqueiro", nome: "Arqueiro", dificuldade: "★★★☆☆", cargo: "DPS à Distância",
        imagem: "assets/images/classes/arqueiro.webp", icone: "assets/images/classes/arqueiro.webp",
        descricao: "O Arqueiro domina alcance, precisão e reposicionamento para controlar linhas de visão e eliminar ameaças antes que se aproximem.",
        especializacao: { titulo: "DPS Físico à Distância", descricao: "Pressiona alvos prioritários e domina corredores do mapa." },
        estilo: { principal: "Dano físico à distância.", secundaria: "Controle de espaço e mobilidade.", fortes: "Alcance, precisão e segurança.", fracos: "Fragilidade corpo a corpo e dependência de visão.", atributos: "FOR e INI." },
        recurso: { nome: "Foco", descricao: "Acumula Foco ao permanecer sem sofrer dano e o consome em disparos especiais." },
        passivas: [{ nome: "Olho de Caçador", descricao: "Ataques contra alvos mais distantes causam até 15% mais dano." }],
        progressao: [
            { nivel: "Nível 1", nome: "Disparo Preciso", descricao: "Causa 120% de FOR a até 6 quadrados." },
            { nivel: "Nível 1", nome: "Passo Recuado", descricao: "Move-se 2 quadrados para trás sem provocar reação." },
            { nivel: "Nível 5", nome: "Flecha Perfurante", descricao: "Atravessa até três alvos em linha." },
            { nivel: "Nível 5", nome: "Marca do Caçador", descricao: "Marca um alvo, aumentando o dano recebido do Arqueiro." }
        ],
        complexidade: { grau: "Médio", descricao: "Recompensa posicionamento, leitura de linha de visão e escolha de alvos." },
        caminhos: [
            { id: "atirador-elite", nome: "Atirador de Elite", especializacao: "DPS de Precisão", complexidade: "Difícil", descricao: "Elimina alvos a longas distâncias.", passiva: { nome: "Respiração Controlada", descricao: "Não se mover aumenta a chance crítica e o alcance." }, habilidades: [
                { nivel: "Nível 50", nome: "Tiro Longo", descricao: "Causa dano crescente com a distância." },
                { nivel: "Nível 50", nome: "Ponto Vital", descricao: "Ignora parte da DEF do alvo." },
                { nivel: "Nível 70", nome: "Rajada Calculada", descricao: "Dispara três flechas no mesmo alvo." },
                { nivel: "Nível 70", nome: "Postura Imóvel", descricao: "Ganha alcance e dano enquanto não se move." },
                { nivel: "Nível 100", nome: "Ultimate — Horizonte Partido", descricao: "Disparo global em linha reta com dano extremo." },
                { nivel: "Nível 100", nome: "Execução Perfeita", descricao: "Causa dano adicional contra alvos feridos." }
            ]},
            { id: "cacador-selvagem", nome: "Caçador Selvagem", especializacao: "Mobilidade / Controle", complexidade: "Médio", descricao: "Combina armadilhas e movimento constante.", passiva: { nome: "Passos Leves", descricao: "Mover-se aumenta o dano do próximo ataque." }, habilidades: [
                { nivel: "Nível 50", nome: "Armadilha de Laço", descricao: "Imobiliza o primeiro inimigo que entrar." },
                { nivel: "Nível 50", nome: "Flecha Serrilhada", descricao: "Aplica Hemorragia." },
                { nivel: "Nível 70", nome: "Disparo em Movimento", descricao: "Ataca durante o deslocamento." },
                { nivel: "Nível 70", nome: "Chuva de Flechas", descricao: "Ataca uma área durante dois turnos." },
                { nivel: "Nível 100", nome: "Ultimate — Caçada Implacável", descricao: "Marca vários inimigos e recebe ações de movimento extras." },
                { nivel: "Nível 100", nome: "Território do Caçador", descricao: "Armadilhas e ataques ficam mais fortes em uma área escolhida." }
            ]}
        ], curiosidades: ["É uma das classes mais fortes em mapas abertos."]
    },

    assassino: {
        id: "assassino", nome: "Assassino", dificuldade: "★★★★★", cargo: "DPS Explosivo",
        imagem: "assets/images/classes/assassino.webp", icone: "assets/images/classes/assassino.webp",
        descricao: "O Assassino utiliza furtividade, mobilidade e ataques oportunistas para eliminar alvos frágeis antes que possam reagir.",
        especializacao: { titulo: "DPS Físico Explosivo", descricao: "Entra e sai do combate rapidamente, punindo erros de posicionamento." },
        estilo: { principal: "Execução de alvos prioritários.", secundaria: "Infiltração e mobilidade.", fortes: "Explosão, acesso à retaguarda e evasão.", fracos: "Baixa resistência e dependência de oportunidade.", atributos: "INI e FOR." },
        recurso: { nome: "Sombras", descricao: "Ganha cargas ao entrar em furtividade ou atacar pelas costas." },
        passivas: [{ nome: "Ataque pelas Costas", descricao: "Ataques contra a retaguarda causam 25% mais dano." }],
        progressao: [
            { nivel: "Nível 1", nome: "Lâmina Oculta", descricao: "Causa 130% de FOR e 170% se usado em furtividade." },
            { nivel: "Nível 1", nome: "Passo Sombrio", descricao: "Teleporta para um espaço adjacente ao alvo." },
            { nivel: "Nível 5", nome: "Fumaça Cega", descricao: "Cria área que reduz precisão e visão." },
            { nivel: "Nível 5", nome: "Ferida Mortal", descricao: "Aplica redução de cura e Hemorragia." }
        ],
        complexidade: { grau: "Muito Alto", descricao: "Exige rotas, tempo de entrada e gerenciamento de fuga." },
        caminhos: [
            { id: "lamina-noturna", nome: "Lâmina Noturna", especializacao: "Burst / Furtividade", complexidade: "Mestre", descricao: "Especializa-se em desaparecer e executar.", passiva: { nome: "Manto da Noite", descricao: "Eliminar um alvo restaura furtividade." }, habilidades: [
                { nivel: "Nível 50", nome: "Execução Silenciosa", descricao: "Dano extremo contra alvos abaixo de 30%." },
                { nivel: "Nível 50", nome: "Véu Sombrio", descricao: "Entra em furtividade e ganha deslocamento." },
                { nivel: "Nível 70", nome: "Dança das Facas", descricao: "Ataca inimigos adjacentes e reposiciona." },
                { nivel: "Nível 70", nome: "Marca da Morte", descricao: "Amplifica todo o dano contra um alvo." },
                { nivel: "Nível 100", nome: "Ultimate — Noite Sem Lua", descricao: "Fica invisível e ganha múltiplas investidas por três turnos." },
                { nivel: "Nível 100", nome: "Fim Inevitável", descricao: "O primeiro ataque contra cada alvo marcado é crítico garantido." }
            ]},
            { id: "duelista-venenoso", nome: "Duelista Venenoso", especializacao: "Dano Contínuo", complexidade: "Difícil", descricao: "Vence pela acumulação de venenos e pressão.", passiva: { nome: "Toxina Crescente", descricao: "Venenos acumulam até três vezes." }, habilidades: [
                { nivel: "Nível 50", nome: "Lâmina Envenenada", descricao: "Aplica Veneno acumulável." },
                { nivel: "Nível 50", nome: "Antídoto Sombrio", descricao: "Remove Veneno próprio e recebe cura." },
                { nivel: "Nível 70", nome: "Nuvem Tóxica", descricao: "Cria área venenosa." },
                { nivel: "Nível 70", nome: "Ruptura Venenosa", descricao: "Consome venenos para causar dano imediato." },
                { nivel: "Nível 100", nome: "Ultimate — Beijo da Serpente", descricao: "Aplica veneno supremo que ignora resistência parcial." },
                { nivel: "Nível 100", nome: "Sangue Frio", descricao: "Venenos curam parte do dano causado." }
            ]}
        ], curiosidades: ["É a classe com maior exigência de posicionamento ofensivo."]
    },

    bardo: {
        id: "bardo", nome: "Bardo", dificuldade: "★★★★☆", cargo: "Suporte / Controle",
        imagem: "assets/images/classes/bardo.webp", icone: "assets/images/classes/bardo.webp",
        descricao: "O Bardo manipula o campo por meio de canções, ritmos e histórias capazes de fortalecer aliados e desestabilizar inimigos.",
        especializacao: { titulo: "Suporte Arcano", descricao: "Mantém efeitos contínuos e adapta a música ao estado da batalha." },
        estilo: { principal: "Buffs, debuffs e controle.", secundaria: "Cura e dano mágico.", fortes: "Utilidade, versatilidade e influência global.", fracos: "Dano direto limitado e dependência de posicionamento.", atributos: "ARC, INT e INI." },
        recurso: { nome: "Ritmo", descricao: "Usar habilidades diferentes mantém o Ritmo e fortalece a próxima canção." },
        passivas: [{ nome: "Encore", descricao: "A cada terceira habilidade diferente, repete 30% do efeito em um aliado próximo." }],
        progressao: [
            { nivel: "Nível 1", nome: "Canção de Coragem", descricao: "Aliados próximos causam 10% mais dano por dois turnos." },
            { nivel: "Nível 1", nome: "Nota Dissonante", descricao: "Causa 90% de INT e reduz o dano do alvo." },
            { nivel: "Nível 5", nome: "Balada Restauradora", descricao: "Cura aliados em área ao longo de dois turnos." },
            { nivel: "Nível 5", nome: "Ritmo Acelerado", descricao: "Concede INI e deslocamento a aliados." }
        ],
        complexidade: { grau: "Alto", descricao: "Exige alternância de habilidades e atenção ao grupo inteiro." },
        caminhos: [
            { id: "maestro-guerra", nome: "Maestro de Guerra", especializacao: "Buffs Ofensivos", complexidade: "Difícil", descricao: "Transforma o grupo em uma força ofensiva coordenada.", passiva: { nome: "Marcha Marcial", descricao: "Buffs ofensivos duram um turno adicional." }, habilidades: [
                { nivel: "Nível 50", nome: "Hino da Vitória", descricao: "Aumenta dano e crítico do grupo." },
                { nivel: "Nível 50", nome: "Compasso de Ataque", descricao: "Concede ataque de reação a um aliado." },
                { nivel: "Nível 70", nome: "Solo Inspirador", descricao: "Amplifica um aliado específico." },
                { nivel: "Nível 70", nome: "Quebra-Ritmo", descricao: "Interrompe habilidades inimigas." },
                { nivel: "Nível 100", nome: "Ultimate — Sinfonia da Conquista", descricao: "O grupo recebe dano, deslocamento e resistência por três turnos." },
                { nivel: "Nível 100", nome: "Aplauso Final", descricao: "Reduz recargas dos aliados após uma eliminação." }
            ]},
            { id: "menestrel-encantado", nome: "Menestrel Encantado", especializacao: "Controle / Cura", complexidade: "Mestre", descricao: "Usa melodias hipnóticas e restauradoras.", passiva: { nome: "Eco Harmônico", descricao: "Curas e controles deixam um eco menor no turno seguinte." }, habilidades: [
                { nivel: "Nível 50", nome: "Canção de Ninar", descricao: "Coloca inimigos em Sono." },
                { nivel: "Nível 50", nome: "Acorde Vital", descricao: "Cura e concede escudo." },
                { nivel: "Nível 70", nome: "Refrão Hipnótico", descricao: "Confunde inimigos em área." },
                { nivel: "Nível 70", nome: "Melodia Purificadora", descricao: "Remove efeitos negativos do grupo." },
                { nivel: "Nível 100", nome: "Ultimate — Ópera dos Sonhos", descricao: "Cria uma área que cura aliados e controla inimigos." },
                { nivel: "Nível 100", nome: "Último Refrão", descricao: "Repete a última canção usada sem custo." }
            ]}
        ], curiosidades: ["É uma das classes mais fortes em grupos organizados."]
    },

    bruxo: {
        id: "bruxo", nome: "Bruxo", dificuldade: "★★★★★", cargo: "DPS Mágico / Debuffer",
        imagem: "assets/images/classes/bruxo.webp", icone: "assets/images/classes/bruxo.webp",
        descricao: "O Bruxo firma pactos com forças proibidas e troca segurança por poder, maldições e invocações sombrias.",
        especializacao: { titulo: "Dano Mágico e Maldições", descricao: "Enfraquece inimigos e converte riscos em poder crescente." },
        estilo: { principal: "Debuffs e dano contínuo.", secundaria: "Invocações e controle.", fortes: "Pressão prolongada e enfraquecimento.", fracos: "Custos perigosos e baixa resistência.", atributos: "INT, ARC e RES." },
        recurso: { nome: "Corrupção", descricao: "Acumula Corrupção para fortalecer feitiços, mas níveis altos aumentam o dano recebido." },
        passivas: [{ nome: "Pacto Profano", descricao: "Pode gastar vida no lugar de Mana para conjurar." }],
        progressao: [
            { nivel: "Nível 1", nome: "Rajada Sombria", descricao: "Causa 120% de INT e gera Corrupção." },
            { nivel: "Nível 1", nome: "Maldição da Fraqueza", descricao: "Reduz FOR e INT do alvo." },
            { nivel: "Nível 5", nome: "Dreno Vital", descricao: "Causa dano e cura parte do valor." },
            { nivel: "Nível 5", nome: "Correntes do Abismo", descricao: "Imobiliza um inimigo." }
        ],
        complexidade: { grau: "Muito Alto", descricao: "Exige equilíbrio entre poder, vida e Corrupção." },
        caminhos: [
            { id: "senhor-maldicoes", nome: "Senhor das Maldições", especializacao: "Debuffer", complexidade: "Mestre", descricao: "Espalha maldições entre múltiplos inimigos.", passiva: { nome: "Praga Persistente", descricao: "Maldições duram um turno adicional." }, habilidades: [
                { nivel: "Nível 50", nome: "Maldição da Ruína", descricao: "Reduz DEF, RES e cura recebida." },
                { nivel: "Nível 50", nome: "Contágio", descricao: "Espalha uma maldição para inimigos próximos." },
                { nivel: "Nível 70", nome: "Selo de Dor", descricao: "Dano recebido pelo alvo é parcialmente repetido." },
                { nivel: "Nível 70", nome: "Peste Espiritual", descricao: "Aplica dano contínuo em área." },
                { nivel: "Nível 100", nome: "Ultimate — Apocalipse Profano", descricao: "Amplifica e detona todas as maldições ativas." },
                { nivel: "Nível 100", nome: "Condenação", descricao: "Inimigos amaldiçoados causam menos dano ao Bruxo." }
            ]},
            { id: "invocador-abissal", nome: "Invocador Abissal", especializacao: "Invocador", complexidade: "Mestre", descricao: "Comanda criaturas do vazio.", passiva: { nome: "Vínculo Abissal", descricao: "Parte do dano recebido é transferida à invocação." }, habilidades: [
                { nivel: "Nível 50", nome: "Invocar Devorador", descricao: "Invoca criatura corpo a corpo." },
                { nivel: "Nível 50", nome: "Olho do Vazio", descricao: "Invoca sentinela que revela e ataca inimigos." },
                { nivel: "Nível 70", nome: "Sacrifício Profano", descricao: "Consome vida da invocação para curar o Bruxo." },
                { nivel: "Nível 70", nome: "Portal Abissal", descricao: "Teleporta a invocação e causa dano em área." },
                { nivel: "Nível 100", nome: "Ultimate — Avatar do Abismo", descricao: "Funde-se temporariamente à invocação." },
                { nivel: "Nível 100", nome: "Legião Breve", descricao: "Invoca duas criaturas menores por três turnos." }
            ]}
        ], curiosidades: ["É uma das classes com maior risco e recompensa."]
    },

    druida: {
        id: "druida", nome: "Druida", dificuldade: "★★★★☆", cargo: "Híbrido / Suporte",
        imagem: "assets/images/classes/druida.webp", icone: "assets/images/classes/druida.webp",
        descricao: "O Druida canaliza ciclos naturais, formas animais e magia de crescimento para adaptar-se ao campo de batalha.",
        especializacao: { titulo: "Híbrido Natural", descricao: "Alterna entre cura, controle e transformação." },
        estilo: { principal: "Suporte e controle.", secundaria: "Transformação e dano.", fortes: "Flexibilidade e sustentação.", fracos: "Complexidade e dependência de forma correta.", atributos: "ARC, RES e INT." },
        recurso: { nome: "Essência Natural", descricao: "Gera Essência ao curar, controlar ou transformar-se." },
        passivas: [{ nome: "Ciclo das Estações", descricao: "A cada três habilidades, muda de estação e recebe um bônus diferente." }],
        progressao: [
            { nivel: "Nível 1", nome: "Espinhos Crescentes", descricao: "Causa 100% de INT e cria terreno difícil." },
            { nivel: "Nível 1", nome: "Toque Revigorante", descricao: "Cura 100% de ARC." },
            { nivel: "Nível 5", nome: "Forma de Lobo", descricao: "Ganha deslocamento e ataques físicos." },
            { nivel: "Nível 5", nome: "Raízes Prensoras", descricao: "Imobiliza inimigos em área pequena." }
        ],
        complexidade: { grau: "Alto", descricao: "Exige alternância de formas e leitura das necessidades do grupo." },
        caminhos: [
            { id: "guardiao-verde", nome: "Guardião Verde", especializacao: "Cura / Controle", complexidade: "Difícil", descricao: "Protege o campo com raízes e renovação.", passiva: { nome: "Solo Fértil", descricao: "Áreas naturais curam aliados levemente." }, habilidades: [
                { nivel: "Nível 50", nome: "Bosque Vivo", descricao: "Cria área de cura e cobertura." },
                { nivel: "Nível 50", nome: "Casca Ancestral", descricao: "Concede escudo e DEF." },
                { nivel: "Nível 70", nome: "Prisão de Vinhas", descricao: "Imobiliza vários inimigos." },
                { nivel: "Nível 70", nome: "Chuva Revigorante", descricao: "Cura aliados em área por três turnos." },
                { nivel: "Nível 100", nome: "Ultimate — Coração da Floresta", descricao: "Transforma uma grande área em território natural poderoso." },
                { nivel: "Nível 100", nome: "Renascimento", descricao: "Impede a queda de um aliado uma vez por batalha." }
            ]},
            { id: "metamorfo-primal", nome: "Metamorfo Primal", especializacao: "DPS / Tanque", complexidade: "Mestre", descricao: "Aprimora formas animais de combate.", passiva: { nome: "Instinto Primal", descricao: "Trocar de forma concede bônus temporário." }, habilidades: [
                { nivel: "Nível 50", nome: "Forma de Urso", descricao: "Aumenta vida, DEF e provoca inimigos." },
                { nivel: "Nível 50", nome: "Forma de Águia", descricao: "Aumenta alcance e mobilidade." },
                { nivel: "Nível 70", nome: "Investida do Rinoceronte", descricao: "Avança, empurra e Atordoa." },
                { nivel: "Nível 70", nome: "Garras da Pantera", descricao: "Executa múltiplos ataques rápidos." },
                { nivel: "Nível 100", nome: "Ultimate — Quimera Primal", descricao: "Combina bônus de várias formas." },
                { nivel: "Nível 100", nome: "Predador Alfa", descricao: "Ganhos de forma duram mais e ficam mais fortes." }
            ]}
        ], curiosidades: ["É uma classe excelente para jogadores versáteis."]
    },

    espadachim: {
        id: "espadachim", nome: "Espadachim", dificuldade: "★★★★☆", cargo: "Duelista",
        imagem: "assets/images/classes/espadachim.webp", icone: "assets/images/classes/espadachim.webp",
        descricao: "O Espadachim vence pela técnica, leitura do adversário e sequências precisas de golpes.",
        especializacao: { titulo: "Duelista Físico", descricao: "Controla duelos e pune ações previsíveis." },
        estilo: { principal: "Dano físico técnico.", secundaria: "Contra-ataques e mobilidade.", fortes: "Precisão, defesa ativa e combos.", fracos: "Menor eficiência contra grupos e erros severamente punidos.", atributos: "FOR e INI." },
        recurso: { nome: "Postura", descricao: "Alterna entre Postura Ofensiva e Defensiva." },
        passivas: [{ nome: "Ritmo da Lâmina", descricao: "Alternar ataque e defesa aumenta a eficiência da próxima ação." }],
        progressao: [
            { nivel: "Nível 1", nome: "Corte Rápido", descricao: "Causa 100% de FOR e permite mover 1 quadrado." },
            { nivel: "Nível 1", nome: "Aparo", descricao: "Reduz o próximo dano físico e prepara contra-ataque." },
            { nivel: "Nível 5", nome: "Estocada Precisa", descricao: "Ignora parte da DEF." },
            { nivel: "Nível 5", nome: "Passo Lateral", descricao: "Reposiciona-se e ganha evasão." }
        ],
        complexidade: { grau: "Alto", descricao: "Exige leitura de turnos e alternância correta de posturas." },
        caminhos: [
            { id: "mestre-duelo", nome: "Mestre do Duelo", especializacao: "1 contra 1", complexidade: "Difícil", descricao: "Domina confrontos isolados.", passiva: { nome: "Desafio Honrado", descricao: "Causa mais dano ao alvo marcado e recebe menos dano dele." }, habilidades: [
                { nivel: "Nível 50", nome: "Duelo Marcado", descricao: "Marca um inimigo e limita interferências." },
                { nivel: "Nível 50", nome: "Resposta Perfeita", descricao: "Contra-ataca após aparar." },
                { nivel: "Nível 70", nome: "Corte da Lua", descricao: "Golpe amplo com reposicionamento." },
                { nivel: "Nível 70", nome: "Estocada Final", descricao: "Dano alto contra alvos feridos." },
                { nivel: "Nível 100", nome: "Ultimate — Mil Cortes", descricao: "Sequência rápida de ataques em um alvo." },
                { nivel: "Nível 100", nome: "Técnica Suprema", descricao: "A primeira reação de cada turno não consome recurso." }
            ]},
            { id: "dancarino-laminas", nome: "Dançarino de Lâminas", especializacao: "Mobilidade / Área", complexidade: "Mestre", descricao: "Transforma movimento em ataques contínuos.", passiva: { nome: "Fluxo Contínuo", descricao: "Mover-se aumenta o dano do próximo golpe." }, habilidades: [
                { nivel: "Nível 50", nome: "Dança Circular", descricao: "Ataca inimigos adjacentes." },
                { nivel: "Nível 50", nome: "Passo Cortante", descricao: "Move-se através de inimigos causando dano." },
                { nivel: "Nível 70", nome: "Lâminas Cruzadas", descricao: "Golpe duplo em cone." },
                { nivel: "Nível 70", nome: "Ritmo Ascendente", descricao: "Ganha INI a cada ataque." },
                { nivel: "Nível 100", nome: "Ultimate — Tempestade de Aço", descricao: "Move-se e ataca múltiplos alvos em sequência." },
                { nivel: "Nível 100", nome: "Sem Pausa", descricao: "Eliminações restauram movimento." }
            ]}
        ], curiosidades: ["É diferente do Guerreiro por depender muito mais de técnica e tempo."]
    },

    feiticeiro: {
        id: "feiticeiro", nome: "Feiticeiro", dificuldade: "★★★★☆", cargo: "Conjurador Instintivo",
        imagem: "assets/images/classes/feiticeiro.webp", icone: "assets/images/classes/feiticeiro.webp",
        descricao: "O Feiticeiro manifesta magia inata e poderosa, alterando feitiços no momento da conjuração.",
        especializacao: { titulo: "DPS Mágico Flexível", descricao: "Usa Metamagia para mudar alcance, área e potência." },
        estilo: { principal: "Dano mágico explosivo.", secundaria: "Manipulação de feitiços.", fortes: "Flexibilidade e alto impacto.", fracos: "Poucas defesas e recurso limitado.", atributos: "INT e ARC." },
        recurso: { nome: "Pontos de Metamagia", descricao: "São gastos para modificar feitiços durante a conjuração." },
        passivas: [{ nome: "Magia Inata", descricao: "A primeira Metamagia usada em cada combate custa 1 ponto a menos." }],
        progressao: [
            { nivel: "Nível 1", nome: "Explosão Elemental", descricao: "Causa 120% de INT com elemento escolhido." },
            { nivel: "Nível 1", nome: "Metamagia: Alcance", descricao: "Aumenta o alcance de um feitiço." },
            { nivel: "Nível 5", nome: "Onda Arcana", descricao: "Causa dano e empurra inimigos." },
            { nivel: "Nível 5", nome: "Metamagia: Potência", descricao: "Aumenta o dano de um feitiço." }
        ],
        complexidade: { grau: "Alto", descricao: "Exige decidir como modificar cada feitiço sem esgotar recursos." },
        caminhos: [
            { id: "sangue-draconico", nome: "Sangue Dracônico", especializacao: "DPS Elemental", complexidade: "Difícil", descricao: "Canaliza herança dracônica.", passiva: { nome: "Escamas Arcanas", descricao: "Recebe resistência ao elemento escolhido." }, habilidades: [
                { nivel: "Nível 50", nome: "Sopro Dracônico", descricao: "Causa dano elemental em cone." },
                { nivel: "Nível 50", nome: "Asas Etéreas", descricao: "Ganha mobilidade aérea." },
                { nivel: "Nível 70", nome: "Sangue Incandescente", descricao: "Dano recebido fortalece o próximo feitiço." },
                { nivel: "Nível 70", nome: "Garra Elemental", descricao: "Golpe mágico corpo a corpo." },
                { nivel: "Nível 100", nome: "Ultimate — Ascensão Dracônica", descricao: "Assume forma dracônica parcial." },
                { nivel: "Nível 100", nome: "Coração de Dragão", descricao: "Feitiços elementais ignoram parte da RES." }
            ]},
            { id: "caos-vivo", nome: "Caos Vivo", especializacao: "Efeitos Aleatórios", complexidade: "Mestre", descricao: "Manipula magia imprevisível.", passiva: { nome: "Surto Caótico", descricao: "Metamagias podem gerar efeitos extras." }, habilidades: [
                { nivel: "Nível 50", nome: "Orbe Instável", descricao: "Explode com um efeito aleatório benéfico ou ofensivo." },
                { nivel: "Nível 50", nome: "Dobra Improvável", descricao: "Troca posições de duas unidades." },
                { nivel: "Nível 70", nome: "Eco Caótico", descricao: "Repete parcialmente o último feitiço." },
                { nivel: "Nível 70", nome: "Falha da Realidade", descricao: "Cria zona de efeitos variáveis." },
                { nivel: "Nível 100", nome: "Ultimate — Colapso do Possível", descricao: "Aplica múltiplos efeitos mágicos em grande área." },
                { nivel: "Nível 100", nome: "Destino Reescrito", descricao: "Pode refazer uma rolagem ou resultado uma vez por batalha." }
            ]}
        ], curiosidades: ["É mais explosivo e improvisado que o Mago."]
    },

    mago: {
        id: "mago", nome: "Mago", dificuldade: "★★★★☆", cargo: "Conjurador Ofensivo",
        imagem: "assets/images/classes/mago.webp", icone: "assets/images/classes/mago.webp",
        descricao: "O Mago domina conhecimento arcano, elementos e controle de área por meio de estudo e preparação.",
        especializacao: { titulo: "Conjurador de Controle", descricao: "Prepara respostas para diferentes situações e domina o campo à distância." },
        estilo: { principal: "Dano mágico e controle.", secundaria: "Debuffs e zonas.", fortes: "Alcance, variedade e preparação.", fracos: "Baixa resistência e dependência de Mana.", atributos: "INT, ARC e INI." },
        recurso: { nome: "Mana", descricao: "Usada para conjurar e recuperar por descanso ou efeitos específicos." },
        passivas: [{ nome: "Livro de Feitiços", descricao: "Pode preparar uma seleção diferente de magias antes da batalha." }],
        progressao: [
            { nivel: "Nível 1", nome: "Projétil Arcano", descricao: "Causa 110% de INT a até 6 quadrados." },
            { nivel: "Nível 1", nome: "Barreira Arcana", descricao: "Concede escudo equivalente a 100% de ARC." },
            { nivel: "Nível 5", nome: "Círculo de Gelo", descricao: "Causa dano em área e aplica Lentidão." },
            { nivel: "Nível 5", nome: "Teleporte Curto", descricao: "Teleporta até 3 quadrados." }
        ],
        complexidade: { grau: "Alto", descricao: "Recompensa preparação, conhecimento e controle de distância." },
        caminhos: [
            { id: "arquimago-elemental", nome: "Arquimago Elemental", especializacao: "DPS / Área", complexidade: "Difícil", descricao: "Domina múltiplos elementos.", passiva: { nome: "Ressonância Elemental", descricao: "Alternar elementos aumenta o dano." }, habilidades: [
                { nivel: "Nível 50", nome: "Muralha de Fogo", descricao: "Cria parede que causa dano ao atravessar." },
                { nivel: "Nível 50", nome: "Prisão de Gelo", descricao: "Imobiliza e concede escudo gelado ao alvo." },
                { nivel: "Nível 70", nome: "Tempestade Elétrica", descricao: "Dano em área com saltos entre inimigos." },
                { nivel: "Nível 70", nome: "Terremoto Arcano", descricao: "Derruba inimigos em área." },
                { nivel: "Nível 100", nome: "Ultimate — Convergência Elemental", descricao: "Combina quatro elementos em grande área." },
                { nivel: "Nível 100", nome: "Mestre dos Elementos", descricao: "Reduz resistências elementais dos inimigos." }
            ]},
            { id: "cronista-arcano", nome: "Cronista Arcano", especializacao: "Controle Temporal", complexidade: "Mestre", descricao: "Manipula tempo e ordem de turnos.", passiva: { nome: "Segundo Preparado", descricao: "A primeira recarga usada por turno é reduzida." }, habilidades: [
                { nivel: "Nível 50", nome: "Acelerar", descricao: "Concede ação de movimento adicional." },
                { nivel: "Nível 50", nome: "Retardar", descricao: "Reduz INI e deslocamento." },
                { nivel: "Nível 70", nome: "Âncora Temporal", descricao: "Impede movimento e teleporte." },
                { nivel: "Nível 70", nome: "Repetir Instante", descricao: "Repete a última magia com potência reduzida." },
                { nivel: "Nível 100", nome: "Ultimate — Tempo Suspenso", descricao: "Inimigos em área perdem o próximo turno." },
                { nivel: "Nível 100", nome: "Reescrever Momento", descricao: "Restaura posição e vida de um aliado ao estado anterior." }
            ]}
        ], curiosidades: ["É a classe arcana mais baseada em preparação."]
    },

    ninja: {
        id: "ninja", nome: "Ninja", dificuldade: "★★★★★", cargo: "DPS / Mobilidade",
        imagem: "assets/images/classes/ninja.webp", icone: "assets/images/classes/ninja.webp",
        descricao: "O Ninja combina velocidade, técnicas secretas e ferramentas para dominar o campo por ângulos inesperados.",
        especializacao: { titulo: "DPS Tático", descricao: "Alterna golpes, clones e deslocamentos rápidos." },
        estilo: { principal: "Mobilidade e combos.", secundaria: "Furtividade e controle.", fortes: "Velocidade, acesso e evasão.", fracos: "Baixa resistência e alta exigência mecânica.", atributos: "INI, FOR e ARC." },
        recurso: { nome: "Chakra", descricao: "Gasto em técnicas e recuperado ao completar sequências de combo." },
        passivas: [{ nome: "Combo Shinobi", descricao: "Usar três técnicas diferentes recupera Chakra e reduz recargas." }],
        progressao: [
            { nivel: "Nível 1", nome: "Kunai", descricao: "Causa 90% de FOR à distância." },
            { nivel: "Nível 1", nome: "Substituição", descricao: "Evita um ataque e move-se 2 quadrados." },
            { nivel: "Nível 5", nome: "Shuriken em Leque", descricao: "Ataca em cone." },
            { nivel: "Nível 5", nome: "Clone Sombrio", descricao: "Cria clone que imita o próximo ataque." }
        ],
        complexidade: { grau: "Muito Alto", descricao: "Exige sequências, previsão de movimentos e controle de Chakra." },
        caminhos: [
            { id: "mestre-ninjutsu", nome: "Mestre do Ninjutsu", especializacao: "DPS Mágico", complexidade: "Mestre", descricao: "Usa técnicas elementais e clones.", passiva: { nome: "Selos Rápidos", descricao: "A primeira técnica elemental por turno custa menos Chakra." }, habilidades: [
                { nivel: "Nível 50", nome: "Bola de Fogo", descricao: "Dano em cone e Queimadura." },
                { nivel: "Nível 50", nome: "Prisão de Água", descricao: "Imobiliza um inimigo." },
                { nivel: "Nível 70", nome: "Raio Cortante", descricao: "Avança em linha causando dano." },
                { nivel: "Nível 70", nome: "Muralha de Terra", descricao: "Cria obstáculo defensivo." },
                { nivel: "Nível 100", nome: "Ultimate — Dragão dos Cinco Elementos", descricao: "Sequência elemental massiva." },
                { nivel: "Nível 100", nome: "Clone Perfeito", descricao: "O clone repete duas técnicas." }
            ]},
            { id: "fantasma-lamina", nome: "Fantasma da Lâmina", especializacao: "Assassino / Físico", complexidade: "Mestre", descricao: "Foca em velocidade e execução.", passiva: { nome: "Passo Invisível", descricao: "Após usar mobilidade, o próximo ataque ganha dano extra." }, habilidades: [
                { nivel: "Nível 50", nome: "Corte Relâmpago", descricao: "Teleporta e ataca um alvo." },
                { nivel: "Nível 50", nome: "Marca Shinobi", descricao: "Marca alvo para combos." },
                { nivel: "Nível 70", nome: "Mil Lâminas", descricao: "Ataca várias vezes em curto alcance." },
                { nivel: "Nível 70", nome: "Desaparecer", descricao: "Entra em furtividade e remove marcações." },
                { nivel: "Nível 100", nome: "Ultimate — Execução do Vazio", descricao: "Ataca todos os inimigos marcados." },
                { nivel: "Nível 100", nome: "Velocidade Absoluta", descricao: "Ganha uma ação adicional por dois turnos." }
            ]}
        ], curiosidades: ["É uma das classes mais rápidas do jogo."]
    },

    necromante: {
        id: "necromante", nome: "Necromante", dificuldade: "★★★★★", cargo: "Invocador / Controle",
        imagem: "assets/images/classes/necromante.webp", icone: "assets/images/classes/necromante.webp",
        descricao: "O Necromante manipula cadáveres, almas e energia funerária para controlar o campo e vencer por desgaste.",
        especializacao: { titulo: "Invocador Sombrio", descricao: "Cria servos, consome corpos e enfraquece inimigos." },
        estilo: { principal: "Invocações e controle.", secundaria: "Dano contínuo e suporte sombrio.", fortes: "Presença de campo e economia de ações.", fracos: "Preparação lenta e dependência de corpos ou almas.", atributos: "INT, ARC e RES." },
        recurso: { nome: "Almas", descricao: "Obtidas quando unidades morrem e gastas para invocar ou fortalecer servos." },
        passivas: [{ nome: "Colheita Sombria", descricao: "A primeira morte de cada turno gera uma Alma." }],
        progressao: [
            { nivel: "Nível 1", nome: "Seta Óssea", descricao: "Causa 110% de INT." },
            { nivel: "Nível 1", nome: "Erguer Esqueleto", descricao: "Invoca um servo simples." },
            { nivel: "Nível 5", nome: "Miasma", descricao: "Cria área de dano e redução de cura." },
            { nivel: "Nível 5", nome: "Explosão Cadavérica", descricao: "Consome um cadáver para causar dano em área." }
        ],
        complexidade: { grau: "Muito Alto", descricao: "Exige gerenciamento de servos, Almas e posicionamento." },
        caminhos: [
            { id: "senhor-mortos", nome: "Senhor dos Mortos", especializacao: "Invocador", complexidade: "Mestre", descricao: "Comanda um exército de servos.", passiva: { nome: "Legião Obediente", descricao: "Pode manter mais uma invocação ativa." }, habilidades: [
                { nivel: "Nível 50", nome: "Erguer Guerreiro Ósseo", descricao: "Invoca servo resistente." },
                { nivel: "Nível 50", nome: "Arqueiro Esquelético", descricao: "Invoca servo à distância." },
                { nivel: "Nível 70", nome: "Comando de Ataque", descricao: "Servos atacam o mesmo alvo." },
                { nivel: "Nível 70", nome: "Recompor Ossos", descricao: "Cura todas as invocações." },
                { nivel: "Nível 100", nome: "Ultimate — Exército dos Mortos", descricao: "Invoca múltiplos servos temporários." },
                { nivel: "Nível 100", nome: "Rei Cadáver", descricao: "Uma invocação torna-se elite." }
            ]},
            { id: "lich-ascendente", nome: "Lich Ascendente", especializacao: "DPS / Controle", complexidade: "Mestre", descricao: "Converte a própria essência em magia funerária.", passiva: { nome: "Filactério", descricao: "Uma vez por batalha, evita a morte e retorna com vida reduzida." }, habilidades: [
                { nivel: "Nível 50", nome: "Raio da Morte", descricao: "Dano alto e redução de RES." },
                { nivel: "Nível 50", nome: "Prisão de Almas", descricao: "Silencia e Imobiliza." },
                { nivel: "Nível 70", nome: "Aura de Decadência", descricao: "Dano contínuo ao redor." },
                { nivel: "Nível 70", nome: "Roubo de Vida", descricao: "Drena vida de vários inimigos." },
                { nivel: "Nível 100", nome: "Ultimate — Eclipse Funerário", descricao: "Grande área de dano, medo e redução de cura." },
                { nivel: "Nível 100", nome: "Imortalidade Profana", descricao: "Fica temporariamente imune a execução." }
            ]}
        ], curiosidades: ["É a classe com maior presença de unidades no mapa."]
    },

    guerreiro: {
        id: "guerreiro", nome: "Guerreiro", dificuldade: "★★★☆☆", cargo: "Combatente Versátil",
        imagem: "assets/images/classes/guerreiro.webp", icone: "assets/images/classes/guerreiro.webp",
        descricao: "O Guerreiro domina armas, disciplina e posturas, adaptando-se entre ataque, defesa e controle.",
        especializacao: { titulo: "Combatente Versátil", descricao: "É a classe física mais adaptável, capaz de responder a diferentes ameaças." },
        estilo: { principal: "Combate físico versátil.", secundaria: "Proteção e controle.", fortes: "Consistência, adaptação e variedade.", fracos: "Depende de equipamento e decisões corretas.", atributos: "FOR, DEF, RES ou INI." },
        recurso: { nome: "Postura", descricao: "Alterna entre posturas Ofensiva, Defensiva e Tática." },
        passivas: [{ nome: "Mestre de Armas", descricao: "Recebe bônus diferentes conforme o tipo de arma equipado." }],
        progressao: [
            { nivel: "Nível 1", nome: "Corte Disciplinado", descricao: "Causa 110% de FOR." },
            { nivel: "Nível 1", nome: "Guarda Preparada", descricao: "Recebe 15% de redução de dano." },
            { nivel: "Nível 5", nome: "Golpe de Escudo", descricao: "Causa dano e pode Atordoar." },
            { nivel: "Nível 5", nome: "Avanço Tático", descricao: "Move-se e protege um aliado próximo." }
        ],
        complexidade: { grau: "Médio", descricao: "Fácil de aprender, mas profundo na escolha de postura e equipamento." },
        caminhos: [
            { id: "campeao-armas", nome: "Campeão de Armas", especializacao: "DPS Físico", complexidade: "Difícil", descricao: "Domina combinações de armas.", passiva: { nome: "Especialista Marcial", descricao: "Trocar de arma concede bônus temporário." }, habilidades: [
                { nivel: "Nível 50", nome: "Golpe Pesado", descricao: "Dano alto com armas de duas mãos." },
                { nivel: "Nível 50", nome: "Rajada de Cortes", descricao: "Múltiplos ataques com armas leves." },
                { nivel: "Nível 70", nome: "Quebra-Guarda", descricao: "Reduz DEF e bloqueio." },
                { nivel: "Nível 70", nome: "Contra-Ataque", descricao: "Responde ao próximo ataque recebido." },
                { nivel: "Nível 100", nome: "Ultimate — Arsenal Supremo", descricao: "Usa uma sequência de técnicas de diferentes armas." },
                { nivel: "Nível 100", nome: "Mestre Absoluto", descricao: "Bônus de armas ficam permanentemente ativos durante a batalha." }
            ]},
            { id: "guardiao-ferro", nome: "Guardião de Ferro", especializacao: "Tanque", complexidade: "Médio", descricao: "Protege aliados com escudo e disciplina.", passiva: { nome: "Linha Inquebrável", descricao: "Aliados atrás do Guerreiro recebem cobertura." }, habilidades: [
                { nivel: "Nível 50", nome: "Muralha de Escudos", descricao: "Protege uma linha de aliados." },
                { nivel: "Nível 50", nome: "Provocação Marcial", descricao: "Provoca inimigos próximos." },
                { nivel: "Nível 70", nome: "Interposição", descricao: "Recebe o dano de um aliado." },
                { nivel: "Nível 70", nome: "Bastião", descricao: "Fica imóvel e recebe grande redução de dano." },
                { nivel: "Nível 100", nome: "Ultimate — Fortaleza de Aço", descricao: "Cria uma zona defensiva para o grupo." },
                { nivel: "Nível 100", nome: "Último Defensor", descricao: "Quando um aliado cair, ganha escudo e ação de reação." }
            ]}
        ], curiosidades: ["É a classe mais indicada para aprender combate físico."]
    }
};