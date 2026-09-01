"use client";

import { useEffect, useRef } from "react";

type HpSnapshot = { player: number | null; enemy: number | null };

function findLab() {
  return document.querySelector<HTMLElement>('[aria-label="Laboratório do mapa tático V8"]');
}

function findHp(article: HTMLElement | null) {
  if (!article) return null;
  const spans = Array.from(article.querySelectorAll<HTMLElement>("span"));
  const value = spans
    .map((span) => span.textContent?.match(/HP\s+(\d+)\/(\d+)/i))
    .find(Boolean);
  return value ? Number(value[1]) : null;
}

function addPresentationClasses(lab: HTMLElement) {
  lab.classList.add("tactical-premium-lab");

  const shell = lab.closest<HTMLElement>('[data-combat-mode="battle"]');
  if (shell) {
    const topbar = Array.from(shell.children).find((entry) => {
      const text = entry.textContent ?? "";
      return text.includes("Preparação") && text.includes("Log / detalhes");
    });
    topbar?.classList.add("battleTopbar");
  }

  const direct = Array.from(lab.children) as HTMLElement[];
  const hiddenHeader = direct.find((entry) => entry.tagName === "HEADER");
  const roundText = hiddenHeader?.textContent?.match(/Rodada\s+(\d+)/i)?.[1];
  if (roundText) lab.dataset.round = roundText;

  const hud = direct.find(
    (entry) => entry.tagName === "SECTION" && entry.querySelectorAll(":scope > article").length === 2,
  );
  hud?.classList.add("combatHud");
  hud?.querySelectorAll<HTMLElement>("article").forEach((article, index) => {
    article.classList.add(index === 0 ? "tactical-player-hud" : "tactical-enemy-hud");
    article.querySelectorAll<HTMLElement>("div").forEach((div) => {
      if (div.querySelector(":scope > i")) div.classList.add("bar");
    });
  });

  const toolbar = direct.find((entry) =>
    Array.from(entry.querySelectorAll("button")).some((button) => button.textContent?.includes("Movimento")),
  );
  toolbar?.classList.add("toolbar", "tactical-actionbar");
  if (toolbar) {
    const buttons = Array.from(toolbar.querySelectorAll<HTMLButtonElement>(":scope > button"));
    const movement = buttons.find((button) => button.textContent?.includes("Movimento"));
    const basic = buttons.find((button) => button.textContent?.includes("Ataque"));
    const end = buttons.find((button) => button.textContent?.includes("Encerrar turno"));
    const reset = buttons.find((button) => button.textContent?.includes("Reiniciar"));
    if (movement) movement.dataset.combatAction = "movement";
    if (basic) {
      basic.dataset.combatAction = "basic";
      basic.dataset.actionLabel = "Ataque Básico";
    }
    if (end) {
      end.dataset.combatAction = "end";
      end.dataset.actionLabel = "Encerrar Turno";
    }
    if (reset) reset.dataset.combatAction = "reset";
  }

  const skillBar = direct.find((entry) =>
    Array.from(entry.querySelectorAll("button")).some((button) => /Classe · Alcance|Raça · Alcance|Item ativo/.test(button.textContent ?? "")),
  );
  skillBar?.classList.add("skillBar", "tactical-contextbar");

  const workspace = direct.find((entry) => entry.querySelector("aside"));
  if (workspace) {
    workspace.classList.add("workspace", "tactical-workspace");
    const boardShell = workspace.firstElementChild as HTMLElement | null;
    boardShell?.classList.add("boardShell", "tactical-board-shell");
    if (boardShell && roundText) boardShell.dataset.roundLabel = `RODADA ${roundText}`;
    const board = boardShell?.querySelector<HTMLElement>(":scope > div");
    board?.classList.add("board", "tactical-board");
    board?.querySelectorAll<HTMLElement>(":scope > button").forEach((cell) => {
      cell.classList.add("cell", "tactical-cell");
      cell.querySelectorAll<HTMLElement>(":scope > span").forEach((span) => {
        if (span.textContent === "♞" || span.textContent === "♜") span.classList.add("unit", "tactical-unit");
      });
    });
  }

  document.querySelectorAll<HTMLElement>("button[data-category]").forEach((button) => button.classList.add("category"));
}

function spawnFloat(kind: "damage" | "heal", amount: number, target: "player" | "enemy") {
  const lab = findLab();
  const cell = lab?.querySelector<HTMLElement>(`[data-state="${target}"]`);
  if (!cell || amount <= 0) return;

  const rect = cell.getBoundingClientRect();
  const float = document.createElement("div");
  float.className = "tactical-combat-float";
  float.dataset.kind = kind;
  float.textContent = `${kind === "damage" ? "−" : "+"}${amount}`;
  float.style.left = `${rect.left + rect.width / 2}px`;
  float.style.top = `${rect.top + rect.height * 0.2}px`;
  document.body.appendChild(float);

  cell.classList.remove("tactical-vfx-impact", "tactical-vfx-heal");
  void cell.offsetWidth;
  cell.classList.add(kind === "damage" ? "tactical-vfx-impact" : "tactical-vfx-heal");

  window.setTimeout(() => {
    float.remove();
    cell.classList.remove("tactical-vfx-impact", "tactical-vfx-heal");
  }, 950);
}

export function TacticalPresentationBridge({ active }: { active: boolean }) {
  const previousHp = useRef<HpSnapshot>({ player: null, enemy: null });

  useEffect(() => {
    if (!active) {
      previousHp.current = { player: null, enemy: null };
      return;
    }

    const lab = findLab();
    if (!lab) return;

    const sync = () => {
      addPresentationClasses(lab);
      const articles = lab.querySelectorAll<HTMLElement>(".combatHud > article, section > article");
      const playerArticle = articles[0] ?? null;
      const enemyArticle = articles[1] ?? null;
      const next = { player: findHp(playerArticle), enemy: findHp(enemyArticle) };
      const before = previousHp.current;

      if (before.player !== null && next.player !== null && next.player !== before.player) {
        spawnFloat(next.player < before.player ? "damage" : "heal", Math.abs(next.player - before.player), "player");
      }
      if (before.enemy !== null && next.enemy !== null && next.enemy !== before.enemy) {
        spawnFloat(next.enemy < before.enemy ? "damage" : "heal", Math.abs(next.enemy - before.enemy), "enemy");
      }
      previousHp.current = next;
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(lab, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["data-state", "disabled"] });
    return () => observer.disconnect();
  }, [active]);

  return null;
}
