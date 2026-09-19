import { z } from "zod";

import type { ClassPayload, ClassSkill } from "@/lib/game/classes";
import type { RacePayload } from "@/lib/game/races";

export const defaultSkillLoadoutLimits = {
  classSkills: 4,
  raceSkills: 2,
  passives: 3,
  talents: 3,
} as const;

export const skillLoadoutLimitsSchema = z.object({
  classSkills: z.number().int().min(1).max(12),
  raceSkills: z.number().int().min(1).max(6),
  passives: z.number().int().min(1).max(12),
  talents: z.number().int().min(0).max(12),
});

export type SkillLoadoutLimits = z.infer<typeof skillLoadoutLimitsSchema>;

export const skillBalanceOverrideSchema = z.object({
  powerMultiplier: z.number().min(0).max(5).default(1),
  cooldownDelta: z.number().int().min(-20).max(20).default(0),
  rangeDelta: z.number().int().min(-20).max(20).default(0),
  areaDelta: z.number().int().min(-20).max(20).default(0),
  costDelta: z.number().int().min(-999).max(999).default(0),
  disabled: z.boolean().default(false),
});

export const skillBalanceOverridesSchema = z.record(z.string().min(1), skillBalanceOverrideSchema);
export type SkillBalanceOverrides = z.infer<typeof skillBalanceOverridesSchema>;

export interface SkillLoadout {
  classSkillKeys: string[];
  raceSkillKeys: string[];
  passiveKeys: string[];
  talentKeys: string[];
  persisted: boolean;
}

export interface PassiveOption {
  key: string;
  name: string;
  description: string;
  source: "Classe" | "Caminho" | "Raça";
}

export interface SkillLoadoutAvailability {
  classSkillKeys: string[];
  raceSkillKeys: string[];
  passiveKeys: string[];
  talentKeys: string[];
}

export interface StoredSkillLoadout {
  equipped_class_skill_keys: string[];
  equipped_race_skill_keys: string[];
  selected_passive_keys: string[];
  selected_talent_keys: string[];
}

function uniqueAllowed(keys: readonly string[], allowed: readonly string[]) {
  const allowedSet = new Set(allowed);
  return [...new Set(keys)].filter((key) => allowedSet.has(key));
}

export function getPassiveOptions(
  classPayload: ClassPayload,
  racePayload: RacePayload,
  classPathKey: string | null,
): PassiveOption[] {
  const path = classPayload.paths.find((entry) => entry.key === classPathKey);
  return [
    {
      key: "class:base",
      name: classPayload.passive.name,
      description: classPayload.passive.description,
      source: "Classe" as const,
    },
    ...(path
      ? [
          {
            key: `path:${path.key}`,
            name: path.passive.name,
            description: path.passive.description,
            source: "Caminho" as const,
          },
        ]
      : []),
    ...racePayload.traits.map((entry, index) => ({
      key: `race:trait:${index}`,
      name: entry.name,
      description: entry.description,
      source: "Raça" as const,
    })),
    ...racePayload.mechanics.map((entry, index) => ({
      key: `race:mechanic:${index}`,
      name: entry.name,
      description: entry.description,
      source: "Raça" as const,
    })),
  ];
}

export function getTalentSkills(
  classPayload: ClassPayload,
  classPathKey: string | null,
  level: number,
) {
  return (classPayload.paths.find((entry) => entry.key === classPathKey)?.skills ?? [])
    .filter((skill) => skill.level <= level)
    .sort((left, right) => left.level - right.level || left.name.localeCompare(right.name));
}

export function buildSkillLoadoutAvailability({
  classSkills,
  raceSkills,
  passiveOptions,
  talentSkills,
}: {
  classSkills: ClassSkill[];
  raceSkills: ClassSkill[];
  passiveOptions: PassiveOption[];
  talentSkills: ClassSkill[];
}): SkillLoadoutAvailability {
  return {
    classSkillKeys: classSkills
      .filter((skill) => !/passiva|rea[cç][aã]o/i.test(skill.type))
      .map((skill) => skill.key),
    raceSkillKeys: raceSkills
      .filter((skill) => !/passiva|rea[cç][aã]o/i.test(skill.type))
      .map((skill) => skill.key),
    passiveKeys: passiveOptions.map((entry) => entry.key),
    talentKeys: talentSkills.map((skill) => skill.key),
  };
}

/** Ausência de registro preserva o comportamento legado: tudo que já estava disponível continua ativo. */
export function resolveSkillLoadout(
  stored: StoredSkillLoadout | null | undefined,
  available: SkillLoadoutAvailability,
): SkillLoadout {
  if (!stored) {
    return {
      classSkillKeys: [...available.classSkillKeys],
      raceSkillKeys: [...available.raceSkillKeys],
      passiveKeys: [...available.passiveKeys],
      talentKeys: [...available.talentKeys],
      persisted: false,
    };
  }
  return {
    classSkillKeys: uniqueAllowed(stored.equipped_class_skill_keys, available.classSkillKeys),
    raceSkillKeys: uniqueAllowed(stored.equipped_race_skill_keys, available.raceSkillKeys),
    passiveKeys: uniqueAllowed(stored.selected_passive_keys, available.passiveKeys),
    talentKeys: uniqueAllowed(stored.selected_talent_keys, available.talentKeys),
    persisted: true,
  };
}

export function isTalentTreeSelectionValid(
  talentKeys: readonly string[],
  orderedTalentKeys: readonly string[],
) {
  const selected = new Set(talentKeys);
  let gapFound = false;
  for (const key of orderedTalentKeys) {
    if (!selected.has(key)) {
      gapFound = true;
      continue;
    }
    if (gapFound) return false;
  }
  return true;
}

export function applySkillBalanceOverride(
  skill: ClassSkill,
  overrides: SkillBalanceOverrides,
): ClassSkill | null {
  const override = overrides[skill.key];
  if (!override) return skill;
  if (override.disabled) return null;
  const factor = override.powerMultiplier;
  return {
    ...skill,
    cost: Math.max(0, skill.cost + override.costDelta),
    cooldown: Math.max(0, skill.cooldown + override.cooldownDelta),
    range: Math.max(0, skill.range + override.rangeDelta),
    area: Math.max(0, skill.area + override.areaDelta),
    scaling: skill.scaling.map((entry) => ({
      ...entry,
      multiplier: Number((entry.multiplier * factor).toFixed(3)),
    })),
    operations: skill.operations.map((operation) => ({
      ...operation,
      base: Math.round(operation.base * factor),
      scaling: operation.scaling.map((entry) => ({
        ...entry,
        multiplier: Number((entry.multiplier * factor).toFixed(3)),
      })),
      modifiers: operation.modifiers.map((modifier) => ({
        ...modifier,
        value: Math.round(modifier.value * factor),
      })),
    })),
  };
}

export function applySkillBalanceOverrides(skills: ClassSkill[], overrides: SkillBalanceOverrides) {
  return skills.flatMap((skill) => {
    const balanced = applySkillBalanceOverride(skill, overrides);
    return balanced ? [balanced] : [];
  });
}
