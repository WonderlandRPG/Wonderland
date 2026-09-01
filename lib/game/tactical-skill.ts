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
import { applyTacticalRacialReaction } from "@/lib/game/tactical-race-reactions";

export type TacticalSkillContext = {
  distance?: number;
  firstSuccessfulActionThisRound?: boolean;
};

export type TacticalSkillResolution = CombatResolution & {
  successfulOperationIndexes: number[];
};

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
  if (["ROOT", "STUN", "SILENCE", "FEAR", "TAUNT", "SUMMON"].includes(operation.operation)) {
    return `${operation.operation.toLowerCase()}-${skill.key}`;
  }
  return skill.key;
}

function operationHasMechanicalEffect(operation: ClassSkill["operations"][number]) {
  if (
    [
      "DAMAGE",
      "HEAL",
      "SHIELD",
      "STUN",
      "ROOT",
      "SILENCE",
      "FEAR",
      "PUSH",
      "MOVE",
      "TELEPORT",
      "REMOVE_STATUS",
      "RESOURCE_GAIN",
      "RESOURCE_COST",
      "TAUNT",
    ].includes(operation.operation)
  ) {
    return true;
  }

  if (["BUFF", "DEBUFF", "APPLY_STATUS", "SUMMON"].includes(operation.operation)) {
    return operation.modifiers.length > 0;
  }

  return false;
}

function isDefeated(combatant: CombatantState) {
  return combatant.hp <= 0;
}

function hasOpponentOperation(skill: ClassSkill) {
  return skill.operations.some(
    (operation) => operation.target === "enemy" || operation.target === "area",
  );
}

export function hasTacticalMechanicalEffect(skill: ClassSkill) {
  return skill.operations.some(operationHasMechanicalEffect);
}

function errorResolution(
  actor: CombatantState,
  target: CombatantState,
  message: string,
): TacticalSkillResolution {
  return {
    actor,
    target,
    successfulOperationIndexes: [],
    event: { kind: "error", amount: 0, message },
  };
}

