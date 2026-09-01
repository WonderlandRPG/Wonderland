import type { ClassSkill } from "@/lib/game/classes";
import {
  applyDamage,
  calculateDamage,
  calculateScaledPower,
  defaultCombatRules,
  getEffectiveAttributes,
  isBeneficialStatusOperation,
  type CombatEvent,
  type CombatResolution,
  type CombatRules,
  type CombatantState,
} from "@/lib/game/combat";
import { applyOffensiveItemEffects, getItemCooldownReduction } from "@/lib/game/item-effects";

function operationReceiver(
  actor: CombatantState,
  target: CombatantState,
  targetKind: ClassSkill["operations"][number]["target"],
) {
  return targetKind === "self" || targetKind === "source" || targetKind === "ally" ? actor : target;
}

function replaceReceiver(
  actor: CombatantState,
  target: CombatantState,
  receiver: CombatantState,
) {
  return receiver.id === actor.id ? { actor: receiver, target } : { actor, target: receiver };
}

function statusKey(operation: ClassSkill["operations"][number], skill: ClassSkill) {
  if (operation.status) return operation.status;
  if (["ROOT", "STUN", "SILENCE", "FEAR", "TAUNT"].includes(operation.operation)) {
    return `${operation.operation.toLowerCase()}-${skill.key}`;
  }
  return skill.key;
}

function validateAndPay(
  actor: CombatantState,
  target: CombatantState,
  skill: ClassSkill,
): CombatResolution | { actor: CombatantState; target: CombatantState } {
  if ((actor.cooldowns[skill.key] ?? 0) > 0) {
    return {
      actor,
      target,
      event: { kind: "error", amount: 0, message: `${skill.name} ainda está em recarga.` },
    };
  }
  if (skill.resource === "mana" && actor.mana < skill.cost) {
    return {
      actor,
      target,
      event: { kind: "error", amount: 0, message: `Mana insuficiente para usar ${skill.name}.` },
    };
  }
  if (skill.resource === "life" && actor.hp <= skill.cost) {
    return {
      actor,
      target,
      event: { kind: "error", amount: 0, message: `HP insuficiente para usar ${skill.name}.` },
    };
  }

  const usesRaceResource = skill.resource === "special" && skill.resourceKey === "race";
  const available = usesRaceResource ? actor.raceResource : actor.classResource;
  const resourceName = usesRaceResource ? actor.raceResourceName : actor.classResourceName;
  if (skill.resource === "special" && available < skill.cost) {
    return {
      actor,
      target,
      event: { kind: "error", amount: 0, message: `${resourceName} insuficiente para usar ${skill.name}.` },
    };
  }

  return {
    actor: {
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
    },
    target,
  };
}

