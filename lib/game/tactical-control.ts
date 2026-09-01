import type { CombatantState } from "@/lib/game/combat";

function normalizedStatusText(key: string, name: string) {
  return `${key} ${name}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function longestMatchingStatus(
  combatant: CombatantState,
  matches: (text: string) => boolean,
) {
  return Object.entries(combatant.statuses).reduce((longest, [key, status]) => {
    const text = normalizedStatusText(key, status.name);
    return matches(text) ? Math.max(longest, status.duration) : longest;
  }, 0);
}

export function getTacticalRootTurns(combatant: CombatantState) {
  return longestMatchingStatus(combatant, (text) =>
    /\broot\b|enraiz|imobil|prisao|controle/.test(text),
  );
}

export function getTacticalStunTurns(combatant: CombatantState) {
  return longestMatchingStatus(combatant, (text) =>
    /\bstun\b|atordo|aturdid|incapacit/.test(text),
  );
}

export function getTacticalSilenceTurns(combatant: CombatantState) {
  return longestMatchingStatus(combatant, (text) =>
    /\bsilence\b|silencio|silenciad/.test(text),
  );
}

export function getTacticalFearTurns(combatant: CombatantState) {
  return longestMatchingStatus(combatant, (text) =>
    /\bfear\b|\bmedo\b|amedront/.test(text),
  );
}

export function getTacticalTaunt(combatant: CombatantState) {
  let best: { turns: number; targetId: string } | null = null;
  for (const [key, status] of Object.entries(combatant.statuses)) {
    if (!status.forcedTargetId) continue;
    const text = normalizedStatusText(key, status.name);
    if (!/\btaunt\b|provoc/.test(text)) continue;
    if (!best || status.duration > best.turns) {
      best = { turns: status.duration, targetId: status.forcedTargetId };
    }
  }
  return best;
}

export function isTacticalTurnDisabled(combatant: CombatantState) {
  return getTacticalStunTurns(combatant) > 0;
}

export function canUseTacticalSkills(combatant: CombatantState) {
  return !isTacticalTurnDisabled(combatant) && getTacticalSilenceTurns(combatant) <= 0;
}

export function canUseTacticalOffense(combatant: CombatantState) {
  return !isTacticalTurnDisabled(combatant) && getTacticalFearTurns(combatant) <= 0;
}
