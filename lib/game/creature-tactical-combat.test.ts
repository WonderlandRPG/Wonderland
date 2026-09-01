import { describe, expect, it } from "vitest";

import { createCombatant } from "@/lib/game/combat";
import type { ClassSkill } from "@/lib/game/classes";
import {
  applyCreatureWeaknessBonus,
  findMatchedCreatureWeakness,
  parseCreatureCombatProfile,
} from "@/lib/game/creature-tactical-combat";

const fireSkill: ClassSkill = {
  key: "chama-teste",
  name: "Chama Solar",
  level: 1,
  category: "Ofensiva",
  type: "Ativa",
  effect: "Dispara fogo concentrado.",
  kind: "damage",
  damageType: "magic",
  target: "enemy",
  resource: "mana",
  resourceKey: "class",
  cost: 10,
  cooldown: 1,
  range: 3,
  area: 0,
  duration: 0,
  scaling: [{ attribute: "INT", multiplier: 1 }],
  reachText: "3 casas",
  conditions: [],
  systemRule: "Causa dano de fogo.",
  playerDescription: "Uma chama de fogo.",
  chance: 100,
  maxStacks: 1,
  operations: [{ operation: "DAMAGE", target: "enemy", base: 20, scaling: [{ attribute: "INT", multiplier: 1 }], damageType: "magic", status: "", duration: 0, chance: 100, stacks: 0, maxStacks: 0, distance: 0, modifiers: [] }],
};

function target(hp: number) {
  const state = createCombatant({
    id: `target-${hp}`,
    name: "Alvo",
    attributes: { FOR: 10, DEF: 10, RES: 10, INI: 10, INT: 10, ARC: 10 },
    baseHp: 500,
    baseMana: 0,
    usesMana: false,
  });
  return { ...state, hp };
}

describe("perfil tático de criatura", () => {
  it("usa defaults seguros por rank quando o perfil está incompleto", () => {
    const profile = parseCreatureCombatProfile("B", {});
    expect(profile.hp).toBe(900);
    expect(profile.attributes.FOR).toBe(100);
    expect(profile.aiProfile).toBe("aggressive");
  });

  it("reconhece afinidade elemental somente quando a fraqueza combina", () => {
    expect(findMatchedCreatureWeakness(fireSkill, ["fogo", "ataques simultâneos"])).toBe("fogo");
    expect(findMatchedCreatureWeakness(fireSkill, ["frio", "espelhos"])).toBeNull();
  });

  it("aplica exatamente 25% de dano extra quando a fraqueza é ativada", () => {
    const before = target(500);
    const after = target(400);
    const result = applyCreatureWeaknessBonus({ before, after, skill: fireSkill, weaknesses: ["fogo"] });
    expect(result.bonusDamage).toBe(25);
    expect(result.target.hp).toBe(375);
    expect(result.weakness).toBe("fogo");
  });
});
