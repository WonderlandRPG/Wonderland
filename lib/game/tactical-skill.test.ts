import { describe, expect, it } from "vitest";

import { createCombatant } from "@/lib/game/combat";
import type { ClassSkill } from "@/lib/game/classes";
import { resolveTacticalSkill } from "@/lib/game/tactical-skill";

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
});