function validateAndPay(
  actor: CombatantState,
  target: CombatantState,
  skill: ClassSkill,
): TacticalSkillResolution | { actor: CombatantState; target: CombatantState } {
  if (isDefeated(actor)) {
    return errorResolution(actor, target, `${actor.name} está derrotado e não pode usar ${skill.name}.`);
  }
  if (isDefeated(target) && hasOpponentOperation(skill)) {
    return errorResolution(actor, target, `${target.name} já está derrotado.`);
  }
  if (!hasTacticalMechanicalEffect(skill)) {
    return errorResolution(
      actor,
      target,
      `${skill.name} ainda não possui uma regra mecânica executável no mapa tático. Nenhum recurso ou cooldown foi consumido.`,
    );
  }
  if ((actor.cooldowns[skill.key] ?? 0) > 0) {
    return errorResolution(actor, target, `${skill.name} ainda está em recarga.`);
  }
  if (skill.resource === "mana" && actor.mana < skill.cost) {
    return errorResolution(actor, target, `Mana insuficiente para usar ${skill.name}.`);
  }
  if (skill.resource === "life" && actor.hp <= skill.cost) {
    return errorResolution(actor, target, `HP insuficiente para usar ${skill.name}.`);
  }

  const usesRaceResource = skill.resource === "special" && skill.resourceKey === "race";
  const available = usesRaceResource ? actor.raceResource : actor.classResource;
  const resourceName = usesRaceResource ? actor.raceResourceName : actor.classResourceName;
  if (skill.resource === "special" && available < skill.cost) {
    return errorResolution(actor, target, `${resourceName} insuficiente para usar ${skill.name}.`);
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
  context: TacticalSkillContext = {},
): TacticalSkillResolution {
  const paid = validateAndPay(actor, target, skill);
  if ("event" in paid) return paid;

  let nextActor = paid.actor;
  let nextTarget = paid.target;
  const messages: string[] = [];
  const successfulOperationTypes = new Set<string>();
  const successfulOperationIndexes: number[] = [];
  let totalAmount = 0;
  let eventKind: CombatEvent["kind"] = "utility";
  let damageType: CombatEvent["damageType"];

  for (const [operationIndex, operation] of skill.operations.entries()) {
    if (operation.chance < 100 && Math.random() * 100 >= operation.chance) {
      messages.push(`${skill.name}: ${operation.operation} falhou.`);
      continue;
    }

    if (operation.operation === "REACTION") {
      messages.push(`${skill.name}: reação passiva aguardando o gatilho automático.`);
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
      if (dealt > 0) {
        successfulOperationTypes.add("DAMAGE");
        successfulOperationIndexes.push(operationIndex);
      }
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
      if (healed > 0) {
        successfulOperationTypes.add("HEAL");
        successfulOperationIndexes.push(operationIndex);
      }
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
      successfulOperationTypes.add("SHIELD");
      successfulOperationIndexes.push(operationIndex);
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
      if (removableKey) {
        successfulOperationTypes.add("REMOVE_STATUS");
        successfulOperationIndexes.push(operationIndex);
      }
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
      if (amount > 0) {
        successfulOperationTypes.add(operation.operation);
        successfulOperationIndexes.push(operationIndex);
      }
      continue;
    }

    if (["MOVE", "TELEPORT", "PUSH"].includes(operation.operation)) {
      messages.push(`${skill.name}: ${operation.operation} reservado ao tabuleiro tático.`);
      successfulOperationTypes.add(operation.operation);
      successfulOperationIndexes.push(operationIndex);
      continue;
    }

    if (
      ["BUFF", "DEBUFF", "APPLY_STATUS", "SUMMON"].includes(operation.operation) &&
      operation.modifiers.length === 0
    ) {
      messages.push(`${skill.name}: ${operation.operation} não possui modificadores mecânicos cadastrados.`);
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
    successfulOperationTypes.add(operation.operation);
    successfulOperationIndexes.push(operationIndex);
    messages.push(
      operation.operation === "SUMMON"
        ? `${skill.name} invocou ${operation.status || "uma entidade"}; ${receiver.name} recebeu seus bônus por ${duration} turno(s).`
        : `${skill.name} aplicou ${operation.status || operation.operation.toLowerCase()} em ${receiver.name} por ${duration} turno(s).`,
    );
  }

  const damageToTarget = Math.max(
    0,
    target.hp + target.shield - (nextTarget.hp + nextTarget.shield),
  );
  const reactionSkill: ClassSkill = {
    ...skill,
    operations: skill.operations.filter((operation) => successfulOperationTypes.has(operation.operation)),
  };

  const actorReaction = applyTacticalRacialReaction(
    nextActor,
    nextActor.raceResourceName,
    {
      dealtDamage: damageToTarget,
      damageType,
      distance: context.distance,
      targetHpBefore: target.hp,
      targetMaxHp: target.maxHp,
      skill: reactionSkill,
      firstSuccessfulActionThisRound: context.firstSuccessfulActionThisRound,
    },
  );
  nextActor = actorReaction.combatant;
  if (actorReaction.message) messages.push(actorReaction.message);

  const targetReaction = applyTacticalRacialReaction(
    nextTarget,
    nextTarget.raceResourceName,
    { tookDamage: damageToTarget },
  );
  nextTarget = targetReaction.combatant;
  if (targetReaction.message) messages.push(`${nextTarget.name}: ${targetReaction.message}`);

  if (!messages.length) messages.push(`${skill.name} foi usada, mas nenhuma operação produziu efeito.`);

  return {
    actor: nextActor,
    target: nextTarget,
    successfulOperationIndexes,
    event: {
      kind: eventKind,
      amount: totalAmount,
      damageType,
      message: `${actor.name} usou ${skill.name}. ${messages.join(" ")}`,
    },
  };
}
