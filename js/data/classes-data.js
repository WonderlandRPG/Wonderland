const classes = {
    barbaro: {
        id: "barbaro",
        nome: "Bárbaro",
        dificuldade: "★★★☆☆",
        cargo: "Híbrido (DPS Físico / Tanque)",
        imagem: "assets/images/classes/barbaro.webp",
        icone: "assets/images/classes/barbaro.webp",
        descricao: [
            "O Bárbaro é um combatente brutal que transforma dor, perigo e agressividade em poder. Quanto mais intensa a batalha, mais difícil se torna detê-lo.",
            "Seu estilo de combate é baseado na geração e no gerenciamento de Fúria, um recurso acumulado ao atacar e receber dano. O Bárbaro pode gastar essa Fúria em golpes poderosos ou guardá-la para entrar em um estado de selvageria extrema.",
            "Seus principais pontos fortes são o dano físico elevado, a resistência e a capacidade de permanecer lutando mesmo com pouca vida. Entretanto, possui alcance limitado, poucas ferramentas contra inimigos distantes e pode ser neutralizado por controle de grupo, redução de mobilidade e adversários que evitem o confronto direto."
        ].join(" "),
        especializacao: {
            titulo: "Híbrido (DPS Físico / Tanque)",
            descricao: "O Bárbaro pode assumir a linha de frente, pressionar inimigos e proteger aliados por meio de provocações e controle territorial. Seus Caminhos permitem especialização total em dano ou defesa."
        },
        afinidades: {
            FOR: "★★★★★",
            DEF: "★★★☆☆",
            RES: "★★★★☆",
            INI: "★★★☆☆",
            INT: "★☆☆☆☆",
            ARC: "★☆☆☆☆"
        },
        estilo: {
            principal: "Dano físico elevado e pressão corpo a corpo.",
            secundaria: "Linha de frente, resistência e controle territorial.",
            fortes: "Dano físico alto, resistência e capacidade de continuar lutando com pouca vida.",
            fracos: "Alcance limitado, poucas respostas contra inimigos distantes e vulnerabilidade a controle e redução de mobilidade.",
            atributos: "FOR, RES e DEF, com INI como suporte situacional."
        },
        recurso: {
            nome: "Fúria",
            descricao: "A barra começa em 0 e pode acumular até 100 pontos. Ataques físicos diretos geram 10 de Fúria e receber dano direto gera 5, limitado a 20 por turno. Abaixo de 40% da vida máxima, toda geração aumenta em 50%. A Fúria desaparece ao fim da batalha."
        },
        passivas: [
            {
                nome: "Instinto de Fúria",
                descricao: "Ao alcançar 100 de Fúria, o Bárbaro pode consumir toda a barra, sem gastar sua ação, para entrar em Fúria Selvagem durante dois turnos: causa 20% mais dano físico, recebe 15% menos dano e fica imune a Medo. Só pode ser ativada uma vez por turno."
            }
        ],
        tabelaProgressao: [
            [1, "Instinto de Fúria, Corte Brutal e Golpe Demolidor"],
            [3, "Investida Selvagem e Passo do Predador"],
            [7, "Rugido Provocador e Presença Ameaçadora"],
            [10, "Golpe Quebra-Ossos e Esmagamento Descendente"],
            [15, "Talho Sangrento e Ferida Aberta"],
            [20, "Fôlego Indomável e Recuperação Selvagem"],
            [25, "Redemoinho Carniceiro e Giro de Ruptura"],
            [30, "Salto Devastador e Queda Brutal"],
            [35, "Pele de Guerra e Tenacidade Bestial"],
            [40, "Desafio da Morte e Último Impacto"],
            [45, "Grito de Sobrevivência e Recusa da Morte"],
            [50, "Escolha de Caminho"]
        ],
        progressao: [
            { nivel: "Nível 1", nome: "Corte Brutal", descricao: "Causa 120% de FOR como dano físico, gera 15 de Fúria e, abaixo de 40% da vida, passa a causar 140% de FOR. Alcance: 1 quadrado. Recarga: nenhuma." },
            { nivel: "Nível 1", nome: "Golpe Demolidor", descricao: "Golpeia um inimigo adjacente e causa 90% de FOR como dano físico. Se o alvo estiver com escudo, causa 40% de dano adicional ao escudo. Gera 10 de Fúria. Alcance: 1 quadrado. Recarga: 2 turnos." },
            { nivel: "Nível 3", nome: "Investida Selvagem", descricao: "Avança até 3 quadrados, causa 100% de FOR, empurra o alvo em 1 quadrado e o Atordoa se houver colisão com parede ou obstáculo. Gera 10 de Fúria. Recarga: 3 turnos." },
            { nivel: "Nível 3", nome: "Passo do Predador", descricao: "Desloca-se até 2 quadrados sem provocar reações. Se terminar adjacente a um inimigo, recebe 10 de Fúria. Recarga: 2 turnos." },
            { nivel: "Nível 7", nome: "Rugido Provocador", descricao: "Provoca inimigos em um raio de 2 quadrados por um turno. Inimigos provocados causam 15% menos dano contra outros personagens. Gera 5 de Fúria por inimigo, até 20. Recarga: 5 turnos." },
            { nivel: "Nível 7", nome: "Presença Ameaçadora", descricao: "Inimigos adjacentes causam 10% menos dano contra aliados que não sejam o Bárbaro. Efeito passivo enquanto o Bárbaro estiver consciente." },
            { nivel: "Nível 10", nome: "Golpe Quebra-Ossos", descricao: "Causa 170% de FOR e aplica Fratura por dois turnos, reduzindo a DEF do alvo em 25%. Custo: 25 de Fúria. Alcance: 1 quadrado. Recarga: 3 turnos." },
            { nivel: "Nível 10", nome: "Esmagamento Descendente", descricao: "Causa 130% de FOR. Se o alvo estiver Atordoado, Imobilizado ou Provocado, causa 170% de FOR. Custo: 20 de Fúria. Recarga: 3 turnos." },
            { nivel: "Nível 15", nome: "Talho Sangrento", descricao: "Causa 130% de FOR e aplica Hemorragia por dois turnos. A Hemorragia causa 30% de FOR no começo de cada turno do alvo. Reaplicar reinicia a duração sem acumular o dano. Custo: 20 de Fúria. Recarga: 2 turnos." },
            { nivel: "Nível 15", nome: "Ferida Aberta", descricao: "Contra um alvo com Hemorragia, causa 110% de FOR e aumenta em um turno a duração da Hemorragia. Custo: 15 de Fúria. Recarga: 2 turnos." },
            { nivel: "Nível 20", nome: "Fôlego Indomável", descricao: "Remove Atordoamento, Imobilização, Medo ou Lentidão e recupera 100% de RES + 8% da vida máxima. Pode ser usada sob controle. Custo: 30 de Fúria. Recarga: 5 turnos." },
            { nivel: "Nível 20", nome: "Recuperação Selvagem", descricao: "Recupera 80% de RES e recebe 20% de redução de dano até o início do próximo turno. Custo: 25 de Fúria. Recarga: 4 turnos." },
            { nivel: "Nível 25", nome: "Redemoinho Carniceiro", descricao: "Causa 140% de FOR em todos os inimigos adjacentes. Cada alvo gera 5 de Fúria, até 20. Alvos com Hemorragia recebem 20% de dano adicional. Custo inicial: 25 de Fúria. Recarga: 3 turnos." },
            { nivel: "Nível 25", nome: "Giro de Ruptura", descricao: "Causa 100% de FOR em todos os inimigos adjacentes e empurra cada um em 1 quadrado. Custo: 20 de Fúria. Recarga: 3 turnos." },
            { nivel: "Nível 30", nome: "Salto Devastador", descricao: "Salta até 4 quadrados e causa 150% de FOR em um raio de 1 quadrado. O alvo central fica Atordoado; os demais sofrem Lentidão de 50% por um turno. Custo: 40 de Fúria. Recarga: 4 turnos." },
            { nivel: "Nível 30", nome: "Queda Brutal", descricao: "Salta até 3 quadrados e causa 120% de FOR em uma área de 1 quadrado. Inimigos atingidos têm o deslocamento reduzido em 1 até o fim do próximo turno. Custo: 30 de Fúria. Recarga: 4 turnos." },
            { nivel: "Nível 35", nome: "Pele de Guerra", descricao: "Reduz o dano recebido em 30% por dois turnos. Cada ataque recebido gera 10 de Fúria, mantendo o limite de 20 por turno. Não consome Fúria. Recarga: 5 turnos." },
            { nivel: "Nível 35", nome: "Tenacidade Bestial", descricao: "Recebe 20% de redução de dano e 50% de resistência a Lentidão e Imobilização por dois turnos. Recarga: 5 turnos." },
            { nivel: "Nível 40", nome: "Desafio da Morte", descricao: "Causa 200% de FOR. Para cada 10% de vida faltante, recebe 10% de FOR adicional, até 70%, totalizando 270% de FOR. Custo: 50 de Fúria. Recarga: 4 turnos." },
            { nivel: "Nível 40", nome: "Último Impacto", descricao: "Causa 150% de FOR. Se o Bárbaro estiver abaixo de 30% da vida máxima, causa 220% de FOR e recupera 20 de Fúria. Recarga: 4 turnos." },
            { nivel: "Nível 45", nome: "Grito de Sobrevivência", descricao: "Durante dois turnos, a vida não pode cair abaixo de 1. Ao final, recupera 120% de RES. Se for curado acima de 30% da vida máxima, o efeito termina. Custo: 40 de Fúria. Uma vez por batalha." },
            { nivel: "Nível 45", nome: "Recusa da Morte", descricao: "Quando receber dano que reduziria sua vida a 0, permanece com 1 de vida e recebe 25 de Fúria. Pode acontecer uma vez por batalha." }
        ],
        complexidade: {
            grau: "Médio",
            descricao: "As habilidades são fáceis de compreender, mas exigem gerenciamento de Fúria e domínio do momento correto para atacar ou se defender. Jogadores experientes aproveitam a vida baixa para gerar mais Fúria e liberar o potencial máximo da classe."
        },
        caminhos: [
            {
                id: "berserker-sanguinario",
                nome: "Berserker Sanguinário",
                especializacao: "DPS Físico",
                complexidade: "Difícil",
                descricao: "O Berserker transforma seus próprios ferimentos em poder destrutivo. É extremamente perigoso com pouca vida, mas pode ser eliminado rapidamente se escolher o momento errado para atacar.",
                passiva: { nome: "Sede de Sangue", descricao: "Para cada 10% de vida faltante, causa 3% mais dano físico, até 21%. Ao eliminar um inimigo, recupera 10% da vida máxima e recebe 20 de Fúria, uma vez por turno." },
                habilidades: [
                    { nivel: "Nível 50", nome: "Dilacerar", descricao: "Ataca três vezes, cada golpe causando 70% de FOR. Dano total: 210% de FOR. O terceiro golpe aplica Hemorragia. Custo: 30 de Fúria. Recarga: 3 turnos." },
                    { nivel: "Nível 50", nome: "Avanço Predatório", descricao: "Desloca-se até 5 quadrados, causa 140% de FOR e marca o alvo por dois turnos. Causa 20% mais dano contra o alvo marcado. A marca termina ao atacar outro alvo. Recarga: 4 turnos." },
                    { nivel: "Nível 70", nome: "Banho de Sangue", descricao: "Durante dois turnos, recupera 25% do dano físico causado, limitado a 15% da vida máxima por turno. Eliminar um inimigo prolonga em um turno, uma vez por ativação. Custo: 40 de Fúria. Recarga: 6 turnos." },
                    { nivel: "Nível 70", nome: "Esmagar Crânio", descricao: "Causa 240% de FOR ou 340% contra alvos abaixo de 25% da vida. Se eliminar o alvo, recupera 30 de Fúria. Custo: 50 de Fúria. Recarga: 4 turnos." },
                    { nivel: "Nível 100", nome: "Ultimate — Êxtase da Carnificina", descricao: "Por três turnos, causa 35% mais dano físico, recebe +2 de deslocamento, cura 20% do dano causado e eliminações reduzem todas as recargas em um turno. Em contrapartida, recebe 20% mais dano. Uma vez por batalha." },
                    { nivel: "Nível 100", nome: "Carnificina Incontrolável", descricao: "Durante três turnos, o primeiro ataque físico de cada turno não consome Fúria e causa 20% de dano adicional. Uma vez por batalha." }
                ]
            },
            {
                id: "colosso-indomavel",
                nome: "Colosso Indomável",
                especializacao: "Tanque / Controle de Grupo",
                complexidade: "Médio",
                descricao: "O Colosso bloqueia passagens, provoca inimigos e protege aliados. Seu dano é menor, mas sua resistência aumenta conforme recebe ataques.",
                passiva: { nome: "Corpo de Montanha", descricao: "Recebe 20% de vida máxima adicional. Cada ataque direto concede uma carga de Fortitude que reduz o dano recebido em 3%, até cinco cargas e 15%. As cargas desaparecem após um turno inteiro sem receber dano." },
                habilidades: [
                    { nivel: "Nível 50", nome: "Ombro de Montanha", descricao: "Avança até 2 quadrados, causa 120% de FOR e empurra o inimigo em até 2 quadrados. Se houver colisão, causa mais 50% de FOR e Atordoa. Recarga: 3 turnos." },
                    { nivel: "Nível 50", nome: "Desafio Absoluto", descricao: "Provoca inimigos em um raio de 3 quadrados por dois turnos e recebe um escudo de 150% de RES + 5% da vida máxima por inimigo, limitado a 20% da vida máxima. Recarga: 5 turnos." },
                    { nivel: "Nível 70", nome: "Guarda Interposta", descricao: "Move-se para junto de um aliado a até 3 quadrados e redireciona para si 70% do dano que ele receberia por dois turnos. O dano redirecionado é reduzido em 25%. Recarga: 5 turnos." },
                    { nivel: "Nível 70", nome: "Impacto Sísmico", descricao: "Causa 140% de FOR em um cone de 3 quadrados, puxa inimigos em 1 quadrado e Imobiliza os que terminarem adjacentes. Custo: 30 de Fúria. Recarga: 4 turnos." },
                    { nivel: "Nível 100", nome: "Ultimate — Muralha Viva", descricao: "Por dois turnos, provoca inimigos em um raio de 4 quadrados, reduz em 40% o dano recebido e concede 30% de redução de dano aos aliados em um raio de 3 quadrados. Não pode ser empurrado, puxado ou derrubado. Uma vez por batalha." },
                    { nivel: "Nível 100", nome: "Fortaleza Inquebrável", descricao: "Durante dois turnos, não pode receber acertos críticos e recebe um escudo equivalente a 200% de RES. Uma vez por batalha." }
                ]
            }
        ],
        curiosidades: [
            "As habilidades originais são preservadas após a escolha de Caminho.",
            "O nível 50 define permanentemente entre Berserker Sanguinário e Colosso Indomável.",
            "A principal decisão estratégica é escolher entre gastar Fúria nas habilidades ou guardá-la para Fúria Selvagem."
        ]
    },

    guerreiro: {
        id: "guerreiro",
        nome: "Guerreiro",
        dificuldade: "★★★☆☆",
        cargo: "Combatente Versátil",
        imagem: "assets/images/classes/guerreiro.webp",
        icone: "assets/images/classes/guerreiro.webp",
        descricao: "O Guerreiro domina armas, postura e disciplina. Sua versatilidade permite adaptar a construção para ataque, defesa ou controle de espaço.",
        estilo: { principal: "Combate físico versátil.", secundaria: "Proteção, controle de espaço e resposta tática.", fortes: "Adaptação, consistência e variedade de construções.", fracos: "Depende de escolhas corretas de equipamento e posicionamento.", atributos: "FOR e DEF, com RES ou INI conforme a especialização." },
        recurso: { nome: "Postura", descricao: "O Guerreiro alterna posturas para favorecer ataque, defesa ou mobilidade." },
        passivas: [{ nome: "Mestre de Armas", descricao: "Recebe maior eficiência ao utilizar diferentes tipos de armamento físico." }],
        progressao: [
            { nivel: "Nível 1", nome: "Corte Disciplinado", descricao: "Ataque físico confiável que se beneficia de força e precisão de posicionamento." },
            { nivel: "Nível 1", nome: "Guarda Preparada", descricao: "Recebe 15% de redução de dano até o início do próximo turno." }
        ],
        curiosidades: ["É uma das classes mais flexíveis para jogadores iniciantes.", "Pode ocupar funções ofensivas ou defensivas sem perder identidade."]
    },

    mago: {
        id: "mago",
        nome: "Mago",
        dificuldade: "★★★★☆",
        cargo: "Conjurador Ofensivo",
        imagem: "assets/images/classes/mago.webp",
        icone: "assets/images/classes/mago.webp",
        descricao: "O Mago domina energia elemental e conhecimento arcano para causar dano à distância, controlar áreas e transformar o campo de batalha.",
        estilo: { principal: "Dano mágico e controle de área.", secundaria: "Debuffs e manipulação do campo.", fortes: "Grande alcance, dano explosivo e variedade elemental.", fracos: "Baixa resistência física e dependência de Mana.", atributos: "INT, ARC e INI." },
        recurso: { nome: "Mana", descricao: "A Mana é consumida para conjurar magias e deve ser administrada durante combates prolongados." },
        passivas: [{ nome: "Afinidade Elemental", descricao: "O Mago pode especializar suas conjurações em diferentes elementos e efeitos." }],
        progressao: [
            { nivel: "Nível 1", nome: "Projétil Arcano", descricao: "Dispara energia mágica contra um alvo, causando dano baseado em Inteligência." },
            { nivel: "Nível 1", nome: "Barreira Arcana", descricao: "Concede um pequeno escudo mágico ao Mago até o início do próximo turno." }
        ],
        curiosidades: ["O posicionamento é essencial para manter a segurança.", "A classe pode ser adaptada para dano direto ou controle."]
    },

    clerigo: {
        id: "clerigo",
        nome: "Clérigo",
        dificuldade: "★★★★☆",
        cargo: "Suporte e Protetor",
        imagem: "assets/images/classes/clerigo.webp",
        icone: "assets/images/classes/clerigo.webp",
        descricao: "O Clérigo utiliza fé, magia sagrada e disciplina para curar, proteger e fortalecer aliados enquanto enfraquece ameaças sobrenaturais.",
        estilo: { principal: "Cura, escudos e suporte.", secundaria: "Dano sagrado e proteção da equipe.", fortes: "Sustentação, utilidade e alta influência no grupo.", fracos: "Menor dano direto e alta responsabilidade estratégica.", atributos: "ARC, INT e RES." },
        recurso: { nome: "Graça", descricao: "A Graça fortalece curas, escudos e efeitos de proteção quando o Clérigo mantém seus aliados seguros." },
        passivas: [{ nome: "Presença Sagrada", descricao: "Aliados próximos recebem benefícios de proteção e recuperação." }],
        progressao: [
            { nivel: "Nível 1", nome: "Luz Restauradora", descricao: "Recupera a vida de um aliado com eficiência baseada em Arcano." },
            { nivel: "Nível 1", nome: "Selo Protetor", descricao: "Concede um escudo sagrado a um aliado próximo." }
        ],
        curiosidades: ["Pode ser construído como curador puro ou suporte resistente.", "Seu valor cresce muito em grupos organizados."]
    }
};
