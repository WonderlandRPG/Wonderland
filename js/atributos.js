"use strict";

/* =========================================================
   ATRIBUTOS — WONDERLAND
   Interações, partículas, música e animações da página.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    const body = document.body;

    const cards = [
        ...document.querySelectorAll(
            ".attribute-details-card"
        )
    ];

    const particlesContainer =
        document.getElementById(
            "attributeParticles"
        );

    const music =
        document.getElementById(
            "bgMusic"
        );

    const musicButton =
        document.getElementById(
            "musicButton"
        );

    const musicIcon =
        document.getElementById(
            "musicIcon"
        );

    const attributes = {
        for: {
            color: "207, 80, 69",
            symbol: "FOR",
            title: "Força"
        },

        def: {
            color: "105, 138, 169",
            symbol: "DEF",
            title: "Defesa"
        },

        res: {
            color: "95, 174, 128",
            symbol: "RES",
            title: "Resistência"
        },

        ini: {
            color: "220, 177, 75",
            symbol: "INI",
            title: "Iniciativa"
        },

        int: {
            color: "108, 130, 221",
            symbol: "INT",
            title: "Inteligência"
        },

        arc: {
            color: "181, 103, 211",
            symbol: "ARC",
            title: "Arcano"
        }
    };

    const defaultColor =
        "214, 181, 107";

    let activeCard = null;

    /* =====================================================
       TEMA DA PÁGINA
       ===================================================== */

    function setPageTheme(attributeId) {
        const attribute =
            attributes[attributeId];

        const color =
            attribute?.color ||
            defaultColor;

        body.style.setProperty(
            "--page-accent",
            color
        );

        updateHeroSymbol(attribute);
        updateParticlesColor();
    }

    function resetPageTheme() {
        body.style.setProperty(
            "--page-accent",
            defaultColor
        );

        updateHeroSymbol(null);
        updateParticlesColor();
    }

    function updateHeroSymbol(attribute) {
        const heroSymbol =
            document.querySelector(
                ".attributes-hero-symbol"
            );

        if (!heroSymbol) {
            return;
        }

        if (attribute) {
            heroSymbol.textContent =
                attribute.symbol;

            heroSymbol.setAttribute(
                "title",
                attribute.title
            );
        } else {
            heroSymbol.textContent = "✦";

            heroSymbol.removeAttribute(
                "title"
            );
        }
    }

    /* =====================================================
       ATIVAÇÃO DOS CARTÕES
       ===================================================== */

    function activateCard(card) {
        if (!card) {
            return;
        }

        cards.forEach((item) => {
            item.classList.remove(
                "active"
            );

            item.setAttribute(
                "aria-pressed",
                "false"
            );
        });

        card.classList.add(
            "active"
        );

        card.setAttribute(
            "aria-pressed",
            "true"
        );

        activeCard = card;

        const attributeId =
            card.dataset.attribute;

        setPageTheme(attributeId);

        createAttributeBurst(
            card,
            attributeId
        );
    }

    function deactivateCards() {
        cards.forEach((card) => {
            card.classList.remove(
                "active"
            );

            card.setAttribute(
                "aria-pressed",
                "false"
            );
        });

        activeCard = null;

        resetPageTheme();
    }

    function setupCards() {
        cards.forEach((card) => {
            card.setAttribute(
                "role",
                "button"
            );

            card.setAttribute(
                "aria-pressed",
                "false"
            );

            card.addEventListener(
                "mouseenter",
                () => {
                    if (
                        window.matchMedia(
                            "(hover: hover)"
                        ).matches
                    ) {
                        setPageTheme(
                            card.dataset.attribute
                        );
                    }
                }
            );

            card.addEventListener(
                "mouseleave",
                () => {
                    if (
                        window.matchMedia(
                            "(hover: hover)"
                        ).matches &&
                        !activeCard
                    ) {
                        resetPageTheme();
                    }

                    if (
                        window.matchMedia(
                            "(hover: hover)"
                        ).matches &&
                        activeCard
                    ) {
                        setPageTheme(
                            activeCard.dataset.attribute
                        );
                    }
                }
            );

            card.addEventListener(
                "click",
                () => {
                    if (
                        activeCard === card
                    ) {
                        deactivateCards();
                        return;
                    }

                    activateCard(card);
                }
            );

            card.addEventListener(
                "keydown",
                (event) => {
                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {
                        event.preventDefault();

                        if (
                            activeCard === card
                        ) {
                            deactivateCards();
                        } else {
                            activateCard(card);
                        }
                    }

                    if (
                        event.key === "Escape"
                    ) {
                        deactivateCards();

                        card.blur();
                    }
                }
            );
        });
    }

    /* =====================================================
       EXPLOSÃO VISUAL DOS ATRIBUTOS
       ===================================================== */

    function createAttributeBurst(
        card,
        attributeId
    ) {
        const attribute =
            attributes[attributeId];

        if (
            !attribute ||
            !card
        ) {
            return;
        }

        const animationLayer =
            card.querySelector(
                ".attribute-animation"
            );

        if (!animationLayer) {
            return;
        }

        const amount =
            window.innerWidth <= 700
                ? 9
                : 16;

        for (
            let index = 0;
            index < amount;
            index += 1
        ) {
            const particle =
                document.createElement(
                    "span"
                );

            particle.className =
                "attribute-click-particle";

            const angle =
                Math.random() *
                Math.PI *
                2;

            const distance =
                35 +
                Math.random() *
                115;

            const x =
                Math.cos(angle) *
                distance;

            const y =
                Math.sin(angle) *
                distance;

            const size =
                2 +
                Math.random() *
                5;

            particle.style.setProperty(
                "--burst-x",
                `${x}px`
            );

            particle.style.setProperty(
                "--burst-y",
                `${y}px`
            );

            particle.style.width =
                `${size}px`;

            particle.style.height =
                `${size}px`;

            particle.style.left =
                `${42 + Math.random() * 20}%`;

            particle.style.top =
                `${35 + Math.random() * 30}%`;

            particle.style.background =
                `rgb(${attribute.color})`;

            particle.style.boxShadow =
                `0 0 14px rgba(${attribute.color}, 0.85)`;

            animationLayer.appendChild(
                particle
            );

            window.setTimeout(
                () => {
                    particle.remove();
                },
                900
            );
        }
    }

    function injectBurstStyle() {
        const style =
            document.createElement(
                "style"
            );

        style.textContent = `
            .attribute-click-particle {
                position: absolute;
                z-index: 8;

                border-radius: 50%;

                pointer-events: none;

                animation:
                    attributeClickBurst
                    0.85s
                    cubic-bezier(
                        0.18,
                        0.72,
                        0.28,
                        1
                    )
                    forwards;
            }

            @keyframes attributeClickBurst {
                0% {
                    opacity: 0;

                    transform:
                        translate(0, 0)
                        scale(0.35);
                }

                18% {
                    opacity: 1;
                }

                100% {
                    opacity: 0;

                    transform:
                        translate(
                            var(--burst-x),
                            var(--burst-y)
                        )
                        scale(1.2);
                }
            }
        `;

        document.head.appendChild(
            style
        );
    }

    /* =====================================================
       PARTÍCULAS GERAIS
       ===================================================== */

    function setupParticles() {
        if (!particlesContainer) {
            return;
        }

        particlesContainer.innerHTML =
            "";

        const fragment =
            document.createDocumentFragment();

        const amount =
            window.innerWidth <= 700
                ? 18
                : 34;

        for (
            let index = 0;
            index < amount;
            index += 1
        ) {
            const particle =
                document.createElement(
                    "span"
                );

            const size =
                1 +
                Math.random() *
                3;

            particle.className =
                "attribute-page-particle";

            particle.style.left =
                `${Math.random() * 100}%`;

            particle.style.width =
                `${size}px`;

            particle.style.height =
                `${size}px`;

            particle.style.animationDuration =
                `${13 + Math.random() * 19}s`;

            particle.style.animationDelay =
                `${Math.random() * -30}s`;

            particle.style.setProperty(
                "--particle-drift",
                `${-90 + Math.random() * 180}px`
            );

            fragment.appendChild(
                particle
            );
        }

        particlesContainer.appendChild(
            fragment
        );
    }

    function updateParticlesColor() {
        const pageParticles = [
            ...document.querySelectorAll(
                ".attribute-page-particle"
            )
        ];

        pageParticles.forEach(
            (particle) => {
                particle.style.background =
                    "rgb(var(--page-accent))";

                particle.style.boxShadow =
                    "0 0 14px rgba(var(--page-accent), 0.75)";
            }
        );
    }

    /* =====================================================
       ANIMAÇÃO DE ENTRADA DAS SEÇÕES
       ===================================================== */

    function setupRevealAnimations() {
        const sections = [
            ...document.querySelectorAll(
                [
                    ".attributes-hero",
                    ".attributes-introduction",
                    ".attributes-creation",
                    ".attributes-codex",
                    ".attribute-example"
                ].join(",")
            )
        ];

        sections.forEach(
            (section, index) => {
                section.classList.add(
                    "attribute-reveal"
                );

                section.style.transitionDelay =
                    `${Math.min(index * 0.06, 0.18)}s`;
            }
        );

        if (
            !("IntersectionObserver" in window)
        ) {
            sections.forEach(
                (section) => {
                    section.classList.add(
                        "visible"
                    );
                }
            );

            return;
        }

        const observer =
            new IntersectionObserver(
                (entries) => {
                    entries.forEach(
                        (entry) => {
                            if (
                                !entry.isIntersecting
                            ) {
                                return;
                            }

                            entry.target.classList.add(
                                "visible"
                            );

                            observer.unobserve(
                                entry.target
                            );
                        }
                    );
                },
                {
                    threshold: 0.12,
                    rootMargin:
                        "0px 0px -45px 0px"
                }
            );

        sections.forEach(
            (section) => {
                observer.observe(
                    section
                );
            }
        );
    }

    /* =====================================================
       CARTÕES DE ATRIBUTOS AO ENTRAR NA TELA
       ===================================================== */

    function setupCardReveal() {
        if (
            !("IntersectionObserver" in window)
        ) {
            return;
        }

        cards.forEach(
            (card, index) => {
                card.style.opacity = "0";

                card.style.transform =
                    "translateY(24px)";

                card.style.transitionDelay =
                    `${Math.min(index * 0.07, 0.28)}s`;
            }
        );

        const observer =
            new IntersectionObserver(
                (entries) => {
                    entries.forEach(
                        (entry) => {
                            if (
                                !entry.isIntersecting
                            ) {
                                return;
                            }

                            entry.target.style.opacity =
                                "1";

                            entry.target.style.transform =
                                "translateY(0)";

                            observer.unobserve(
                                entry.target
                            );
                        }
                    );
                },
                {
                    threshold: 0.14
                }
            );

        cards.forEach(
            (card) => {
                observer.observe(card);
            }
        );
    }

    /* =====================================================
       MÚSICA
       ===================================================== */

    function setupMusic() {
        if (
            !music ||
            !musicButton ||
            !musicIcon
        ) {
            return;
        }

        music.volume = 0.25;

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
            const savedTime =
                Number(
                    localStorage.getItem(
                        "wonderlandMusicTime"
                    ) || 0
                );

            if (
                savedTime <= 0 ||
                !Number.isFinite(
                    savedTime
                )
            ) {
                return;
            }

            if (
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
            const playing =
                !music.paused;

            musicButton.classList.toggle(
                "playing",
                playing
            );

            musicIcon.textContent =
                playing
                    ? "♫"
                    : "♪";

            const label =
                playing
                    ? "Pausar música"
                    : "Tocar música";

            musicButton.setAttribute(
                "aria-label",
                label
            );

            musicButton.setAttribute(
                "title",
                label
            );
        }

        function attemptPlay() {
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
                attemptPlay();
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

        musicButton.addEventListener(
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

        if (
            music.readyState >= 1
        ) {
            restoreMusicTime();
            attemptPlay();
        }

        updateMusicButton();
    }

    /* =====================================================
       CLIQUE FORA DOS CARTÕES
       ===================================================== */

    function setupOutsideClick() {
        document.addEventListener(
            "click",
            (event) => {
                if (!activeCard) {
                    return;
                }

                const clickedCard =
                    event.target.closest(
                        ".attribute-details-card"
                    );

                if (clickedCard) {
                    return;
                }

                deactivateCards();
            }
        );
    }

    /* =====================================================
       REDIMENSIONAMENTO
       ===================================================== */

    let resizeTimer;

    function setupResize() {
        window.addEventListener(
            "resize",
            () => {
                window.clearTimeout(
                    resizeTimer
                );

                resizeTimer =
                    window.setTimeout(
                        () => {
                            setupParticles();
                        },
                        180
                    );
            }
        );
    }

    /* =====================================================
       INICIALIZAÇÃO
       ===================================================== */

    function initialize() {
        injectBurstStyle();
        setupCards();
        setupParticles();
        setupRevealAnimations();
        setupCardReveal();
        setupMusic();
        setupOutsideClick();
        setupResize();
    }

    initialize();
});