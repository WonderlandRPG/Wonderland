import { z } from "zod";

import type { ClassSkill } from "@/lib/game/classes";
import { attributeKeys, attributesSchema, type AttributeKey } from "@/lib/game/schemas";

export const combatRulesSchema = z.object({
  hpPerResistance: z.number().finite().min(0),
  manaPerIntelligence: z.number().finite().min(0),
  physicalMitigationConstant: z.number().finite().positive(),
  magicalMitigationConstant: z.number().finite().positive(),
  basicAttackMultiplier: z.number().finite().positive(),
  minimumDamage: z.number().int().min(0),
});

export type CombatRules = z.infer<typeof combatRulesSchema>;
export type CombatAttributes = z.infer<typeof attributesSchema>;
export type DamageType = "physical" | "magic" | "true";

export const defaultCombatRules: CombatRules = {
  hpPerResistance: 5,
  manaPerIntelligence: 3,
  physicalMitigationConstant: 100,
  magicalMitigationConstant: 100,
  basicAttackMultiplier: 1,
  minimumDamage: 1,
};

export interface DerivedStats {
  maxHp: number;
  maxMana: number;
  initiative: number;
  physicalPower: number;
  magicalPower: number;
  supportPower: number;
}

export interface CombatantState {
  id: string;
  name: string;
  attributes: CombatAttributes;
  maxHp: number;
  hp: number;
  maxMana: number;
  mana: number;
  shield: number;
  cooldowns: Record<string, number>;
  classResourceName: string;
  classResource: number;
  maxClassResource: number;
  statuses: Record<string, ActiveCombatStatus>;
  resourceGainOnBasicAttack: number;
  raceResourceName: string;
  raceResource: number;
  maxRaceResource: number;
  raceResourceGainOnBasicAttack: number;
}

export interface ActiveCombatStatus {
  name: string;
  duration: number;
  stacks: number;
  modifiers: Partial<CombatAttributes>;
  beneficial: boolean;
}

export function getConvertedResourceBonus(intelligence: number, maximum: number) {
  if (maximum <= 0 || intelligence <= 0) return 0;
  const ratio = Math.min(0.3, intelligence / 400);
  return Math.min(maximum, Math.max(1, Math.ceil(maximum * ratio)));
}

export interface CombatEvent {
  kind: "damage" | "heal" | "shield" | "utility" | "error";
  message: string;
  amount: number;
  damageType?: DamageType;
}

export interface CombatResolution {
  actor: CombatantState;
  target: CombatantState;
  event: CombatEvent;
}

function rounded(value: number) {
  return Math.max(0, Math.round(value));
}

export function deriveStats(
  attributes: CombatAttributes,
  baseHp: number,
  baseMana: number,
  rules: CombatRules = defaultCombatRules,
): DerivedStats {
  return {
    maxHp: rounded(baseHp + attributes.RES * rules.hpPerResistance),
    maxMana: rounded(baseMana + attributes.INT * rules.manaPerIntelligence),
    initiative: rounded(attributes.INI),
    physicalPower: rounded(attributes.FOR),
    magicalPower: rounded(attributes.INT),
    supportPower: rounded(attributes.ARC),
  };
}

