"use strict";

/* =========================================================
   WONDERLAND UI — PANEL CONTROLLER
   ========================================================= */

window.Wonderland = window.Wonderland || {};
Wonderland.UI = Wonderland.UI || {};

Wonderland.UI.Panel = (() => {
    const SELECTOR =
        ".wl-panel, .wl-window";

    function addStructure(panel) {
        if (
            !panel.querySelector(
                ".wl-panel-frame"
            )
        ) {
            const frame =
                document.createElement(
                    "span"
                );

            frame.className =
                "wl-panel-frame";

            frame.setAttribute(
                "aria-hidden",
                "true"
            );

            panel.appendChild(frame);
        }

        const ornaments = [
            "wl-panel-ornament-top-left",
            "wl-panel-ornament-top-right",
            "wl-panel-ornament-bottom-left",
            "wl-panel-ornament-bottom-right"
        ];

        ornaments.forEach(
            (className) => {
                if (
                    panel.querySelector(
                        `.${className}`
                    )
                ) {
                    return;
                }

                const ornament =
                    document.createElement(
                        "span"
                    );

                ornament.className =
                    `wl-panel-ornament ${className}`;

                ornament.setAttribute(
                    "aria-hidden",
                    "true"
                );

                panel.appendChild(
                    ornament
                );
            }
        );
    }

    function updatePointer(
        panel,
        event
    ) {
        const rect =
            panel.getBoundingClientRect();

        const x =
            ((event.clientX - rect.left) /
                rect.width) *
            100;

        const y =
            ((event.clientY - rect.top) /
                rect.height) *
            100;

        panel.style.setProperty(
            "--wl-panel-pointer-x",
            `${x}%`
        );

        panel.style.setProperty(
            "--wl-panel-pointer-y",
            `${y}%`
        );
    }

    function resetPointer(panel) {
        panel.style.setProperty(
            "--wl-panel-pointer-x",
            "50%"
        );

        panel.style.setProperty(
            "--wl-panel-pointer-y",
            "50%"
        );
    }

    function bind(panel) {
        if (
            panel.dataset.wlPanelReady ===
            "true"
        ) {
            return;
        }

        panel.dataset.wlPanelReady =
            "true";

        addStructure(panel);

        panel.addEventListener(
            "pointermove",
            (event) => {
                if (
                    event.pointerType ===
                        "touch" ||
                    window.matchMedia(
                        "(prefers-reduced-motion: reduce)"
                    ).matches
                ) {
                    return;
                }

                updatePointer(
                    panel,
                    event
                );
            }
        );

        panel.addEventListener(
            "pointerleave",
            () => {
                resetPointer(panel);
            }
        );
    }

    function setupReveal(
        root = document
    ) {
        const panels = [
            ...root.querySelectorAll(
                SELECTOR
            )
        ];

        if (
            !(
                "IntersectionObserver" in
                window
            )
        ) {
            panels.forEach(
                (panel) => {
                    panel.classList.add(
                        "wl-panel-visible"
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

                            entry.target
                                .classList.add(
                                    "wl-panel-visible"
                                );

                            observer.unobserve(
                                entry.target
                            );
                        }
                    );
                },
                {
                    threshold: 0.08,
                    rootMargin:
                        "0px 0px -30px 0px"
                }
            );

        panels.forEach(
            (panel, index) => {
                panel.classList.add(
                    "wl-panel-reveal"
                );

                panel.style.transitionDelay =
                    `${Math.min(
                        index * 0.04,
                        0.2
                    )}s`;

                observer.observe(panel);
            }
        );
    }

    function initialize(
        root = document
    ) {
        root
            .querySelectorAll(SELECTOR)
            .forEach(bind);

        setupReveal(root);
    }

    document.addEventListener(
        "DOMContentLoaded",
        () => initialize()
    );

    return {
        initialize
    };
})();