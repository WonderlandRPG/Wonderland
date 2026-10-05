import {
  applyDamage,
  applyReworkLifesteal,
  calculateDamage,
  createCombatant as createCoreCombatant,
  defaultCombatRules,
  getEffectiveAttributes,
  reworkDefenderAttributes,
  reworkOutgoingDamageMultiplier,
  type CombatantState,
  type CombatResolution,
  type CombatRules,
  type DamageType,
} from "@/lib/game/combat-core";
import { applyOffensiveItemEffects } from "@/lib/game/item-effects";

export * from "@/lib/game/combat-core";

export type BasicAttackAffinity = "physical" | "magic";

type CombatantWithAffinity = CombatantState & {
  basicAttackDamageType?: BasicAttackAffinity;
};

type CreateCombatantInput = Parameters<typeof createCoreCombatant>[0] & {
  basicAttackDamageType?: BasicAttackAffinity;
};

export function createCombatant(input: CreateCombatantInput): CombatantWithAffinity {
  const combatant = createCoreCombatant(input);
  return input.basicAttackDamageType
    ? { ...combatant, basicAttackDamageType: input.basicAttackDamageType }
    : combatant;
}

export function resolveBasicAttack(
  actor: CombatantState,
  target: CombatantState,
  rules: CombatRules = defaultCombatRules,
  context: { movedBeforeAction?: boolean } = {},
): CombatResolution {
  if (actor.hp <= 0) {
    return {
      actor,
      target,
      event: {
        kind: "error",
        amount: 0,
        message: `${actor.name} está derrotado e não pode atacar.`,
      },
    };
  }
  if (target.hp <= 0) {
    return {
      actor,
      target,
      event: {
        kind: "error",
        amount: 0,
        message: `${target.name} já está derrotado.`,
      },
    };
  }

  const actorAttributes = getEffectiveAttributes(actor);
  const targetAttributes = getEffectiveAttributes(target);
  const affinity = (actor as CombatantWithAffinity).basicAttackDamageType;
  const damageType: DamageType =
    affinity ?? (actorAttributes.INT > actorAttributes.FOR ? "magic" : "physical");
  const offensiveAttribute = damageType === "magic" ? actorAttributes.INT : actorAttributes.FOR;
  const raw = offensiveAttribute * rules.basicAttackMultiplier;
  const amount = calculateDamage(
    raw * reworkOutgoingDamageMultiplier(actor, target, damageType, context),
    damageType,
    reworkDefenderAttributes(actor, target, damageType, targetAttributes),
    rules,
  );
  const damagedTarget = applyDamage(target, amount);
  const damageDealt = target.hp + target.shield - (damagedTarget.hp + damagedTarget.shield);
  const actorAfterAttack = {
    ...actor,
    classResource: Math.min(
      actor.maxClassResource,
      actor.classResource + actor.resourceGainOnBasicAttack,
    ),
    raceResource: Math.min(
      actor.maxRaceResource,
      actor.raceResource + actor.raceResourceGainOnBasicAttack,
    ),
  };
  const itemResolution = applyOffensiveItemEffects(actorAfterAttack, damagedTarget, damageDealt);

  return {
    actor: applyReworkLifesteal(
      itemResolution.actor,
      Math.max(0, target.hp - damagedTarget.hp),
      damageType,
      { before: target, after: damagedTarget },
    ),
    target: itemResolution.target,
    event: {
      kind: "damage",
      damageType,
      amount: damageDealt,
      message: `${actor.name} usou Ataque básico e causou ${damageDealt} de dano ${damageType === "magic" ? "mágico" : "físico"}.${damageDealt === 0 && amount > 0 ? " O golpe foi bloqueado." : ""}${itemResolution.messages.length ? ` ${itemResolution.messages.join(" ")}` : ""}`,
    },
  };
}
