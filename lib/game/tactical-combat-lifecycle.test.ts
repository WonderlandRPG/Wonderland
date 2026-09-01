import { describe, expect, it } from "vitest";

import { createCombatant } from "@/lib/game/combat";
import type { ClassSkill } from "@/lib/game/classes";
import {
  getTacticalCombatOutcome,
  isTacticalCombatFinished,
  shouldStartNextTacticalRound,
} from "@/lib/game/tactical-combat-outcome";
import { resolveTacticalSkill } from "@/lib/game/tactical-skill";
import { applyTacticalSpatialSkill } from "@/lib/game/tactical-spatial-skill";

const attrs = { FOR: 200, DEF: 20, RES: 20, INI: 20, INT: 20, ARC: 40 };

function fighter(id: string) {
  return createCombatant({
    id,
    name: id,
    attributes: attrs,
    baseHp: 300,
    baseMana: 100,
    usesMana: true,
  });
}

function operation(overrides: Partial<ClassSkill["operations"][number]> = {}): ClassSkill["operations"][number] {
  return {
    operation: "DAMAGE",
    target: "enemy",
    base: 0,
    scaling: [],
    damageType: "physical",
    status: "",
    duration: 0,
    chance: 100,
    stacks: 0,
    maxStacks: 0,
    distance: 0,
    modifiers: [],
    ...overrides,
  };
}

function skill(operations: ClassSkill["operations"]): ClassSkill {
  return {
    key: "ciclo-letal",
    name: "Ciclo Letal",
    level: 1,
    category: "Teste",
    type: "Ativa",
    effect: "Teste de ciclo",
    kind: "damage",
    damageType: "physical",
    target: "enemy",
    resource: "mana",
    resourceKey: "class",
    cost: 5,
    cooldown: 1,
    range: 4,
    area: 0,
    duration: 0,
    scaling: [],
    reachText: "Alvo",
    conditions: [],
    systemRule: "Teste",
    playerDescription: "Teste",
    chance: 100,
    maxStacks: 0,
    operations,
  };
}

describe("tactical combat lifecycle integration", () => {
  it("does not execute PUSH after the target dies earlier in the same skill", () => {
    const actor = fighter("actor");
    const target = { ...fighter("target"), hp: 10 };
    const ability = skill([
      operation({ operation: "DAMAGE", base: 9999 }),
      operation({ operation: "PUSH", target: "enemy", distance: 3, damageType: "none" }),
    ]);

    const resolved = resolveTacticalSkill(actor, target, ability);
    expect(resolved.target.hp).toBe(0);
    expect(resolved.successfulOperationIndexes).toEqual([0]);

    const spatial = applyTacticalSpatialSkill({
      skill: ability,
      successfulOperationIndexes: resolved.successfulOperationIndexes,
      playerPosition: { x: 1, y: 1 },
      enemyPosition: { x: 2, y: 1 },
      selectedPosition: { x: 2, y: 1 },
      obstacles: new Set<string>(),
      grid: { width: 8, height: 8 },
    });

    expect(spatial.enemyPosition).toEqual({ x: 2, y: 1 });
  });

  it("does not leave control statuses on a target defeated by the same skill", () => {
    const actor = fighter("actor");
    const target = { ...fighter("target"), hp: 10 };
    const ability = skill([
      operation({ operation: "DAMAGE", base: 9999 }),
      operation({ operation: "STUN", status: "stun-pos-morte", duration: 3, damageType: "none" }),
    ]);

    const resolved = resolveTacticalSkill(actor, target, ability);

    expect(resolved.target.hp).toBe(0);
    expect(resolved.target.statuses["stun-pos-morte"]).toBeUndefined();
  });

  it("still resolves a self operation after a lethal enemy hit", () => {
    const actor = fighter("actor");
    const target = { ...fighter("target"), hp: 10 };
    const ability = skill([
      operation({ operation: "DAMAGE", base: 9999 }),
      operation({
        operation: "BUFF",
        target: "self",
        status: "impeto-final",
        duration: 2,
        damageType: "none",
        modifiers: [{ attribute: "FOR", value: 10 }],
      }),
    ]);

    const resolved = resolveTacticalSkill(actor, target, ability);

    expect(resolved.target.hp).toBe(0);
    expect(resolved.actor.statuses["impeto-final"]?.duration).toBe(2);
  });

  it("ends the combat immediately after lethal resolution and forbids another round", () => {
    const player = fighter("player");
    const enemy = { ...fighter("enemy"), hp: 0 };
    const outcome = getTacticalCombatOutcome(player, enemy);

    expect(outcome).toBe("victory");
    expect(isTacticalCombatFinished(outcome)).toBe(true);
    expect(shouldStartNextTacticalRound(outcome)).toBe(false);
  });

  it("keeps a living combat in ongoing state and allows the next round", () => {
    const outcome = getTacticalCombatOutcome(fighter("player"), fighter("enemy"));

    expect(outcome).toBe("ongoing");
    expect(isTacticalCombatFinished(outcome)).toBe(false);
    expect(shouldStartNextTacticalRound(outcome)).toBe(true);
  });
});
