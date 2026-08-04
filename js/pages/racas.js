"use strict";

/* =========================================================
   WONDERLAND RPG — CÓDICE DAS RAÇAS V2
   Arquivo: js/pages/racas.js

   Responsabilidades:
   - Carregar os dados das raças
   - Criar a lista lateral
   - Controlar pesquisa
   - Selecionar a raça atual
   - Alterar o tema visual
   - Renderizar o Hero
   - Renderizar atributos
   - Controlar as abas
   - Renderizar o conteúdo
   - Controlar música
   - Criar partículas
   - Sincronizar URL e localStorage
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    /* =====================================================
       DADOS
       ===================================================== */

    const races = Array.isArray(window.WONDERLAND_RACES)
        ? window.WONDERLAND_RACES
        : [];

    /* =====================================================
       ESTADO
       ===================================================== */

    const state = {
        selectedRaceId: "",
        activeTab: "overview",
        search: "",
        transitioning: false
    };

    /* =====================================================
       ELEMENTOS
       ===================================================== */

    const elements = {
        body: document.body,

        raceView: document.getElementById("raceView"),
        raceHero: document.getElementById("raceHero"),

        raceList: document.getElementById("raceList"),
        raceCount: document.getElementById("raceCount"),

        raceSearch: document.getElementById("raceSearch"),
        clearRaceSearch: document.getElementById(
            "clearRaceSearch"
        ),

        raceArtwork: document.getElementById("raceArtwork"),
        raceEmblem: document.getElementById("raceEmblem"),

        raceArchetype: document.getElementById(
            "raceArchetype"
        ),

        raceName: document.getElementById("raceName"),
        raceTagline: document.getElementById("raceTagline"),

        raceDifficulty: document.getElementById(
            "raceDifficulty"
        ),

        raceDifficultyText: document.getElementById(
            "raceDifficultyText"
        ),

        raceRoles: document.getElementById("raceRoles"),
        raceHp: document.getElementById("raceHp"),
        raceMana: document.getElementById("raceMana"),

        attributeGrid: document.getElementById(
            "attributeGrid"
        ),

        raceContent: document.getElementById(
            "raceContent"
        ),

        tabs: [
            ...document.querySelectorAll(".race-tab")
        ],

        particles: document.getElementById("particles"),

        transition: document.getElementById(
            "raceTransition"
        ),

        music: document.getElementById("bgMusic"),
        musicButton: document.getElementById(
            "musicButton"
        ),
        musicIcon: document.getElementById("musicIcon"),

        raceModal: document.getElementById("raceModal"),
        raceModalBody: document.getElementById(
            "raceModalBody"
        ),
        raceModalClose: document.querySelector(
            ".race-modal-close"
        )
    };

    /* =====================================================
       CONSTANTES
       ===================================================== */

    const STORAGE_KEYS = {
        selectedRace: "wonderlandSelectedRace",
        activeTab: "wonderlandRaceActiveTab",
        musicEnabled: "wonderlandMusicEnabled",
        musicTime: "wonderlandMusicTime"
    };

    const ATTRIBUTE_ORDER = [
        "FOR",
        "DEF",
        "RES",
        "INI",
        "INT",
        "ARC"
    ];

    const ATTRIBUTE_NAMES = {
        FOR: "Força",
        DEF: "Defesa",
        RES: "Resistência",
        INI: "Iniciativa",
        INT: "Inteligência",
        ARC: "Arcano"
    };

    const DIFFICULTY_LABELS = {
        1: "Muito baixa",
        2: "Baixa",
        3: "Moderada",
        4: "Alta",
        5: "Muito alta"
    };

    const DEFAULT_ARTWORK =
        "assets/images/logo.png";

    /* =====================================================
       SEGURANÇA E UTILITÁRIOS
       ===================================================== */

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function normalizeText(value) {
        return String(value ?? "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    }

    function clamp(value, minimum, maximum) {
        return Math.min(
            Math.max(value, minimum),
            maximum
        );
    }

    function hexToRgb(hex) {
        const fallback = "214, 181, 107";

        const cleaned = String(hex || "")
            .trim()
            .replace("#", "");

        const normalized =
            cleaned.length === 3
                ? cleaned
                    .split("")
                    .map((character) => {
                        return character + character;
                    })
                    .join("")
                : cleaned;

        if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
            return fallback;
        }

        const number = Number.parseInt(
            normalized,
            16
        );

        return [
            (number >> 16) & 255,
            (number >> 8) & 255,
            number & 255
        ].join(", ");
    }

    function getDifficultyStars(difficulty) {
        const value = clamp(
            Number(difficulty) || 1,
            1,
            5
        );

        return (
            "★".repeat(value) +
            "☆".repeat(5 - value)
        );
    }

    function getCurrentRace() {
        return (
            races.find((race) => {
                return race.id === state.selectedRaceId;
            }) ||
            races[0] ||
            null
        );
    }

    function getRaceById(raceId) {
        return (
            races.find((race) => {
                return race.id === raceId;
            }) || null
        );
    }

    function getRaceArtwork(race) {
        const configuredArtwork =
            race.artwork ||
            race.image ||
            race.imagem ||
            "";

        if (configuredArtwork) {
            return configuredArtwork;
        }

        return `assets/images/races/${race.id}.webp`;
    }

    function setElementText(element, value) {
        if (!element) {
            return;
        }

        element.textContent =
            value === null ||
            value === undefined ||
            value === ""
                ? "—"
                : String(value);
    }

    /* =====================================================
       TEMA VISUAL
       ===================================================== */

    function applyRaceTheme(race) {
        if (!race) {
            return;
        }

        const accent =
            race?.theme?.accent || "#d6b56b";

        const secondary =
            race?.theme?.secondary || "#718a91";

        elements.body.style.setProperty(
            "--race-accent",
            accent
        );

        elements.body.style.setProperty(
            "--race-accent-rgb",
            hexToRgb(accent)
        );

        elements.body.style.setProperty(
            "--race-secondary",
            secondary
        );

        elements.body.style.setProperty(
            "--race-secondary-rgb",
            hexToRgb(secondary)
        );

        elements.body.dataset.race =
            race.id;
    }

    /* =====================================================
       FILTRO E PESQUISA
       ===================================================== */

    function getFilteredRaces() {
        const search =
            normalizeText(state.search);

        if (!search) {
            return [...races];
        }

        return races.filter((race) => {
            const searchableContent = [
                race.name,
                race.archetype,
                race.tagline,
                ...(race.roles || []),
                race?.playstyle?.main,
                race?.playstyle?.secondary,
                race?.playstyle?.strengths,
                race?.playstyle?.weaknesses,
                ...(race?.playstyle?.recommended || [])
            ].join(" ");

            return normalizeText(
                searchableContent
            ).includes(search);
        });
    }

    function updateClearSearchButton() {
        if (!elements.clearRaceSearch) {
            return;
        }

        const hasSearch =
            Boolean(state.search.trim());

        elements.clearRaceSearch.hidden =
            !hasSearch;

        elements.clearRaceSearch.setAttribute(
            "aria-hidden",
            String(!hasSearch)
        );
    }

    function clearSearch() {
        state.search = "";

        if (elements.raceSearch) {
            elements.raceSearch.value = "";
            elements.raceSearch.focus();
        }

        updateClearSearchButton();
        renderRaceList();
    }

    /* =====================================================
       LISTA LATERAL
       ===================================================== */

    function createRaceListButton(race) {
        const accent =
            race?.theme?.accent || "#d6b56b";

        const itemRgb =
            hexToRgb(accent);

        const button =
            document.createElement("button");

        button.type = "button";
        button.className = "race-list-button";
        button.dataset.raceId = race.id;

        button.style.setProperty(
            "--item-rgb",
            itemRgb
        );

        const isActive =
            race.id === state.selectedRaceId;

        button.classList.toggle(
            "active",
            isActive
        );

        button.setAttribute(
            "aria-pressed",
            String(isActive)
        );

        button.setAttribute(
            "aria-label",
            `Selecionar a raça ${race.name}`
        );

        button.innerHTML = `
            <span
                class="race-list-emblem"
                aria-hidden="true"
            >
                ${escapeHtml(race.icon || "✦")}
            </span>

            <span class="race-list-copy">
                <strong>
                    ${escapeHtml(race.name)}
                </strong>

                <small>
                    ${escapeHtml(
                        race.archetype ||
                        "Raça de Wonderland"
                    )}
                </small>
            </span>

            <span
                class="race-list-stars"
                aria-label="Dificuldade ${
                    race.difficulty || 1
                } de 5"
            >
                ${"★".repeat(
                    clamp(
                        Number(race.difficulty) || 1,
                        1,
                        5
                    )
                )}
            </span>
        `;

        button.addEventListener("click", () => {
            selectRace(race.id, {
                updateUrl: true,
                scroll: true,
                animate: true
            });
        });

        return button;
    }

    function renderRaceList() {
        if (!elements.raceList) {
            return;
        }

        const filteredRaces =
            getFilteredRaces();

        elements.raceList.innerHTML = "";

        if (!filteredRaces.length) {
            elements.raceList.innerHTML = `
                <div class="empty-state">
                    <strong>
                        Nenhuma raça encontrada.
                    </strong>

                    <p>
                        Tente pesquisar utilizando outro nome.
                    </p>
                </div>
            `;
        } else {
            const fragment =
                document.createDocumentFragment();

            filteredRaces.forEach((race, index) => {
                const button =
                    createRaceListButton(race);

                button.style.animationDelay =
                    `${Math.min(index * 35, 280)}ms`;

                fragment.appendChild(button);
            });

            elements.raceList.appendChild(
                fragment
            );
        }

        if (elements.raceCount) {
            elements.raceCount.textContent =
                `${filteredRaces.length} ${
                    filteredRaces.length === 1
                        ? "raça"
                        : "raças"
                }`;
        }
    }

    /* =====================================================
       HERO
       ===================================================== */

    function renderArtwork(race) {
        if (!elements.raceArtwork) {
            return;
        }

        const artwork =
            getRaceArtwork(race);

        elements.raceArtwork.alt =
            `Representação da raça ${race.name}`;

        elements.raceArtwork.src =
            artwork;

        elements.raceArtwork.onerror = () => {
            elements.raceArtwork.onerror = null;
            elements.raceArtwork.src =
                DEFAULT_ARTWORK;
            elements.raceArtwork.alt =
                "Símbolo de Wonderland";
        };
    }

    function renderRaceHero(race) {
        if (!race) {
            return;
        }

        renderArtwork(race);

        setElementText(
            elements.raceEmblem,
            race.icon || "✦"
        );

        setElementText(
            elements.raceArchetype,
            race.archetype ||
            "Raça de Wonderland"
        );

        setElementText(
            elements.raceName,
            race.name
        );

        setElementText(
            elements.raceTagline,
            race.tagline
        );

        const difficulty =
            clamp(
                Number(race.difficulty) || 1,
                1,
                5
            );

        setElementText(
            elements.raceDifficulty,
            getDifficultyStars(difficulty)
        );

        if (elements.raceDifficulty) {
            elements.raceDifficulty.setAttribute(
                "aria-label",
                `Dificuldade ${difficulty} de 5`
            );
        }

        setElementText(
            elements.raceDifficultyText,
            DIFFICULTY_LABELS[difficulty]
        );

        setElementText(
            elements.raceHp,
            race?.stats?.hp
        );

        setElementText(
            elements.raceMana,
            race?.stats?.mana
        );

        if (elements.raceRoles) {
            elements.raceRoles.innerHTML =
                (race.roles || [])
                    .map((role) => {
                        return `
                            <span class="role-tag">
                                ${escapeHtml(role)}
                            </span>
                        `;
                    })
                    .join("");
        }
    }

    /* =====================================================
       ATRIBUTOS
       ===================================================== */

    function calculateAttributePercentage(value) {
        const numericValue =
            Number(value) || 0;

        const maximumVisualValue = 5;

        return clamp(
            (numericValue / maximumVisualValue) * 100,
            0,
            100
        );
    }

    function renderAttributes(race) {
        if (!elements.attributeGrid) {
            return;
        }

        const attributes =
            race?.stats?.attributes || {};

        elements.attributeGrid.innerHTML =
            ATTRIBUTE_ORDER.map((attribute) => {
                const value =
                    Number(attributes[attribute]) || 0;

                const percentage =
                    calculateAttributePercentage(value);

                return `
                    <article
                        class="attribute-card"
                        style="
                            --attribute-value:
                            ${percentage}%;
                        "
                        title="${
                            ATTRIBUTE_NAMES[attribute]
                        }: +${value}"
                    >
                        <span>
                            ${attribute}
                        </span>

                        <strong
                            data-attribute-value="${value}"
                        >
                            +0
                        </strong>
                    </article>
                `;
            }).join("");

        animateAttributeNumbers();
    }

    function animateAttributeNumbers() {
        if (
            window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches
        ) {
            elements.attributeGrid
                ?.querySelectorAll(
                    "[data-attribute-value]"
                )
                .forEach((element) => {
                    element.textContent =
                        `+${
                            element.dataset.attributeValue
                        }`;
                });

            return;
        }

        elements.attributeGrid
            ?.querySelectorAll(
                "[data-attribute-value]"
            )
            .forEach((element, index) => {
                const target =
                    Number(
                        element.dataset.attributeValue
                    ) || 0;

                let current = 0;

                const delay =
                    index * 55;

                window.setTimeout(() => {
                    const interval =
                        window.setInterval(() => {
                            current += 1;

                            element.textContent =
                                `+${current}`;

                            if (current >= target) {
                                window.clearInterval(
                                    interval
                                );
                            }
                        }, 55);
                }, delay);
            });
    }

    /* =====================================================
       CABEÇALHOS DO CONTEÚDO
       ===================================================== */

    function createSectionHeading(
        kicker,
        title,
        lead = ""
    ) {
        return `
            <header class="section-heading">

                <div class="section-kicker">
                    ${escapeHtml(kicker)}
                </div>

                <h3 class="section-title">
                    ${escapeHtml(title)}
                </h3>

                ${
                    lead
                        ? `
                            <p class="section-lead">
                                ${escapeHtml(lead)}
                            </p>
                        `
                        : ""
                }

            </header>
        `;
    }

    /* =====================================================
       VISÃO GERAL
       ===================================================== */

    function renderOverview(race) {
        const descriptions =
            Array.isArray(race.description)
                ? race.description
                : [];

        const descriptionHtml =
            descriptions
                .map((paragraph) => {
                    return `
                        <p>
                            ${escapeHtml(paragraph)}
                        </p>
                    `;
                })
                .join("");

        const recommended =
            Array.isArray(
                race?.playstyle?.recommended
            )
                ? race.playstyle.recommended
                : [];

        const recommendedHtml =
            recommended
                .map((attribute) => {
                    return `
                        <span class="recommended-tag">
                            ${escapeHtml(attribute)}
                        </span>
                    `;
                })
                .join("");

        return `
            ${createSectionHeading(
                "Origem e cultura",
                `Conheça os ${race.name}`,
                race.tagline
            )}

            <div class="overview-grid">

                <article class="lore-card">

                    ${
                        descriptionHtml ||
                        `
                            <p>
                                Nenhuma descrição registrada.
                            </p>
                        `
                    }

                </article>

                <aside class="playstyle-card">

                    <h4 class="card-title">
                        Estilo de jogo
                    </h4>

                    <div class="playstyle-list">

                        ${createPlaystyleRow(
                            "Função principal",
                            race?.playstyle?.main
                        )}

                        ${createPlaystyleRow(
                            "Funções secundárias",
                            race?.playstyle?.secondary
                        )}

                        ${createPlaystyleRow(
                            "Pontos fortes",
                            race?.playstyle?.strengths
                        )}

                        ${createPlaystyleRow(
                            "Pontos fracos",
                            race?.playstyle?.weaknesses
                        )}

                        <div class="playstyle-row">

                            <span>
                                Atributos recomendados
                            </span>

                            <div class="recommended-tags">

                                ${
                                    recommendedHtml ||
                                    `
                                        <span
                                            class="recommended-tag"
                                        >
                                            Dependem da classe
                                        </span>
                                    `
                                }

                            </div>

                        </div>

                    </div>

                </aside>

            </div>
        `;
    }

    function createPlaystyleRow(label, value) {
        return `
            <div class="playstyle-row">

                <span>
                    ${escapeHtml(label)}
                </span>

                <strong>
                    ${escapeHtml(value || "—")}
                </strong>

            </div>
        `;
    }

    /* =====================================================
       MECÂNICAS
       ===================================================== */

    function renderMechanics(race) {
        const mechanics =
            Array.isArray(race.mechanics)
                ? race.mechanics
                : [];

        const mechanicsHtml =
            mechanics
                .map((mechanic) => {
                    return `
                        <article class="info-card">

                            <h3>
                                ${escapeHtml(
                                    mechanic.title
                                )}
                            </h3>

                            ${
                                mechanic.content ||
                                "<p>Sem descrição.</p>"
                            }

                        </article>
                    `;
                })
                .join("");

        return `
            ${createSectionHeading(
                "Sistema racial",
                "Mecânicas",
                "Recursos, estados e regras que definem a identidade da raça durante o combate."
            )}

            <div class="info-grid">

                ${
                    mechanicsHtml ||
                    createEmptyState(
                        "Nenhuma mecânica racial registrada."
                    )
                }

            </div>
        `;
    }

    /* =====================================================
       TRAÇOS
       ===================================================== */

    function renderTraits(race) {
        const traits =
            Array.isArray(race.traits)
                ? race.traits
                : [];

        const traitsHtml =
            traits
                .map((trait) => {
                    return `
                        <article class="trait-card">

                            <span class="trait-label">
                                ${escapeHtml(
                                    trait.label ||
                                    "Traço racial"
                                )}
                            </span>

                            <h3>
                                ${escapeHtml(
                                    trait.title
                                )}
                            </h3>

                            ${
                                trait.content ||
                                "<p>Sem descrição.</p>"
                            }

                        </article>
                    `;
                })
                .join("");

        const weaknessHtml =
            race.weakness
                ? `
                    <article class="weakness-card">

                        <span class="trait-label">
                            Fraqueza racial
                        </span>

                        <h3>
                            ${escapeHtml(
                                race.weakness.title
                            )}
                        </h3>

                        ${
                            race.weakness.content ||
                            "<p>Sem descrição.</p>"
                        }

                    </article>
                `
                : "";

        return `
            ${createSectionHeading(
                "Características permanentes",
                "Traços Raciais",
                "Passivas, resistências, limitações e características que acompanham o personagem."
            )}

            <div class="traits-grid">

                ${
                    traitsHtml ||
                    createEmptyState(
                        "Nenhum traço racial registrado."
                    )
                }

                ${weaknessHtml}

            </div>
        `;
    }

    /* =====================================================
       PROGRESSÃO
       ===================================================== */

    function renderProgression(race) {
        const progression =
            Array.isArray(race.progression)
                ? race.progression
                : [];

        const progressionHtml =
            progression
                .map((skill, index) => {
                    const metadata =
                        Array.isArray(skill.meta)
                            ? skill.meta
                            : [];

                    const metaHtml =
                        metadata
                            .filter(Boolean)
                            .map((item) => {
                                return `
                                    <span>
                                        ${escapeHtml(item)}
                                    </span>
                                `;
                            })
                            .join("");

                    return `
                        <details
                            class="skill-card"
                            ${index === 0 ? "open" : ""}
                        >

                            <summary class="skill-summary">

                                <span class="skill-level">
                                    Nível
                                    <br>
                                    ${escapeHtml(skill.level)}
                                </span>

                                <span class="skill-title-wrap">

                                    <small>
                                        ${escapeHtml(
                                            skill.category ||
                                            "Habilidade racial"
                                        )}
                                    </small>

                                    <strong>
                                        ${escapeHtml(
                                            skill.name
                                        )}
                                    </strong>

                                </span>

                                <span
                                    class="skill-toggle"
                                    aria-hidden="true"
                                >
                                    ＋
                                </span>

                            </summary>

                            <div class="skill-body">

                                ${
                                    skill.content ||
                                    "<p>Sem descrição.</p>"
                                }

                                ${
                                    metaHtml
                                        ? `
                                            <div class="skill-meta">
                                                ${metaHtml}
                                            </div>
                                        `
                                        : ""
                                }

                            </div>

                        </details>
                    `;
                })
                .join("");

        return `
            ${createSectionHeading(
                "Evolução racial",
                "Progressão de Níveis",
                "As habilidades raciais são desbloqueadas nos níveis 1, 20, 40, 60, 80 e 100."
            )}

            <div class="progression-list">

                ${
                    progressionHtml ||
                    createEmptyState(
                        "Nenhuma habilidade racial registrada."
                    )
                }

            </div>
        `;
    }

    /* =====================================================
       CURIOSIDADES
       ===================================================== */

    function renderCuriosities(race) {
        const curiosities =
            Array.isArray(race.curiosities)
                ? race.curiosities
                : [];

        const curiositiesHtml =
            curiosities
                .map((curiosity) => {
                    return `
                        <article class="curiosity-card">

                            <p>
                                ${escapeHtml(curiosity)}
                            </p>

                        </article>
                    `;
                })
                .join("");

        return `
            ${createSectionHeading(
                "Costumes e detalhes",
                "Curiosidades",
                "Informações culturais, biológicas e históricas para ajudar na criação e interpretação do personagem."
            )}

            <div class="curiosity-grid">

                ${
                    curiositiesHtml ||
                    createEmptyState(
                        "Nenhuma curiosidade registrada."
                    )
                }

            </div>
        `;
    }

    /* =====================================================
       ESTADOS VAZIOS
       ===================================================== */

    function createEmptyState(message) {
        return `
            <div class="empty-state">
                ${escapeHtml(message)}
            </div>
        `;
    }

    /* =====================================================
       CONTEÚDO DA ABA
       ===================================================== */

    function renderActiveTab() {
        const race =
            getCurrentRace();

        if (!race || !elements.raceContent) {
            return;
        }

        const renderers = {
            overview: renderOverview,
            mechanics: renderMechanics,
            traits: renderTraits,
            progression: renderProgression,
            curiosities: renderCuriosities
        };

        const renderer =
            renderers[state.activeTab] ||
            renderOverview;

        elements.raceContent.innerHTML = `
            <div class="content-enter">
                ${renderer(race)}
            </div>
        `;

        elements.raceContent.setAttribute(
            "aria-labelledby",
            `${state.activeTab}Tab`
        );
    }

    /* =====================================================
       ABAS
       ===================================================== */

    function updateTabs() {
        elements.tabs.forEach((tab) => {
            const isActive =
                tab.dataset.tab === state.activeTab;

            tab.classList.toggle(
                "active",
                isActive
            );

            tab.setAttribute(
                "aria-selected",
                String(isActive)
            );

            tab.tabIndex =
                isActive ? 0 : -1;
        });
    }

    function selectTab(tabId, options = {}) {
        const validTabs = [
            "overview",
            "mechanics",
            "traits",
            "progression",
            "curiosities"
        ];

        if (!validTabs.includes(tabId)) {
            return;
        }

        state.activeTab = tabId;

        localStorage.setItem(
            STORAGE_KEYS.activeTab,
            tabId
        );

        updateTabs();
        renderActiveTab();

        if (options.focus) {
            const selectedTab =
                elements.tabs.find((tab) => {
                    return tab.dataset.tab === tabId;
                });

            selectedTab?.focus();
        }
    }

    function setupTabs() {
        elements.tabs.forEach((tab, index) => {
            tab.addEventListener("click", () => {
                selectTab(tab.dataset.tab);
            });

            tab.addEventListener(
                "keydown",
                (event) => {
                    if (
                        event.key !== "ArrowLeft" &&
                        event.key !== "ArrowRight"
                    ) {
                        return;
                    }

                    event.preventDefault();

                    const direction =
                        event.key === "ArrowRight"
                            ? 1
                            : -1;

                    const nextIndex =
                        (
                            index +
                            direction +
                            elements.tabs.length
                        ) %
                        elements.tabs.length;

                    selectTab(
                        elements.tabs[nextIndex]
                            .dataset.tab,
                        {
                            focus: true
                        }
                    );
                }
            );
        });
    }

    /* =====================================================
       TRANSIÇÃO DE RAÇA
       ===================================================== */

    function showTransition() {
        if (!elements.transition) {
            return;
        }

        elements.transition.classList.add(
            "active"
        );
    }

    function hideTransition() {
        if (!elements.transition) {
            return;
        }

        elements.transition.classList.remove(
            "active"
        );
    }

    async function performRaceTransition(callback) {
        if (
            state.transitioning ||
            window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches
        ) {
            callback();
            return;
        }

        state.transitioning = true;

        showTransition();

        await new Promise((resolve) => {
            window.setTimeout(resolve, 180);
        });

        callback();

        await new Promise((resolve) => {
            window.setTimeout(resolve, 120);
        });

        hideTransition();

        window.setTimeout(() => {
            state.transitioning = false;
        }, 260);
    }

    /* =====================================================
       SELEÇÃO DA RAÇA
       ===================================================== */

    function updateUrl(raceId) {
        const newHash =
            `#${encodeURIComponent(raceId)}`;

        if (window.location.hash === newHash) {
            return;
        }

        history.replaceState(
            {
                raceId
            },
            "",
            newHash
        );
    }

    function scrollToRaceView() {
        if (
            window.innerWidth > 1020 ||
            !elements.raceView
        ) {
            return;
        }

        elements.raceView.scrollIntoView({
            behavior:
                window.matchMedia(
                    "(prefers-reduced-motion: reduce)"
                ).matches
                    ? "auto"
                    : "smooth",
            block: "start"
        });
    }function renderSelectedRace(race) {

    const hero = elements.raceHero;

    if (!hero) {
        applyRaceTheme(race);
        renderRaceHero(race);
        renderAttributes(race);
        renderRaceList();
        renderActiveTab();
        return;
    }

    hero.classList.remove("hero-show");
    hero.classList.add("hero-hide");

    requestAnimationFrame(() => {

        applyRaceTheme(race);

        renderRaceHero(race);

        renderAttributes(race);

        renderRaceList();

        renderActiveTab();

        hero.classList.remove("hero-hide");
        hero.classList.add("hero-show");

    });

}

    function selectRace(raceId, options = {}) {
        const race =
            getRaceById(raceId);

        if (!race) {
            return;
        }

        const selectionAction = () => {
            state.selectedRaceId =
                race.id;

            localStorage.setItem(
                STORAGE_KEYS.selectedRace,
                race.id
            );

            if (options.updateUrl) {
                updateUrl(race.id);
            }

            renderSelectedRace(race);

            if (options.scroll) {
                scrollToRaceView();
            }
        };

        if (options.animate) {
            performRaceTransition(
                selectionAction
            );
        } else {
            selectionAction();
        }
    }

    /* =====================================================
       PESQUISA
       ===================================================== */

    function setupSearch() {
        if (!elements.raceSearch) {
            return;
        }

        elements.raceSearch.addEventListener(
            "input",
            (event) => {
                state.search =
                    event.target.value;

                updateClearSearchButton();
                renderRaceList();
            }
        );

        elements.raceSearch.addEventListener(
            "keydown",
            (event) => {
                if (event.key === "Escape") {
                    clearSearch();
                }

                if (event.key === "Enter") {
                    const firstRace =
                        getFilteredRaces()[0];

                    if (firstRace) {
                        selectRace(firstRace.id, {
                            updateUrl: true,
                            scroll: true,
                            animate: true
                        });
                    }
                }
            }
        );

        elements.clearRaceSearch?.addEventListener(
            "click",
            clearSearch
        );

        updateClearSearchButton();
    }

    /* =====================================================
       PARTÍCULAS
       ===================================================== */

    function createParticle(index) {
        const particle =
            document.createElement("span");

        const size =
            1 + Math.random() * 3;

        particle.className =
            "race-particle";

        particle.style.left =
            `${Math.random() * 100}%`;

        particle.style.width =
            `${size}px`;

        particle.style.height =
            `${size}px`;

        particle.style.animationDuration =
            `${13 + Math.random() * 18}s`;

        particle.style.animationDelay =
            `${-Math.random() * 24}s`;

        particle.style.setProperty(
            "--drift",
            `${-80 + Math.random() * 160}px`
        );

        particle.dataset.particleIndex =
            String(index);

        return particle;
    }

    function setupParticles() {
        if (!elements.particles) {
            return;
        }

        elements.particles.innerHTML = "";

        const amount =
            window.innerWidth <= 780
                ? 20
                : 40;

        const fragment =
            document.createDocumentFragment();

        for (
            let index = 0;
            index < amount;
            index += 1
        ) {
            fragment.appendChild(
                createParticle(index)
            );
        }

        elements.particles.appendChild(
            fragment
        );
    }

    /* =====================================================
       MÚSICA
       ===================================================== */

    function setupMusic() {
        const music =
            elements.music;

        const button =
            elements.musicButton;

        const icon =
            elements.musicIcon;

        if (!music || !button || !icon) {
            return;
        }

        music.volume = 0.25;

        function isEnabled() {
            return (
                localStorage.getItem(
                    STORAGE_KEYS.musicEnabled
                ) === "true"
            );
        }

        function saveCurrentTime() {
            if (
                Number.isFinite(
                    music.currentTime
                )
            ) {
                localStorage.setItem(
                    STORAGE_KEYS.musicTime,
                    String(music.currentTime)
                );
            }
        }

        function restoreCurrentTime() {
            const savedTime =
                Number(
                    localStorage.getItem(
                        STORAGE_KEYS.musicTime
                    ) || 0
                );

            if (
                savedTime > 0 &&
                Number.isFinite(
                    music.duration
                ) &&
                savedTime < music.duration
            ) {
                music.currentTime =
                    savedTime;
            }
        }

        function updateButton() {
            const isPlaying =
                !music.paused;

            button.classList.toggle(
                "playing",
                isPlaying
            );

            icon.textContent =
                isPlaying ? "♫" : "♪";

            const label =
                isPlaying
                    ? "Pausar música"
                    : "Tocar música";

            button.setAttribute(
                "aria-label",
                label
            );

            button.setAttribute(
                "title",
                label
            );
        }

        function attemptPlay() {
            if (
                !isEnabled() ||
                !music.paused
            ) {
                return;
            }

            music.play().catch(() => {
                updateButton();
            });
        }

        music.addEventListener(
            "loadedmetadata",
            () => {
                restoreCurrentTime();
                attemptPlay();
            }
        );

        music.addEventListener(
            "play",
            () => {
                localStorage.setItem(
                    STORAGE_KEYS.musicEnabled,
                    "true"
                );

                updateButton();
            }
        );

        music.addEventListener(
            "pause",
            updateButton
        );

        music.addEventListener(
            "timeupdate",
            saveCurrentTime
        );

        button.addEventListener(
            "click",
            () => {
                if (music.paused) {
                    localStorage.setItem(
                        STORAGE_KEYS.musicEnabled,
                        "true"
                    );

                    music.play().catch(() => {
                        updateButton();
                    });
                } else {
                    music.pause();

                    localStorage.setItem(
                        STORAGE_KEYS.musicEnabled,
                        "false"
                    );

                    saveCurrentTime();
                }
            }
        );

        window.addEventListener(
            "pagehide",
            saveCurrentTime
        );

        const unlockMusic = () => {
            attemptPlay();

            document.removeEventListener(
                "pointerdown",
                unlockMusic
            );

            document.removeEventListener(
                "keydown",
                unlockMusic
            );
        };

        document.addEventListener(
            "pointerdown",
            unlockMusic
        );

        document.addEventListener(
            "keydown",
            unlockMusic
        );

        if (music.readyState >= 1) {
            restoreCurrentTime();
            attemptPlay();
        }

        updateButton();
    }

    /* =====================================================
       MODAL
       ===================================================== */

    function setupModal() {
        if (!elements.raceModal) {
            return;
        }

        elements.raceModalClose?.addEventListener(
            "click",
            () => {
                elements.raceModal.close();
            }
        );

        elements.raceModal.addEventListener(
            "click",
            (event) => {
                if (
                    event.target ===
                    elements.raceModal
                ) {
                    elements.raceModal.close();
                }
            }
        );
    }

    /* =====================================================
       NAVEGAÇÃO PELO HASH
       ===================================================== */

    function setupHashNavigation() {
        window.addEventListener(
            "hashchange",
            () => {
                const raceId =
                    decodeURIComponent(
                        window.location.hash
                            .replace("#", "")
                    );

                if (!getRaceById(raceId)) {
                    return;
                }

                selectRace(raceId, {
                    updateUrl: false,
                    scroll: false,
                    animate: true
                });
            }
        );
    }

    /* =====================================================
       ERRO DE DADOS
       ===================================================== */

    function showDataError() {
        if (elements.raceList) {
            elements.raceList.innerHTML = `
                <div class="empty-state">
                    Os dados das raças não foram carregados.
                </div>
            `;
        }

        if (elements.raceContent) {
            elements.raceContent.innerHTML = `
                <section class="race-empty">

                    <div class="race-empty-symbol">
                        ⚠
                    </div>

                    <h2>
                        Códice indisponível
                    </h2>

                    <p>
                        Confirme se
                        <strong>
                            js/data/racas-data.js
                        </strong>
                        está sendo carregado antes de
                        <strong>
                            js/pages/racas.js
                        </strong>.
                    </p>

                </section>
            `;
        }

        if (elements.raceCount) {
            elements.raceCount.textContent =
                "0 raças";
        }
    }

    /* =====================================================
       VALIDAÇÃO DOS ELEMENTOS
       ===================================================== */

    function validateRequiredElements() {
        const required = [
            "raceList",
            "raceContent",
            "raceName",
            "attributeGrid"
        ];

        const missing =
            required.filter((key) => {
                return !elements[key];
            });

        if (!missing.length) {
            return true;
        }

        console.error(
            "[Wonderland Raças] Elementos ausentes:",
            missing
        );

        return false;
    }

    /* =====================================================
       INICIALIZAÇÃO
       ===================================================== */

    function getInitialRaceId() {
        const hashRaceId =
            decodeURIComponent(
                window.location.hash
                    .replace("#", "")
            );

        const savedRaceId =
            localStorage.getItem(
                STORAGE_KEYS.selectedRace
            );

        if (getRaceById(hashRaceId)) {
            return hashRaceId;
        }

        if (getRaceById(savedRaceId)) {
            return savedRaceId;
        }

        return races[0]?.id || "";
    }

    function getInitialTab() {
        const savedTab =
            localStorage.getItem(
                STORAGE_KEYS.activeTab
            );

        const validTabs =
            elements.tabs.map((tab) => {
                return tab.dataset.tab;
            });

        return validTabs.includes(savedTab)
            ? savedTab
            : "overview";
    }

    function initialize() {
        if (!validateRequiredElements()) {
            return;
        }

        setupTabs();
        setupSearch();
        setupParticles();
        setupMusic();
        setupModal();
        setupHashNavigation();

        if (!races.length) {
            showDataError();
            return;
        }

        state.activeTab =
            getInitialTab();

        state.selectedRaceId =
            getInitialRaceId();

        updateTabs();

        selectRace(
            state.selectedRaceId,
            {
                updateUrl:
                    Boolean(
                        window.location.hash
                    ),
                scroll: false,
                animate: false
            }
        );
    }

    initialize();
});