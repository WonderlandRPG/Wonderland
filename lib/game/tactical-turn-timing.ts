import type { CombatantState } from "@/lib/game/combat";

export function tickTacticalCooldownValues(combatant: CombatantState): CombatantState {
  return {
    ...combatant,
    cooldowns: Object.fromEntries(
      Object.entries(combatant.cooldowns).map(([key, value]) => [key, Math.max(0, value - 1)]),
    ),
  };
}

export function tickTacticalStatusGroup(
  combatant: CombatantState,
  beneficial: boolean,
): CombatantState {
  return {
    ...combatant,
    statuses: Object.fromEntries(
      Object.entries(combatant.statuses)
        .map(([key, status]) => {
          if (status.beneficial !== beneficial) return [key, status] as const;
          return [key, { ...status, duration: status.duration - 1 }] as const;
        })
        .filter(([, status]) => status.duration > 0),
    ),
  };
}

export function prepareEnemyTacticalTurn(player: CombatantState, enemy: CombatantState) {
  return {
    player: tickTacticalStatusGroup(player, false),
    enemy: tickTacticalStatusGroup(enemy, true),
  };
}

export function completeEnemyTacticalTurn(player: CombatantState, enemy: CombatantState) {
  return {
    player: tickTacticalCooldownValues(tickTacticalStatusGroup(player, true)),
    enemy: tickTacticalCooldownValues(tickTacticalStatusGroup(enemy, false)),
  };
}
