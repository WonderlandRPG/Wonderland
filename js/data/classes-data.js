const classes = {
    barbaro: {
        id: "barbaro",
        nome: "Bárbaro",
        dificuldade: "★★☆☆☆",
        cargo: "Combatente de Linha de Frente",
        imagem: "assets/images/classes/barbaro.webp",
        icone: "assets/images/classes/barbaro.webp",
        descricao:
            "O Bárbaro transforma força bruta, resistência e instinto em pressão constante. É uma classe direta, agressiva e excelente para jogadores que desejam dominar a linha de frente.",
        estilo: {
            principal: "Dano físico e pressão corpo a corpo.",
            secundaria: "Absorver impacto e abrir espaço para aliados.",
            fortes: "Alto dano, grande presença na linha de frente e boa resistência.",
            fracos: "Pouco alcance, dependência de aproximação e menor versatilidade mágica.",
            atributos: "FOR, RES e DEF. INI pode melhorar a frequência de ação."
        },
        recurso: {
            nome: "Fúria",
            descricao:
                "A Fúria cresce durante o combate e fortalece golpes, efeitos ofensivos e habilidades de sobrevivência."
        },
        passivas: [
            {
                nome: "Instinto de Guerra",
                descricao:
                    "Ao entrar em combate, o Bárbaro recebe bônus temporário de presença ofensiva enquanto permanecer próximo dos inimigos."
            },
            {
                nome: "Corpo Inabalável",
                descricao:
                    "Quanto menor sua vida, maior sua capacidade de resistir e manter a pressão na linha de frente."
            }
        ],
        progressao: [
            {
                nivel: "Nível 1",
                nome: "Golpe Brutal",
                descricao:
                    "Um ataque físico poderoso que utiliza a força do personagem como principal escala de dano."
            },
            {
                nivel: "Nível 10",
                nome: "Fúria Crescente",
                descricao:
                    "Aumenta o ganho de Fúria e melhora a eficiência das habilidades ofensivas."
            },
            {
                nivel: "Nível 20",
                nome: "Ruptura da Linha",
                descricao:
                    "Avança contra os inimigos e rompe formações, causando dano e criando espaço para o grupo."
            }
        ],
        curiosidades: [
            "Bárbaros não dependem de magia para serem ameaças constantes.",
            "A classe recompensa jogadores que permanecem ativos no combate.",
            "Pode ser construída para dano puro ou para uma função híbrida de resistência."
        ]
    },

    guerreiro: {
        id: "guerreiro",
        nome: "Guerreiro",
        dificuldade: "★★★☆☆",
        cargo: "Combatente Versátil",
        imagem: "assets/images/classes/guerreiro.webp",
        icone: "assets/images/classes/guerreiro.webp",
        descricao:
            "O Guerreiro domina armas, postura e disciplina. Sua versatilidade permite adaptar a construção para ataque, defesa ou controle de espaço.",
        estilo: {
            principal: "Combate físico versátil.",
            secundaria: "Proteção, controle de espaço e resposta tática.",
            fortes: "Adaptação, consistência e variedade de construções.",
            fracos: "Depende de escolhas corretas de equipamento e posicionamento.",
            atributos: "FOR e DEF, com RES ou INI conforme a especialização."
        },
        recurso: {
            nome: "Postura",
            descricao:
                "O Guerreiro alterna posturas para favorecer ataque, defesa ou mobilidade."
        },
        passivas: [
            {
                nome: "Mestre de Armas",
                descricao:
                    "Recebe maior eficiência ao utilizar diferentes tipos de armamento físico."
            }
        ],
        progressao: [
            {
                nivel: "Nível 1",
                nome: "Corte Disciplinado",
                descricao:
                    "Ataque físico confiável que se beneficia de força e precisão de posicionamento."
            }
        ],
        curiosidades: [
            "É uma das classes mais flexíveis para jogadores iniciantes.",
            "Pode ocupar funções ofensivas ou defensivas sem perder identidade."
        ]
    },

    mago: {
        id: "mago",
        nome: "Mago",
        dificuldade: "★★★★☆",
        cargo: "Conjurador Ofensivo",
        imagem: "assets/images/classes/mago.webp",
        icone: "assets/images/classes/mago.webp",
        descricao:
            "O Mago domina energia elemental e conhecimento arcano para causar dano à distância, controlar áreas e transformar o campo de batalha.",
        estilo: {
            principal: "Dano mágico e controle de área.",
            secundaria: "Debuffs e manipulação do campo.",
            fortes: "Grande alcance, dano explosivo e variedade elemental.",
            fracos: "Baixa resistência física e dependência de Mana.",
            atributos: "INT, ARC e INI."
        },
        recurso: {
            nome: "Mana",
            descricao:
                "A Mana é consumida para conjurar magias e deve ser administrada durante combates prolongados."
        },
        passivas: [
            {
                nome: "Afinidade Elemental",
                descricao:
                    "O Mago pode especializar suas conjurações em diferentes elementos e efeitos."
            }
        ],
        progressao: [
            {
                nivel: "Nível 1",
                nome: "Projétil Arcano",
                descricao:
                    "Dispara energia mágica contra um alvo, causando dano baseado em Inteligência."
            }
        ],
        curiosidades: [
            "O posicionamento é essencial para manter a segurança.",
            "A classe pode ser adaptada para dano direto ou controle."
        ]
    },

    clerigo: {
        id: "clerigo",
        nome: "Clérigo",
        dificuldade: "★★★★☆",
        cargo: "Suporte e Protetor",
        imagem: "assets/images/classes/clerigo.webp",
        icone: "assets/images/classes/clerigo.webp",
        descricao:
            "O Clérigo utiliza fé, magia sagrada e disciplina para curar, proteger e fortalecer aliados enquanto enfraquece ameaças sobrenaturais.",
        estilo: {
            principal: "Cura, escudos e suporte.",
            secundaria: "Dano sagrado e proteção da equipe.",
            fortes: "Sustentação, utilidade e alta influência no grupo.",
            fracos: "Menor dano direto e alta responsabilidade estratégica.",
            atributos: "ARC, INT e RES."
        },
        recurso: {
            nome: "Graça",
            descricao:
                "A Graça fortalece curas, escudos e efeitos de proteção quando o Clérigo mantém seus aliados seguros."
        },
        passivas: [
            {
                nome: "Presença Sagrada",
                descricao:
                    "Aliados próximos recebem benefícios de proteção e recuperação."
            }
        ],
        progressao: [
            {
                nivel: "Nível 1",
                nome: "Luz Restauradora",
                descricao:
                    "Recupera a vida de um aliado com eficiência baseada em Arcano."
            }
        ],
        curiosidades: [
            "Pode ser construído como curador puro ou suporte resistente.",
            "Seu valor cresce muito em grupos organizados."
        ]
    }
};
