import { describe, expect, it } from "vitest";

import type { ClassSkill } from "@/lib/game/classes";
import { getTacticalSkillRange } from "@/lib/game/tactical-skill-range";

function skill(input: Partial<ClassSkill> & Pick<ClassSkill, "target" | "operations">): ClassSkill {
  return {
    key: "teste",
    name: "Teste",
    level: 1,
    category: "Teste",
    type: "Ativa",
    effect: "Teste",
    kind: "utility",
    damageType: "none",
    target: input.target,
    resource: "none",
    resourceKey: "class",
    cost: 0,
    cooldown: 0,
    range: input.range ?? 0,
    area: input.area ?? 0,
    duration: 0,
    scaling: [],
    reachText: "Teste",
    conditions: [],
    systemRule: "Teste",
    playerDescription: "Teste",
    chance: 100,
    maxStacks: 1,
    operations: input.operations,
  };
}

const operation = (target: "self" | "ally" | "enemy" | "area", operation = "DAMAGE", distance = 0) => ({
  operation: operation as ClassSkill["operations"][number]["operation"],
  target,
  base: 0,
  scaling: [],
  damageType: "none" as const,
  status: "",
  duration: 0,
  chance: 100,
  stacks: 0,
  maxStacks: 0,
  distance,
  modifiers: [],
});

describe("getTacticalSkillRange", () => {
  it("preserves a real configured range", () => {
    expect(getTacticalSkillRange(skill({ target: "enemy", range: 5, operations: [operation("enemy")] }), 3)).toBe(5);
  });

  it("repairs legacy ranged class skills with range zero", () => {
    expect(getTacticalSkillRange(skill({ target: "enemy", operations: [operation("enemy")] }), 3)).toBe(3);
  });

  it("repairs legacy melee skills with at least one cell", () => {
    expect(getTacticalSkillRange(skill({ target: "enemy", operations: [operation("enemy")] }), 1)).toBe(1);
  });

  it("keeps pure self buffs at range zero", () => {
    expect(getTacticalSkillRange(skill({ target: "self", operations: [operation("self", "BUFF")] }), 3)).toBe(0);
  });

  it("uses MOVE or TELEPORT distance for self movement", () => {
    expect(getTacticalSkillRange(skill({ target: "self", operations: [operation("self", "TELEPORT", 4)] }), 1)).toBe(4);
  });
});
