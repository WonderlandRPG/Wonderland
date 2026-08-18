"use client";

import { useEffect } from "react";

const imageSelectors = [
  ".arena-fighter__portrait",
  ".arena-map-piece > div",
  ".pvp-fighter-card__image",
  ".pvp-history-avatar",
  ".pvp-match-card > span",
  ".dungeon-bestiary__portrait",
  ".dungeon-party-panel article > div",
].join(",");

function promoteInlineArenaImages() {
  document.querySelectorAll<HTMLElement>(imageSelectors).forEach((element) => {
    const image = element.style.backgroundImage;
    if (
      image &&
      image !== "none" &&
      element.style.getPropertyPriority("background-image") !== "important"
    ) {
      element.style.setProperty("background-image", image, "important");
    }
  });

  // O Boneco Rúnico do modo Treino não possui uma arte própria no banco.
  // Usa o Golem Rúnico como representação visual em vez de deixar o retrato vazio.
  const trainingEnemy = document.querySelector<HTMLElement>(
    ".arena-fighter.is-enemy .arena-fighter__portrait:not(.is-image)",
  );
  if (trainingEnemy && !trainingEnemy.style.backgroundImage) {
    trainingEnemy.style.setProperty(
      "background-image",
      "url('/images/monsters/pve/golem-runa.webp')",
      "important",
    );
    trainingEnemy.classList.add("is-image", "is-training-fallback");
  }
}

export function ArenaImageRepair() {
  useEffect(() => {
    let frame = 0;
    let disposed = false;

    const observer = new MutationObserver(() => {
      if (disposed || frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        if (disposed) return;
        observer.disconnect();
        promoteInlineArenaImages();
        observer.observe(document.body, {
          subtree: true,
          childList: true,
          attributes: true,
          attributeFilter: ["style", "class"],
        });
      });
    });

    // Do not observe our own first style/class repair. Older versions could create
    // an unnecessary cascade of observer callbacks on slower browsers.
    promoteInlineArenaImages();
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return null;
}