export function createCombatant(input: {
  id: string;
  name: string;
  attributes: CombatAttributes;
  baseHp: number;
  baseMana: number;
  rules?: CombatRules;
  classResource?: {
    name: string;
    initial: number;
    maximum: number;
    generationEvents?: Array<{ trigger: string; amount: number }>;
  };
  raceResource?: {
    name: string;
    initial: number;
    maximum: number;
    generationEvents?: Array<{ trigger: string; amount: number }>;
  } | null;
  usesMana?: boolean;
}): CombatantState {
  const stats = deriveStats(input.attributes, input.baseHp, input.baseMana, input.rules);
  const usesMana = input.usesMana ?? true;
  const classResourceBonus = usesMana
    ? 0
    : getConvertedResourceBonus(input.attributes.INT, input.classResource?.maximum ?? 0);
  const raceResourceBonus = usesMana
    ? 0
    : getConvertedResourceBonus(input.attributes.INT, input.raceResource?.maximum ?? 0);
  return {
    id: input.id,
    name: input.name,
    attributes: input.attributes,
    maxHp: stats.maxHp,
    hp: stats.maxHp,
    maxMana: usesMana ? stats.maxMana : 0,
    mana: usesMana ? stats.maxMana : 0,
    shield: 0,
    cooldowns: {},
    classResourceName: input.classResource?.name ?? "Recurso",
    classResource: Math.min(
      input.classResource?.maximum ?? 0,
      (input.classResource?.initial ?? 0) + classResourceBonus,
    ),
    maxClassResource: input.classResource?.maximum ?? 0,
    statuses: {},
    resourceGainOnBasicAttack:
      input.classResource?.generationEvents?.find((entry) => entry.trigger === "BASIC_ATTACK_HIT")
        ?.amount ?? 0,
    raceResourceName: input.raceResource?.name ?? "Recurso racial",
    raceResource: Math.min(
      input.raceResource?.maximum ?? 0,
      (input.raceResource?.initial ?? 0) + raceResourceBonus,
    ),
    maxRaceResource: input.raceResource?.maximum ?? 0,
    raceResourceGainOnBasicAttack:
      input.raceResource?.generationEvents?.find((entry) => entry.trigger === "BASIC_ATTACK_HIT")
        ?.amount ?? 0,
  };
}

export function calculateScaledPower(
  attributes: CombatAttributes,
  scaling: Array<{ attribute: AttributeKey; multiplier: number }>,
) {
  return rounded(
    scaling.reduce((total, entry) => total + attributes[entry.attribute] * entry.multiplier, 0),
  );
}

export function calculateDamage(
  rawDamage: number,
  type: DamageType,
  defender: CombatAttributes,
  rules: CombatRules = defaultCombatRules,
) {
  if (type === "true") return Math.max(rules.minimumDamage, rounded(rawDamage));
  const defense = type === "physical" ? defender.DEF : defender.RES;
  const constant =
    type === "physical" ? rules.physicalMitigationConstant : rules.magicalMitigationConstant;
  const mitigated = rawDamage * (constant / (constant + Math.max(0, defense)));
  return Math.max(rules.minimumDamage, rounded(mitigated));
}

export function applyDamage(target: CombatantState, amount: number) {
  const guardKey = "defesa-total";
  if (amount > 0 && target.statuses[guardKey]) {
    const statuses = { ...target.statuses };
    delete statuses[guardKey];
    return { ...target, statuses };
  }
  const absorbed = Math.min(target.shield, amount);
  const hpDamage = Math.max(0, amount - absorbed);
  return {
    ...target,
    shield: target.shield - absorbed,
    hp: Math.max(0, target.hp - hpDamage),
  };
}

export function guardCombatant(combatant: CombatantState): CombatantState {
  return {
    ...combatant,
    cooldowns: { ...combatant.cooldowns, ["defesa-total"]: 5 },
    statuses: {
      ...combatant.statuses,
      ["defesa-total"]: {
        name: "Defesa total",
        duration: 2,
        stacks: 1,
        modifiers: {},
        beneficial: true,
      },
    },
  };
}

export function tickCooldowns(combatant: CombatantState): CombatantState {
  return {
    ...combatant,
    cooldowns: Object.fromEntries(
      Object.entries(combatant.cooldowns).map(([key, value]) => [key, Math.max(0, value - 1)]),
    ),
    statuses: Object.fromEntries(
      Object.entries(combatant.statuses)
        .map(([key, status]) => [key, { ...status, duration: status.duration - 1 }] as const)
        .filter(([, status]) => status.duration > 0),
    ),
  };
}

export function getEffectiveAttributes(combatant: CombatantState): CombatAttributes {
  return Object.fromEntries(
    attributeKeys.map((attribute) => [
      attribute,
      Math.max(
        0,
        combatant.attributes[attribute] +
          Object.values(combatant.statuses).reduce(
            (total, status) => total + (status.modifiers[attribute] ?? 0) * status.stacks,
            0,
          ),
      ),
    ]),
  ) as CombatAttributes;
}

