"use strict";

/* =========================================================
   WONDERLAND UI — LIVING CARD CONTROLLER
   ========================================================= */

window.Wonderland = window.Wonderland || {};
Wonderland.UI = Wonderland.UI || {};

Wonderland.UI.Card = (() => {
    const CARD_SELECTOR = ".wl-card";

    function createParticle(index) {
        const particle = document.createElement("span");

        particle.className = "wl-card-particle";

        particle.style.left =
            `${8 + Math.random() * 84}%`;

        particle.style.setProperty(
            "--particle-duration",
            `${2.8 + Math.random() * 2.8}s`
        );

        particle.style.setProperty(
            "--particle-delay",
            `${index * 0.18 + Math.random()}s`
        );

        particle.style.setProperty(
            "--particle-drift",
            `${-35 + Math.random() * 70}px`
        );

        const size =
            2 + Math.random() * 4;

        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        return particle;
    }

    function prepareStructure(card) {
        if (!card.querySelector(".wl-card-frame")) {
            const frame = document.createElement("span");

            frame.className = "wl-card-frame";
            frame.setAttribute("aria-hidden", "true");

            card.appendChild(frame);
        }

        const cornerClasses = [
            "wl-card-corner-top-left",
            "wl-card-corner-top-right",
            "wl-card-corner-bottom-left",
            "wl-card-corner-bottom-right"
        ];

        cornerClasses.forEach((className) => {
            if (card.querySelector(`.${className}`)) {
                return;
            }

            const corner = document.createElement("span");

            corner.className =
                `wl-card-corner ${className}`;

            corner.setAttribute("aria-hidden", "true");

            card.appendChild(corner);
        });

        const image = card.querySelector(".wl-card-image");

        if (image && !image.querySelector(".wl-card-shine")) {
            const shine = document.createElement("span");

            shine.className = "wl-card-shine";
            shine.setAttribute("aria-hidden", "true");

            image.appendChild(shine);
        }

        if (!card.querySelector(".wl-card-particles")) {
            const particles = document.createElement("div");

            particles.className = "wl-card-particles";
            particles.setAttribute("aria-hidden", "true");

            const amount =
                window.innerWidth <= 700
                    ? 7
                    : 12;

            for (
                let index = 0;
                index < amount;
                index += 1
            ) {
                particles.appendChild(
                    createParticle(index)
                );
            }

            card.appendChild(particles);
        }
    }

    function updatePointer(card, event) {
        const rect = card.getBoundingClientRect();

        const x =
            event.clientX - rect.left;

        const y =
            event.clientY - rect.top;

        const percentX =
            (x / rect.width) * 100;

        const percentY =
            (y / rect.height) * 100;

        const rotateY =
            ((percentX - 50) / 50) * 5;

        const rotateX =
            ((50 - percentY) / 50) * 5;

        card.style.setProperty(
            "--wl-card-pointer-x",
            `${percentX}%`
        );

        card.style.setProperty(
            "--wl-card-pointer-y",
            `${percentY}%`
        );

        card.style.setProperty(
            "--wl-card-tilt-x",
            `${rotateX}deg`
        );

        card.style.setProperty(
            "--wl-card-tilt-y",
            `${rotateY}deg`
        );
    }

    function resetPointer(card) {
        card.style.setProperty(
            "--wl-card-pointer-x",
            "50%"
        );

        card.style.setProperty(
            "--wl-card-pointer-y",
            "50%"
        );

        card.style.setProperty(
            "--wl-card-tilt-x",
            "0deg"
        );

        card.style.setProperty(
            "--wl-card-tilt-y",
            "0deg"
        );
    }

    function bindCard(card) {
        if (card.dataset.wlCardReady === "true") {
            return;
        }

        card.dataset.wlCardReady = "true";

        prepareStructure(card);

        card.addEventListener(
            "pointermove",
            (event) => {
                if (
                    event.pointerType === "touch" ||
                    window.matchMedia(
                        "(prefers-reduced-motion: reduce)"
                    ).matches
                ) {
                    return;
                }

                updatePointer(card, event);
            }
        );

        card.addEventListener(
            "pointerleave",
            () => {
                resetPointer(card);
            }
        );

        card.addEventListener(
            "click",
            (event) => {
                if (
                    event.target.closest(
                        "button, a, input, select, textarea"
                    )
                ) {
                    return;
                }

                card.classList.toggle(
                    "wl-card-active"
                );
            }
        );
    }

    function initialize(root = document) {
        root
            .querySelectorAll(CARD_SELECTOR)
            .forEach(bindCard);
    }

    function render(data = {}) {
        const title =
            data.title || "Sem título";

        const subtitle =
            data.subtitle || "Wonderland";

        const text =
            data.text || "";

        const image =
            data.image || "assets/images/logo.png";

        const theme =
            data.theme || "";

        const rarity =
            data.rarity || "";

        const rarityClass =
            data.rarityClass
                ? ` ${data.rarityClass}`
                : "";

        const stars =
            data.stars || "";

        const tag =
            data.tag || "";

        return `
            <article
                class="wl-card${rarityClass}"
                ${theme ? `data-theme="${theme}"` : ""}
                tabindex="0"
            >
                ${
                    rarity
                        ? `
                            <span class="wl-card-rarity">
                                ${rarity}
                            </span>
                        `
                        : ""
                }

                <div class="wl-card-image">
                    <img
                        src="${image}"
                        alt="${title}"
                        loading="lazy"
                    >
                </div>

                <div class="wl-card-body">
                    <span class="wl-card-subtitle">
                        ${subtitle}
                    </span>

                    <h3 class="wl-card-title">
                        ${title}
                    </h3>

                    <p class="wl-card-text">
                        ${text}
                    </p>

                    ${
                        stars || tag
                            ? `
                                <div class="wl-card-meta">
                                    <span class="wl-card-stars">
                                        ${stars}
                                    </span>

                                    <span class="wl-card-tag">
                                        ${tag}
                                    </span>
                                </div>
                            `
                            : ""
                    }
                </div>
            </article>
        `;
    }

    document.addEventListener(
        "DOMContentLoaded",
        () => {
            initialize();
        }
    );

    return {
        initialize,
        render
    };
})();