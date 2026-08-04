"use strict";

(function () {
    const termList = document.getElementById("termList");
    const termContent = document.getElementById("termContent");
    if (!termList || !termContent) return;

    const modal = document.createElement("dialog");
    modal.className = "grimorio-card-modal";
    modal.innerHTML = '<button class="grimorio-card-close" type="button" aria-label="Fechar">×</button><div class="grimorio-card-modal-content"></div>';
    document.body.appendChild(modal);

    const modalContent = modal.querySelector(".grimorio-card-modal-content");
    const closeButton = modal.querySelector(".grimorio-card-close");

    function openFromCurrentPanel() {
        const title = termContent.querySelector("h1, h2")?.textContent?.trim() || "Registro do Grimório";
        const subtitle = termContent.querySelector(".term-subtitle")?.textContent?.trim() || "Conhecimento de Wonderland";
        const clone = termContent.cloneNode(true);
        clone.querySelectorAll(".magic-preview").forEach((element) => element.remove());
        modalContent.innerHTML = `<span class="modal-meta">${subtitle}</span><h2>${title}</h2>${clone.innerHTML}`;
        if (typeof modal.showModal === "function") modal.showModal();
    }

    termList.addEventListener("click", (event) => {
        const button = event.target.closest(".term-button");
        if (!button) return;
        window.setTimeout(openFromCurrentPanel, 180);
    });

    closeButton.addEventListener("click", () => modal.close());
    modal.addEventListener("click", (event) => {
        const rect = modal.getBoundingClientRect();
        const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
        if (outside) modal.close();
    });
})();
