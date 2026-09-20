import { calculateDamage, getEffectiveAttributes, type CombatantState } from "@/lib/game/combat";
import { resolvePeriodicItemDamage } from "@/lib/game/item-effects";

export type TacticalTurnTransition = {
  player: CombatantState;
  enemy: CombatantState;
  messages: string[];
};

export function resolveTacticalPeriodicDamage(combatant: CombatantState) {
  return resolvePeriodicItemDamage(combatant, (amount, type) =>
    calculateDamage(amount, type, getEffectiveAttributes(combatant)),
  );
}

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

export function prepareEnemyTacticalTurn(
  player: CombatantState,
  enemy: CombatantState,
): TacticalTurnTransition {
  const periodic = resolveTacticalPeriodicDamage(player);
  return {
    player: tickTacticalStatusGroup(periodic.combatant, false),
    enemy: tickTacticalStatusGroup(enemy, true),
    messages: periodic.messages,
  };
}

export function completeEnemyTacticalTurn(
  player: CombatantState,
  enemy: CombatantState,
): TacticalTurnTransition {
  const periodic = resolveTacticalPeriodicDamage(enemy);
  return {
    player: tickTacticalCooldownValues(tickTacticalStatusGroup(player, true)),
    enemy: tickTacticalCooldownValues(tickTacticalStatusGroup(periodic.combatant, false)),
    messages: periodic.messages,
  };
}
