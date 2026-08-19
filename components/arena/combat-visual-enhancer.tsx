"use client";

import { useEffect } from "react";
import { visualFromStatusText, type CombatStatusIconKey } from "@/lib/game/combat-status-visual";

function appendLegacyIcon(
  dock: HTMLElement,
  options: {
    kind: "buff" | "debuff" | "shield";
    iconKey: CombatStatusIconKey;
    title: string;
    marker: string;
    duration: string;
  },
) {
  const icon = document.createElement("span");
  icon.className = `combat-status-icon combat-status-icon--${options.kind}`;
  icon.title = options.title;

  const glyph = document.createElement("span");
  glyph.className = `combat-status-glyph combat-status-glyph--${options.iconKey}`;
  glyph.setAttribute("aria-hidden", "true");

  const marker = document.createElement("i");
  marker.textContent = options.marker;
  const duration = document.createElement("small");
  duration.textContent = options.duration;

  icon.append(glyph, marker, duration);
  dock.append(icon);
}

function buildLegacyStatusDock(fighter: HTMLElement) {
  const hud = fighter.querySelector<HTMLElement>(".combat-hud-panel");
  if (!hud) return;

  const nativeDock = hud.querySelector<HTMLElement>(
    ":scope > .combat-status-dock:not(.combat-status-dock--enhanced)",
  );
  if (nativeDock) {
    hud.querySelector<HTMLElement>(":scope > .combat-status-dock--enhanced")?.remove();
    return;
  }

  const statusSource = fighter.querySelector<HTMLElement>(".jrpg-statuses");
  const statusTexts = statusSource
    ? Array.from(statusSource.querySelectorAll<HTMLElement>(":scope > span"))
        .map((span) => span.textContent?.trim() ?? "")
        .filter(Boolean)
    : [];
  const shieldMeter = fighter.querySelector<HTMLElement>(".combat-meter--shield");
  const shieldText = shieldMeter?.querySelector<HTMLElement>("strong")?.textContent?.trim() ?? "";
  const signature = JSON.stringify({ statusTexts, shieldText });

  let dock = hud.querySelector<HTMLElement>(":scope > .combat-status-dock--enhanced");
  if (!statusTexts.length && !shieldMeter) {
    dock?.remove();
    fighter.classList.remove("has-combat-buff", "has-combat-debuff", "has-combat-shield");
    return;
  }

  if (!dock) {
    dock = document.createElement("div");
    dock.className = "combat-status-dock combat-status-dock--enhanced";
    dock.setAttribute("aria-label", "Efeitos ativos");
    const hp = hud.querySelector<HTMLElement>(".combat-meter--hp");
    if (hp) hud.insertBefore(dock, hp);
    else hud.prepend(dock);
  }

  if (dock.dataset.signature === signature) return;
  dock.dataset.signature = signature;
  dock.replaceChildren();

  let hasBuff = false;
  let hasDebuff = false;
  if (shieldMeter) {
    appendLegacyIcon(dock, {
      kind: "shield",
      iconKey: "shield",
      title: `Escudo ativo · ${shieldText || "proteção temporária"}`,
      marker: "+",
      duration: shieldText.split("/")[0]?.trim() || "ON",
    });
  }

  for (const text of statusTexts) {
    const visual = visualFromStatusText(text);
    const duration = text.match(/(\d+)\s*T/i)?.[1];
    appendLegacyIcon(dock, {
      kind: visual.kind,
      iconKey: visual.iconKey,
      title: text,
      marker: visual.kind === "buff" ? "↑" : "↓",
      duration: duration ? `${duration}T` : "ON",
    });
    hasBuff ||= visual.kind === "buff";
    hasDebuff ||= visual.kind === "debuff";
  }

  fighter.classList.toggle("has-combat-buff", hasBuff);
  fighter.classList.toggle("has-combat-debuff", hasDebuff);
  fighter.classList.toggle("has-combat-shield", Boolean(shieldMeter));
}

function labelCombatFx(root: ParentNode) {
  root.querySelectorAll<HTMLElement>(".combat-fx").forEach((fx) => {
    if (fx.classList.contains("combat-fx--heal")) fx.dataset.fxLabel = "CURA";
    else if (fx.classList.contains("combat-fx--shield")) fx.dataset.fxLabel = "ESCUDO";
    else if (fx.classList.contains("combat-fx--magic")) fx.dataset.fxLabel = "MAGIA";
    else fx.dataset.fxLabel = "DANO";
  });
}

function enhanceCombatUi() {
  document.querySelectorAll<HTMLElement>(".jrpg-fighter").forEach(buildLegacyStatusDock);
  labelCombatFx(document);
}

export function CombatVisualEnhancer() {
  useEffect(() => {
    let queued = false;
    const run = () => {
      queued = false;
      enhanceCombatUi();
    };
    const schedule = () => {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(run);
    };

    enhanceCombatUi();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
