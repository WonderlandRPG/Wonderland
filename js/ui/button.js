"use strict";

/* =========================================================
   WONDERLAND UI — BUTTON CONTROLLER
   ========================================================= */

window.Wonderland = window.Wonderland || {};
Wonderland.UI = Wonderland.UI || {};

Wonderland.UI.Button = (() => {
    const SELECTOR = ".wl-button";

    function addCorners(button) {
        if (
            button.querySelector(
                ".wl-button-corner-left"
            )
        ) {
            return;
        }

        const leftCorner =
            document.createElement("span");

        const rightCorner =
            document.createElement("span");

        leftCorner.className =
            "wl-button-corner wl-button-corner-left";

        rightCorner.className =
            "wl-button-corner wl-button-corner-right";

        leftCorner.setAttribute(
            "aria-hidden",
            "true"
        );

        rightCorner.setAttribute(
            "aria-hidden",
            "true"
        );

        button.append(
            leftCorner,
            rightCorner
        );
    }

    function createClickEffect(
        button,
        event
    ) {
        const rect =
            button.getBoundingClientRect();

        const effect =
            document.createElement("span");

        const size =
            Math.max(
                rect.width,
                rect.height
            ) * 1.35;

        const x =
            event.clientX
                ? event.clientX - rect.left
                : rect.width / 2;

        const y =
            event.clientY
                ? event.clientY - rect.top
                : rect.height / 2;

        effect.className =
            "wl-button-click-effect";

        effect.style.width =
            `${size}px`;

        effect.style.height =
            `${size}px`;

        effect.style.left =
            `${x - size / 2}px`;

        effect.style.top =
            `${y - size / 2}px`;

        button.appendChild(effect);

        window.setTimeout(
            () => effect.remove(),
            650
        );
    }

    function bind(button) {
        if (
            button.dataset.wlButtonReady ===
            "true"
        ) {
            return;
        }

        button.dataset.wlButtonReady =
            "true";

        addCorners(button);

        button.addEventListener(
            "click",
            (event) => {
                if (
                    button.disabled ||
                    button.getAttribute(
                        "aria-disabled"
                    ) === "true"
                ) {
                    return;
                }

                createClickEffect(
                    button,
                    event
                );
            }
        );
    }

    function injectClickStyle() {
        if (
            document.getElementById(
                "wlButtonDynamicStyle"
            )
        ) {
            return;
        }

        const style =
            document.createElement("style");

        style.id =
            "wlButtonDynamicStyle";

        style.textContent = `
            .wl-button-click-effect {
                position: absolute;
                z-index: 20;

                border-radius: 50%;

                pointer-events: none;

                background:
                    radial-gradient(
                        circle,
                        rgba(
                            var(--wl-button-color),
                            0.38
                        ),
                        transparent 68%
                    );

                animation:
                    wlButtonClickEffect
                    0.62s
                    ease-out
                    forwards;
            }

            @keyframes wlButtonClickEffect {
                from {
                    opacity: 1;
                    transform: scale(0.12);
                }

                to {
                    opacity: 0;
                    transform: scale(1);
                }
            }
        `;

        document.head.appendChild(style);
    }

    function initialize(
        root = document
    ) {
        injectClickStyle();

        root
            .querySelectorAll(SELECTOR)
            .forEach(bind);
    }

    document.addEventListener(
        "DOMContentLoaded",
        () => initialize()
    );

    return {
        initialize
    };
})();