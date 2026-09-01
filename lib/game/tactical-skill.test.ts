import { describe, expect, it } from "vitest";

import { createCombatant } from "@/lib/game/combat";
import type { ClassSkill } from "@/lib/game/classes";
import { hasTacticalMechanicalEffect, resolveTacticalSkill } from "@/lib/game/tactical-skill";

const attrs = { FOR: 100, DEF: 20, RES: 20, INI: 20, INT: 80, ARC: 60 };

function fighter(id: string) {
  return createCombatant({
    id,
    name: id,
    attributes: attrs,
    baseHp: 500,
    baseMana: 200,
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

function skill(operations: ClassSkill["operations"], overrides: Partial<ClassSkill> = {}): ClassSkill {
  return {
    key: "teste-tatico",
    name: "Teste Tático",
    level: 1,
    category: "Teste",
    type: "Ativa",
    effect: "Teste",
    kind: "damage",
    damageType: "physical",
    target: "enemy",
    resource: "mana",
    resourceKey: "class",
    cost: 10,
    cooldown: 3,
    range: 4,
    area: 0,
    duration: 0,
    scaling: [{ attribute: "FOR", multiplier: 1 }],
    reachText: "Alvo",
    conditions: [],
    systemRule: "Teste",
    playerDescription: "Teste",
    chance: 100,
    maxStacks: 0,
    operations,
    ...overrides,
  };
}

describe("tactical skill resolver", () => {
  it("deals damage even when MOVE is the first operation", () => {
    const actor = fighter("actor");
    const target = fighter("target");
    const ability = skill([
      operation({ operation: "MOVE", target: "self", distance: 2, damageType: "none" }),
      operation({ operation: "DAMAGE", target: "enemy", scaling: [{ attribute: "FOR", multiplier: 1 }] }),
    ]);

    const result = resolveTacticalSkill(actor, target, ability);

    expect(result.target.hp).toBeLessThan(target.hp);
    expect(result.actor.hp).toBe(actor.hp);
    expect(result.actor.mana).toBe(actor.mana - 10);
    expect(result.actor.cooldowns[ability.key]).toBe(3);
  });

  it("applies damage and root in the same cast", () => {
    const actor = fighter("actor");
    const target = fighter("target");
    const ability = skill([
      operation({ operation: "DAMAGE", target: "enemy" }),
      operation({ operation: "ROOT", target: "enemy", status: "enraizado", duration: 2, damageType: "none" }),
    ]);

    const result = resolveTacticalSkill(actor, target, ability);

    expect(result.target.hp).toBeLessThan(target.hp);
    expect(result.target.statuses.enraizado?.duration).toBe(2);
  });

  it("uses operation target instead of the skill-wide target", () => {
    const actor = { ...fighter("actor"), hp: 300 };
    const target = fighter("target");
    const ability = skill(
      [
        operation({ operation: "HEAL", target: "self", base: 50, damageType: "none", scaling: [] }),
        operation({ operation: "DAMAGE", target: "enemy", base: 30, scaling: [] }),
      ],
      { target: "self", kind: "utility", damageType: "none" },
    );

    const result = resolveTacticalSkill(actor, target, ability);

    expect(result.actor.hp).toBeGreaterThan(actor.hp);
    expect(result.target.hp).toBeLessThan(target.hp);
  });

  it("does not charge resource or cooldown twice for multi-operation skills", () => {
    const actor = fighter("actor");
    const target = fighter("target");
    const ability = skill([
      operation({ operation: "DAMAGE", target: "enemy" }),
      operation({ operation: "DAMAGE", target: "enemy" }),
    ]);

    const result = resolveTacticalSkill(actor, target, ability);

    expect(result.actor.mana).toBe(actor.mana - 10);
    expect(result.actor.cooldowns[ability.key]).toBe(3);
    expect(result.target.hp).toBeLessThan(target.hp);
  });

  it("does not consume resources for a status-only skill with no mechanical rule", () => {
    const actor = fighter("actor");
    const target = fighter("target");
    const ability = skill(
      [
        operation({
          operation: "APPLY_STATUS",
          target: "self",
          status: "forma-sem-regra",
          duration: 3,
          damageType: "none",
        }),
      ],
      { kind: "utility", damageType: "none", target: "self" },
    );

    expect(hasTacticalMechanicalEffect(ability)).toBe(false);
    const result = resolveTacticalSkill(actor, target, ability);

    expect(result.event.kind).toBe("error");
    expect(result.actor.mana).toBe(actor.mana);
    expect(result.actor.cooldowns[ability.key]).toBeUndefined();
    expect(result.actor.statuses["forma-sem-regra"]).toBeUndefined();
  });

  it("treats REACTION-only skills as passive instead of clickable actions", () => {
    const actor = fighter("actor");
    const target = fighter("target");
    const ability = skill(
      [operation({ operation: "REACTION", target: "self", damageType: "none" })],
      { kind: "utility", damageType: "none", target: "self", resource: "none", cost: 0 },
    );

    expect(hasTacticalMechanicalEffect(ability)).toBe(false);
    const result = resolveTacticalSkill(actor, target, ability);

    expect(result.event.kind).toBe("error");
    expect(result.actor).toEqual(actor);
  });

  it("applies summon bonuses as a real temporary status", () => {
    const actor = fighter("actor");
    const target = fighter("target");
    const ability = skill(
      [
        operation({
          operation: "SUMMON",
          target: "self",
          status: "servo-espectral",
          duration: 3,
          damageType: "none",
          modifiers: [
            { attribute: "INT", value: 13 },
            { attribute: "DEF", value: 8 },
          ],
        }),
      ],
      { kind: "utility", damageType: "none", target: "self" },
    );

    expect(hasTacticalMechanicalEffect(ability)).toBe(true);
    const result = resolveTacticalSkill(actor, target, ability);

    expect(result.actor.statuses["servo-espectral"]?.duration).toBe(3);
    expect(result.actor.statuses["servo-espectral"]?.modifiers).toEqual({ INT: 13, DEF: 8 });
    expect(result.event.message).toContain("invocou servo-espectral");
  });

  it("refuses an offensive skill when the target is already defeated", () => {
    const actor = fighter("actor");
    const target = { ...fighter("target"), hp: 0 };
    const ability = skill([operation({ operation: "DAMAGE", target: "enemy", base: 50 })]);

    const result = resolveTacticalSkill(actor, target, ability);

    expect(result.event.kind).toBe("error");
    expect(result.actor.mana).toBe(actor.mana);
    expect(result.actor.cooldowns[ability.key]).toBeUndefined();
  });

  it("refuses every skill when the actor is already defeated", () => {
    const actor = { ...fighter("actor"), hp: 0 };
    const target = fighter("target");
    const ability = skill(
      [operation({ operation: "HEAL", target: "self", base: 100, damageType: "none" })],
      { kind: "utility", target: "self", damageType: "none" },
    );

    const result = resolveTacticalSkill(actor, target, ability);

    expect(result.event.kind).toBe("error");
    expect(result.actor.hp).toBe(0);
    expect(result.actor.mana).toBe(actor.mana);
  });

  it("stops remaining enemy effects after lethal damage", () => {
    const actor = fighter("actor");
    const target = { ...fighter("target"), hp: 20 };
    const ability = skill([
      operation({ operation: "DAMAGE", target: "enemy", base: 1000, scaling: [] }),
      operation({
        operation: "ROOT",
        target: "enemy",
        status: "nao-deve-aplicar",
        duration: 4,
        damageType: "none",
      }),
    ]);

    const result = resolveTacticalSkill(actor, target, ability);

    expect(result.target.hp).toBe(0);
    expect(result.target.statuses["nao-deve-aplicar"]).toBeUndefined();
    expect(result.successfulOperationIndexes).toEqual([0]);
    expect(result.event.message).toContain("efeitos restantes no alvo foram encerrados");
  });
});
