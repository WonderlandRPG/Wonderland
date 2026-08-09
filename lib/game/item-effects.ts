import { z } from "zod";
import { attributesSchema, type AttributeKey } from "@/lib/game/schemas";

export const itemSpecialEffectSchema = z.object({
  key: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  trigger: z.enum(["BATTLE_START"]),
  duration: z.number().int().min(0).default(0),
  modifiers: attributesSchema.partial().default({}),
  shield: z.number().int().min(0).default(0),
  maxHpPercent: z.number().min(0).max(100).default(0),
  mana: z.number().int().min(0).default(0),
  classResource: z.number().int().min(0).default(0),
  raceResource: z.number().int().min(0).default(0),
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

export function applyBattleStartItemEffects<
  T extends {
    maxHp: number;
    hp: number;
    maxMana: number;
    mana: number;
    shield: number;
    maxClassResource: number;
    classResource: number;
    maxRaceResource: number;
    raceResource: number;
  },
>(combatant: T, effects: ItemSpecialEffect[]): T {
  return effects.reduce((state, effect) => {
    if (effect.trigger !== "BATTLE_START") return state;
    const extraHp = Math.round(state.maxHp * (effect.maxHpPercent / 100));
    return {
      ...state,
      maxHp: state.maxHp + extraHp,
      hp: state.hp + extraHp,
      shield: state.shield + effect.shield,
      mana: Math.min(state.maxMana, state.mana + effect.mana),
      classResource: Math.min(
        state.maxClassResource,
        state.classResource + effect.classResource,
      ),
      raceResource: Math.min(
        state.maxRaceResource,
        state.raceResource + effect.raceResource,
      ),
    };
  }, combatant);
}
