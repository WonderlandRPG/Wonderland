"use strict";

(function () {
    const content = document.getElementById("classContent");
    if (!content) return;

    function createRating(value) {
        const text = String(value || "☆☆☆☆☆");
        const filledCount = Math.max(0, Math.min(5, (text.match(/★/g) || []).length));
        const row = document.createElement("span");
        row.className = "rating-stars-inline";
        row.setAttribute("aria-label", `${filledCount} de 5 estrelas`);

        const filled = document.createElement("span");
        filled.className = "rating-stars-filled";
        filled.textContent = "★".repeat(filledCount);

        const empty = document.createElement("span");
        empty.className = "rating-stars-empty";
        empty.textContent = "★".repeat(5 - filledCount);

        row.append(filled, empty);
        return row;
    }

    function enhanceRatings() {
        const difficulty = content.querySelector(".class-stars");
        if (difficulty && !difficulty.dataset.enhanced) {
            const raw = difficulty.textContent.trim();
            difficulty.dataset.enhanced = "true";
            difficulty.innerHTML = "";

            const label = document.createElement("span");
            label.className = "rating-label";
            label.textContent = "Dificuldade";

            difficulty.append(label, createRating(raw));
        }

        content.querySelectorAll(".class-affinity-card strong").forEach((element) => {
            if (element.dataset.enhanced) return;
            const raw = element.textContent.trim();
            element.dataset.enhanced = "true";
            element.innerHTML = "";
            element.classList.add("affinity-stars-row");
            element.appendChild(createRating(raw));
        });
    }

    const observer = new MutationObserver(enhanceRatings);
    observer.observe(content, { childList: true, subtree: true });
    enhanceRatings();
})();