export function resolveBasicAttack(
  actor: CombatantState,
  target: CombatantState,
  rules: CombatRules = defaultCombatRules,
): CombatResolution {
  const actorAttributes = getEffectiveAttributes(actor);
  const targetAttributes = getEffectiveAttributes(target);
  const isMagical = actorAttributes.INT > actorAttributes.FOR;
  const damageType: DamageType = isMagical ? "magic" : "physical";
  const raw = (isMagical ? actorAttributes.INT : actorAttributes.FOR) * rules.basicAttackMultiplier;
  const amount = calculateDamage(raw, damageType, targetAttributes, rules);
  return {
    actor: {
      ...actor,
      classResource: Math.min(
        actor.maxClassResource,
        actor.classResource + actor.resourceGainOnBasicAttack,
      ),
      raceResource: Math.min(
        actor.maxRaceResource,
        actor.raceResource + actor.raceResourceGainOnBasicAttack,
      ),
    },
    target: applyDamage(target, amount),
    event: {
      kind: "damage",
      damageType,
      amount,
      message: `${actor.name} usou Ataque básico e causou ${amount} de dano ${isMagical ? "mágico" : "físico"}.`,
    },
  };
}

function skillError(
  actor: CombatantState,
  target: CombatantState,
  message: string,
): CombatResolution {
  return { actor, target, event: { kind: "error", amount: 0, message } };
}

