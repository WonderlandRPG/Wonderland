import type { ClassSkill } from "@/lib/game/classes";
import {
  applyDamage,
  calculateDamage,
  calculateScaledPower,
  getEffectiveAttributes,
  isBeneficialStatusOperation,
  resolveSkill,
  type CombatAttributes,
  type CombatEvent,
  type CombatResolution,
  type CombatRules,
  type CombatantState,
  defaultCombatRules,
} from "@/lib/game/combat";

function operationTarget(
  actor: CombatantState,
  target: CombatantState,
  targetKind: ClassSkill["operations"][number]["target"],
) {
  return targetKind === "self" || targetKind === "source" ? actor : target;
}

function replaceCombatant(actor: CombatantState, target: CombatantState, receiver: CombatantState) {
  return receiver.id === actor.id ? { actor: receiver, target } : { actor, target: receiver };
}

function statusKey(operation: ClassSkill["operations"][number], skill: ClassSkill) {
  if (operation.status) return operation.status;
  if (operation.operation === "STUN") return `stun-${skill.key}`;
  if (operation.operation === "FEAR") return `fear-${skill.key}`;
  if (operation.operation === "SILENCE") return `silence-${skill.key}`;
  if (operation.operation === "TAUNT") return `taunt-${skill.key}`;
  return skill.key;
}

function applySecondaryOperation(
  actor: CombatantState,
  target: CombatantState,
  skill: ClassSkill,
  operation: ClassSkill["operations"][number],
  rules: CombatRules,
) {
  const actorAttributes = getEffectiveAttributes(actor);
  const power =
    operation.base +
    calculateScaledPower(
      actorAttributes,
      operation.scaling.length ? operation.scaling : skill.scaling,
    );
  const receiver = operationTarget(actor, target, operation.target);

  if (operation.operation === "DAMAGE") {
    const damageType = operation.damageType === "none" ? "physical" : operation.damageType;
    const amount = calculateDamage(power, damageType, getEffectiveAttributes(receiver), rules);
    const damaged = applyDamage(receiver, amount);
    const dealt = receiver.hp + receiver.shield - (damaged.hp + damaged.shield);
    return {
      ...replaceCombatant(actor, target, damaged),
      message: `${skill.name} causou mais ${dealt} de dano.`,
      amount: dealt,
      kind: "damage" as const,
    };
  }

  if (operation.operation === "HEAL") {
    const amount = Math.max(1, Math.round(power || actorAttributes.ARC));
    const healed = Math.min(amount, receiver.maxHp - receiver.hp);
    const next = { ...receiver, hp: receiver.hp + healed };
    return {
      ...replaceCombatant(actor, target, next),
      message: `${skill.name} recuperou ${healed} de HP de ${receiver.name}.`,
      amount: healed,
      kind: "heal" as const,
    };
  }

  if (operation.operation === "SHIELD") {
    const amount = Math.max(1, Math.round(power || actorAttributes.ARC));
    const next = { ...receiver, shield: receiver.shield + amount };
    return {
      ...replaceCombatant(actor, target, next),
      message: `${skill.name} concedeu ${amount} de escudo a ${receiver.name}.`,
      amount,
      kind: "shield" as const,
    };
  }

  if (operation.operation === "REMOVE_STATUS") {
    const statuses = { ...receiver.statuses };
    const key =
      operation.status && operation.status !== "negative"
        ? operation.status
        : Object.entries(statuses).find(([, value]) => !value.beneficial)?.[0];
    if (key) delete statuses[key];
    const next = { ...receiver, statuses };
    return {
      ...replaceCombatant(actor, target, next),
      message: key
        ? `${skill.name} removeu um efeito negativo de ${receiver.name}.`
        : `${skill.name} não encontrou efeito para remover em ${receiver.name}.`,
      amount: 0,
      kind: "utility" as const,
    };
  }

  if (operation.operation === "RESOURCE_GAIN" || operation.operation === "RESOURCE_COST") {
    const delta = Math.max(0, Math.round(power));
    const sign = operation.operation === "RESOURCE_GAIN" ? 1 : -1;
    const useRace = skill.resourceKey === "race";
    const next = useRace
      ? {
          ...receiver,
          raceResource: Math.max(
            0,
            Math.min(receiver.maxRaceResource, receiver.raceResource + sign * delta),
          ),
        }
      : {
          ...receiver,
          classResource: Math.max(
            0,
            Math.min(receiver.maxClassResource, receiver.classResource + sign * delta),
          ),
        };
    return {
      ...replaceCombatant(actor, target, next),
      message: `${skill.name} ${sign > 0 ? "gerou" : "consumiu"} ${delta} de ${useRace ? receiver.raceResourceName : receiver.classResourceName}.`,
      amount: delta,
      kind: "utility" as const,
    };
  }

  const modifiers = Object.fromEntries(
    operation.modifiers.map((modifier) => [modifier.attribute, modifier.value]),
  ) as Partial<CombatAttributes>;
  const duration = Math.max(1, operation.duration || skill.duration || 1);
  const key = statusKey(operation, skill);
  const beneficial = isBeneficialStatusOperation(operation);
  const next = {
    ...receiver,
    statuses: {
      ...receiver.statuses,
      [key]: {
        name: skill.name,
        duration,
        stacks: Math.min(
          operation.maxStacks || 1,
          (receiver.statuses[key]?.stacks ?? 0) + (operation.stacks || 1),
        ),
        modifiers,
        beneficial,
      },
    },
  };
  return {
    ...replaceCombatant(actor, target, next),
    message: `${skill.name} aplicou ${operation.status || operation.operation.toLowerCase()} em ${receiver.name} por ${duration} turno(s).`,
    amount: 0,
    kind: "utility" as const,
  };
}

