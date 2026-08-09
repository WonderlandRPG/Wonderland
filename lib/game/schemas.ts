import { z } from "zod";

import { contentTypeKeys, type ContentType } from "@/lib/game/catalog";

export const attributeKeys = ["FOR", "DEF", "RES", "INI", "INT", "ARC"] as const;

export type AttributeKey = (typeof attributeKeys)[number];

const finiteNumberSchema = z.number().finite();
const nonNegativeNumberSchema = finiteNumberSchema.min(0);
const requiredTextSchema = z.string().trim().min(1);
const nonNegativeIntegerSchema = z.number().int().min(0);

export const attributesSchema = z.object({
  FOR: finiteNumberSchema,
  DEF: finiteNumberSchema,
  RES: finiteNumberSchema,
  INI: finiteNumberSchema,
  INT: finiteNumberSchema,
  ARC: finiteNumberSchema,
});

export const traitSchema = z.object({
  name: requiredTextSchema,
  description: requiredTextSchema,
  unlockLevel: z.number().int().min(1).optional(),
});

export const progressionEntrySchema = z.object({
  level: z.number().int().min(1),
  title: requiredTextSchema,
  description: requiredTextSchema,
});

export const raceMechanicSchema = z.object({
  name: requiredTextSchema,
  description: requiredTextSchema,
});

export const raceTraitSchema = z.object({
  name: requiredTextSchema,
  description: requiredTextSchema,
});

export const raceAbilitySchema = z.object({
  name: requiredTextSchema,
  description: requiredTextSchema,
  unlockLevel: z.number().int().min(1),
  manaCost: nonNegativeIntegerSchema,
  cooldown: nonNegativeIntegerSchema,
});

export const raceAttributeBonusesSchema = z.object({
  FOR: nonNegativeIntegerSchema,
  DEF: nonNegativeIntegerSchema,
  RES: nonNegativeIntegerSchema,
  INI: nonNegativeIntegerSchema,
  INT: nonNegativeIntegerSchema,
  ARC: nonNegativeIntegerSchema,
});

export const racePayloadSchema = z
  .object({
    description: requiredTextSchema,
    imageUrl: z.union([z.literal(""), z.url()]).default(""),
    difficulty: z.number().int().min(1).max(5),
    baseHp: nonNegativeIntegerSchema,
    baseMana: nonNegativeIntegerSchema,
    attributeBonuses: raceAttributeBonusesSchema,
    mechanics: z.array(raceMechanicSchema).default([]),
    traits: z.array(raceTraitSchema),
    abilities: z.array(raceAbilitySchema).optional(),
    progression: z.array(progressionEntrySchema),
  })
  .superRefine((payload, context) => {
    const total = attributeKeys.reduce(
      (sum, attribute) => sum + payload.attributeBonuses[attribute],
      0,
    );

    if (total > 25) {
      context.addIssue({
        code: "custom",
        message: "Os bônus raciais não podem ultrapassar 25 pontos.",
        path: ["attributeBonuses"],
      });
    }
  })
  .transform(({ abilities, ...payload }) => ({
    ...payload,
    progression: [
      ...payload.progression,
      ...(abilities ?? []).map((ability) => ({
        level: ability.unlockLevel,
        title: ability.name,
        description: [
          ability.description,
          `Custo: ${ability.manaCost} de Mana;`,
          `Recarga: ${ability.cooldown} turno(s).`,
        ].join("\n"),
      })),
    ],
  }));

export const classSkillScalingSchema = z.object({
  attribute: z.enum(attributeKeys),
  multiplier: finiteNumberSchema.min(0),
});

export const classSkillSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: requiredTextSchema,
  level: z.number().int().min(1).max(100),
  category: requiredTextSchema,
  type: requiredTextSchema.default("Ativa"),
  effect: requiredTextSchema,
  kind: z.enum(["damage", "heal", "shield", "utility"]),
  damageType: z.enum(["physical", "magic", "true", "none"]),
  target: z.enum(["self", "ally", "enemy", "area"]),
  resource: z.enum(["mana", "life", "special", "none"]),
  cost: nonNegativeNumberSchema,
  cooldown: nonNegativeIntegerSchema,
  range: nonNegativeIntegerSchema,
  area: nonNegativeIntegerSchema,
  duration: nonNegativeIntegerSchema,
  scaling: z.array(classSkillScalingSchema),
});

export const classPathSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: requiredTextSchema,
  description: requiredTextSchema,
  passive: z.object({ name: requiredTextSchema, description: requiredTextSchema }),
  skills: z.array(classSkillSchema),
});

export const classPayloadSchema = z.object({
  description: requiredTextSchema,
  imageUrl: z.union([z.literal(""), z.url()]).default(""),
  difficulty: z.number().int().min(1).max(5),
  complexity: requiredTextSchema,
  specialization: requiredTextSchema,
  primaryAttributes: z.array(z.enum(attributeKeys)).min(1),
  affinities: z.object({
    FOR: z.number().int().min(1).max(5),
    DEF: z.number().int().min(1).max(5),
    RES: z.number().int().min(1).max(5),
    INI: z.number().int().min(1).max(5),
    INT: z.number().int().min(1).max(5),
    ARC: z.number().int().min(1).max(5),
  }),
  mechanic: z.object({ name: requiredTextSchema, description: requiredTextSchema }),
  passive: z.object({ name: requiredTextSchema, description: requiredTextSchema }),
  progression: z.array(classSkillSchema),
  paths: z.array(classPathSchema),
});

export const skillPayloadSchema = z.object({
  description: requiredTextSchema,
  unlockLevel: z.number().int().min(1),
  resource: z.enum(["mana", "life", "special", "none"]),
  cost: nonNegativeNumberSchema,
  cooldown: z.number().int().min(0),
  scaling: z.array(
    z.object({
      attribute: z.enum(attributeKeys),
      multiplier: finiteNumberSchema,
    }),
  ),
  effects: z.array(requiredTextSchema),
});

export const itemPayloadSchema = z.object({
  description: requiredTextSchema,
  category: requiredTextSchema,
  rarity: requiredTextSchema,
  priceWg: nonNegativeNumberSchema,
  levelRequirement: z.number().int().min(1),
  attributeBonuses: attributesSchema.partial(),
  effects: z.array(requiredTextSchema),
});

export const genericContentPayloadSchema = z
  .object({
    description: requiredTextSchema,
  })
  .passthrough();

export const contentRecordSchema = z.object({
  id: z.uuid(),
  content_type: z.enum(contentTypeKeys),
  slug: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: requiredTextSchema,
  status: z.enum(["draft", "published", "archived"]),
  payload: z.record(z.string(), z.unknown()),
  revision: z.number().int().min(1),
});

const payloadSchemas: Partial<Record<ContentType, z.ZodType>> = {
  race: racePayloadSchema,
  class: classPayloadSchema,
  skill: skillPayloadSchema,
  item: itemPayloadSchema,
};

export function validateContentPayload(type: ContentType, payload: unknown) {
  const schema = payloadSchemas[type] ?? genericContentPayloadSchema;
  return schema.safeParse(payload);
}

export const baseAttributes = attributesSchema.parse({
  FOR: 20,
  DEF: 20,
  RES: 20,
  INI: 20,
  INT: 20,
  ARC: 20,
});
