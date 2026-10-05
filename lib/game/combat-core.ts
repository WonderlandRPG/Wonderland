import { z } from "zod";

import type { ClassSkill } from "@/lib/game/classes";
import { attributeKeys, attributesSchema, type AttributeKey } from "@/lib/game/schemas";
import {
  applyOffensiveItemEffects,
  getItemCooldownReduction,
  type ItemSpecialEffect,
} from "@/lib/game/item-effects";

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
  passiveKeys?: string[];
  passiveFlags?: Record<string, boolean>;
  passiveMarkedTargetId?: string;
  passiveRoundHealing?: number;
  basicAttackDamageType?: "physical" | "magic";
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
  itemEffects: ItemSpecialEffect[];
}

export interface ActiveCombatStatus {
  name: string;
  duration: number;
  stacks: number;
  modifiers: Partial<CombatAttributes>;
  beneficial: boolean;
  damageReductionPercent?: number;
  periodicDamage?: number;
  periodicDamageType?: DamageType;
  forcedTargetId?: string;
}

const harmfulStatusOperations = new Set(["DEBUFF", "STUN", "ROOT", "SILENCE", "FEAR", "TAUNT"]);

export function isBeneficialStatusOperation(operation: ClassSkill["operations"][number]) {
  if (operation.modifiers.some((modifier) => modifier.value < 0)) return false;
  if (harmfulStatusOperations.has(operation.operation)) return false;
  if (operation.modifiers.some((modifier) => modifier.value > 0)) return true;
  if (["BUFF", "REACTION", "SUMMON"].includes(operation.operation)) return true;
  return ["self", "source", "ally"].includes(operation.target);
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
  maxHp?: number;
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
  itemEffects?: ItemSpecialEffect[];
  passiveKeys?: string[];
}): CombatantState {
  const stats = deriveStats(input.attributes, input.baseHp, input.baseMana, input.rules);
  const maxHp = input.maxHp === undefined ? stats.maxHp : Math.max(1, rounded(input.maxHp));
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
    passiveKeys: input.passiveKeys ?? [],
    passiveFlags: {},
    passiveRoundHealing: 0,
    attributes: input.attributes,
    maxHp,
    hp: maxHp,
    maxMana: usesMana ? stats.maxMana : 0,
    mana: usesMana ? stats.maxMana : 0,
    shield: (input.passiveKeys ?? []).includes("aengel-0")
      ? Math.round(100 + input.attributes.INT * 0.4)
      : 0,
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
    itemEffects: input.itemEffects ?? [],
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

export function reworkOutgoingDamageMultiplier(
  actor: CombatantState,
  target: CombatantState,
  type: DamageType,
  context: { movedBeforeAction?: boolean } = {},
) {
  const passiveKeys = actor.passiveKeys ?? [];
  let multiplier = 1;
  if (passiveKeys.includes("barbaro-0") && actor.maxHp > 0) {
    const lostTens = Math.floor(((actor.maxHp - actor.hp) * 10) / actor.maxHp + 1e-9);
    multiplier *= 1 + Math.min(0.15, Math.max(0, lostTens) * 0.03);
  }
  if (
    passiveKeys.includes("ladino-0") &&
    Object.values(target.statuses).some((status) => !status.beneficial)
  ) {
    multiplier *= 1.15;
  }
  if (passiveKeys.includes("lobisomem-0") && type === "physical" && actor.hp < actor.maxHp / 2) {
    multiplier *= 1.15;
  }
  if (passiveKeys.includes("arqueiro-0") && type === "physical" && !context.movedBeforeAction) {
    multiplier *= 1.15;
  }
  if (passiveKeys.includes("leonis-0") && actor.passiveMarkedTargetId === target.id) {
    multiplier *= 1.1;
  }
  return multiplier;
}

export function reworkMovementAllowance(
  actor: CombatantState,
  enemyId: string,
  baseMovement: number,
) {
  return (
    baseMovement +
    (actor.passiveKeys?.includes("leonis-0") && actor.passiveMarkedTargetId === enemyId ? 1 : 0)
  );
}

export function reworkDefenderAttributes(
  actor: CombatantState,
  target: CombatantState,
  type: DamageType,
  attributes: CombatAttributes,
): CombatAttributes {
  if (
    actor.id === target.id ||
    !actor.passiveKeys?.includes("elfo-0") ||
    actor.passiveFlags?.[`elfo-first-hit:${target.id}`] ||
    type === "true"
  )
    return attributes;
  const key = type === "physical" ? "DEF" : "RES";
  return { ...attributes, [key]: Math.max(0, attributes[key] * 0.85) };
}

export function applyReworkLifesteal(
  actor: CombatantState,
  hpDamage: number,
  type: DamageType,
  defeatedTarget?: { before: CombatantState; after: CombatantState },
): CombatantState {
  const withMarkedPrey =
    defeatedTarget &&
    actor.id !== defeatedTarget.before.id &&
    defeatedTarget.before.hp > defeatedTarget.after.hp &&
    actor.passiveKeys?.includes("leonis-0") &&
    !actor.passiveMarkedTargetId
      ? { ...actor, passiveMarkedTargetId: defeatedTarget.before.id }
      : actor;
  const withFirstHit =
    defeatedTarget &&
    withMarkedPrey.id !== defeatedTarget.before.id &&
    withMarkedPrey.passiveKeys?.includes("elfo-0")
      ? {
          ...withMarkedPrey,
          passiveFlags: {
            ...withMarkedPrey.passiveFlags,
            [`elfo-first-hit:${defeatedTarget.before.id}`]: true,
          },
        }
      : withMarkedPrey;
  const withHarvest =
    defeatedTarget &&
    defeatedTarget.before.hp > 0 &&
    defeatedTarget.after.hp <= 0 &&
    withFirstHit.passiveKeys?.includes("necromante-0")
      ? {
          ...withFirstHit,
          cooldowns: {
            ...withFirstHit.cooldowns,
            "necromante-2": Math.max(0, (withFirstHit.cooldowns["necromante-2"] ?? 0) - 1),
          },
        }
      : withFirstHit;
  if (hpDamage <= 0 || withHarvest.hp <= 0) return withHarvest;
  let heal = 0;
  let vampireHealing = withHarvest.passiveRoundHealing ?? 0;
  if (withHarvest.passiveKeys?.includes("vampiro-0")) {
    const cap = Math.round(withHarvest.maxHp * 0.08);
    const available = Math.max(0, cap - vampireHealing);
    const gained = Math.min(
      available,
      withHarvest.maxHp - withHarvest.hp,
      Math.round(hpDamage * 0.1),
    );
    heal += gained;
    vampireHealing += gained;
  }
  if (
    withHarvest.passiveKeys?.includes("lobisomem-0") &&
    type === "physical" &&
    withHarvest.hp < withHarvest.maxHp / 2
  ) {
    heal += Math.round(hpDamage * 0.1);
  }
  return heal
    ? {
        ...withHarvest,
        hp: Math.min(withHarvest.maxHp, withHarvest.hp + heal),
        passiveRoundHealing: vampireHealing,
      }
    : withHarvest;
}

export function applyDamage(
  target: CombatantState,
  amount: number,
  context: { areaAttack?: boolean } = {},
) {
  const guardKey = target.statuses["kitsune-ilusao"] ? "kitsune-ilusao" : "defesa-total";
  if (amount > 0 && target.statuses[guardKey]) {
    const statuses = { ...target.statuses };
    delete statuses[guardKey];
    return { ...target, statuses };
  }
  const reduction = Math.min(
    100,
    Math.max(
      0,
      ...Object.values(target.statuses).map((status) => status.damageReductionPercent ?? 0),
    ),
  );
  const draconatoFirstHit =
    amount > 0 &&
    target.passiveKeys?.includes("draconato-0") &&
    !target.passiveFlags?.draconatoFirstHitTaken;
  const passiveReduction = draconatoFirstHit ? 15 : 0;
  const fairyReduction = context.areaAttack && target.passiveKeys?.includes("fada-0") ? 0.8 : 1;
  const reducedAmount = Math.max(
    0,
    Math.round(amount * (1 - reduction / 100) * (1 - passiveReduction / 100) * fairyReduction),
  );
  const absorbed = Math.min(target.shield, reducedAmount);
  const hpDamage = Math.max(0, reducedAmount - absorbed);
  if (
    target.passiveKeys?.includes("orc-0") &&
    !target.passiveFlags?.orcDeathSaved &&
    target.hp > 0 &&
    hpDamage >= target.hp
  ) {
    return {
      ...target,
      shield: target.shield - absorbed,
      hp: 1,
      passiveFlags: {
        ...target.passiveFlags,
        orcDeathSaved: true,
        draconatoFirstHitTaken:
          draconatoFirstHit || target.passiveFlags?.draconatoFirstHitTaken || false,
      },
      statuses: {
        ...target.statuses,
        "orc-recusar-a-morte": {
          name: "Recusar a Morte",
          duration: 1,
          stacks: 1,
          modifiers: {},
          beneficial: true,
          damageReductionPercent: 25,
        },
      },
    };
  }
  return {
    ...target,
    passiveFlags: draconatoFirstHit
      ? { ...target.passiveFlags, draconatoFirstHitTaken: true }
      : target.passiveFlags,
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
    passiveRoundHealing: 0,
    passiveFlags: { ...combatant.passiveFlags, draconatoFirstHitTaken: false },
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
  const amount = calculateDamage(
    raw * reworkOutgoingDamageMultiplier(actor, target, damageType),
    damageType,
    reworkDefenderAttributes(actor, target, damageType, targetAttributes),
    rules,
  );
  const damagedTarget = applyDamage(target, amount);
  const damageDealt = target.hp + target.shield - (damagedTarget.hp + damagedTarget.shield);
  const itemResolution = applyOffensiveItemEffects(
    {
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
    damagedTarget,
    damageDealt,
  );
  const actorAfterPassives = applyReworkLifesteal(
    itemResolution.actor,
    Math.max(0, target.hp - damagedTarget.hp),
    damageType,
    { before: target, after: damagedTarget },
  );
  return {
    actor: actorAfterPassives,
    target: itemResolution.target,
    event: {
      kind: "damage",
      damageType,
      amount: damageDealt,
      message: `${actor.name} usou Ataque básico e causou ${damageDealt} de dano ${isMagical ? "mágico" : "físico"}.${damageDealt === 0 && amount > 0 ? " O golpe foi bloqueado." : ""}${itemResolution.messages.length ? ` ${itemResolution.messages.join(" ")}` : ""}`,
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
    cooldowns: {
      ...actor.cooldowns,
      [skill.key]: Math.max(0, skill.cooldown - getItemCooldownReduction(actor.itemEffects)),
    },
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
    const amount = calculateDamage(
      rawPower * reworkOutgoingDamageMultiplier(actor, target, type),
      type,
      reworkDefenderAttributes(actor, target, type, getEffectiveAttributes(target)),
      rules,
    );
    const damagedTarget = applyDamage(target, amount, { areaAttack: skill.area > 0 });
    const damageDealt = target.hp + target.shield - (damagedTarget.hp + damagedTarget.shield);
    const itemResolution = applyOffensiveItemEffects(paidActor, damagedTarget, damageDealt);
    return {
      actor: applyReworkLifesteal(
        itemResolution.actor,
        Math.max(0, target.hp - damagedTarget.hp),
        type,
        { before: target, after: damagedTarget },
      ),
      target: itemResolution.target,
      event: {
        kind: "damage",
        damageType: type,
        amount: damageDealt,
        message: `${actor.name} usou ${skill.name} e causou ${damageDealt} de dano ${type === "magic" ? "mágico" : type === "true" ? "verdadeiro" : "físico"}.${damageDealt === 0 && amount > 0 ? " O golpe foi bloqueado." : ""}${itemResolution.messages.length ? ` ${itemResolution.messages.join(" ")}` : ""}`,
      },
    };
  }

  if (primaryOperation?.operation === "HEAL") {
    const receiver = skill.target === "enemy" ? target : paidActor;
    const amount =
      rawPower + rounded((receiver.maxHp * (primaryOperation.healPercentOfMaxHp ?? 0)) / 100) ||
      rounded(actor.maxHp * 0.08);
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
    const removableKey =
      primaryOperation.status === "positive"
        ? Object.entries(receiver.statuses).find(([, active]) => active.beneficial)?.[0]
        : primaryOperation.status && primaryOperation.status !== "negative"
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
    (primaryOperation?.modifiers ?? []).map((modifier) => [
      modifier.attribute,
      modifier.percent
        ? Math.round((actorAttributes[modifier.attribute] * modifier.value) / 100)
        : modifier.value,
    ]),
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
            beneficial: isBeneficialStatusOperation(primaryOperation),
            damageReductionPercent: primaryOperation.damageReductionPercent,
            forcedTargetId: primaryOperation.operation === "TAUNT" ? actor.id : undefined,
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

export function resolveAreaSkill(
  actor: CombatantState,
  targets: CombatantState[],
  skill: ClassSkill,
  rules: CombatRules = defaultCombatRules,
) {
  const [primary, ...extras] = targets;
  if (!primary) return { actor, targets: [], events: [] as CombatEvent[] };
  const first = resolveSkill(actor, primary, skill, rules);
  if (first.event.kind === "error" || skill.area <= 0)
    return { actor: first.actor, targets: [first.target], events: [first.event] };
  const resolvedTargets = [first.target];
  const events = [first.event];
  for (const target of extras) {
    const proxyActor = {
      ...actor,
      mana: actor.maxMana,
      classResource: actor.maxClassResource,
      raceResource: actor.maxRaceResource,
      cooldowns: {},
      itemEffects: [],
    };
    const result = resolveSkill(proxyActor, target, skill, rules);
    resolvedTargets.push(result.target);
    events.push(result.event);
  }
  return { actor: first.actor, targets: resolvedTargets, events };
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
