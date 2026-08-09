import { z } from "zod";

import { combineAttributes, deriveStats, type CombatRules } from "@/lib/game/combat";
import type { RacePayload } from "@/lib/game/races";
import { attributeKeys, attributesSchema } from "@/lib/game/schemas";

export const allocatedAttributesSchema = z.object({
  FOR: z.number().int().min(0),
  DEF: z.number().int().min(0),
  RES: z.number().int().min(0),
  INI: z.number().int().min(0),
  INT: z.number().int().min(0),
  ARC: z.number().int().min(0),
});

export type AllocatedAttributes = z.infer<typeof allocatedAttributesSchema>;

export const defaultBaseAttributes = attributesSchema.parse({
  FOR: 20,
  DEF: 20,
  RES: 20,
  INI: 20,
  INT: 20,
  ARC: 20,
});

export interface CharacterRules {
  baseAttributes: typeof defaultBaseAttributes;
  distributablePoints: number;
  maximumSlots: number;
  maximumLevel: number;
}

export const defaultCharacterRules: CharacterRules = {
  baseAttributes: defaultBaseAttributes,
  distributablePoints: 100,
  maximumSlots: 3,
  maximumLevel: 100,
};

export function getAllocatedTotal(attributes: AllocatedAttributes) {
  return attributeKeys.reduce((total, attribute) => total + attributes[attribute], 0);
}

export function buildCharacterAttributes(
  allocated: AllocatedAttributes,
  race: RacePayload,
  rules: CharacterRules = defaultCharacterRules,
  equipmentBonuses: Partial<typeof defaultBaseAttributes> = {},
) {
  return combineAttributes(
    rules.baseAttributes,
    allocated,
    race.attributeBonuses,
    equipmentBonuses,
  );
}

export function buildCharacterStats(
  allocated: AllocatedAttributes,
  race: RacePayload,
  characterRules: CharacterRules,
  combatRules: CombatRules,
  equipmentBonuses: Partial<typeof defaultBaseAttributes> = {},
) {
  const attributes = buildCharacterAttributes(allocated, race, characterRules, equipmentBonuses);
  return {
    attributes,
    ...deriveStats(attributes, race.baseHp, race.baseMana, combatRules),
  };
}

export function getUnlockedRaceAbilities(race: RacePayload, level: number) {
  return race.progression.filter((entry) => entry.level <= level).sort((a, b) => a.level - b.level);
}

export function createEmptyAllocation(): AllocatedAttributes {
  return { FOR: 0, DEF: 0, RES: 0, INI: 0, INT: 0, ARC: 0 };
}
