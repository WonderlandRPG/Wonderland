"use strict";

/* Delegação de eventos para manter as abas funcionais após cada renderização. */
document.addEventListener("click", (event) => {
    const tab = event.target.closest(".class-tab");
    if (tab && document.getElementById("classContent")?.contains(tab)) {
        event.preventDefault();
        if (typeof activeTab !== "undefined" && typeof renderClass === "function") {
            activeTab = tab.dataset.tab || "overview";
            renderClass();
        }
        return;
    }

    const pathButton = event.target.closest(".class-path-selector-button");
    if (pathButton && document.getElementById("classContent")?.contains(pathButton)) {
        event.preventDefault();
        const index = Number(pathButton.dataset.pathIndex);
        const view = document.getElementById("classPathView");
        if (!Number.isNaN(index) && view && typeof currentClass !== "undefined" && currentClass?.caminhos?.[index] && typeof renderSinglePath === "function") {
            document.querySelectorAll(".class-path-selector-button").forEach((button) => {
                button.classList.toggle("active", button === pathButton);
            });
            view.innerHTML = renderSinglePath(currentClass.caminhos[index], index);
        }
    }
}, true);
