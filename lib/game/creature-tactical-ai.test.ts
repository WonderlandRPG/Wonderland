import { describe, expect, it } from "vitest";

import type { ClassSkill } from "@/lib/game/classes";
import { chooseCreatureTacticalSkill, getCreaturePlanningSkillRange } from "@/lib/game/creature-tactical-ai";

function skill(input: {
  key: string;
  name: string;
  range: number;
  base: number;
  cooldown?: number;
  effect?: "ROOT" | "STUN" | "PUSH";
}): ClassSkill {
  const operations: ClassSkill["operations"] = [
    {
      operation: "DAMAGE",
      target: "enemy",
      base: input.base,
      scaling: [],
      damageType: "physical",
      status: "",
      duration: 0,
      chance: 100,
      stacks: 0,
      maxStacks: 0,
      distance: 0,
      modifiers: [],
    },
  ];
  if (input.effect) {
    operations.push({
      operation: input.effect,
      target: "enemy",
      base: 0,
      scaling: [],
      damageType: "none",
      status: input.effect.toLowerCase(),
      duration: input.effect === "PUSH" ? 0 : 1,
      chance: 100,
      stacks: 1,
      maxStacks: 1,
      distance: input.effect === "PUSH" ? 1 : 0,
      modifiers: [],
    });
  }
  return {
    key: input.key,
    name: input.name,
    level: 1,
    category: "Criatura",
    type: "Ativa",
    effect: input.name,
    kind: "damage",
    damageType: "physical",
    target: "enemy",
    resource: "none",
    resourceKey: "class",
    cost: 0,
    cooldown: input.cooldown ?? 0,
    range: input.range,
    area: 0,
    duration: 0,
    scaling: [],
    reachText: `${input.range} casas`,
    conditions: [],
    systemRule: input.name,
    playerDescription: input.name,
    chance: 100,
    maxStacks: 1,
    operations,
  };
}

const melee = skill({ key: "melee", name: "Garra", range: 1, base: 80 });
const ranged = skill({ key: "ranged", name: "Espinho", range: 4, base: 45 });
const root = skill({ key: "root", name: "Teia", range: 3, base: 30, effect: "ROOT" });
const stun = skill({ key: "stun", name: "Impacto", range: 2, base: 25, effect: "STUN" });
const push = skill({ key: "push", name: "Investida", range: 1, base: 50, effect: "PUSH" });

describe("seleção de habilidade da criatura", () => {
  it("não escolhe habilidade em cooldown", () => {
    const chosen = chooseCreatureTacticalSkill({
      skills: [melee, ranged],
      cooldowns: { ranged: 2 },
      distance: 1,
      profile: "ranged",
    });
    expect(chosen?.key).toBe("melee");
  });

  it("perfil ranged prefere habilidade de maior alcance", () => {
    const chosen = chooseCreatureTacticalSkill({
      skills: [melee, ranged],
      cooldowns: {},
      distance: 1,
      profile: "ranged",
    });
    expect(chosen?.key).toBe("ranged");
  });

  it("perfil controller prioriza STUN e ROOT", () => {
    const chosen = chooseCreatureTacticalSkill({
      skills: [ranged, root, stun],
      cooldowns: {},
      distance: 2,
      profile: "controller",
    });
    expect(chosen?.key).toBe("stun");
  });

  it("perfil aggressive valoriza PUSH em curta distância", () => {
    const chosen = chooseCreatureTacticalSkill({
      skills: [melee, push],
      cooldowns: {},
      distance: 1,
      profile: "aggressive",
    });
    expect(chosen?.key).toBe("push");
  });

  it("retorna null quando nenhuma habilidade disponível alcança o alvo", () => {
    const chosen = chooseCreatureTacticalSkill({
      skills: [melee],
      cooldowns: {},
      distance: 3,
      profile: "aggressive",
    });
    expect(chosen).toBeNull();
  });

  it("usa a habilidade preferida para planejar alcance antes do movimento", () => {
    expect(getCreaturePlanningSkillRange({
      skills: [melee, ranged],
      cooldowns: {},
      profile: "ranged",
      fallbackRange: 1,
    })).toBe(4);
  });
});
