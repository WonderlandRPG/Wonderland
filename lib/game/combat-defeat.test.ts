import { describe, expect, it } from "vitest";

import { createCombatant, resolveBasicAttack } from "@/lib/game/combat";

const attributes = { FOR: 100, DEF: 20, RES: 20, INI: 20, INT: 20, ARC: 20 };

function fighter(id: string) {
  return createCombatant({
    id,
    name: id,
    attributes,
    baseHp: 100,
    baseMana: 0,
    basicAttackDamageType: "physical",
  });
}

describe("basic attack defeat guards", () => {
  it("does not let a defeated actor attack", () => {
    const actor = { ...fighter("actor"), hp: 0 };
    const target = fighter("target");

    const result = resolveBasicAttack(actor, target);

    expect(result.event.kind).toBe("error");
    expect(result.target).toEqual(target);
  });

  it("does not let anyone attack an already defeated target", () => {
    const actor = fighter("actor");
    const target = { ...fighter("target"), hp: 0 };

    const result = resolveBasicAttack(actor, target);

    expect(result.event.kind).toBe("error");
    expect(result.actor).toEqual(actor);
  });

  it("keeps a lethally hit target at zero HP", () => {
    const actor = { ...fighter("actor"), attributes: { ...attributes, FOR: 1000 } };
    const target = { ...fighter("target"), hp: 1 };

    const result = resolveBasicAttack(actor, target);

    expect(result.event.kind).toBe("damage");
    expect(result.target.hp).toBe(0);
  });
});
