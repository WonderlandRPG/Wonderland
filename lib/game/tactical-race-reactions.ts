import type { ClassSkill } from "@/lib/game/classes";
import type { CombatantState } from "@/lib/game/combat";

const HUMAN_ACTION_MARKER = "tactical-human-first-action-used";

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

function matchesIdentity(identity: string, ...values: string[]) {
  const normalized = normalize(identity);
  return values.some((value) => normalized === normalize(value));
}

function isHumanIdentity(identity: string) {
  return matchesIdentity(identity, "Humano", "Determinação", "Determinacao");
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

function hasSuccessfulAction(context: TacticalRaceReactionContext) {
  if ((context.dealtDamage ?? 0) > 0) return true;
  if (context.skill) return true;
  return context.firstSuccessfulActionThisRound === true;
}

function shouldTrigger(
  raceOrResourceName: string,
  combatant: CombatantState,
  context: TacticalRaceReactionContext,
) {
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

  if (matchesIdentity(raceOrResourceName, "Aengel", "Radiância", "Radiancia")) {
    return hasOperation(context.skill, ["HEAL", "SHIELD"]);
  }
  if (matchesIdentity(raceOrResourceName, "Draconato", "Carga Dracônica", "Carga Draconica")) {
    return tookDamage >= combatant.maxHp * 0.1;
  }
  if (matchesIdentity(raceOrResourceName, "Elfo", "Foco Ancestral")) {
    return dealtDamage > 0 && (context.distance ?? 0) >= 3;
  }
  if (matchesIdentity(raceOrResourceName, "Fada", "Pó Feérico", "Po Feerico")) {
    return hasOperation(context.skill, ["HEAL", "SHIELD"]) || didControl(context.skill);
  }
  if (isHumanIdentity(raceOrResourceName)) {
    const explicit = context.firstSuccessfulActionThisRound;
    const markerMissing = !combatant.statuses[HUMAN_ACTION_MARKER];
    return (explicit ?? markerMissing) && markerMissing && hasSuccessfulAction(context);
  }
  if (matchesIdentity(raceOrResourceName, "Kitsune", "Cauda Mística", "Cauda Mistica")) {
    return appliedNegativeStatus(context.skill);
  }
  if (matchesIdentity(raceOrResourceName, "Leonis", "Bravura")) {
    return hasOperation(context.skill, ["SHIELD", "TAUNT"]);
  }
  if (matchesIdentity(raceOrResourceName, "Lobisomem", "Faro de Sangue")) {
    return dealtDamage > 0 && targetWasBelowHalf;
  }
  if (matchesIdentity(raceOrResourceName, "Orc", "Ímpeto de Guerra", "Impeto de Guerra")) {
    return tookDamage > 0;
  }
  if (matchesIdentity(raceOrResourceName, "Tiefling", "Marca Infernal")) {
    return dealtDamage > 0 && context.damageType === "magic";
  }
  if (matchesIdentity(raceOrResourceName, "Vampiro", "Sangue")) {
    return dealtDamage > 0 && targetWasInjured;
  }
  return false;
}

export function applyTacticalRacialReaction(
  combatant: CombatantState,
  raceOrResourceName: string,
  context: TacticalRaceReactionContext,
): TacticalRaceReactionResult {
  if (!shouldTrigger(raceOrResourceName, combatant, context) || combatant.maxRaceResource <= 0) {
    return { combatant, triggered: false, message: null };
  }

  const nextValue = Math.min(combatant.maxRaceResource, combatant.raceResource + 1);
  if (nextValue === combatant.raceResource) {
    return { combatant, triggered: false, message: null };
  }

  const resourceName = combatant.raceResourceName || "Recurso Racial";
  const nextCombatant = isHumanIdentity(raceOrResourceName)
    ? {
        ...combatant,
        raceResource: nextValue,
        statuses: {
          ...combatant.statuses,
          [HUMAN_ACTION_MARKER]: {
            name: "Adaptabilidade usada nesta rodada",
            duration: 1,
            stacks: 1,
            modifiers: {},
            beneficial: true,
          },
        },
      }
    : { ...combatant, raceResource: nextValue };

  return {
    combatant: nextCombatant,
    triggered: true,
    message: `REAÇÃO RACIAL: +1 ${resourceName}.`,
  };
}
