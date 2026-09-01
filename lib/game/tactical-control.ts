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

export function isTacticalTurnDisabled(combatant: CombatantState) {
  return getTacticalStunTurns(combatant) > 0;
}
