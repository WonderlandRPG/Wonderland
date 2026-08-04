"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const races = Array.isArray(window.WONDERLAND_RACES)
        ? window.WONDERLAND_RACES
        : [];

    const state = {
        selectedRaceId: "",
        activeTab: "overview",
        search: "",
        transitioning: false
    };

    const $ = (id) => document.getElementById(id);

    const elements = {
        body: document.body,
        raceView: $("raceView"),
        raceHero: $("raceHero"),
        raceList: $("raceList"),
        raceCount: $("raceCount"),
        raceSearch: $("raceSearch"),
        clearRaceSearch: $("clearRaceSearch"),
        raceArtwork: $("raceArtwork"),
        raceEmblem: $("raceEmblem"),
        raceArchetype: $("raceArchetype"),
        raceName: $("raceName"),
        raceTagline: $("raceTagline"),
        raceDifficulty: $("raceDifficulty"),
        raceDifficultyText: $("raceDifficultyText"),
        raceRoles: $("raceRoles"),
        raceHp: $("raceHp"),
        raceMana: $("raceMana"),
        attributeGrid: $("attributeGrid"),
        raceContent: $("raceContent"),
        tabs: [...document.querySelectorAll(".race-tab")],
        particles: $("particles"),
        transition: $("raceTransition"),
        music: $("bgMusic"),
        musicButton: $("musicButton"),
        musicIcon: $("musicIcon"),
        raceModal: $("raceModal"),
        raceModalClose: document.querySelector(".race-modal-close")
    };

    const STORAGE_KEYS = {
        selectedRace: "wonderlandSelectedRace",
        activeTab: "wonderlandRaceActiveTab",
        musicEnabled: "wonderlandMusicEnabled",
        musicTime: "wonderlandMusicTime"
    };

    const ATTRIBUTES = ["FOR", "DEF", "RES", "INI", "INT", "ARC"];
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
    const DEFAULT_ARTWORK = "assets/images/logo.png";

    const escapeHtml = (value) =>
        String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    const normalizeText = (value) =>
        String(value ?? "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();

    const clamp = (value, minimum, maximum) =>
        Math.min(Math.max(value, minimum), maximum);

    function hexToRgb(hex) {
        const cleaned = String(hex || "").replace("#", "").trim();
        const value = cleaned.length === 3
            ? cleaned.split("").map((char) => char + char).join("")
            : cleaned;

        if (!/^[0-9a-fA-F]{6}$/.test(value)) {
            return "214, 181, 107";
        }

        const number = Number.parseInt(value, 16);
        return `${(number >> 16) & 255}, ${(number >> 8) & 255}, ${number & 255}`;
    }

    const getRaceById = (id) =>
        races.find((race) => race.id === id) || null;

    const getCurrentRace = () =>
        getRaceById(state.selectedRaceId) || races[0] || null;

    const setText = (element, value) => {
        if (element) {
            element.textContent =
                value === null || value === undefined || value === ""
                    ? "—"
                    : String(value);
        }
    };

    function applyRaceTheme(race) {
        const accent = race?.theme?.accent || "#d6b56b";
        const secondary = race?.theme?.secondary || "#718a91";

        elements.body.style.setProperty("--race-accent", accent);
        elements.body.style.setProperty("--race-accent-rgb", hexToRgb(accent));
        elements.body.style.setProperty("--race-secondary", secondary);
        elements.body.style.setProperty("--race-secondary-rgb", hexToRgb(secondary));
        elements.body.dataset.race = race.id;
    }

    function getFilteredRaces() {
        const search = normalizeText(state.search);
        if (!search) return [...races];

        return races.filter((race) =>
            normalizeText([
                race.name,
                race.archetype,
                race.tagline,
                ...(race.roles || []),
                race?.playstyle?.main,
                race?.playstyle?.secondary,
                race?.playstyle?.strengths,
                race?.playstyle?.weaknesses,
                ...(race?.playstyle?.recommended || [])
            ].join(" ")).includes(search)
        );
    }

    function renderRaceList() {
        if (!elements.raceList) return;

        const filtered = getFilteredRaces();
        elements.raceList.innerHTML = "";

        if (!filtered.length) {
            elements.raceList.innerHTML = `
                <div class="empty-state">
                    <strong>Nenhuma raça encontrada.</strong>
                    <p>Tente pesquisar utilizando outro nome.</p>
                </div>
            `;
        } else {
            const fragment = document.createDocumentFragment();

            filtered.forEach((race, index) => {
                const button = document.createElement("button");
                const active = race.id === state.selectedRaceId;
                button.type = "button";
                button.className = "race-list-button";
                button.dataset.raceId = race.id;
                button.classList.toggle("active", active);
                button.setAttribute("aria-pressed", String(active));
                button.setAttribute("aria-label", `Selecionar a raça ${race.name}`);
                button.style.setProperty(
                    "--item-rgb",
                    hexToRgb(race?.theme?.accent || "#d6b56b")
                );
                button.style.animationDelay = `${Math.min(index * 35, 280)}ms`;

                button.innerHTML = `
                    <span class="race-list-emblem" aria-hidden="true">
                        ${escapeHtml(race.icon || "✦")}
                    </span>
                    <span class="race-list-copy">
                        <strong>${escapeHtml(race.name)}</strong>
                        <small>${escapeHtml(race.archetype || "Raça de Wonderland")}</small>
                    </span>
                    <span class="race-list-stars">
                        ${"★".repeat(clamp(Number(race.difficulty) || 1, 1, 5))}
                    </span>
                `;

                button.addEventListener("click", () => {
                    selectRace(race.id, {
                        updateUrl: true,
                        scroll: true,
                        animate: true
                    });
                });

                fragment.appendChild(button);
            });

            elements.raceList.appendChild(fragment);
        }

        if (elements.raceCount) {
            elements.raceCount.textContent =
                `${filtered.length} ${filtered.length === 1 ? "raça" : "raças"}`;
        }
    }

    function renderArtwork(race) {
        if (!elements.raceArtwork) return;

        const artwork =
            race.artwork ||
            race.image ||
            race.imagem ||
            `assets/images/races/${race.id}.webp`;

        elements.raceArtwork.alt = `Representação da raça ${race.name}`;
        elements.raceArtwork.src = artwork;
        elements.raceArtwork.onerror = () => {
            elements.raceArtwork.onerror = null;
            elements.raceArtwork.src = DEFAULT_ARTWORK;
            elements.raceArtwork.alt = "Símbolo de Wonderland";
        };
    }

    function renderRaceHero(race) {
        renderArtwork(race);
        setText(elements.raceEmblem, race.icon || "✦");
        setText(elements.raceArchetype, race.archetype || "Raça de Wonderland");
        setText(elements.raceName, race.name);
        setText(elements.raceTagline, race.tagline);

        const difficulty = clamp(Number(race.difficulty) || 1, 1, 5);
        setText(
            elements.raceDifficulty,
            "★".repeat(difficulty) + "☆".repeat(5 - difficulty)
        );
        setText(elements.raceDifficultyText, DIFFICULTY_LABELS[difficulty]);
        setText(elements.raceHp, race?.stats?.hp);
        setText(elements.raceMana, race?.stats?.mana);

        if (elements.raceRoles) {
            elements.raceRoles.innerHTML = (race.roles || [])
                .map((role) => `<span class="role-tag">${escapeHtml(role)}</span>`)
                .join("");
        }
    }

    function renderAttributes(race) {
        if (!elements.attributeGrid) return;

        const attributes = race?.stats?.attributes || {};
        elements.attributeGrid.innerHTML = ATTRIBUTES.map((attribute) => {
            const value = Number(attributes[attribute]) || 0;
            const percentage = clamp((value / 5) * 100, 0, 100);

            return `
                <article
                    class="attribute-card"
                    style="--attribute-value:${percentage}%;"
                    title="${ATTRIBUTE_NAMES[attribute]}: +${value}"
                >
                    <span>${attribute}</span>
                    <strong data-attribute-value="${value}">+0</strong>
                </article>
            `;
        }).join("");

        elements.attributeGrid
            .querySelectorAll("[data-attribute-value]")
            .forEach((element, index) => {
                const target = Number(element.dataset.attributeValue) || 0;

                if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                    element.textContent = `+${target}`;
                    return;
                }

                let current = 0;
                window.setTimeout(() => {
                    if (target === 0) {
                        element.textContent = "+0";
                        return;
                    }

                    const timer = window.setInterval(() => {
                        current += 1;
                        element.textContent = `+${current}`;

                        if (current >= target) {
                            window.clearInterval(timer);
                        }
                    }, 55);
                }, index * 55);
            });
    }

    function createSectionHeading(kicker, title, lead = "") {
        return `
            <header class="section-heading">
                <div class="section-kicker">${escapeHtml(kicker)}</div>
                <h3 class="section-title">${escapeHtml(title)}</h3>
                ${lead ? `<p class="section-lead">${escapeHtml(lead)}</p>` : ""}
            </header>
        `;
    }

    const emptyState = (message) =>
        `<div class="empty-state">${escapeHtml(message)}</div>`;

    function renderOverview(race) {
        const description = Array.isArray(race.description)
            ? race.description
            : [];

        const recommended = Array.isArray(race?.playstyle?.recommended)
            ? race.playstyle.recommended
            : [];

        const row = (label, value) => `
            <div class="playstyle-row">
                <span>${escapeHtml(label)}</span>
                <strong>${escapeHtml(value || "—")}</strong>
            </div>
        `;

        return `
            ${createSectionHeading("Origem e cultura", `Conheça os ${race.name}`, race.tagline)}
            <div class="overview-grid">
                <article class="lore-card">
                    ${
                        description.length
                            ? description.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")
                            : "<p>Nenhuma descrição registrada.</p>"
                    }
                </article>

                <aside class="playstyle-card">
                    <h4 class="card-title">Estilo de jogo</h4>
                    <div class="playstyle-list">
                        ${row("Função principal", race?.playstyle?.main)}
                        ${row("Funções secundárias", race?.playstyle?.secondary)}
                        ${row("Pontos fortes", race?.playstyle?.strengths)}
                        ${row("Pontos fracos", race?.playstyle?.weaknesses)}
                        <div class="playstyle-row">
                            <span>Atributos recomendados</span>
                            <div class="recommended-tags">
                                ${
                                    recommended.length
                                        ? recommended
                                            .map((item) => `<span class="recommended-tag">${escapeHtml(item)}</span>`)
                                            .join("")
                                        : '<span class="recommended-tag">Dependem da classe</span>'
                                }
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        `;
    }

    function renderMechanics(race) {
        const mechanics = Array.isArray(race.mechanics) ? race.mechanics : [];

        return `
            ${createSectionHeading(
                "Sistema racial",
                "Mecânicas",
                "Recursos, estados e regras que definem a identidade da raça durante o combate."
            )}
            <div class="info-grid">
                ${
                    mechanics.length
                        ? mechanics.map((mechanic) => `
                            <article class="info-card">
                                <h3>${escapeHtml(mechanic.title)}</h3>
                                ${mechanic.content || "<p>Sem descrição.</p>"}
                            </article>
                        `).join("")
                        : emptyState("Nenhuma mecânica racial registrada.")
                }
            </div>
        `;
    }

    function renderTraits(race) {
        const traits = Array.isArray(race.traits) ? race.traits : [];

        return `
            ${createSectionHeading(
                "Características permanentes",
                "Traços Raciais",
                "Passivas, resistências, limitações e características que acompanham o personagem."
            )}
            <div class="traits-grid">
                ${
                    traits.length
                        ? traits.map((trait) => `
                            <article class="trait-card">
                                <span class="trait-label">
                                    ${escapeHtml(trait.label || "Traço racial")}
                                </span>
                                <h3>${escapeHtml(trait.title)}</h3>
                                ${trait.content || "<p>Sem descrição.</p>"}
                            </article>
                        `).join("")
                        : emptyState("Nenhum traço racial registrado.")
                }
                ${
                    race.weakness
                        ? `
                            <article class="weakness-card">
                                <span class="trait-label">Fraqueza racial</span>
                                <h3>${escapeHtml(race.weakness.title)}</h3>
                                ${race.weakness.content || "<p>Sem descrição.</p>"}
                            </article>
                        `
                        : ""
                }
            </div>
        `;
    }

    function renderProgression(race) {
        const progression = Array.isArray(race.progression)
            ? race.progression
            : [];

        return `
            ${createSectionHeading(
                "Evolução racial",
                "Progressão de Níveis",
                "As habilidades raciais são desbloqueadas nos níveis 1, 20, 40, 60, 80 e 100."
            )}
            <div class="progression-list">
                ${
                    progression.length
                        ? progression.map((skill, index) => {
                            const meta = Array.isArray(skill.meta)
                                ? skill.meta.filter(Boolean)
                                : [];

                            return `
                                <details class="skill-card" ${index === 0 ? "open" : ""}>
                                    <summary class="skill-summary">
                                        <span class="skill-level">
                                            Nível<br>${escapeHtml(skill.level)}
                                        </span>
                                        <span class="skill-title-wrap">
                                            <small>${escapeHtml(skill.category || "Habilidade racial")}</small>
                                            <strong>${escapeHtml(skill.name)}</strong>
                                        </span>
                                        <span class="skill-toggle" aria-hidden="true">＋</span>
                                    </summary>
                                    <div class="skill-body">
                                        <div class="skill-body-content">
                                            ${skill.content || "<p>Sem descrição.</p>"}
                                            ${
                                                meta.length
                                                    ? `<div class="skill-meta">
                                                        ${meta.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
                                                    </div>`
                                                    : ""
                                            }
                                        </div>
                                    </div>
                                </details>
                            `;
                        }).join("")
                        : emptyState("Nenhuma habilidade racial registrada.")
                }
            </div>
        `;
    }

    function renderCuriosities(race) {
        const curiosities = Array.isArray(race.curiosities)
            ? race.curiosities
            : [];

        return `
            ${createSectionHeading(
                "Costumes e detalhes",
                "Curiosidades",
                "Informações culturais, biológicas e históricas para ajudar na criação e interpretação do personagem."
            )}
            <div class="curiosity-grid">
                ${
                    curiosities.length
                        ? curiosities
                            .map((item) => `<article class="curiosity-card"><p>${escapeHtml(item)}</p></article>`)
                            .join("")
                        : emptyState("Nenhuma curiosidade registrada.")
                }
            </div>
        `;
    }

    function renderActiveTab() {
        const race = getCurrentRace();
        if (!race || !elements.raceContent) return;

        const renderers = {
            overview: renderOverview,
            mechanics: renderMechanics,
            traits: renderTraits,
            progression: renderProgression,
            curiosities: renderCuriosities
        };

        const renderer = renderers[state.activeTab] || renderOverview;

        elements.raceContent.innerHTML = `
            <div class="content-enter">${renderer(race)}</div>
        `;
        elements.raceContent.setAttribute(
            "aria-labelledby",
            `${state.activeTab}Tab`
        );

        const cards = elements.raceContent.querySelectorAll(".skill-card");
        cards.forEach((card) => {
            card.addEventListener("toggle", () => {
                if (!card.open) return;
                cards.forEach((other) => {
                    if (other !== card) {
                        other.removeAttribute("open");
                    }
                });
            });
        });
    }

    function updateTabs() {
        elements.tabs.forEach((tab) => {
            const active = tab.dataset.tab === state.activeTab;
            tab.classList.toggle("active", active);
            tab.setAttribute("aria-selected", String(active));
            tab.tabIndex = active ? 0 : -1;
        });
    }

    function selectTab(tabId, options = {}) {
        const valid = ["overview", "mechanics", "traits", "progression", "curiosities"];
        if (!valid.includes(tabId)) return;

        state.activeTab = tabId;
        localStorage.setItem(STORAGE_KEYS.activeTab, tabId);
        updateTabs();
        renderActiveTab();

        if (options.focus) {
            elements.tabs.find((tab) => tab.dataset.tab === tabId)?.focus();
        }
    }

    function setupTabs() {
        elements.tabs.forEach((tab, index) => {
            tab.addEventListener("click", () => selectTab(tab.dataset.tab));

            tab.addEventListener("keydown", (event) => {
                if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
                event.preventDefault();

                const direction = event.key === "ArrowRight" ? 1 : -1;
                const next = (index + direction + elements.tabs.length) %
                    elements.tabs.length;

                selectTab(elements.tabs[next].dataset.tab, { focus: true });
            });
        });
    }

    function updateUrl(raceId) {
        const hash = `#${encodeURIComponent(raceId)}`;
        if (window.location.hash !== hash) {
            history.replaceState({ raceId }, "", hash);
        }
    }

    function scrollToRaceView() {
        if (window.innerWidth > 1020 || !elements.raceView) return;

        elements.raceView.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                ? "auto"
                : "smooth",
            block: "start"
        });
    }

    function renderSelectedRace(race) {
        applyRaceTheme(race);
        renderRaceHero(race);
        renderAttributes(race);
        renderRaceList();
        renderActiveTab();
    }

    async function performRaceTransition(callback) {
        if (
            state.transitioning ||
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
            callback();
            return;
        }

        state.transitioning = true;
        elements.transition?.classList.add("active");

        await new Promise((resolve) => window.setTimeout(resolve, 180));
        callback();
        await new Promise((resolve) => window.setTimeout(resolve, 120));

        elements.transition?.classList.remove("active");
        window.setTimeout(() => {
            state.transitioning = false;
        }, 260);
    }

    function selectRace(raceId, options = {}) {
        const race = getRaceById(raceId);
        if (!race) return;

        const action = () => {
            state.selectedRaceId = race.id;
            localStorage.setItem(STORAGE_KEYS.selectedRace, race.id);

            if (options.updateUrl) updateUrl(race.id);
            renderSelectedRace(race);
            if (options.scroll) scrollToRaceView();
        };

        options.animate ? performRaceTransition(action) : action();
    }

    function setupSearch() {
        if (!elements.raceSearch) return;

        elements.raceSearch.addEventListener("input", (event) => {
            state.search = event.target.value;
            if (elements.clearRaceSearch) {
                elements.clearRaceSearch.hidden = !state.search.trim();
            }
            renderRaceList();
        });

        elements.raceSearch.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                state.search = "";
                elements.raceSearch.value = "";
                if (elements.clearRaceSearch) {
                    elements.clearRaceSearch.hidden = true;
                }
                renderRaceList();
            }

            if (event.key === "Enter") {
                const first = getFilteredRaces()[0];
                if (first) {
                    selectRace(first.id, {
                        updateUrl: true,
                        scroll: true,
                        animate: true
                    });
                }
            }
        });

        elements.clearRaceSearch?.addEventListener("click", () => {
            state.search = "";
            elements.raceSearch.value = "";
            elements.clearRaceSearch.hidden = true;
            elements.raceSearch.focus();
            renderRaceList();
        });
    }

    function setupParticles() {
        if (!elements.particles) return;

        elements.particles.innerHTML = "";
        const fragment = document.createDocumentFragment();
        const amount = window.innerWidth <= 780 ? 20 : 40;

        for (let index = 0; index < amount; index += 1) {
            const particle = document.createElement("span");
            const size = 1 + Math.random() * 3;

            particle.className = "race-particle";
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.animationDuration = `${13 + Math.random() * 18}s`;
            particle.style.animationDelay = `${-Math.random() * 24}s`;
            particle.style.setProperty(
                "--drift",
                `${-80 + Math.random() * 160}px`
            );
            fragment.appendChild(particle);
        }

        elements.particles.appendChild(fragment);
    }

    function setupMusic() {
        const music = elements.music;
        const button = elements.musicButton;
        const icon = elements.musicIcon;
        if (!music || !button || !icon) return;

        music.volume = 0.25;

        const updateButton = () => {
            const playing = !music.paused;
            button.classList.toggle("playing", playing);
            icon.textContent = playing ? "♫" : "♪";
            button.setAttribute(
                "aria-label",
                playing ? "Pausar música" : "Tocar música"
            );
        };

        const saveTime = () => {
            if (Number.isFinite(music.currentTime)) {
                localStorage.setItem(
                    STORAGE_KEYS.musicTime,
                    String(music.currentTime)
                );
            }
        };

        music.addEventListener("loadedmetadata", () => {
            const saved = Number(
                localStorage.getItem(STORAGE_KEYS.musicTime) || 0
            );
            if (saved > 0 && saved < music.duration) {
                music.currentTime = saved;
            }
        });

        music.addEventListener("play", () => {
            localStorage.setItem(STORAGE_KEYS.musicEnabled, "true");
            updateButton();
        });
        music.addEventListener("pause", updateButton);
        music.addEventListener("timeupdate", saveTime);

        button.addEventListener("click", () => {
            if (music.paused) {
                music.play().catch(updateButton);
            } else {
                music.pause();
                localStorage.setItem(STORAGE_KEYS.musicEnabled, "false");
                saveTime();
            }
        });

        updateButton();
    }

    function setupModal() {
        if (!elements.raceModal) return;

        elements.raceModalClose?.addEventListener("click", () => {
            elements.raceModal.close();
        });

        elements.raceModal.addEventListener("click", (event) => {
            if (event.target === elements.raceModal) {
                elements.raceModal.close();
            }
        });
    }

    function showDataError() {
        if (elements.raceList) {
            elements.raceList.innerHTML =
                '<div class="empty-state">Os dados das raças não foram carregados.</div>';
        }

        if (elements.raceContent) {
            elements.raceContent.innerHTML = `
                <section class="race-empty">
                    <div class="race-empty-symbol">⚠</div>
                    <h2>Códice indisponível</h2>
                    <p>
                        Confirme se <strong>js/data/racas-data.js</strong>
                        está sendo carregado antes de
                        <strong>js/pages/racas.js</strong>.
                    </p>
                </section>
            `;
        }

        if (elements.raceCount) {
            elements.raceCount.textContent = "0 raças";
        }
    }

    function initialize() {
        if (
            !elements.raceList ||
            !elements.raceContent ||
            !elements.raceName ||
            !elements.attributeGrid
        ) {
            console.error("[Wonderland Raças] Elementos obrigatórios ausentes.");
            return;
        }

        setupTabs();
        setupSearch();
        setupParticles();
        setupMusic();
        setupModal();

        window.addEventListener("hashchange", () => {
            const id = decodeURIComponent(
                window.location.hash.replace("#", "")
            );
            if (getRaceById(id)) {
                selectRace(id, {
                    updateUrl: false,
                    scroll: false,
                    animate: true
                });
            }
        });

        if (!races.length) {
            showDataError();
            return;
        }

        const hashRace = decodeURIComponent(
            window.location.hash.replace("#", "")
        );
        const savedRace = localStorage.getItem(STORAGE_KEYS.selectedRace);
        const savedTab = localStorage.getItem(STORAGE_KEYS.activeTab);

        state.selectedRaceId =
            getRaceById(hashRace)?.id ||
            getRaceById(savedRace)?.id ||
            races[0].id;

        state.activeTab =
            elements.tabs.some((tab) => tab.dataset.tab === savedTab)
                ? savedTab
                : "overview";

        updateTabs();
        selectRace(state.selectedRaceId, {
            updateUrl: Boolean(window.location.hash),
            scroll: false,
            animate: false
        });
    }

    initialize();
});
