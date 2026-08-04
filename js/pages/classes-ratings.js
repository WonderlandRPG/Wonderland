"use strict";

(function () {
    const content = document.getElementById("classContent");
    if (!content) return;

    function createStars(value) {
        const text = String(value || "☆☆☆☆☆");
        const filled = (text.match(/★/g) || []).length;
        const fragment = document.createDocumentFragment();

        for (let index = 0; index < 5; index += 1) {
            const star = document.createElement("span");
            star.className = index < filled ? "rating-star filled" : "rating-star empty";
            star.textContent = "★";
            fragment.appendChild(star);
        }

        return fragment;
    }

    function enhanceRatings() {
        const difficulty = content.querySelector(".class-stars");
        if (difficulty && !difficulty.dataset.enhanced) {
            const raw = difficulty.textContent.trim();
            difficulty.dataset.enhanced = "true";
            difficulty.dataset.value = raw;
            difficulty.innerHTML = "";

            const label = document.createElement("span");
            label.className = "rating-label";
            label.textContent = "Dificuldade";

            const stars = document.createElement("span");
            stars.className = "rating-stars-row";
            stars.appendChild(createStars(raw));

            difficulty.append(label, stars);
        }

        content.querySelectorAll(".class-affinity-card strong").forEach((element) => {
            if (element.dataset.enhanced) return;
            const raw = element.textContent.trim();
            element.dataset.enhanced = "true";
            element.dataset.value = raw;
            element.innerHTML = "";
            element.classList.add("affinity-stars-row");
            element.appendChild(createStars(raw));
        });
    }

    const observer = new MutationObserver(enhanceRatings);
    observer.observe(content, { childList: true, subtree: true });
    enhanceRatings();
})();
