import { attributeKeys, type AttributeKey } from "@/lib/game/schemas";
import type { AllocatedAttributes } from "@/lib/game/characters";

export type CharacterPreset = "aggressive" | "balanced" | "defensive";

const attackAttributes = new Set<AttributeKey>(["FOR", "INI", "INT", "ARC"]);
const defenseAttributes = new Set<AttributeKey>(["DEF", "RES"]);

export function buildCharacterPreset(input: {
  preset: CharacterPreset;
  points: number;
  racialBonuses: AllocatedAttributes;
  primaryAttributes: AttributeKey[];
}): AllocatedAttributes {
  const { preset, racialBonuses, primaryAttributes } = input;
  const points = Math.max(0, Math.floor(input.points));
  const primary = new Set(primaryAttributes);
  const weights = Object.fromEntries(
    attributeKeys.map((attribute) => {
      const groupWeight =
        preset === "balanced"
          ? 4
          : preset === "aggressive"
            ? attackAttributes.has(attribute)
              ? 6
              : 2
            : defenseAttributes.has(attribute)
              ? 7
              : 2;
      const classWeight = primary.has(attribute)
        ? preset === "balanced"
          ? 3
          : preset === "aggressive" && attackAttributes.has(attribute)
            ? 5
            : preset === "defensive" && defenseAttributes.has(attribute)
              ? 5
              : 2
        : 0;
      const raceWeight = racialBonuses[attribute] * (preset === "balanced" ? 0.55 : 0.8);
      return [attribute, Math.max(0.5, groupWeight + classWeight + raceWeight)];
    }),
  ) as Record<AttributeKey, number>;
  const totalWeight = attributeKeys.reduce((sum, attribute) => sum + weights[attribute], 0);
  const exact = Object.fromEntries(
    attributeKeys.map((attribute) => [attribute, (weights[attribute] / totalWeight) * points]),
  ) as Record<AttributeKey, number>;
  const allocation = Object.fromEntries(
    attributeKeys.map((attribute) => [attribute, Math.floor(exact[attribute])]),
  ) as AllocatedAttributes;
  let remainder = points - attributeKeys.reduce((sum, attribute) => sum + allocation[attribute], 0);
  const priority = [...attributeKeys].sort(
    (left, right) =>
      exact[right] - Math.floor(exact[right]) - (exact[left] - Math.floor(exact[left])) ||
      weights[right] - weights[left] ||
      attributeKeys.indexOf(left) - attributeKeys.indexOf(right),
  );
  for (let index = 0; remainder > 0; index += 1, remainder -= 1) {
    allocation[priority[index % priority.length]] += 1;
  }
  return allocation;
}
