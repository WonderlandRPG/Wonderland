import { z } from "zod";
import { attributesSchema, type AttributeKey } from "@/lib/game/schemas";

export const itemEffectKinds = [
  "BATTLE_START",
  "POISON",
  "BLEED",
  "LIFE_STEAL",
  "COOLDOWN_REDUCTION",
  "FREEZE",
] as const;

export type ItemEffectKind = (typeof itemEffectKinds)[number];

export const itemSpecialEffectSchema = z.object({
  key: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  kind: z.enum(itemEffectKinds).default("BATTLE_START"),
  trigger: z.enum(["BATTLE_START", "ON_DAMAGE_DEALT", "ON_SKILL_USE"]).default("BATTLE_START"),
  duration: z.number().int().min(0).default(0),
  power: z.number().min(0).default(0),
  modifiers: attributesSchema.partial().default({}),
  shield: z.number().int().min(0).default(0),
  maxHpPercent: z.number().min(0).max(100).default(0),
  mana: z.number().int().min(0).default(0),
  classResource: z.number().int().min(0).default(0),
  raceResource: z.number().int().min(0).default(0),
});

export const itemSpecialEffectsSchema = z.array(itemSpecialEffectSchema);
export type ItemSpecialEffect = z.infer<typeof itemSpecialEffectSchema>;

export interface ItemEffectCombatant {
  maxHp: number;
  hp: number;
  maxMana: number;
  mana: number;
  shield: number;
  maxClassResource: number;
  classResource: number;
  maxRaceResource: number;
  raceResource: number;
  cooldowns: Record<string, number>;
  statuses: Record<
    string,
    {
      name: string;
      duration: number;
      stacks: number;
      modifiers: Partial<Record<AttributeKey, number>>;
      beneficial: boolean;
      periodicDamage?: number;
      periodicDamageType?: "physical" | "magic" | "true";
    }
  >;
  itemEffects: ItemSpecialEffect[];
}

export function parseItemSpecialEffects(value: unknown): ItemSpecialEffect[] {
  const parsed = itemSpecialEffectsSchema.safeParse(value);
  return parsed.success ? parsed.data : [];
}

export function sumItemEffectModifiers(effects: ItemSpecialEffect[]) {
  const total: Partial<Record<AttributeKey, number>> = {};
  for (const effect of effects) {
    if (effect.kind !== "BATTLE_START" || effect.trigger !== "BATTLE_START") continue;
    for (const [attribute, value] of Object.entries(effect.modifiers)) {
      total[attribute as AttributeKey] = (total[attribute as AttributeKey] ?? 0) + (value ?? 0);
    }
  }
  return total;
}

export function applyBattleStartItemEffects<T extends ItemEffectCombatant>(
  combatant: T,
  effects: ItemSpecialEffect[],
): T {
  return effects.reduce((state, effect) => {
    if (effect.kind !== "BATTLE_START" || effect.trigger !== "BATTLE_START") return state;
    const extraHp = Math.round(state.maxHp * (effect.maxHpPercent / 100));
    return {
      ...state,
      maxHp: state.maxHp + extraHp,
      hp: state.hp + extraHp,
      shield: state.shield + effect.shield,
      mana: Math.min(state.maxMana, state.mana + effect.mana),
      classResource: Math.min(state.maxClassResource, state.classResource + effect.classResource),
      raceResource: Math.min(state.maxRaceResource, state.raceResource + effect.raceResource),
    };
  }, combatant);
}

export function getItemCooldownReduction(effects: ItemSpecialEffect[]) {
  return Math.min(
    3,
    Math.floor(
      effects
        .filter((effect) => effect.kind === "COOLDOWN_REDUCTION")
        .reduce((total, effect) => total + effect.power, 0),
    ),
  );
}

export function applyOffensiveItemEffects<T extends ItemEffectCombatant>(
  actor: T,
  target: T,
  damageDealt: number,
) {
  let nextActor = actor;
  let nextTarget = target;
  const messages: string[] = [];

  for (const effect of actor.itemEffects) {
    if (effect.trigger !== "ON_DAMAGE_DEALT" || damageDealt <= 0) continue;
    if (effect.kind === "LIFE_STEAL") {
      const healing = Math.min(
        Math.round(damageDealt * (effect.power / 100)),
        nextActor.maxHp - nextActor.hp,
      );
      if (healing > 0) {
        nextActor = { ...nextActor, hp: nextActor.hp + healing };
        messages.push(`${effect.name} restaurou ${healing} de HP.`);
      }
      continue;
    }

    if (effect.kind === "POISON" || effect.kind === "BLEED") {
      const statusKey = `item:${effect.kind.toLowerCase()}:${effect.key}`;
      nextTarget = {
        ...nextTarget,
        statuses: {
          ...nextTarget.statuses,
          [statusKey]: {
            name: effect.kind === "POISON" ? "Envenenamento" : "Sangramento",
            duration: Math.max(1, effect.duration),
            stacks: 1,
            modifiers: {},
            beneficial: false,
            periodicDamage: Math.max(1, Math.round(effect.power)),
            periodicDamageType: effect.kind === "POISON" ? "true" : "physical",
          },
        },
      };
      messages.push(
        `${effect.name} aplicou ${effect.kind === "POISON" ? "Envenenamento" : "Sangramento"}.`,
      );
      continue;
    }

    if (effect.kind === "FREEZE") {
      const statusKey = `item:freeze:${effect.key}`;
      nextTarget = {
        ...nextTarget,
        statuses: {
          ...nextTarget.statuses,
          [statusKey]: {
            name: "Congelamento",
            duration: Math.max(1, effect.duration),
            stacks: 1,
            modifiers: { INI: -Math.max(1, Math.round(effect.power)) },
            beneficial: false,
          },
        },
      };
      messages.push(`${effect.name} reduziu a INI do alvo.`);
    }
  }

  return { actor: nextActor, target: nextTarget, messages };
}

export function resolvePeriodicItemDamage<T extends ItemEffectCombatant>(
  combatant: T,
  mitigate: (amount: number, type: "physical" | "magic" | "true") => number = (amount) => amount,
) {
  let next = combatant;
  const messages: string[] = [];
  for (const status of Object.values(combatant.statuses)) {
    const rawDamage = Math.max(0, Math.round(status.periodicDamage ?? 0));
    if (!rawDamage) continue;
    const damage = Math.max(
      0,
      Math.round(mitigate(rawDamage, status.periodicDamageType ?? "true")),
    );
    const absorbed = Math.min(next.shield, damage);
    const hpDamage = Math.max(0, damage - absorbed);
    next = {
      ...next,
      shield: next.shield - absorbed,
      hp: Math.max(0, next.hp - hpDamage),
    };
    messages.push(`${status.name} causou ${damage} de dano.`);
  }
  return { combatant: next, messages };
}