function primarySkillForChosenTarget(skill: ClassSkill): ClassSkill {
  if (skill.target !== "ally") return skill;
  const [first, ...rest] = skill.operations;
  if (!first) return skill;
  if (!["HEAL", "SHIELD", "REMOVE_STATUS"].includes(first.operation)) return skill;
  return {
    ...skill,
    target: "enemy",
    operations: [{ ...first, target: "enemy" }, ...rest],
  };
}

export function resolveJrpgSkill(
  actor: CombatantState,
  target: CombatantState,
  skill: ClassSkill,
  rules: CombatRules = defaultCombatRules,
): CombatResolution {
  const first = resolveSkill(actor, target, primarySkillForChosenTarget(skill), rules);
  if (first.event.kind === "error" || skill.operations.length <= 1) return first;

  let nextActor = first.actor;
  let nextTarget = first.target;
  const messages = [first.event.message];
  let total = first.event.amount;
  let kind: CombatEvent["kind"] = first.event.kind;

  for (const operation of skill.operations.slice(1)) {
    if (operation.chance < 100 && Math.random() * 100 >= operation.chance) continue;
    const result = applySecondaryOperation(nextActor, nextTarget, skill, operation, rules);
    nextActor = result.actor;
    nextTarget = result.target;
    messages.push(result.message);
    total += result.amount;
    if (result.kind === "damage" || result.kind === "heal" || result.kind === "shield")
      kind = result.kind;
  }

  return {
    actor: nextActor,
    target: nextTarget,
    event: {
      kind,
      amount: total,
      damageType: first.event.damageType,
      message: messages.join(" "),
    },
  };
}

export function jrpgAreaTargetLimit(skill: ClassSkill) {
  return skill.area > 0 ? Math.max(2, Math.min(4, skill.area)) : 1;
}

export function resolveJrpgAreaSkill(
  actor: CombatantState,
  targets: CombatantState[],
  skill: ClassSkill,
  rules: CombatRules = defaultCombatRules,
) {
  const limitedTargets = targets
    .filter((target) => target.hp > 0)
    .slice(0, jrpgAreaTargetLimit(skill));
  const [primary, ...extras] = limitedTargets;
  if (!primary) return { actor, targets: [], events: [] as CombatEvent[] };
  const first = resolveJrpgSkill(actor, primary, skill, rules);
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
    const result = resolveJrpgSkill(
      proxyActor,
      target,
      { ...skill, resource: "none", cost: 0, cooldown: 0 },
      rules,
    );
    resolvedTargets.push(result.target);
    events.push(result.event);
  }
  return { actor: first.actor, targets: resolvedTargets, events };
}
