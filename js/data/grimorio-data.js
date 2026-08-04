"use strict";

/*
    =========================================================
    GRIMÓRIO — BANCO DE DADOS
    =========================================================

    Cada termo possui:

    id: identificador interno;
    nome: nome mostrado ao jogador;
    categoria: categoria à qual pertence;
    subtitulo: pequena classificação;
    tema: identidade visual;
    descricao: explicação resumida;
    funcionamento: regras detalhadas;
    exemplo: exemplo de combate;
    utilizadoPor: referências futuras;
    observacoes: exceções e informações adicionais.
*/

window.WONDERLAND_GRIMOIRE = {
    categorias: [
        {
            id: "mecanicas",
            nome: "Mecânicas Gerais",
            icone: "✦",
            descricao: "Regras fundamentais utilizadas nas habilidades e nos combates."
        },
        {
            id: "controle",
            nome: "Controle de Grupo",
            icone: "⛓",
            descricao: "Efeitos que limitam ações, movimentos ou decisões dos personagens."
        },
        {
            id: "efeitos",
            nome: "Efeitos Contínuos",
            icone: "◆",
            descricao: "Condições que permanecem ativas durante um ou mais turnos."
        },
        {
            id: "defesa",
            nome: "Defesa",
            icone: "⬡",
            descricao: "Mecânicas relacionadas à proteção e à redução de dano."
        },
        {
            id: "estados",
            nome: "Estados Especiais",
            icone: "◇",
            descricao: "Condições especiais que modificam o comportamento do personagem."
        }
    ],

    termos: [
        /* =================================================
           MECÂNICAS GERAIS
        ================================================= */

        criarTermo({
            id: "dano-fisico",
            nome: "Dano Físico",
            categoria: "mecanicas",
            subtitulo: "Mecânica ofensiva",
            tema: criarTema("#cf5045", "#ff9b72", "impact")
        }),

        criarTermo({
            id: "dano-magico",
            nome: "Dano Mágico",
            categoria: "mecanicas",
            subtitulo: "Mecânica ofensiva",
            tema: criarTema("#6c82dd", "#a6c5ff", "arcane")
        }),

        criarTermo({
            id: "dano-verdadeiro",
            nome: "Dano Verdadeiro",
            categoria: "mecanicas",
            subtitulo: "Mecânica ofensiva",
            tema: criarTema("#e5d5b2", "#ffffff", "pure")
        }),

        criarTermo({
            id: "cura",
            nome: "Cura",
            categoria: "mecanicas",
            subtitulo: "Recuperação",
            tema: criarTema("#5fae80", "#a7ffd0", "healing")
        }),

        criarTermo({
            id: "escudo",
            nome: "Escudo",
            categoria: "mecanicas",
            subtitulo: "Proteção temporária",
            tema: criarTema("#d6b56b", "#fff0a7", "shield")
        }),

        criarTermo({
            id: "buff",
            nome: "Buff",
            categoria: "mecanicas",
            subtitulo: "Efeito positivo",
            tema: criarTema("#dfb85d", "#fff0a4", "buff")
        }),

        criarTermo({
            id: "debuff",
            nome: "Debuff",
            categoria: "mecanicas",
            subtitulo: "Efeito negativo",
            tema: criarTema("#9d61c9", "#ddb0ff", "debuff")
        }),

        criarTermo({
            id: "mana",
            nome: "Mana",
            categoria: "mecanicas",
            subtitulo: "Recurso mágico",
            tema: criarTema("#668ddc", "#a9ceff", "mana")
        }),

        criarTermo({
            id: "recarga",
            nome: "Recarga",
            categoria: "mecanicas",
            subtitulo: "Limitação de habilidade",
            tema: criarTema("#b18c5e", "#ecd19e", "time")
        }),

        criarTermo({
            id: "area-de-efeito",
            nome: "Área de Efeito",
            categoria: "mecanicas",
            subtitulo: "Alcance coletivo",
            tema: criarTema("#d0794d", "#ffc18b", "area")
        }),

        criarTermo({
            id: "canalizacao",
            nome: "Canalização",
            categoria: "mecanicas",
            subtitulo: "Preparação de habilidade",
            tema: criarTema("#7669d0", "#c9b9ff", "channel")
        }),

        criarTermo({
            id: "reacao",
            nome: "Reação",
            categoria: "mecanicas",
            subtitulo: "Ação responsiva",
            tema: criarTema("#d9ad4e", "#fff1a0", "reaction")
        }),

        criarTermo({
            id: "passiva",
            nome: "Passiva",
            categoria: "mecanicas",
            subtitulo: "Efeito permanente",
            tema: criarTema("#6c9c85", "#afe8ca", "passive")
        }),

        criarTermo({
            id: "ativa",
            nome: "Ativa",
            categoria: "mecanicas",
            subtitulo: "Habilidade utilizada",
            tema: criarTema("#bf704d", "#ffb18c", "active")
        }),

        criarTermo({
            id: "ultimate",
            nome: "Ultimate",
            categoria: "mecanicas",
            subtitulo: "Habilidade máxima",
            tema: criarTema("#d6b56b", "#fff0aa", "ultimate")
        }),

        criarTermo({
            id: "invocacao",
            nome: "Invocação",
            categoria: "mecanicas",
            subtitulo: "Criatura ou construção",
            tema: criarTema("#6f9b77", "#b8edbe", "summon")
        }),

        criarTermo({
            id: "transformacao",
            nome: "Transformação",
            categoria: "mecanicas",
            subtitulo: "Alteração temporária",
            tema: criarTema("#bb69ca", "#efb5ff", "transform")
        }),

        /* =================================================
           CONTROLE DE GRUPO
        ================================================= */

        criarTermo({
            id: "atordoamento",
            nome: "Atordoamento",
            categoria: "controle",
            subtitulo: "Controle total",
            tema: criarTema("#d6b347", "#fff19a", "stun")
        }),

        criarTermo({
            id: "imobilizacao",
            nome: "Imobilização",
            categoria: "controle",
            subtitulo: "Controle de movimento",
            tema: criarTema("#788b9e", "#c2d9e9", "root")
        }),

        criarTermo({
            id: "silencio",
            nome: "Silêncio",
            categoria: "controle",
            subtitulo: "Bloqueio de magia",
            tema: criarTema("#66718d", "#b6c0df", "silence")
        }),

        criarTermo({
            id: "provocacao",
            nome: "Provocação",
            categoria: "controle",
            subtitulo: "Controle de alvo",
            tema: criarTema("#c65a49", "#ff9a83", "taunt")
        }),

        criarTermo({
            id: "lentidao",
            nome: "Lentidão",
            categoria: "controle",
            subtitulo: "Redução de velocidade",
            tema: criarTema("#659eb4", "#a9e7ff", "slow")
        }),

        criarTermo({
            id: "derrubada",
            nome: "Derrubada",
            categoria: "controle",
            subtitulo: "Controle físico",
            tema: criarTema("#9a7151", "#dfb184", "knockdown")
        }),

        criarTermo({
            id: "empurrao",
            nome: "Empurrão",
            categoria: "controle",
            subtitulo: "Deslocamento forçado",
            tema: criarTema("#7198b5", "#bde2ff", "push")
        }),

        criarTermo({
            id: "puxao",
            nome: "Puxão",
            categoria: "controle",
            subtitulo: "Deslocamento forçado",
            tema: criarTema("#8c719e", "#d5afea", "pull")
        }),

        criarTermo({
            id: "medo",
            nome: "Medo",
            categoria: "controle",
            subtitulo: "Controle mental",
            tema: criarTema("#69517f", "#b592cd", "fear")
        }),

        criarTermo({
            id: "encanto",
            nome: "Encanto",
            categoria: "controle",
            subtitulo: "Controle mental",
            tema: criarTema("#d06ca8", "#ffb2de", "charm")
        }),

        criarTermo({
            id: "confusao",
            nome: "Confusão",
            categoria: "controle",
            subtitulo: "Desorientação mental",
            tema: criarTema("#9267bc", "#dfb2ff", "confusion")
        }),

        criarTermo({
            id: "revelacao",
            nome: "Revelação",
            categoria: "controle",
            subtitulo: "Detecção",
            tema: criarTema("#d5c571", "#fff5ae", "reveal")
        }),

        /* =================================================
           EFEITOS CONTÍNUOS
        ================================================= */

        criarTermo({
            id: "sangramento",
            nome: "Sangramento",
            categoria: "efeitos",
            subtitulo: "Dano contínuo físico",
            tema: criarTema("#9f2734", "#ff6876", "bleed")
        }),

        criarTermo({
            id: "queimadura",
            nome: "Queimadura",
            categoria: "efeitos",
            subtitulo: "Dano contínuo elemental",
            tema: criarTema("#d34a2d", "#ff9c4a", "burn")
        }),

        criarTermo({
            id: "veneno",
            nome: "Veneno",
            categoria: "efeitos",
            subtitulo: "Dano contínuo tóxico",
            tema: criarTema("#65973c", "#b6ef6e", "poison")
        }),

        criarTermo({
            id: "congelamento",
            nome: "Congelamento",
            categoria: "efeitos",
            subtitulo: "Efeito elemental",
            tema: criarTema("#67abd0", "#c3efff", "freeze")
        }),

        criarTermo({
            id: "choque",
            nome: "Choque",
            categoria: "efeitos",
            subtitulo: "Efeito elemental",
            tema: criarTema("#d8b94a", "#fff18a", "shock")
        }),

        criarTermo({
            id: "maldicao",
            nome: "Maldição",
            categoria: "efeitos",
            subtitulo: "Efeito mágico negativo",
            tema: criarTema("#76469d", "#c688ee", "curse")
        }),

        criarTermo({
            id: "regeneracao",
            nome: "Regeneração",
            categoria: "efeitos",
            subtitulo: "Recuperação contínua",
            tema: criarTema("#4d9f67", "#9bf2ad", "regeneration")
        }),

        /* =================================================
           DEFESA
        ================================================= */

        criarTermo({
            id: "armadura",
            nome: "Armadura",
            categoria: "defesa",
            subtitulo: "Proteção física",
            tema: criarTema("#7d8997", "#c8d3df", "armor")
        }),

        criarTermo({
            id: "resistencia-magica",
            nome: "Resistência Mágica",
            categoria: "defesa",
            subtitulo: "Proteção mágica",
            tema: criarTema("#6779a6", "#b9c9ff", "magic-resist")
        }),

        criarTermo({
            id: "bloqueio",
            nome: "Bloqueio",
            categoria: "defesa",
            subtitulo: "Defesa ativa",
            tema: criarTema("#a58b62", "#ead4a9", "block")
        }),

        criarTermo({
            id: "esquiva",
            nome: "Esquiva",
            categoria: "defesa",
            subtitulo: "Evasão",
            tema: criarTema("#c4a34f", "#ffe38d", "dodge")
        }),

        criarTermo({
            id: "reflexao",
            nome: "Reflexão",
            categoria: "defesa",
            subtitulo: "Retorno de efeito",
            tema: criarTema("#718cb4", "#c0ddff", "reflect")
        }),

        criarTermo({
            id: "absorcao",
            nome: "Absorção",
            categoria: "defesa",
            subtitulo: "Conversão defensiva",
            tema: criarTema("#687d9f", "#b6ccef", "absorb")
        }),

        criarTermo({
            id: "reducao-de-dano",
            nome: "Redução de Dano",
            categoria: "defesa",
            subtitulo: "Mitigação",
            tema: criarTema("#7a8a83", "#c4d7cf", "reduction")
        }),

        /* =================================================
           ESTADOS ESPECIAIS
        ================================================= */

        criarTermo({
            id: "invisibilidade",
            nome: "Invisibilidade",
            categoria: "estados",
            subtitulo: "Ocultação mágica",
            tema: criarTema("#66778b", "#b6cbdf", "invisibility")
        }),

        criarTermo({
            id: "camuflagem",
            nome: "Camuflagem",
            categoria: "estados",
            subtitulo: "Ocultação ambiental",
            tema: criarTema("#667f64", "#aed3a8", "camouflage")
        }),

        criarTermo({
            id: "furtividade",
            nome: "Furtividade",
            categoria: "estados",
            subtitulo: "Ocultação física",
            tema: criarTema("#5f596d", "#aaa0ba", "stealth")
        }),

        criarTermo({
            id: "voo",
            nome: "Voo",
            categoria: "estados",
            subtitulo: "Mobilidade aérea",
            tema: criarTema("#72a8c0", "#c5edff", "flight")
        }),

        criarTermo({
            id: "exaustao",
            nome: "Exaustão",
            categoria: "estados",
            subtitulo: "Penalidade temporária",
            tema: criarTema("#806c68", "#c9aaa4", "exhaustion")
        }),

        criarTermo({
            id: "berserk",
            nome: "Berserk",
            categoria: "estados",
            subtitulo: "Estado ofensivo",
            tema: criarTema("#b53536", "#ff7770", "berserk")
        }),

        criarTermo({
            id: "intangibilidade",
            nome: "Intangibilidade",
            categoria: "estados",
            subtitulo: "Estado espiritual",
            tema: criarTema("#8298b8", "#d1e3ff", "intangibility")
        })
    ]
};