export function resolveTacticalSkill(
  actor: CombatantState,
  target: CombatantState,
  skill: ClassSkill,
  rules: CombatRules = defaultCombatRules,
): CombatResolution {
  const paid = validateAndPay(actor, target, skill);
  if ("event" in paid) return paid;

  let nextActor = paid.actor;
  let nextTarget = paid.target;
  const messages: string[] = [];
  let totalAmount = 0;
  let eventKind: CombatEvent["kind"] = "utility";
  let damageType: CombatEvent["damageType"];

  for (const operation of skill.operations) {
    if (operation.chance < 100 && Math.random() * 100 >= operation.chance) {
      messages.push(`${skill.name}: ${operation.operation} falhou.`);
      continue;
    }

    const receiver = operationReceiver(nextActor, nextTarget, operation.target);
    const actorAttributes = getEffectiveAttributes(nextActor);
    const scaling = operation.scaling.length ? operation.scaling : skill.scaling;
    const rawPower = operation.base + calculateScaledPower(actorAttributes, scaling);

    if (operation.operation === "DAMAGE") {
      const type = operation.damageType === "none" ? (skill.damageType === "none" ? "physical" : skill.damageType) : operation.damageType;
      const amount = calculateDamage(rawPower, type, getEffectiveAttributes(receiver), rules);
      const damaged = applyDamage(receiver, amount);
      const dealt = receiver.hp + receiver.shield - (damaged.hp + damaged.shield);
      const replaced = replaceReceiver(nextActor, nextTarget, damaged);
      nextActor = replaced.actor;
      nextTarget = replaced.target;

      if (receiver.id !== nextActor.id) {
        const itemResolution = applyOffensiveItemEffects(nextActor, nextTarget, dealt);
        nextActor = itemResolution.actor;
        nextTarget = itemResolution.target;
        if (itemResolution.messages.length) messages.push(...itemResolution.messages);
      }

      messages.push(`${skill.name} causou ${dealt} de dano ${type === "magic" ? "mágico" : type === "true" ? "verdadeiro" : "físico"} em ${receiver.name}.`);
      totalAmount += dealt;
      eventKind = "damage";
      damageType = type;
      continue;
    }

    if (operation.operation === "HEAL") {
      const amount = Math.max(1, Math.round(rawPower || actorAttributes.ARC));
      const healed = Math.min(amount, receiver.maxHp - receiver.hp);
      const replaced = replaceReceiver(nextActor, nextTarget, { ...receiver, hp: receiver.hp + healed });
      nextActor = replaced.actor;
      nextTarget = replaced.target;
      messages.push(`${skill.name} recuperou ${healed} de HP de ${receiver.name}.`);
      totalAmount += healed;
      if (eventKind !== "damage") eventKind = "heal";
      continue;
    }

    if (operation.operation === "SHIELD") {
      const amount = Math.max(1, Math.round(rawPower || actorAttributes.ARC));
      const replaced = replaceReceiver(nextActor, nextTarget, { ...receiver, shield: receiver.shield + amount });
      nextActor = replaced.actor;
      nextTarget = replaced.target;
      messages.push(`${skill.name} concedeu ${amount} de escudo a ${receiver.name}.`);
      totalAmount += amount;
      if (eventKind !== "damage" && eventKind !== "heal") eventKind = "shield";
      continue;
    }

    if (operation.operation === "REMOVE_STATUS") {
      const statuses = { ...receiver.statuses };
      const removableKey =
        operation.status && operation.status !== "negative"
          ? operation.status
          : Object.entries(statuses).find(([, value]) => !value.beneficial)?.[0];
      if (removableKey) delete statuses[removableKey];
      const replaced = replaceReceiver(nextActor, nextTarget, { ...receiver, statuses });
      nextActor = replaced.actor;
      nextTarget = replaced.target;
      messages.push(removableKey ? `${skill.name} removeu um efeito negativo de ${receiver.name}.` : `${skill.name} não encontrou efeito negativo para remover.`);
      continue;
    }

    if (operation.operation === "RESOURCE_GAIN" || operation.operation === "RESOURCE_COST") {
      const amount = Math.max(0, Math.round(rawPower));
      const sign = operation.operation === "RESOURCE_GAIN" ? 1 : -1;
      const race = skill.resourceKey === "race";
      const changed = race
        ? {
            ...receiver,
            raceResource: Math.max(0, Math.min(receiver.maxRaceResource, receiver.raceResource + sign * amount)),
          }
        : {
            ...receiver,
            classResource: Math.max(0, Math.min(receiver.maxClassResource, receiver.classResource + sign * amount)),
          };
      const replaced = replaceReceiver(nextActor, nextTarget, changed);
      nextActor = replaced.actor;
      nextTarget = replaced.target;
      messages.push(`${skill.name} ${sign > 0 ? "gerou" : "consumiu"} ${amount} de ${race ? receiver.raceResourceName : receiver.classResourceName}.`);
      continue;
    }

    if (["MOVE", "TELEPORT", "PUSH"].includes(operation.operation)) {
      messages.push(`${skill.name}: ${operation.operation} reservado ao tabuleiro tático.`);
      continue;
    }

    const duration = Math.max(1, operation.duration || skill.duration || 1);
    const key = statusKey(operation, skill);
    const stacks = Math.max(1, operation.stacks || 1);
    const maxStacks = Math.max(stacks, operation.maxStacks || 1);
    const modifiers = Object.fromEntries(
      operation.modifiers.map((modifier) => [modifier.attribute, modifier.value]),
    );
    const nextStatuses = {
      ...receiver.statuses,
      [key]: {
        name: operation.status || skill.name,
        duration,
        stacks: Math.min(maxStacks, (receiver.statuses[key]?.stacks ?? 0) + stacks),
        modifiers,
        beneficial: isBeneficialStatusOperation(operation),
        forcedTargetId: operation.operation === "TAUNT" ? nextActor.id : undefined,
      },
    };
    const replaced = replaceReceiver(nextActor, nextTarget, { ...receiver, statuses: nextStatuses });
    nextActor = replaced.actor;
    nextTarget = replaced.target;
    messages.push(`${skill.name} aplicou ${operation.status || operation.operation.toLowerCase()} em ${receiver.name} por ${duration} turno(s).`);
  }

  if (!messages.length) messages.push(`${skill.name} foi usada, mas nenhuma operação produziu efeito.`);

  return {
    actor: nextActor,
    target: nextTarget,
    event: {
      kind: eventKind,
      amount: totalAmount,
      damageType,
      message: `${actor.name} usou ${skill.name}. ${messages.join(" ")}`,
    },
  };
}
