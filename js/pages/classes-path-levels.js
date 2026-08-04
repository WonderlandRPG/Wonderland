"use strict";

(function () {
    const content = document.getElementById("classContent");
    if (!content) return;

    const SKILL_LEVELS = [60, 70, 80, 90, 100];

    function createPassiveUnlockCard(pathCard, list) {
        if (pathCard.dataset.passiveUnlockCreated === "true") return;

        const passive = pathCard.querySelector(":scope > .class-path-passive");
        if (!passive) return;

        const name = passive.querySelector("h4")?.textContent?.trim() || "Passiva do Caminho";
        const description = passive.querySelector("div")?.textContent?.trim() || "";

        const card = document.createElement("details");
        card.className = "class-skill-card path-passive-unlock";
        card.dataset.unlockLevel = "50";
        card.open = true;
        card.innerHTML = `
            <summary class="class-skill-summary">
                <span class="class-skill-level" aria-label="Passiva desbloqueada no nível 50">
                    Nível<br><strong>50</strong>
                </span>
                <span class="class-skill-title-wrap">
                    <small>Passiva do Caminho • Desbloqueio no nível 50</small>
                    <strong>${name}</strong>
                </span>
                <span class="class-skill-toggle" aria-hidden="true">＋</span>
            </summary>
            <div class="class-skill-body"><p>${description}</p></div>
        `;

        list.prepend(card);
        passive.remove();
        pathCard.dataset.passiveUnlockCreated = "true";
    }

    function applyPathUnlockLevels() {
        const pathCards = content.querySelectorAll(".class-path-card");

        pathCards.forEach((pathCard) => {
            const list = pathCard.querySelector(".class-path-progression");
            if (!list) return;

            createPassiveUnlockCard(pathCard, list);

            const cards = [...list.querySelectorAll(":scope > .class-skill-card:not(.path-passive-unlock)")];

            cards.forEach((card, index) => {
                const level = SKILL_LEVELS[index] || 100;
                const badge = card.querySelector(".class-skill-level");
                const category = card.querySelector(".class-skill-title-wrap small");
                const isUltimate = card.classList.contains("ultimate");

                card.dataset.unlockLevel = String(level);

                if (badge) {
                    badge.innerHTML = `Nível<br><strong>${level}</strong>`;
                    badge.setAttribute(
                        "aria-label",
                        `${isUltimate ? "Ultimate" : "Habilidade"} desbloqueada no nível ${level}`
                    );
                }

                if (category) {
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
