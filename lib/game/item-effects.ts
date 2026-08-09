import { z } from "zod";
import { attributesSchema, type AttributeKey } from "@/lib/game/schemas";

export const itemSpecialEffectSchema = z.object({
  key: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  trigger: z.enum(["BATTLE_START"]),
  duration: z.number().int().min(0).default(0),
  modifiers: attributesSchema.partial().default({}),
});

export const itemSpecialEffectsSchema = z.array(itemSpecialEffectSchema);
export type ItemSpecialEffect = z.infer<typeof itemSpecialEffectSchema>;

export function parseItemSpecialEffects(value: unknown): ItemSpecialEffect[] {
  const parsed = itemSpecialEffectsSchema.safeParse(value);
  return parsed.success ? parsed.data : [];
}

export function sumItemEffectModifiers(effects: ItemSpecialEffect[]) {
  const total: Partial<Record<AttributeKey, number>> = {};
  for (const effect of effects) {
    if (effect.trigger !== "BATTLE_START") continue;
    for (const [attribute, value] of Object.entries(effect.modifiers)) {
      total[attribute as AttributeKey] = (total[attribute as AttributeKey] ?? 0) + (value ?? 0);
    }
  }
  return total;
}
