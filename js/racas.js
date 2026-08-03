"use strict";

/* =========================================================
   CÓDICE DE RAÇAS — WONDERLAND
   Responsável pela interface e pelo funcionamento da página.
   Os conteúdos das raças ficam em js/racas-data.js.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    const races = Array.isArray(window.WONDERLAND_RACES)
        ? window.WONDERLAND_RACES
        : [];

    const state = {
        raceId: "",
        tab: "overview",
        search: ""
    };

    const elements = {
        body: document.body,

        raceList: document.getElementById("raceList"),
        raceSearch: document.getElementById("raceSearch"),
        raceCount: document.getElementById("raceCount"),

        raceHero: document.getElementById("raceHero"),
        raceEmblem: document.getElementById("raceEmblem"),
        raceArchetype: document.getElementById("raceArchetype"),
        raceName: document.getElementById("raceName"),
        raceTagline: document.getElementById("raceTagline"),
        raceDifficulty: document.getElementById("raceDifficulty"),
        raceDifficultyText: document.getElementById(
            "raceDifficultyText"
        ),
        raceRoles: document.getElementById("raceRoles"),
        raceHp: document.getElementById("raceHp"),
        raceMana: document.getElementById("raceMana"),

        attributeGrid: document.getElementById("attributeGrid"),
        raceContent: document.getElementById("raceContent"),

        tabs: [
            ...document.querySelectorAll(".race-tab")
        ],

        music: document.getElementById("bgMusic"),
        musicButton: document.getElementById("musicButton"),
        musicIcon: document.getElementById("musicIcon"),

        particles: document.getElementById("particles")
    };

    const difficultyLabels = {
        1: "Muito baixa",
        2: "Baixa",
        3: "Moderada",
        4: "Alta",
        5: "Muito alta"
    };

    /* =====================================================
       FUNÇÕES DE APOIO
       ===================================================== */

    function normalizeText(value) {
        return String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function currentRace() {
        return (
            races.find(
                (race) => race.id === state.raceId
            ) || races[0]
        );
    }

    function hexToRgb(hex) {
        const cleaned = String(hex || "#d6b56b")
            .replace("#", "");

        const normalized =
            cleaned.length === 3
                ? cleaned
                    .split("")
                    .map((character) => character + character)
                    .join("")
                : cleaned;

        const number = Number.parseInt(
            normalized,
            16
        );

        if (Number.isNaN(number)) {
            return "214, 181, 107";
        }

        return [
            (number >> 16) & 255,
            (number >> 8) & 255,
            number & 255
        ].join(", ");
    }

    function setRaceTheme(race) {
        const accent =
            race?.theme?.accent || "#d6b56b";

        const secondary =
            race?.theme?.secondary || "#6e829a";

        elements.body.style.setProperty(
            "--race-accent",
            accent
        );

        elements.body.style.setProperty(
            "--race-accent-2",
            secondary
        );

        elements.body.style.setProperty(
            "--race-accent-rgb",
            hexToRgb(accent)
        );
    }

    function getDifficultyStars(difficulty) {
        const value = Math.max(
            1,
            Math.min(5, Number(difficulty) || 1)
        );

        return (
            "★".repeat(value) +
            "☆".repeat(5 - value)
        );
    }

    function scrollToRaceView() {
        if (window.innerWidth > 960) {
            return;
        }

        const raceView =
            document.querySelector(".race-view");

        if (!raceView) {
            return;
        }

        raceView.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    /* =====================================================
       LISTA DE RAÇAS
       ===================================================== */

    function renderRaceList() {
        const search =
            normalizeText(state.search);

        const filteredRaces =
            races.filter((race) => {
                const searchableContent = [
                    race.name,
                    race.archetype,
                    ...(race.roles || []),
                    race?.playstyle?.main,
                    race?.playstyle?.secondary,
                    race?.playstyle?.strengths
                ].join(" ");

                return normalizeText(
                    searchableContent
                ).includes(search);
            });

        elements.raceList.innerHTML = "";

        filteredRaces.forEach((race) => {
            const accent =
                race?.theme?.accent || "#d6b56b";

            const itemRgb =
                hexToRgb(accent);

            const button =
                document.createElement("button");

            button.type = "button";

            button.className =
                "race-list-button";

            button.dataset.race =
                race.id;

            button.style.setProperty(
                "--item-rgb",
                itemRgb
            );

            button.classList.toggle(
                "active",
                race.id === state.raceId
            );

            button.setAttribute(
                "aria-label",
                `Selecionar ${race.name}`
            );

            button.innerHTML = `
                <span
                    class="race-list-emblem"
                    aria-hidden="true"
                >
                    ${race.icon || "✦"}
                </span>

                <span class="race-list-copy">
                    <strong>
                        ${escapeHtml(race.name)}
                    </strong>

                    <small>
                        ${escapeHtml(race.archetype)}
                    </small>
                </span>

                <span
                    class="race-list-stars"
                    aria-label="Dificuldade ${race.difficulty} de 5"
                >
                    ${"★".repeat(race.difficulty)}
                </span>
            `;

            button.addEventListener(
                "click",
                () => {
                    selectRace(
                        race.id,
                        true
                    );
                }
            );

            elements.raceList.appendChild(
                button
            );
        });

        elements.raceCount.textContent =
            `${filteredRaces.length} ${
                filteredRaces.length === 1
                    ? "raça"
                    : "raças"
            }`;

        if (!filteredRaces.length) {
            elements.raceList.innerHTML = `
                <div class="empty-state">
                    Nenhuma raça encontrada.
                </div>
            `;
        }
    }

    /* =====================================================
       CABEÇALHO DA RAÇA
       ===================================================== */

    function renderRaceHero(race) {
        elements.raceEmblem.textContent =
            race.icon || "✦";

        elements.raceArchetype.textContent =
            race.archetype || "Raça de Wonderland";

        elements.raceName.textContent =
            race.name || "Raça";

        elements.raceTagline.textContent =
            race.tagline || "";

        elements.raceDifficulty.textContent =
            getDifficultyStars(
                race.difficulty
            );

        elements.raceDifficulty.setAttribute(
            "aria-label",
            `Dificuldade ${race.difficulty} de 5`
        );

        elements.raceDifficultyText.textContent =
            difficultyLabels[
                race.difficulty
            ] || "—";

        elements.raceHp.textContent =
            race?.stats?.hp ?? "—";

        elements.raceMana.textContent =
            race?.stats?.mana ?? "—";

        elements.raceRoles.innerHTML =
            (race.roles || [])
                .map(
                    (role) => `
                        <span class="role-tag">
                            ${escapeHtml(role)}
                        </span>
                    `
                )
                .join("");

        renderAttributes(race);
    }

    function renderAttributes(race) {
        const attributes =
            race?.stats?.attributes || {};

        const order = [
            "FOR",
            "DEF",
            "RES",
            "INI",
            "INT",
            "ARC"
        ];

        elements.attributeGrid.innerHTML =
            order.map((attribute) => {
                const value =
                    attributes[attribute] ?? 0;

                return `
                    <article class="attribute-card">
                        <span>
                            ${attribute}
                        </span>

                        <strong>
                            +${value}
                        </strong>
                    </article>
                `;
            }).join("");
    }

    /* =====================================================
       CABEÇALHO DAS SEÇÕES
       ===================================================== */

    function createSectionHeading(
        kicker,
        title,
        lead
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
        const description =
            Array.isArray(race.description)
                ? race.description
                : [];

        const paragraphs =
            description
                .map(
                    (paragraph) => `
                        <p>
                            ${escapeHtml(paragraph)}
                        </p>
                    `
                )
                .join("");

        const recommended =
            race?.playstyle?.recommended || [];

        const recommendedTags =
            recommended
                .map(
                    (attribute) => `
                        <span class="recommended-tag">
                            ${escapeHtml(attribute)}
                        </span>
                    `
                )
                .join("");

        return `
            ${createSectionHeading(
                "Origem e cultura",
                `Conheça os ${race.name}`,
                race.tagline
            )}

            <div class="overview-grid">

                <article class="lore-card">
                    ${paragraphs}
                </article>

                <aside class="playstyle-card">

                    <h4 class="card-title">
                        Estilo de Jogo
                    </h4>

                    <div class="playstyle-list">

                        <div class="playstyle-row">
                            <span>
                                Função principal
                            </span>

                            <strong>
                                ${escapeHtml(
                                    race?.playstyle?.main
                                )}
                            </strong>
                        </div>

                        <div class="playstyle-row">
                            <span>
                                Funções secundárias
                            </span>

                            <strong>
                                ${escapeHtml(
                                    race?.playstyle?.secondary
                                )}
                            </strong>
                        </div>

                        <div class="playstyle-row">
                            <span>
                                Pontos fortes
                            </span>

                            <strong>
                                ${escapeHtml(
                                    race?.playstyle?.strengths
                                )}
                            </strong>
                        </div>

                        <div class="playstyle-row">
                            <span>
                                Pontos fracos
                            </span>

                            <strong>
                                ${escapeHtml(
                                    race?.playstyle?.weaknesses
                                )}
                            </strong>
                        </div>

                        <div class="playstyle-row">
                            <span>
                                Atributos recomendados
                            </span>

                            <div class="recommended-tags">
                                ${recommendedTags}
                            </div>
                        </div>

                    </div>

                </aside>

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

        const cards =
            mechanics
                .map(
                    (mechanic) => `
                        <article class="info-card">

                            <h3>
                                ${escapeHtml(
                                    mechanic.title
                                )}
                            </h3>

                            ${mechanic.content || ""}

                        </article>
                    `
                )
                .join("");

        return `
            ${createSectionHeading(
                "Sistema racial",
                "Mecânicas",
                "Recursos, estados e regras que definem a identidade da raça durante o combate."
            )}

            <div class="info-grid">
                ${
                    cards ||
                    `
                        <div class="empty-state">
                            Esta raça não possui uma mecânica
                            especial registrada.
                        </div>
                    `
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

        const cards =
            traits
                .map(
                    (trait) => `
                        <article class="trait-card">

                            <span class="trait-label">
                                ${escapeHtml(
                                    trait.label
                                )}
                            </span>

                            <h3>
                                ${escapeHtml(
                                    trait.title
                                )}
                            </h3>

                            ${trait.content || ""}

                        </article>
                    `
                )
                .join("");

        const weakness =
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
                            ""
                        }

                    </article>
                `
                : "";

        return `
            ${createSectionHeading(
                "Características permanentes",
                "Traços Raciais",
                "Passivas, resistências e limitações que acompanham o personagem durante toda a jornada."
            )}

            <div class="traits-grid">

                ${
                    cards ||
                    `
                        <div class="empty-state">
                            Nenhum traço racial registrado.
                        </div>
                    `
                }

                ${weakness}

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

        const skills =
            progression
                .map(
                    (skill, index) => {
                        const metadata =
                            Array.isArray(skill.meta)
                                ? skill.meta
                                : [];

                        const metaHtml =
                            metadata
                                .filter(Boolean)
                                .map(
                                    (item) => `
                                        <span>
                                            ${escapeHtml(item)}
                                        </span>
                                    `
                                )
                                .join("");

                        return `
                            <details
                                class="skill-card"
                                ${
                                    index === 0
                                        ? "open"
                                        : ""
                                }
                            >

                                <summary class="skill-summary">

                                    <span class="skill-level">
                                        Nível
                                        <br>
                                        ${skill.level}
                                    </span>

                                    <span class="skill-title-wrap">

                                        <small>
                                            ${escapeHtml(
                                                skill.category
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
                                        ""
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
                    }
                )
                .join("");

        return `
            ${createSectionHeading(
                "Evolução racial",
                "Progressão de Níveis",
                "As habilidades raciais são desbloqueadas nos níveis 1, 20, 40, 60, 80 e 100."
            )}

            <div class="progression-list">

                ${
                    skills ||
                    `
                        <div class="empty-state">
                            Nenhuma habilidade racial registrada.
                        </div>
                    `
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

        const cards =
            curiosities
                .map(
                    (curiosity) => `
                        <article class="curiosity-card">

                            <p>
                                ${escapeHtml(curiosity)}
                            </p>

                        </article>
                    `
                )
                .join("");

        return `
            ${createSectionHeading(
                "Costumes e detalhes",
                "Curiosidades",
                "Informações culturais, biológicas e históricas que ajudam a interpretar personagens dessa raça."
            )}

            <div class="curiosity-grid">

                ${
                    cards ||
                    `
                        <div class="empty-state">
                            Nenhuma curiosidade registrada.
                        </div>
                    `
                }

            </div>
        `;
    }

    /* =====================================================
       CONTEÚDO ATUAL
       ===================================================== */

    function renderCurrentContent() {
        const race =
            currentRace();

        if (!race) {
            elements.raceContent.innerHTML = `
                <div class="empty-state">
                    Nenhuma raça disponível.
                </div>
            `;

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
            renderers[state.tab] ||
            renderOverview;

        elements.raceContent.innerHTML = `
            <div class="content-enter">
                ${renderer(race)}
            </div>
        `;
    }

    /* =====================================================
       ABAS
       ===================================================== */

    function updateTabs() {
        elements.tabs.forEach((tab) => {
            const isActive =
                tab.dataset.tab === state.tab;

            tab.classList.toggle(
                "active",
                isActive
            );

            tab.setAttribute(
                "aria-selected",
                String(isActive)
            );
        });
    }

    function setupTabs() {
        elements.tabs.forEach((tab) => {
            tab.addEventListener(
                "click",
                () => {
                    state.tab =
                        tab.dataset.tab;

                    updateTabs();
                    renderCurrentContent();
                }
            );
        });
    }

    /* =====================================================
       SELEÇÃO DE RAÇA
       ===================================================== */

    function selectRace(
        raceId,
        updateHash = false
    ) {
        const race =
            races.find(
                (item) => item.id === raceId
            );

        if (!race) {
            return;
        }

        state.raceId =
            race.id;

        localStorage.setItem(
            "wonderlandSelectedRace",
            race.id
        );

        if (updateHash) {
            history.replaceState(
                null,
                "",
                `#${race.id}`
            );
        }

        setRaceTheme(race);
        renderRaceList();
        renderRaceHero(race);
        renderCurrentContent();

        document.title =
            `${race.name} | Raças de Wonderland`;

        if (updateHash) {
            scrollToRaceView();
        }
    }

    /* =====================================================
       PESQUISA
       ===================================================== */

    function setupSearch() {
        elements.raceSearch.addEventListener(
            "input",
            (event) => {
                state.search =
                    event.target.value;

                renderRaceList();
            }
        );

        elements.raceSearch.addEventListener(
            "keydown",
            (event) => {
                if (
                    event.key === "Escape"
                ) {
                    elements.raceSearch.value =
                        "";

                    state.search = "";

                    renderRaceList();

                    elements.raceSearch.blur();
                }
            }
        );
    }

    /* =====================================================
       PARTÍCULAS
       ===================================================== */

    function setupParticles() {
        if (!elements.particles) {
            return;
        }

        elements.particles.innerHTML = "";

        const fragment =
            document.createDocumentFragment();

        const amount =
            window.innerWidth <= 760
                ? 16
                : 28;

        for (
            let index = 0;
            index < amount;
            index += 1
        ) {
            const particle =
                document.createElement("span");

            const size =
                1 + Math.random() * 3;

            particle.className =
                "race-particle";

            particle.style.left =
                `${Math.random() * 100}%`;

            particle.style.animationDuration =
                `${12 + Math.random() * 18}s`;

            particle.style.animationDelay =
                `${Math.random() * -24}s`;

            particle.style.setProperty(
                "--drift",
                `${-70 + Math.random() * 140}px`
            );

            particle.style.width =
                `${size}px`;

            particle.style.height =
                `${size}px`;

            fragment.appendChild(
                particle
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

        if (
            !music ||
            !button ||
            !icon
        ) {
            return;
        }

        music.volume = 0.25;

        const savedTime =
            Number(
                localStorage.getItem(
                    "wonderlandMusicTime"
                ) || 0
            );

        function isMusicEnabled() {
            return (
                localStorage.getItem(
                    "wonderlandMusicEnabled"
                ) === "true"
            );
        }

        function saveMusicTime() {
            if (
                Number.isFinite(
                    music.currentTime
                )
            ) {
                localStorage.setItem(
                    "wonderlandMusicTime",
                    String(
                        music.currentTime
                    )
                );
            }
        }

        function restoreMusicTime() {
            if (
                savedTime > 0 &&
                Number.isFinite(
                    music.duration
                ) &&
                savedTime <
                    music.duration
            ) {
                music.currentTime =
                    savedTime;
            }
        }

        function updateMusicButton() {
            const isPlaying =
                !music.paused;

            button.classList.toggle(
                "playing",
                isPlaying
            );

            icon.textContent =
                isPlaying
                    ? "♫"
                    : "♪";

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

        function attemptAutoplay() {
            if (
                !isMusicEnabled() ||
                !music.paused
            ) {
                return;
            }

            music.play().catch(() => {
                updateMusicButton();
            });
        }

        music.addEventListener(
            "loadedmetadata",
            () => {
                restoreMusicTime();
                attemptAutoplay();
            }
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

        button.addEventListener(
            "click",
            () => {
                if (music.paused) {
                    localStorage.setItem(
                        "wonderlandMusicEnabled",
                        "true"
                    );

                    music.play().catch(() => {
                        updateMusicButton();
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

        const unlockMusic = () => {
            attemptAutoplay();

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
            restoreMusicTime();
            attemptAutoplay();
        }

        updateMusicButton();
    }

    /* =====================================================
       ALTERAÇÃO DA URL
       ===================================================== */

    function setupHashNavigation() {
        window.addEventListener(
            "hashchange",
            () => {
                const raceId =
                    location.hash.replace(
                        "#",
                        ""
                    );

                const exists =
                    races.some(
                        (race) =>
                            race.id === raceId
                    );

                if (exists) {
                    selectRace(
                        raceId,
                        false
                    );
                }
            }
        );
    }

    /* =====================================================
       ERRO DE CARREGAMENTO
       ===================================================== */

    function showDataError() {
        elements.raceContent.innerHTML = `
            <div class="empty-state">

                <p>
                    Os dados das raças ainda não foram
                    carregados.
                </p>

                <p>
                    Confirme se o arquivo
                    <strong>js/racas-data.js</strong>
                    existe e está sendo carregado antes de
                    <strong>js/racas.js</strong>.
                </p>

            </div>
        `;

        elements.raceList.innerHTML = `
            <div class="empty-state">
                Aguardando os dados das raças.
            </div>
        `;

        elements.raceCount.textContent =
            "0 raças";
    }

    /* =====================================================
       INICIALIZAÇÃO
       ===================================================== */

    function initialize() {
        setupTabs();
        setupSearch();
        setupParticles();
        setupMusic();
        setupHashNavigation();

        if (!races.length) {
            showDataError();
            return;
        }

        const hashRace =
            location.hash.replace(
                "#",
                ""
            );

        const savedRace =
            localStorage.getItem(
                "wonderlandSelectedRace"
            );

        const hashExists =
            races.some(
                (race) =>
                    race.id === hashRace
            );

        const savedExists =
            races.some(
                (race) =>
                    race.id === savedRace
            );

        const initialRace =
            hashExists
                ? hashRace
                : savedExists
                    ? savedRace
                    : races[0].id;

        updateTabs();

        selectRace(
            initialRace,
            false
        );
    }

    initialize();
});