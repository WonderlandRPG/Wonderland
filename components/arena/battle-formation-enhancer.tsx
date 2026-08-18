"use client";

import { useEffect } from "react";

const FRONTLINE_CLASSES = [
  "guerreiro", "barbaro", "bárbaro", "espadachim", "paladino", "monge",
  "cavaleiro", "templario", "templário", "lanceiro", "berserker",
];

const BACKLINE_CLASSES = [
  "arqueiro", "mago", "feiticeiro", "bruxo", "bardo", "alquimista",
  "necromante", "druida", "clerigo", "clérigo", "sacerdote", "invocador",
];

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function formationFor(text: string) {
  const normalized = normalize(text);
  if (BACKLINE_CLASSES.some((entry) => normalized.includes(normalize(entry)))) return "back";
  if (FRONTLINE_CLASSES.some((entry) => normalized.includes(normalize(entry)))) return "front";
  return "front";
}

function ensureBadge(fighter: HTMLElement, label: string) {
  let badge = fighter.querySelector<HTMLElement>(":scope > .combat-formation-badge");
  if (!badge) {
    badge = document.createElement("span");
    badge.className = "combat-formation-badge";
    fighter.prepend(badge);
  }
  if (badge.textContent !== label) badge.textContent = label;
}

function classifyFighter(fighter: HTMLElement) {
  fighter.classList.remove("formation-front", "formation-back", "jrpg-monster-card", "jrpg-boss-card");
  const subtitle = fighter.querySelector<HTMLElement>(".combat-hud-panel p")?.textContent ?? "";
  const monsterArt = fighter.querySelector<HTMLElement>(".monster-art");

  if (monsterArt) {
    fighter.classList.add("jrpg-monster-card");
    const normalizedSubtitle = normalize(subtitle);
    const finalBoss = normalizedSubtitle.includes("boss") && !normalizedSubtitle.includes("mini") && !normalizedSubtitle.includes("sub");
    if (finalBoss) fighter.classList.add("jrpg-boss-card");
    return;
  }

  const formation = formationFor(subtitle);
  fighter.classList.add(formation === "back" ? "formation-back" : "formation-front");
  ensureBadge(fighter, formation === "back" ? "RETAGUARDA" : "LINHA DE FRENTE");
}

function classifyMode(stage: HTMLElement) {
  stage.classList.remove("combat-stage-training", "combat-stage-pve", "combat-stage-pvp", "combat-stage-dungeon");
  const battle = stage.closest<HTMLElement>(".jrpg-battle");
  const header = normalize(battle?.querySelector<HTMLElement>(".arena-game-header .eyebrow")?.textContent ?? "");
  if (header.includes("dungeon")) stage.classList.add("combat-stage-dungeon");
  else if (header.includes("pvp")) stage.classList.add("combat-stage-pvp");
  else if (header.includes("pve")) stage.classList.add("combat-stage-pve");
  else stage.classList.add("combat-stage-training");
}

function removeDefenderCommands() {
  document.querySelectorAll<HTMLButtonElement>(".jrpg-command-panel button, .arena-command-panel button").forEach((button) => {
    const title = normalize(button.querySelector("strong")?.textContent ?? button.textContent ?? "").trim();
    if (title === "defender" || title.startsWith("defender ")) button.remove();
  });
}

function enhanceStage(stage: HTMLElement) {
  stage.classList.add("jrpg-formation-stage");
  classifyMode(stage);

  const party = stage.querySelector<HTMLElement>(":scope > .jrpg-party-stage");
  const duoTeams = Array.from(stage.querySelectorAll<HTMLElement>(":scope > .duo-team"));
  const directFighters = Array.from(stage.querySelectorAll<HTMLElement>(":scope > .jrpg-fighter"));

  if (party) {
    party.classList.add("combat-party-side");
    const partyFighters = Array.from(party.querySelectorAll<HTMLElement>(":scope > .jrpg-fighter"));
    partyFighters.forEach(classifyFighter);
    const front = partyFighters.filter((fighter) => fighter.classList.contains("formation-front"));
    const back = partyFighters.filter((fighter) => fighter.classList.contains("formation-back"));
    front.forEach((fighter, index) => fighter.classList.toggle("formation-label-visible", index === 0));
    back.forEach((fighter, index) => fighter.classList.toggle("formation-label-visible", index === 0));
  }

  if (duoTeams.length) {
    duoTeams.forEach((team) => {
      const fighters = Array.from(team.querySelectorAll<HTMLElement>(":scope > .jrpg-fighter"));
      fighters.forEach(classifyFighter);
      const front = fighters.filter((fighter) => fighter.classList.contains("formation-front"));
      const back = fighters.filter((fighter) => fighter.classList.contains("formation-back"));
      front.forEach((fighter, index) => fighter.classList.toggle("formation-label-visible", index === 0));
      back.forEach((fighter, index) => fighter.classList.toggle("formation-label-visible", index === 0));
    });
    return;
  }

  directFighters.forEach(classifyFighter);
  if (party) {
    directFighters.forEach((fighter) => fighter.classList.add("combat-enemy-side"));
    return;
  }

  if (directFighters.length >= 2) {
    const monsterIndex = directFighters.findIndex((fighter) => fighter.classList.contains("jrpg-monster-card"));
    if (monsterIndex >= 0) {
      directFighters.forEach((fighter, index) => {
        fighter.classList.toggle("combat-enemy-side", index === monsterIndex);
        fighter.classList.toggle("combat-party-side", index !== monsterIndex);
      });
    } else {
      directFighters[0]?.classList.add("combat-party-side");
      directFighters[1]?.classList.add("combat-enemy-side");
    }
  }
}

function enhanceAll() {
  removeDefenderCommands();
  document.querySelectorAll<HTMLElement>(".jrpg-stage").forEach(enhanceStage);
}

export function BattleFormationEnhancer() {
  useEffect(() => {
    let frame = 0;
    let disposed = false;

    const observer = new MutationObserver(() => {
      if (disposed || frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        if (disposed) return;
        observer.disconnect();
        enhanceAll();
        observer.observe(document.body, { childList: true, subtree: true });
      });
    });

    // Run the initial pass before observing. This is important: the enhancer itself
    // inserts formation badges, and observing those writes used to recursively
    // trigger another full pass until some browsers became unresponsive.
    enhanceAll();
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);
  return null;
}
