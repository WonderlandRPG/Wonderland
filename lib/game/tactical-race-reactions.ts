import type { ClassSkill } from "@/lib/game/classes";
import type { CombatantState } from "@/lib/game/combat";

export type TacticalRaceReactionContext = {
  dealtDamage?: number;
  tookDamage?: number;
  damageType?: "physical" | "magic" | "true";
  distance?: number;
  targetHpBefore?: number;
  targetMaxHp?: number;
  skill?: ClassSkill;
  firstSuccessfulActionThisRound?: boolean;
};

export type TacticalRaceReactionResult = {
  combatant: CombatantState;
  triggered: boolean;
  message: string | null;
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function hasOperation(skill: ClassSkill | undefined, operations: string[]) {
  return Boolean(skill?.operations.some((operation) => operations.includes(operation.operation)));
}

function appliedNegativeStatus(skill: ClassSkill | undefined) {
  return Boolean(
    skill?.operations.some(
      (operation) =>
        (operation.target === "enemy" || operation.target === "area") &&
        ["DEBUFF", "APPLY_STATUS", "STUN", "ROOT", "SILENCE", "FEAR", "TAUNT"].includes(
          operation.operation,
        ),
    ),
  );
}

function didControl(skill: ClassSkill | undefined) {
  return hasOperation(skill, ["STUN", "ROOT", "SILENCE", "FEAR", "TAUNT"]);
}

function shouldTrigger(
  raceName: string,
  combatant: CombatantState,
  context: TacticalRaceReactionContext,
) {
  const race = normalize(raceName);
  const dealtDamage = Math.max(0, context.dealtDamage ?? 0);
  const tookDamage = Math.max(0, context.tookDamage ?? 0);
  const targetWasInjured =
    typeof context.targetHpBefore === "number" &&
    typeof context.targetMaxHp === "number" &&
    context.targetHpBefore < context.targetMaxHp;
  const targetWasBelowHalf =
    typeof context.targetHpBefore === "number" &&
    typeof context.targetMaxHp === "number" &&
    context.targetHpBefore < context.targetMaxHp * 0.5;

  if (race === "aengel") return hasOperation(context.skill, ["HEAL", "SHIELD"]);
  if (race === "draconato") return tookDamage >= combatant.maxHp * 0.1;
  if (race === "elfo") return dealtDamage > 0 && (context.distance ?? 0) >= 3;
  if (race === "fada") {
    return hasOperation(context.skill, ["HEAL", "SHIELD"]) || didControl(context.skill);
  }
  if (race === "humano") return context.firstSuccessfulActionThisRound === true;
  if (race === "kitsune") return appliedNegativeStatus(context.skill);
  if (race === "leonis") return hasOperation(context.skill, ["SHIELD", "TAUNT"]);
  if (race === "lobisomem") return dealtDamage > 0 && targetWasBelowHalf;
  if (race === "orc") return tookDamage > 0;
  if (race === "tiefling") return dealtDamage > 0 && context.damageType === "magic";
  if (race === "vampiro") return dealtDamage > 0 && targetWasInjured;
  return false;
}

export function applyTacticalRacialReaction(
  combatant: CombatantState,
  raceName: string,
  context: TacticalRaceReactionContext,
): TacticalRaceReactionResult {
  if (!shouldTrigger(raceName, combatant, context) || combatant.maxRaceResource <= 0) {
    return { combatant, triggered: false, message: null };
  }

  const nextValue = Math.min(combatant.maxRaceResource, combatant.raceResource + 1);
  if (nextValue === combatant.raceResource) {
    return { combatant, triggered: false, message: null };
  }

  const resourceName = combatant.raceResourceName || "Recurso Racial";
  return {
    combatant: { ...combatant, raceResource: nextValue },
    triggered: true,
    message: `REAÇÃO RACIAL: +1 ${resourceName}.`,
  };
}
