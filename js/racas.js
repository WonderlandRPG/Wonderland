"use strict";

document.addEventListener("DOMContentLoaded", () => {
    /*==================================================
                    ELEMENTOS DA PÁGINA
    ==================================================*/

    const raceSelectors = document.querySelectorAll(".race-selector");

    const racePanel = document.getElementById("racePanel");
    const raceCount = document.getElementById("raceCount");

    const raceName = document.getElementById("raceName");
    const raceDifficulty = document.getElementById("raceDifficulty");
    const raceDescription = document.getElementById("raceDescription");

    const raceHp = document.getElementById("raceHp");
    const raceMana = document.getElementById("raceMana");
    const racePoints = document.getElementById("racePoints");

    const raceAttributes = document.getElementById("raceAttributes");
    const raceTraits = document.getElementById("raceTraits");
    const raceProgression = document.getElementById("raceProgression");

    const music = document.getElementById("bgMusic");
    const musicButton = document.getElementById("musicButton");
    const musicIcon = document.getElementById("musicIcon");

    let selectedRace = "humano";

    /*==================================================
                    DADOS DAS RAÇAS
    ==================================================*/

    const races = {
        humano: {
            name: "Humano",
            difficulty: 2,

            description:
                "Os Humanos são conhecidos por sua capacidade de adaptação, ambição e diversidade. Espalhados por todos os reinos, podem seguir qualquer caminho e ocupar praticamente qualquer função dentro de Wonderland. Embora não possuam as vantagens naturais de outras raças, compensam essa ausência com determinação, criatividade e liberdade para desenvolver diferentes estilos.",

            hp: 500,
            mana: 50,
            points: 15,

            attributes: {
                FOR: 2,
                DEF: 2,
                RES: 2,
                INI: 3,
                INT: 3,
                ARC: 3
            },

            traits: [
                {
                    name: "Versatilidade Humana",
                    description:
                        "O Humano possui grande facilidade para se adaptar a diferentes estilos de combate, profissões e situações inesperadas."
                },
                {
                    name: "Espírito Ambicioso",
                    description:
                        "Sua determinação permite superar limitações por meio de treinamento, estratégia, conhecimento e experiência."
                }
            ],

            progression: [
                {
                    level: "Nível 1",
                    name: "Potencial Humano",
                    description:
                        "O personagem inicia sua jornada com liberdade para desenvolver qualquer atributo e seguir qualquer caminho."
                },
                {
                    level: "Nível 20",
                    name: "Mestre da Adaptação",
                    description:
                        "O Humano aperfeiçoa sua principal especialidade e recebe benefícios relacionados ao caminho que escolheu."
                }
            ]
        },

        aengel: {
            name: "Aengel",
            difficulty: 4,

            description:
                "Os Aengels descendem de seres tocados pela Luz Primordial. Possuem grandes asas, olhos luminosos e uma presença que inspira respeito. Sua sociedade valoriza disciplina, honra e responsabilidade. Muitos atuam como guardiões, juízes e protetores do equilíbrio, embora alguns rejeitem esse destino e escolham trilhar caminhos próprios.",

            hp: 450,
            mana: 100,
            points: 15,

            attributes: {
                FOR: 1,
                DEF: 3,
                RES: 3,
                INI: 2,
                INT: 2,
                ARC: 4
            },

            traits: [
                {
                    name: "Luz Celestial",
                    description:
                        "A energia da Luz Primordial fortalece curas, escudos e habilidades utilizadas para proteger aliados."
                },
                {
                    name: "Asas Sagradas",
                    description:
                        "Os Aengels possuem grande mobilidade e podem alcançar locais elevados ou atravessar obstáculos com facilidade."
                }
            ],

            progression: [
                {
                    level: "Nível 1",
                    name: "Centelha Primordial",
                    description:
                        "O Aengel desperta sua conexão com a Luz e aprende a canalizá-la em proteção e auxílio."
                },
                {
                    level: "Nível 20",
                    name: "Ascensão Celestial",
                    description:
                        "Suas asas e sua energia luminosa atingem um novo estágio, tornando sua presença muito mais poderosa."
                }
            ]
        },

        draconato: {
            name: "Draconato",
            difficulty: 5,

            description:
                "Os Draconatos descendem dos antigos Dragões Primordiais. Embora tenham perdido a capacidade de assumir uma forma dracônica completa, ainda carregam escamas, chifres, caudas e parte da essência de seus ancestrais. Cada Draconato manifesta afinidade com um elemento, como fogo, gelo, trovão, terra, vento ou veneno.",

            hp: 650,
            mana: 50,
            points: 15,

            attributes: {
                FOR: 5,
                DEF: 3,
                RES: 3,
                INI: 1,
                INT: 2,
                ARC: 1
            },

            traits: [
                {
                    name: "Herança Dracônica",
                    description:
                        "O Draconato escolhe um elemento ancestral e recebe resistência contra efeitos relacionados a esse elemento."
                },
                {
                    name: "Escamas Naturais",
                    description:
                        "Suas escamas oferecem proteção natural, tornando o Draconato resistente a ataques físicos."
                }
            ],

            progression: [
                {
                    level: "Nível 1",
                    name: "Essência Elemental",
                    description:
                        "O Draconato desperta o elemento herdado de sua linhagem ancestral."
                },
                {
                    level: "Nível 20",
                    name: "Despertar do Dragão",
                    description:
                        "Sua essência dracônica se fortalece, ampliando suas capacidades físicas e elementais."
                }
            ]
        },

        lobisomem: {
            name: "Lobisomem",
            difficulty: 4,

            description:
                "Os Lobisomens descendem da antiga Maldição da Lua. São guerreiros extremamente adaptáveis, capazes de alternar entre sua forma humana e sua forma bestial. Durante o combate, tornam-se progressivamente mais perigosos, utilizando força, velocidade e instintos para dominar seus inimigos.",

            hp: 700,
            mana: 0,
            points: 15,

            attributes: {
                FOR: 4,
                DEF: 2,
                RES: 4,
                INI: 4,
                INT: 0,
                ARC: 1
            },

            traits: [
                {
                    name: "Forma Bestial",
                    description:
                        "O Lobisomem pode assumir uma forma monstruosa, aumentando sua força, resistência e mobilidade."
                },
                {
                    name: "Instinto Predador",
                    description:
                        "Quanto mais ferido estiver, mais agressivos e perigosos se tornam seus ataques."
                }
            ],

            progression: [
                {
                    level: "Nível 1",
                    name: "Maldição da Lua",
                    description:
                        "O personagem aprende a controlar parcialmente sua transformação e seus instintos."
                },
                {
                    level: "Nível 20",
                    name: "Lua Soberana",
                    description:
                        "O Lobisomem domina completamente sua forma bestial sem perder sua consciência."
                }
            ]
        },

        kitsune: {
            name: "Kitsune",
            difficulty: 5,

            description:
                "Os Kitsunes são espíritos ancestrais que assumiram forma física após séculos absorvendo a energia mágica de Wonderland. São mestres da ilusão, manipulação e enganação. Cada cauda representa o amadurecimento de sua alma, e os mais antigos podem manifestar as lendárias nove caudas.",

            hp: 300,
            mana: 200,
            points: 15,

            attributes: {
                FOR: 0,
                DEF: 1,
                RES: 2,
                INI: 4,
                INT: 4,
                ARC: 4
            },

            traits: [
                {
                    name: "Mestre das Ilusões",
                    description:
                        "O Kitsune consegue criar imagens falsas, esconder presenças e confundir a percepção de seus inimigos."
                },
                {
                    name: "Caudas Espirituais",
                    description:
                        "Suas caudas armazenam energia mágica e representam o crescimento de seu poder espiritual."
                }
            ],

            progression: [
                {
                    level: "Nível 1",
                    name: "Primeira Cauda",
                    description:
                        "O Kitsune manifesta sua primeira cauda e desperta seus poderes de ilusão."
                },
                {
                    level: "Nível 20",
                    name: "Raposa Espiritual",
                    description:
                        "Suas ilusões tornam-se mais complexas, permitindo manipular vários alvos ao mesmo tempo."
                }
            ]
        },

        leonis: {
            name: "Leonis",
            difficulty: 3,

            description:
                "Os Leonis são um povo de guerreiros com traços felinos, conhecidos por sua coragem, orgulho e lealdade. Vivem em comunidades organizadas ao redor de grandes famílias e valorizam aqueles que demonstram força, honra e capacidade de proteger seus companheiros.",

            hp: 650,
            mana: 0,
            points: 15,

            attributes: {
                FOR: 4,
                DEF: 3,
                RES: 3,
                INI: 3,
                INT: 1,
                ARC: 1
            },

            traits: [
                {
                    name: "Orgulho do Leão",
                    description:
                        "O Leonis recebe força adicional quando luta para proteger seus aliados ou defender seu território."
                },
                {
                    name: "Sentidos Felinos",
                    description:
                        "Sua audição, visão e percepção permitem identificar ameaças e movimentos com facilidade."
                }
            ],

            progression: [
                {
                    level: "Nível 1",
                    name: "Garras do Caçador",
                    description:
                        "O Leonis desperta seus sentidos de combate e sua capacidade natural de perseguição."
                },
                {
                    level: "Nível 20",
                    name: "Rei da Caçada",
                    description:
                        "Sua presença fortalece aliados próximos e intimida adversários mais fracos."
                }
            ]
        },

        tiefling: {
            name: "Tiefling",
            difficulty: 4,

            description:
                "Os Tieflings carregam em seu sangue a influência de forças infernais ou entidades de outros planos. Possuem chifres, caudas, olhos incomuns e grande afinidade com magia. Apesar do preconceito enfrentado em muitos lugares, não são naturalmente malignos e podem escolher livremente seu destino.",

            hp: 450,
            mana: 150,
            points: 15,

            attributes: {
                FOR: 1,
                DEF: 1,
                RES: 2,
                INI: 3,
                INT: 4,
                ARC: 4
            },

            traits: [
                {
                    name: "Sangue Infernal",
                    description:
                        "O Tiefling possui resistência natural contra calor, fogo e energias de origem infernal."
                },
                {
                    name: "Pacto Interior",
                    description:
                        "Sua herança fortalece magias ofensivas, maldições e efeitos aplicados contra inimigos."
                }
            ],

            progression: [
                {
                    level: "Nível 1",
                    name: "Marca Infernal",
                    description:
                        "O Tiefling desperta a energia adormecida em sua linhagem."
                },
                {
                    level: "Nível 20",
                    name: "Herdeiro do Abismo",
                    description:
                        "O personagem domina sua herança e passa a utilizá-la sem ser consumido por ela."
                }
            ]
        },

        vampiro: {
            name: "Vampiro",
            difficulty: 5,

            description:
                "Os Vampiros são seres marcados pela sede de sangue e pela imortalidade incompleta. Possuem força, velocidade e sentidos superiores aos de muitas outras raças. Entretanto, precisam controlar seus instintos e lidar com fraquezas que podem ser exploradas por inimigos preparados.",

            hp: 500,
            mana: 100,
            points: 15,

            attributes: {
                FOR: 3,
                DEF: 2,
                RES: 3,
                INI: 4,
                INT: 2,
                ARC: 1
            },

            traits: [
                {
                    name: "Sede de Sangue",
                    description:
                        "O Vampiro pode recuperar parte de sua vitalidade ao causar dano direto a criaturas vivas."
                },
                {
                    name: "Predador Noturno",
                    description:
                        "Durante a noite ou em locais escuros, seus sentidos e sua mobilidade tornam-se ainda mais poderosos."
                }
            ],

            progression: [
                {
                    level: "Nível 1",
                    name: "Sangue Desperto",
                    description:
                        "O Vampiro aprende a utilizar sua sede como fonte de poder durante o combate."
                },
                {
                    level: "Nível 20",
                    name: "Senhor da Noite",
                    description:
                        "Sua presença sombria e seus poderes predatórios atingem um novo estágio."
                }
            ]
        },

        elfo: {
            name: "Elfo",
            difficulty: 3,

            description:
                "Os Elfos possuem uma profunda ligação com a magia, a natureza e o conhecimento antigo. Vivem muito mais que os Humanos e dedicam décadas ao aperfeiçoamento de suas habilidades. São conhecidos por sua precisão, inteligência e percepção extraordinária.",

            hp: 400,
            mana: 150,
            points: 15,

            attributes: {
                FOR: 1,
                DEF: 1,
                RES: 2,
                INI: 4,
                INT: 4,
                ARC: 3
            },

            traits: [
                {
                    name: "Sentidos Élficos",
                    description:
                        "O Elfo possui percepção aguçada e facilidade para identificar movimentos, armadilhas e presenças escondidas."
                },
                {
                    name: "Afinidade Ancestral",
                    description:
                        "Sua ligação com a magia melhora a eficiência de feitiços, rituais e efeitos arcanos."
                }
            ],

            progression: [
                {
                    level: "Nível 1",
                    name: "Herança Élfica",
                    description:
                        "O Elfo desperta sua sensibilidade natural para a magia e para o ambiente ao seu redor."
                },
                {
                    level: "Nível 20",
                    name: "Sabedoria Ancestral",
                    description:
                        "Décadas de conhecimento condensam-se em uma percepção mágica muito mais avançada."
                }
            ]
        },

        fada: {
            name: "Fada",
            difficulty: 4,

            description:
                "As Fadas são pequenas criaturas mágicas ligadas às forças naturais e ao mundo espiritual. Apesar de sua aparência delicada, possuem enorme poder arcano. São extremamente móveis e especializadas em curas, escudos, encantamentos e manipulação do campo de batalha.",

            hp: 250,
            mana: 250,
            points: 15,

            attributes: {
                FOR: 0,
                DEF: 0,
                RES: 1,
                INI: 4,
                INT: 4,
                ARC: 6
            },

            traits: [
                {
                    name: "Asas Encantadas",
                    description:
                        "A Fada pode voar e atravessar obstáculos que impediriam criaturas presas ao solo."
                },
                {
                    name: "Essência Feérica",
                    description:
                        "Curas, escudos, fortalecimento de aliados e efeitos arcanos tornam-se mais eficientes."
                }
            ],

            progression: [
                {
                    level: "Nível 1",
                    name: "Pó Feérico",
                    description:
                        "A Fada desperta uma energia capaz de fortalecer aliados e enfraquecer inimigos."
                },
                {
                    level: "Nível 20",
                    name: "Coração da Floresta",
                    description:
                        "Sua essência mágica se expande, permitindo influenciar grandes áreas do campo de batalha."
                }
            ]
        },

        orc: {
            name: "Orc",
            difficulty: 2,

            description:
                "Os Orcs são um povo resistente, poderoso e profundamente ligado à tradição de seus clãs. Embora muitas vezes sejam vistos apenas como guerreiros brutais, também possuem cultura, honra e conhecimentos transmitidos entre gerações. Sua força física é acompanhada por uma enorme capacidade de sobrevivência.",

            hp: 800,
            mana: 0,
            points: 15,

            attributes: {
                FOR: 5,
                DEF: 4,
                RES: 3,
                INI: 1,
                INT: 1,
                ARC: 1
            },

            traits: [
                {
                    name: "Força do Clã",
                    description:
                        "O Orc causa mais impacto com ataques físicos e possui facilidade para quebrar defesas inimigas."
                },
                {
                    name: "Resistência Brutal",
                    description:
                        "Seu corpo continua lutando mesmo após receber ferimentos que derrubariam outras raças."
                }
            ],

            progression: [
                {
                    level: "Nível 1",
                    name: "Sangue Guerreiro",
                    description:
                        "O Orc inicia sua jornada com grande resistência e poder físico."
                },
                {
                    level: "Nível 20",
                    name: "Campeão do Clã",
                    description:
                        "O personagem torna-se um símbolo de força, inspirando aliados e intimidando inimigos."
                }
            ]
        }
    };

    /*==================================================
                    FUNÇÕES AUXILIARES
    ==================================================*/

    function createDifficultyStars(difficulty) {
        const filledStars = "★".repeat(difficulty);
        const emptyStars = "☆".repeat(5 - difficulty);

        return filledStars + emptyStars;
    }

    function formatMana(mana) {
        if (!mana || mana <= 0) {
            return "Não possui";
        }

        return `+${mana}`;
    }

    function formatAttribute(value) {
        if (value > 0) {
            return `+${value}`;
        }

        return String(value);
    }

    /*==================================================
                    CRIAÇÃO DOS ATRIBUTOS
    ==================================================*/

    function renderAttributes(attributes) {
        raceAttributes.innerHTML = "";

        Object.entries(attributes).forEach(([name, value]) => {
            const card = document.createElement("div");
            const attributeName = document.createElement("span");
            const attributeValue = document.createElement("strong");

            card.className = "attribute-card";

            attributeName.textContent = name;
            attributeValue.textContent = formatAttribute(value);

            card.appendChild(attributeName);
            card.appendChild(attributeValue);

            raceAttributes.appendChild(card);
        });
    }

    /*==================================================
                    CRIAÇÃO DOS TRAÇOS
    ==================================================*/

    function renderTraits(traits) {
        raceTraits.innerHTML = "";

        traits.forEach((trait) => {
            const card = document.createElement("article");
            const title = document.createElement("h4");
            const description = document.createElement("p");

            card.className = "trait-card";

            title.textContent = trait.name;
            description.textContent = trait.description;

            card.appendChild(title);
            card.appendChild(description);

            raceTraits.appendChild(card);
        });
    }

    /*==================================================
                    CRIAÇÃO DA PROGRESSÃO
    ==================================================*/

    function renderProgression(progression) {
        raceProgression.innerHTML = "";

        progression.forEach((stage) => {
            const card = document.createElement("article");
            const level = document.createElement("span");
            const content = document.createElement("div");
            const title = document.createElement("h4");
            const description = document.createElement("p");

            card.className = "progression-card";

            level.textContent = stage.level;
            title.textContent = stage.name;
            description.textContent = stage.description;

            content.appendChild(title);
            content.appendChild(description);

            card.appendChild(level);
            card.appendChild(content);

            raceProgression.appendChild(card);
        });
    }

    /*==================================================
                    ATUALIZAÇÃO DA RAÇA
    ==================================================*/

    function updateRace(raceId) {
        const race = races[raceId];

        if (!race) {
            console.warn(`A raça "${raceId}" não foi encontrada.`);
            return;
        }

        selectedRace = raceId;

        racePanel.classList.remove("updating");

        void racePanel.offsetWidth;

        racePanel.classList.add("updating");

        raceName.textContent = race.name;
        raceDifficulty.textContent =
            createDifficultyStars(race.difficulty);

        raceDescription.textContent = race.description;

        raceHp.textContent = race.hp;
        raceMana.textContent = formatMana(race.mana);
        racePoints.textContent = race.points;

        renderAttributes(race.attributes);
        renderTraits(race.traits);
        renderProgression(race.progression);

        raceSelectors.forEach((selector) => {
            const isSelected =
                selector.dataset.race === raceId;

            selector.classList.toggle(
                "active",
                isSelected
            );

            selector.setAttribute(
                "aria-pressed",
                String(isSelected)
            );
        });

        document.title =
            `${race.name} | Raças de Wonderland`;
    }

    /*==================================================
                    EVENTOS DAS RAÇAS
    ==================================================*/

    raceSelectors.forEach((selector) => {
        selector.addEventListener("click", () => {
            updateRace(selector.dataset.race);
        });
    });

    if (raceCount) {
        raceCount.textContent =
            `${Object.keys(races).length} raças`;
    }

    /*==================================================
                    SISTEMA DE MÚSICA
    ==================================================*/

    if (music) {
        music.volume = 0.25;

        const savedTime = Number(
            localStorage.getItem("wonderlandMusicTime")
        );

        function musicIsEnabled() {
            return (
                localStorage.getItem(
                    "wonderlandMusicEnabled"
                ) === "true"
            );
        }

        function saveMusicTime() {
            if (
                Number.isFinite(music.currentTime) &&
                music.currentTime >= 0
            ) {
                localStorage.setItem(
                    "wonderlandMusicTime",
                    String(music.currentTime)
                );
            }
        }

        function restoreMusicTime() {
            if (
                Number.isFinite(savedTime) &&
                savedTime > 0 &&
                Number.isFinite(music.duration) &&
                savedTime < music.duration
            ) {
                music.currentTime = savedTime;
            }
        }

        function updateMusicButton() {
            if (!musicButton || !musicIcon) {
                return;
            }

            const paused = music.paused;

            musicButton.classList.toggle(
                "paused",
                paused
            );

            musicIcon.textContent =
                paused ? "♪" : "♫";

            const label = paused
                ? "Tocar música"
                : "Pausar música";

            musicButton.setAttribute(
                "aria-label",
                label
            );

            musicButton.setAttribute(
                "title",
                label
            );
        }

        function removeUnlockListeners() {
            document.removeEventListener(
                "pointerdown",
                unlockMusic
            );

            document.removeEventListener(
                "keydown",
                unlockMusic
            );

            document.removeEventListener(
                "touchstart",
                unlockMusic
            );
        }

        function tryToPlayMusic() {
            if (
                !musicIsEnabled() ||
                !music.paused
            ) {
                return;
            }

            music.play()
                .then(() => {
                    updateMusicButton();
                    removeUnlockListeners();
                })
                .catch(() => {
                    /*
                     * O navegador aguardará
                     * a primeira interação.
                     */
                });
        }

        function unlockMusic() {
            if (
                !musicIsEnabled() ||
                !music.paused
            ) {
                removeUnlockListeners();
                return;
            }

            music.play()
                .then(() => {
                    updateMusicButton();
                    removeUnlockListeners();
                })
                .catch((error) => {
                    console.warn(
                        "A reprodução ainda foi bloqueada.",
                        error
                    );
                });
        }

        music.addEventListener(
            "loadedmetadata",
            () => {
                restoreMusicTime();
                tryToPlayMusic();
            }
        );

        if (music.readyState >= 1) {
            restoreMusicTime();
            tryToPlayMusic();
        }

        document.addEventListener(
            "pointerdown",
            unlockMusic
        );

        document.addEventListener(
            "touchstart",
            unlockMusic,
            {
                passive: true
            }
        );

        document.addEventListener(
            "keydown",
            unlockMusic
        );

        music.addEventListener(
            "play",
            () => {
                localStorage.setItem(
                    "wonderlandMusicEnabled",
                    "true"
                );

                updateMusicButton();
            }
        );

        music.addEventListener(
            "pause",
            updateMusicButton
        );

        music.addEventListener(
            "timeupdate",
            saveMusicTime
        );

        window.addEventListener(
            "pagehide",
            saveMusicTime
        );

        window.addEventListener(
            "beforeunload",
            saveMusicTime
        );

        if (musicButton) {
            musicButton.addEventListener(
                "click",
                (event) => {
                    event.stopPropagation();

                    if (music.paused) {
                        localStorage.setItem(
                            "wonderlandMusicEnabled",
                            "true"
                        );

                        music.play()
                            .catch((error) => {
                                console.error(
                                    "Não foi possível tocar a música.",
                                    error
                                );
                            });
                    } else {
                        music.pause();

                        localStorage.setItem(
                            "wonderlandMusicEnabled",
                            "false"
                        );

                        saveMusicTime();
                    }
                }
            );
        }

        updateMusicButton();
    }

    /*==================================================
                    ESTADO INICIAL
    ==================================================*/

    updateRace(selectedRace);
});