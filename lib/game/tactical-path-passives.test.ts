import { describe, expect, it } from "vitest";

import { createCombatant } from "@/lib/game/combat";
import type { ClassSkill } from "@/lib/game/classes";
import {
  applyTacticalPathAfterAction,
  applyTacticalPathIncoming,
  applyTacticalPathSummonExpiry,
  applyTacticalPathTurnEnd,
  consumeTacticalPathItemAction,
  initialTacticalPathTracker,
  markTacticalPathMovement,
  prepareTacticalPathSkill,
  tacticalPathIgnoresLineOfSight,
} from "@/lib/game/tactical-path-passives";

function fighter(id = "hero") {
  return createCombatant({
    id,
    name: id,
    attributes: { FOR: 100, DEF: 100, RES: 100, INI: 100, INT: 100, ARC: 100 },
    baseHp: 1000,
    baseMana: 500,
    classResource: { name: "Recurso", initial: 60, maximum: 100 },
  });
}

function skill(
  operation: ClassSkill["operations"][number]["operation"],
  options: { category?: string; damageType?: ClassSkill["damageType"]; chance?: number; duration?: number; cost?: number; effect?: string } = {},
): ClassSkill {
  const damageType = options.damageType ?? (operation === "DAMAGE" ? "physical" : "none");
  const target = operation === "HEAL" || operation === "SHIELD" || operation === "BUFF" ? "self" : "enemy";
  return {
    key: `skill-${operation}-${options.category ?? "teste"}`,
    name: options.effect ?? operation,
    level: 50,
    category: options.category ?? "Dano",
    type: "Ativa",
    effect: options.effect ?? "Teste",
    kind: operation === "DAMAGE" ? "damage" : operation === "HEAL" ? "heal" : operation === "SHIELD" ? "shield" : "utility",
    damageType,
    target,
    resource: "special",
    resourceKey: "class",
    cost: options.cost ?? 10,
    cooldown: 2,
    range: 4,
    area: 0,
    duration: options.duration ?? 1,
    scaling: [{ attribute: damageType === "physical" ? "FOR" : "INT", multiplier: 1 }],
    reachText: "Teste",
    conditions: [],
    systemRule: "Teste",
    playerDescription: options.effect ?? "Teste",
    chance: options.chance ?? 100,
    maxStacks: 1,
    operations: [{
      operation,
      target,
      base: 0,
      scaling: [{ attribute: damageType === "physical" ? "FOR" : "INT", multiplier: 1 }],
      damageType,
      status: operation.toLowerCase(),
      duration: options.duration ?? 1,
      chance: options.chance ?? 100,
      stacks: 1,
      maxStacks: 1,
      distance: 0,
      modifiers: operation === "BUFF" || operation === "DEBUFF" ? [{ attribute: "DEF", value: operation === "BUFF" ? 10 : -10 }] : [],
    }],
  };
}

function after(pathKey: string, context: Parameters<typeof applyTacticalPathAfterAction>[0]["context"], tracker = initialTacticalPathTracker) {
  const actor = fighter();
  const target = fighter("enemy");
  return applyTacticalPathAfterAction({ pathKey, tracker, actorBefore: actor, targetBefore: target, actorAfter: actor, targetAfter: target, context });
}

