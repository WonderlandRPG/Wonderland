"use strict";

(function () {
    const content = document.getElementById("classContent");
    if (!content) return;

    const UNLOCK_LEVELS = [60, 70, 80, 90, 100];

    function applyPathUnlockLevels() {
        const pathLists = content.querySelectorAll(".class-path-progression");

        pathLists.forEach((list) => {
            const cards = [...list.querySelectorAll(":scope > .class-skill-card")];

            cards.forEach((card, index) => {
                const level = UNLOCK_LEVELS[index] || 100;
                const badge = card.querySelector(".class-skill-level");
                const category = card.querySelector(".class-skill-title-wrap small");
                const isUltimate = card.classList.contains("ultimate");

                card.dataset.unlockLevel = String(level);

                if (badge && badge.dataset.pathLevelApplied !== "true") {
                    badge.dataset.pathLevelApplied = "true";
                    badge.innerHTML = `Nível<br><strong>${level}</strong>`;
                    badge.setAttribute(
                        "aria-label",
                        `${isUltimate ? "Ultimate" : "Habilidade"} desbloqueada no nível ${level}`
                    );
                }

                if (category && category.dataset.pathLevelApplied !== "true") {
                    category.dataset.pathLevelApplied = "true";
                    category.textContent = isUltimate
                        ? `Ultimate • Desbloqueio no nível ${level}`
                        : `Habilidade do Caminho • Desbloqueio no nível ${level}`;
                }
            });
        });
    }

    const observer = new MutationObserver(applyPathUnlockLevels);
    observer.observe(content, { childList: true, subtree: true });
    applyPathUnlockLevels();
})();
