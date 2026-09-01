import type { TacticalCombatOutcome } from "@/lib/game/tactical-combat-outcome";

export type TacticalActionUsage = {
  basic: boolean;
  classSkill: boolean;
  raceSkill: boolean;
  item: boolean;
};

export type TacticalActionRestrictions = {
  stunned: boolean;
  silenced: boolean;
  feared: boolean;
  rooted: boolean;
};

export type TacticalActionAvailability = {
  basic: boolean;
  classSkill: boolean;
  raceSkill: boolean;
  item: boolean;
  movement: boolean;
  endTurn: boolean;
};

export const initialTacticalActionUsage: TacticalActionUsage = {
  basic: false,
  classSkill: false,
  raceSkill: false,
  item: false,
};

export function getTacticalActionAvailability({
  outcome,
  usage,
  restrictions,
  hasItem,
}: {
  outcome: TacticalCombatOutcome;
  usage: TacticalActionUsage;
  restrictions: TacticalActionRestrictions;
  hasItem: boolean;
}): TacticalActionAvailability {
  if (outcome !== "ongoing") {
    return {
      basic: false,
      classSkill: false,
      raceSkill: false,
      item: false,
      movement: false,
      endTurn: false,
    };
  }

  const canAct = !restrictions.stunned;

  return {
    basic: canAct && !restrictions.feared && !usage.basic,
    classSkill: canAct && !restrictions.silenced && !usage.classSkill,
    raceSkill: canAct && !restrictions.silenced && !usage.raceSkill,
    item: canAct && hasItem && !usage.item,
    movement: canAct && !restrictions.rooted,
    endTurn: true,
  };
}

export function markTacticalActionUsed(
  usage: TacticalActionUsage,
  action: keyof TacticalActionUsage,
): TacticalActionUsage {
  if (usage[action]) return usage;
  return { ...usage, [action]: true };
}

export function resetTacticalActionUsage(): TacticalActionUsage {
  return { ...initialTacticalActionUsage };
}
