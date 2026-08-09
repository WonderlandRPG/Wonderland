import { z } from "zod";

import { attributeKeys, racePayloadSchema, type AttributeKey } from "@/lib/game/schemas";
import { classSkillSchema } from "@/lib/game/schemas";
import type { ClassSkill } from "@/lib/game/classes";

export type RacePayload = z.infer<typeof racePayloadSchema>;
export type RaceTrait = RacePayload["traits"][number];
export type RaceMechanic = RacePayload["mechanics"][number];
export type RaceProgressionEntry = RacePayload["progression"][number];
export type StructuredRaceAbility = ClassSkill;

export const maximumRaceBonusPoints = 25;

export const attributeLabels: Record<AttributeKey, string> = {
  FOR: "Força",
  DEF: "Defesa",
  RES: "Resistência",
  INI: "Iniciativa",
  INT: "Inteligência",
  ARC: "Arcano",
};

export function createEmptyRacePayload(): RacePayload {
  return {
    engineContractVersion: 1,
    specialization: "Versátil",
    tags: ["HUMANOIDE"],
    description: "",
    imageUrl: "",
    difficulty: 1,
    baseHp: 150,
    baseMana: 0,
    attributeBonuses: {
      FOR: 0,
      DEF: 0,
      RES: 0,
      INI: 0,
      INT: 0,
      ARC: 0,
    },
    mechanics: [],
    traits: [],
    progression: [],
    abilitiesV2: [],
    traitsV2: [],
    resource: null,
  };
}

export function getStructuredRaceAbilities(payload: RacePayload): StructuredRaceAbility[] {
  return classSkillSchema.array().parse(payload.abilitiesV2);
}

export function getRaceBonusTotal(bonuses: RacePayload["attributeBonuses"]) {
  return attributeKeys.reduce((total, attribute) => total + bonuses[attribute], 0);
}

export function createRaceSlug(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function parseRacePayload(payload: unknown) {
  return racePayloadSchema.safeParse(payload);
}