/*
    =========================================================
    FUNÇÕES AUXILIARES
    =========================================================
*/

function criarTema(cor, brilho, efeito) {
    return {
        cor,
        brilho,
        efeito
    };
}

function criarTermo(configuracao) {
    return {
        id: configuracao.id,
        nome: configuracao.nome,
        categoria: configuracao.categoria,
        subtitulo: configuracao.subtitulo,
        tema: configuracao.tema,

        descricao:
            configuracao.descricao ||
            "A definição oficial desta mecânica ainda será adicionada ao Grimório de Wonderland.",

        funcionamento:
            configuracao.funcionamento ||
            [
                "As regras detalhadas desta mecânica ainda estão em desenvolvimento.",
                "O funcionamento definitivo será registrado após a revisão do sistema de combate."
            ],

        exemplo:
            configuracao.exemplo ||
            "Um exemplo prático será adicionado depois que a regra oficial desta mecânica for definida.",

        utilizadoPor:
            configuracao.utilizadoPor ||
            [],

        observacoes:
            configuracao.observacoes ||
            [
                "Conteúdo em desenvolvimento.",
                "Esta entrada poderá ser atualizada durante o balanceamento do RPG."
            ]
    };
}

/*
    Compatibilidade temporária com códigos anteriores.
*/

window.grimorio = window.WONDERLAND_GRIMOIRE;