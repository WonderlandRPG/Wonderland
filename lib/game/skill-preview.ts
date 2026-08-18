import type { ClassSkill } from "@/lib/game/classes";
import {
  calculateDamage,
  getEffectiveAttributes,
  type CombatRules,
  type CombatantState,
} from "@/lib/game/combat";

const attributeLabel: Record<string, string> = {
  FOR: "FOR",
  DEF: "DEF",
  RES: "RES",
  INI: "INI",
  INT: "INT",
  ARC: "ARC",
};

function operationPower(actor: CombatantState, operation: ClassSkill["operations"][number]) {
  const attributes = getEffectiveAttributes(actor);
  return Math.max(
    0,
    Math.round(
      operation.base +
        operation.scaling.reduce(
          (total, scaling) => total + attributes[scaling.attribute] * scaling.multiplier,
          0,
        ),
    ),
  );
}

function scalingText(operation: ClassSkill["operations"][number]) {
  const parts = operation.scaling.map(
    (scaling) => `${scaling.multiplier}x ${attributeLabel[scaling.attribute]}`,
  );
  if (operation.base > 0) parts.unshift(String(operation.base));
  return parts.join(" + ");
}

export function getSkillCombatPreview(
  skill: ClassSkill,
  actor: CombatantState,
  target: CombatantState,
  rules: CombatRules,
) {
  const lines: string[] = [];

  for (const operation of skill.operations) {
    const power = operationPower(actor, operation);
    const formula = scalingText(operation);

    if (operation.operation === "DAMAGE") {
      const type = operation.damageType === "none" ? "physical" : operation.damageType;
      const damage = calculateDamage(power, type, getEffectiveAttributes(target), rules);
      const label = type === "magic" ? "mágico" : type === "true" ? "verdadeiro" : "físico";
      lines.push(`Dano previsto: ${damage} ${label}${formula ? ` · ${formula}` : ""}`);
      continue;
    }

    if (operation.operation === "HEAL") {
      lines.push(`Cura prevista: ${power}${formula ? ` · ${formula}` : ""}`);
      continue;
    }

    if (operation.operation === "SHIELD") {
      lines.push(`Escudo previsto: ${power}${formula ? ` · ${formula}` : ""}`);
      continue;
    }

    if (["STUN", "ROOT", "SILENCE", "FEAR"].includes(operation.operation)) {
      const label =
        operation.operation === "STUN"
          ? "Atordoa"
          : operation.operation === "SILENCE"
            ? "Silencia"
            : operation.operation === "FEAR"
              ? "Amedronta"
              : "Reduz iniciativa";
      lines.push(`${label}${operation.duration ? ` por ${operation.duration} turno(s)` : ""}`);
      continue;
    }

    if (operation.operation === "BUFF" || operation.operation === "DEBUFF") {
      const mods = operation.modifiers
        .map((modifier) => `${modifier.value >= 0 ? "+" : ""}${modifier.value} ${modifier.attribute}`)
        .join(", ");
      lines.push(`${operation.operation === "BUFF" ? "Fortalece" : "Enfraquece"}${mods ? `: ${mods}` : ""}${operation.duration ? ` · ${operation.duration}T` : ""}`);
      continue;
    }

    if (operation.operation === "APPLY_STATUS" && operation.status) {
      lines.push(`${operation.status}${operation.duration ? ` · ${operation.duration}T` : ""}`);
    }
  }

  return {
    description: skill.playerDescription || skill.effect,
    effectLines: lines.length ? lines : [skill.effect],
  };
}
