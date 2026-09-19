import { z } from "zod";

import classesJson from "@/lib/game/rework-classes.json";
import racesJson from "@/lib/game/rework-races.json";

const requiredText = z.string().trim().min(1);
const identifier = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const reworkCombatSchema = z.object({
  power: requiredText.optional(),
  damageType: z.enum(["Físico", "Mágico", "Sagrado", "Natureza"]).optional(),
  range: requiredText,
  area: requiredText,
  duration: requiredText.optional(),
  adjustment: requiredText.optional(),
});

export const reworkAbilityVariantSchema = z.object({
  id: identifier,
  pathId: identifier,
  pathName: requiredText,
  name: requiredText,
  description: requiredText,
  unlockLevel: z.number().int().min(1),
  combat: reworkCombatSchema,
});

export const reworkClassAbilitySchema = z.object({
  id: identifier,
  iconUrl: z.string().regex(/^\/assets\/skills\/classes\/[a-z0-9-]+\/[0-5]\.webp$/),
  kind: z.enum(["Passiva", "Ataque básico", "Habilidade 1", "Habilidade 2", "Habilidade 3", "Suprema"]),
  name: requiredText,
  description: requiredText,
  unlockLevel: z.number().int().min(1),
  cooldown: requiredText,
  combat: reworkCombatSchema,
  variants: z.array(reworkAbilityVariantSchema).length(3),
});

export const reworkClassSchema = z.object({
  contractVersion: z.literal(2),
  id: identifier,
  name: requiredText,
  sigil: requiredText,
  role: requiredText,
  description: requiredText,
  abilities: z.array(reworkClassAbilitySchema).length(6),
  paths: z.array(z.object({ id: identifier, name: requiredText, description: requiredText })).length(3),
});

export const reworkRacePowerSchema = z.object({
  id: identifier,
  iconUrl: z.string().regex(/^\/assets\/skills\/races\/[a-z0-9-]+\/[0-2]\.webp$/),
  unlockLevel: z.number().int().min(1),
  name: requiredText,
  kind: z.enum(["Característica", "Habilidade"]),
  description: requiredText,
  cooldown: requiredText.optional(),
  range: requiredText.optional(),
  area: requiredText.optional(),
});

export const reworkRaceSchema = z.object({
  contractVersion: z.literal(2),
  id: identifier,
  name: requiredText,
  epithet: requiredText,
  sigil: requiredText,
  description: requiredText,
  baseStats: z.object({
    FOR: z.number().int().min(0),
    INT: z.number().int().min(0),
    DEF: z.number().int().min(0),
    RES: z.number().int().min(0),
    HP: z.number().int().positive(),
    INI: z.number().int().min(0),
  }),
  powers: z.array(reworkRacePowerSchema).length(3),
});

export const reworkClassesSchema = z.array(reworkClassSchema).length(17);
export const reworkRacesSchema = z.array(reworkRaceSchema).length(11);

export type ReworkClass = z.infer<typeof reworkClassSchema>;
export type ReworkRace = z.infer<typeof reworkRaceSchema>;

export const reworkClasses = reworkClassesSchema.parse(classesJson);
export const reworkRaces = reworkRacesSchema.parse(racesJson);

export function validateReworkCatalogIconCoverage(fileExists: (relativePath: string) => boolean) {
  return [
    ...reworkClasses.flatMap((entry) => entry.abilities.map((ability) => ability.iconUrl)),
    ...reworkRaces.flatMap((entry) => entry.powers.map((power) => power.iconUrl)),
  ].filter((iconUrl) => !fileExists(iconUrl));
}