export function resolveSkill(
  actor: CombatantState,
  target: CombatantState,
  skill: ClassSkill,
  rules: CombatRules = defaultCombatRules,
): CombatResolution {
  if ((actor.cooldowns[skill.key] ?? 0) > 0) {
    return skillError(actor, target, `${skill.name} ainda está em recarga.`);
  }
  if (skill.resource === "mana" && actor.mana < skill.cost) {
    return skillError(actor, target, `Mana insuficiente para usar ${skill.name}.`);
  }
  if (skill.resource === "life" && actor.hp <= skill.cost) {
    return skillError(actor, target, `HP insuficiente para usar ${skill.name}.`);
  }
  const usesRaceResource = skill.resource === "special" && skill.resourceKey === "race";
  const availableSpecialResource = usesRaceResource ? actor.raceResource : actor.classResource;
  const specialResourceName = usesRaceResource ? actor.raceResourceName : actor.classResourceName;
  if (skill.resource === "special" && availableSpecialResource < skill.cost) {
    return skillError(
      actor,
      target,
      `${specialResourceName} insuficiente para usar ${skill.name}.`,
    );
  }

  const paidActor: CombatantState = {
    ...actor,
    mana: skill.resource === "mana" ? actor.mana - skill.cost : actor.mana,
    hp: skill.resource === "life" ? actor.hp - skill.cost : actor.hp,
    classResource:
      skill.resource === "special" && !usesRaceResource
        ? actor.classResource - skill.cost
        : actor.classResource,
    raceResource:
      skill.resource === "special" && usesRaceResource
        ? actor.raceResource - skill.cost
        : actor.raceResource,
    cooldowns: { ...actor.cooldowns, [skill.key]: skill.cooldown },
  };
  const primaryOperation = skill.operations[0];
  const operationScaling = primaryOperation?.scaling.length
    ? primaryOperation.scaling
    : skill.scaling;
  const actorAttributes = getEffectiveAttributes(actor);
  const rawPower =
    (primaryOperation?.base ?? 0) + calculateScaledPower(actorAttributes, operationScaling);

  if (primaryOperation?.operation === "DAMAGE") {
    const type: DamageType =
      primaryOperation.damageType === "none" ? "physical" : primaryOperation.damageType;
    const amount = calculateDamage(rawPower, type, getEffectiveAttributes(target), rules);
    return {
      actor: paidActor,
      target: applyDamage(target, amount),
      event: {
        kind: "damage",
        damageType: type,
        amount,
        message: `${actor.name} usou ${skill.name} e causou ${amount} de dano ${type === "magic" ? "mágico" : type === "true" ? "verdadeiro" : "físico"}.`,
      },
    };
  }

  if (primaryOperation?.operation === "HEAL") {
    const amount = rawPower || rounded(actor.maxHp * 0.08);
    const receiver = skill.target === "enemy" ? target : paidActor;
    const healed = Math.min(amount, receiver.maxHp - receiver.hp);
    const next = { ...receiver, hp: receiver.hp + healed };
    return {
      actor: receiver.id === paidActor.id ? next : paidActor,
      target: receiver.id === target.id ? next : target,
      event: {
        kind: "heal",
        amount: healed,
        message: `${actor.name} usou ${skill.name} e recuperou ${healed} de HP.`,
      },
    };
  }

  if (primaryOperation?.operation === "SHIELD") {
    const amount = rawPower || rounded(actorAttributes.ARC);
    const receiver = skill.target === "enemy" ? target : paidActor;
    const next = { ...receiver, shield: receiver.shield + amount };
    return {
      actor: receiver.id === paidActor.id ? next : paidActor,
      target: receiver.id === target.id ? next : target,
      event: {
        kind: "shield",
        amount,
        message: `${actor.name} usou ${skill.name} e recebeu ${amount} de escudo.`,
      },
    };
  }

  if (primaryOperation?.operation === "REMOVE_STATUS") {
    const receiver = primaryOperation.target === "enemy" ? target : paidActor;
    const removableKey = primaryOperation.status
      ? primaryOperation.status
      : Object.entries(receiver.statuses).find(([, active]) => !active.beneficial)?.[0];
    if (!removableKey) {
      return {
        actor: paidActor,
        target,
        event: {
          kind: "utility",
          amount: 0,
          message: `${actor.name} usou ${skill.name}, mas não havia efeito negativo para remover.`,
        },
      };
    }
    const statuses = { ...receiver.statuses };
    delete statuses[removableKey];
    const next = { ...receiver, statuses };
    return {
      actor: receiver.id === paidActor.id ? next : paidActor,
      target: receiver.id === target.id ? next : target,
      event: {
        kind: "utility",
        amount: 0,
        message: `${actor.name} usou ${skill.name} e removeu um efeito negativo.`,
      },
    };
  }

  const statusTarget = primaryOperation?.target === "self" ? paidActor : target;
  const status = primaryOperation?.status || skill.key;
  const modifiers = Object.fromEntries(
    (primaryOperation?.modifiers ?? []).map((modifier) => [modifier.attribute, modifier.value]),
  ) as Partial<CombatAttributes>;
  const appliesStatus = Boolean(
    primaryOperation &&
    (primaryOperation.duration > 0 || Object.keys(modifiers).length > 0 || primaryOperation.status),
  );
  const withStatus = appliesStatus
    ? {
        ...statusTarget,
        statuses: {
          ...statusTarget.statuses,
          [status]: {
            name: skill.name,
            duration: Math.max(1, primaryOperation?.duration ?? skill.duration),
            stacks: Math.min(
              primaryOperation?.maxStacks || 1,
              (statusTarget.statuses[status]?.stacks ?? 0) + (primaryOperation?.stacks || 1),
            ),
            modifiers,
            beneficial: primaryOperation.target === "self",
          },
        },
      }
    : statusTarget;
  return {
    actor: withStatus.id === paidActor.id ? withStatus : paidActor,
    target: withStatus.id === target.id ? withStatus : target,
    event: {
      kind: "utility",
      amount: 0,
      message: `${actor.name} usou ${skill.name}: ${skill.effect}`,
    },
  };
}

export function getRaceAbilityArenaMeta(ability: ClassSkill) {
  return {
    cost: ability.cost,
    cooldown: ability.cooldown,
    summary: ability.playerDescription,
  };
}

export function resolveRaceAbility(
  actor: CombatantState,
  target: CombatantState,
  ability: ClassSkill,
  rules: CombatRules = defaultCombatRules,
): CombatResolution {
  return resolveSkill(actor, target, ability, rules);
}

export function getRaceAbilityCooldown(combatant: CombatantState, ability: ClassSkill) {
  return combatant.cooldowns[ability.key] ?? 0;
}

export function combineAttributes(...sources: Partial<CombatAttributes>[]): CombatAttributes {
  return Object.fromEntries(
    attributeKeys.map((attribute) => [
      attribute,
      sources.reduce((total, source) => total + (source[attribute] ?? 0), 0),
    ]),
  ) as unknown as CombatAttributes;
}