describe("tactical path doctrines", () => {
  it("implements offensive doctrines: Berserker, Executor and Pacto Infernal", () => {
    const physical = skill("DAMAGE", { damageType: "physical" });
    expect(after("berserker", { skill: physical, dealtDamage: 100, damageType: "physical" }).target.hp).toBeLessThan(fighter("enemy").hp);

    const low = fighter("enemy");
    low.hp = Math.round(low.maxHp * 0.3);
    const actor = fighter();
    const executor = applyTacticalPathAfterAction({ pathKey: "executor", tracker: initialTacticalPathTracker, actorBefore: actor, targetBefore: low, actorAfter: actor, targetAfter: low, context: { skill: physical, dealtDamage: 100, damageType: "physical" } });
    expect(executor.messages.join(" ")).toContain("Executor");

    const cursed = fighter("enemy");
    cursed.statuses = { curse: { name: "Maldição", duration: 2, stacks: 1, modifiers: { DEF: -10 }, beneficial: false } };
    const infernal = applyTacticalPathAfterAction({ pathKey: "pacto-infernal", tracker: initialTacticalPathTracker, actorBefore: actor, targetBefore: cursed, actorAfter: actor, targetAfter: cursed, context: { skill: skill("DAMAGE", { damageType: "magic" }), dealtDamage: 100, damageType: "magic" } });
    expect(infernal.messages.join(" ")).toContain("Pacto Infernal");
  });

  it("implements support amplification doctrines", () => {
    const wounded = fighter();
    wounded.hp -= 300;
    const support = skill("SHIELD", { category: "Escudo", duration: 2 });
    const commander = prepareTacticalPathSkill({ pathKey: "comandante", tracker: initialTacticalPathTracker, actor: wounded, target: wounded, skill: support });
    expect(commander.skill.operations[0].scaling[0].multiplier).toBeGreaterThan(1);
    const light = prepareTacticalPathSkill({ pathKey: "juramento-da-luz", tracker: initialTacticalPathTracker, actor: wounded, target: wounded, skill: support });
    expect(light.skill.operations[0].scaling[0].multiplier).toBeGreaterThan(1);
    const surgeon = prepareTacticalPathSkill({ pathKey: "cirurgiao-quimico", tracker: initialTacticalPathTracker, actor: wounded, target: wounded, skill: support });
    expect(surgeon.messages.length).toBeGreaterThan(0);
  });

  it("extends/control-amplifies Terra and Glamour doctrines", () => {
    const control = skill("ROOT", { category: "Controle", duration: 1, chance: 70 });
    const terra = prepareTacticalPathSkill({ pathKey: "circulo-da-terra", tracker: initialTacticalPathTracker, actor: fighter(), target: fighter("enemy"), skill: control });
    expect(terra.skill.operations[0].duration).toBe(2);
    const glamour = prepareTacticalPathSkill({ pathKey: "colegio-do-glamour", tracker: initialTacticalPathTracker, actor: fighter(), target: fighter("enemy"), skill: control });
    expect(glamour.skill.operations[0].chance).toBe(90);
  });

  it("implements defensive incoming doctrines", () => {
    const before = fighter();
    before.shield = 100;
    const after = { ...before, hp: before.hp - 150, shield: 0 };
    expect(applyTacticalPathIncoming({ pathKey: "guardiao-totemico", tracker: initialTacticalPathTracker, before, after }).combatant.shield).toBeGreaterThan(0);
    expect(applyTacticalPathIncoming({ pathKey: "bastiao", tracker: initialTacticalPathTracker, before, after }).combatant.hp).toBeGreaterThan(after.hp);
    expect(applyTacticalPathIncoming({ pathKey: "duelista", tracker: initialTacticalPathTracker, before, after, basicAttack: true }).messages.join(" ")).toContain("Duelista");
  });

  it("implements movement doctrines for Sombra and Shinobi", () => {
    const moved = markTacticalPathMovement(initialTacticalPathTracker, true);
    const damage = skill("DAMAGE", { damageType: "physical" });
    expect(after("sombra", { skill: damage, dealtDamage: 100, damageType: "physical", movedBeforeAction: true }, moved).messages.join(" ")).toContain("Sombra");
    expect(after("shinobi", { skill: damage, dealtDamage: 100, damageType: "physical", movedBeforeAction: true }, moved).actor.classResource).toBeGreaterThan(fighter().classResource);
  });

  it("implements item doctrine Trapaceiro only once per combat", () => {
    const first = consumeTacticalPathItemAction("trapaceiro", initialTacticalPathTracker);
    expect(first.consumeAction).toBe(false);
    const second = consumeTacticalPathItemAction("trapaceiro", first.tracker);
    expect(second.consumeAction).toBe(true);
  });

  it("implements Caçador LOS exception only against marked targets", () => {
    const target = fighter("enemy");
    expect(tacticalPathIgnoresLineOfSight("cacador", target)).toBe(false);
    target.statuses = { mark: { name: "Marca da Presa", duration: 2, stacks: 1, modifiers: {}, beneficial: false } };
    expect(tacticalPathIgnoresLineOfSight("cacador", target)).toBe(true);
  });

  it("implements resource-refund doctrines Pacto Abissal, Mestre Transmutador, Mestre dos Selos and Pastor do Véu", () => {
    const control = skill("ROOT", { category: "Controle" });
    expect(after("pacto-abissal", { skill: control, successfulOperationIndexes: [0] }).actor.classResource).toBeGreaterThan(fighter().classResource);

    let tracker = initialTacticalPathTracker;
    for (const category of ["Dano", "Escudo", "Controle"]) {
      const result = after("mestre-transmutador", { skill: skill("DAMAGE", { category }), successfulOperationIndexes: [0], dealtDamage: 10 }, tracker);
      tracker = result.tracker;
      if (category === "Controle") expect(result.actor.classResource).toBeGreaterThan(fighter().classResource);
    }

    const markedTracker = after("mestre-dos-selos", { skill: control, successfulOperationIndexes: [0], targetMarked: true }).actor;
    expect(markedTracker.classResource).toBeGreaterThan(fighter().classResource);

    const pastor = after("pastor-do-veu", { skill: control, classResourceBefore: 10, classResourceAfterCost: 0 });
    expect(pastor.actor.shield).toBeGreaterThan(0);
  });

  it("implements end-of-turn Arcanista and summon-expiry Senhor dos Mortos", () => {
    const arcanist = applyTacticalPathTurnEnd({ pathKey: "arcanista", tracker: initialTacticalPathTracker, combatant: fighter() });
    expect(arcanist.combatant.shield).toBeGreaterThan(0);
    const summon = applyTacticalPathSummonExpiry({ pathKey: "senhor-dos-mortos", tracker: initialTacticalPathTracker, combatant: fighter(), expired: true });
    expect(summon.combatant.classResource).toBeGreaterThan(fighter().classResource);
  });

  it("implements combo/alternation doctrines", () => {
    const damage = skill("DAMAGE", { damageType: "physical" });
    const first = after("punho-de-ferro", { skill: damage, dealtDamage: 100, damageType: "physical" });
    const second = after("punho-de-ferro", { skill: damage, dealtDamage: 100, damageType: "physical" }, first.tracker);
    expect(second.messages.join(" ")).toContain("Punho de Ferro");

    const elementalFirst = after("elementalista", { skill: skill("DAMAGE", { damageType: "magic", effect: "Chama de fogo" }), dealtDamage: 100, damageType: "magic" });
    const elementalSecond = after("elementalista", { skill: skill("DAMAGE", { damageType: "magic", effect: "Lança de gelo" }), dealtDamage: 100, damageType: "magic" }, elementalFirst.tracker);
    expect(elementalSecond.messages.join(" ")).toContain("Reação Elemental");
  });
});
