import type { ClassSkill } from "@/lib/game/classes";
import type { AttributeKey } from "@/lib/game/schemas";

const tacticalTransformationModifiers: Record<
  string,
  Array<{ attribute: AttributeKey; value: number }>
> = {
  "forma-serafinica": [
    { attribute: "ARC", value: 18 },
    { attribute: "RES", value: 12 },
  ],
  "forma-draconica": [
    { attribute: "FOR", value: 18 },
    { attribute: "DEF", value: 12 },
  ],
  "transe-ancestral": [
    { attribute: "INT", value: 18 },
    { attribute: "INI", value: 12 },
  ],
  "glamour-supremo": [
    { attribute: "ARC", value: 18 },
    { attribute: "INI", value: 12 },
  ],
  improvisacao: [
    { attribute: "FOR", value: 8 },
    { attribute: "INT", value: 8 },
    { attribute: "ARC", value: 8 },
  ],
  "nove-caudas": [
    { attribute: "INT", value: 18 },
    { attribute: "ARC", value: 12 },
  ],
  "soberania-leonis": [
    { attribute: "FOR", value: 18 },
    { attribute: "RES", value: 12 },
  ],
  "forma-lunar": [
    { attribute: "FOR", value: 18 },
    { attribute: "INI", value: 12 },
  ],
  "frenesi-orc": [
    { attribute: "FOR", value: 18 },
    { attribute: "RES", value: 12 },
  ],
  "avatar-infernal": [
    { attribute: "INT", value: 18 },
    { attribute: "ARC", value: 12 },
  ],
  "senhor-da-noite": [
    { attribute: "FOR", value: 12 },
    { attribute: "INT", value: 12 },
    { attribute: "INI", value: 8 },
  ],
};

export function repairTacticalInertSkill(skill: ClassSkill): ClassSkill {
  let repaired = false;
  const operations = skill.operations.map((operation) => {
    if (
      !["APPLY_STATUS", "BUFF"].includes(operation.operation) ||
      operation.modifiers.length > 0 ||
      !operation.status
    ) {
      return operation;
    }

    const modifiers = tacticalTransformationModifiers[operation.status];
    if (!modifiers) return operation;
    repaired = true;
    return {
      ...operation,
      modifiers,
    };
  });

  if (!repaired) return skill;

  const repairedEffects = operations
    .flatMap((operation) => operation.modifiers)
    .map((modifier) => `${modifier.value > 0 ? "+" : ""}${modifier.value} ${modifier.attribute}`)
    .join(" · ");

  return {
    ...skill,
    operations,
    systemRule: `${skill.systemRule} Regra tática provisória de transformação: ${repairedEffects}.`,
    playerDescription: `${skill.playerDescription} No mapa tático: ${repairedEffects}.`,
  };
}

export function getTacticalTransformationModifiers(status: string) {
  return tacticalTransformationModifiers[status] ?? null;
}
