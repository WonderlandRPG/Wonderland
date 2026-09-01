import { describe, expect, it } from "vitest";

import { createCombatant } from "@/lib/game/combat";
import type { ClassSkill } from "@/lib/game/classes";
import {
  applyCreatureBasicAttackResistance,
  applyCreatureControlResistances,
  applyCreatureDamageTraits,
  applyCreatureWeaknessBonus,
  findMatchedCreatureResistance,
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
  operations: [
    {
      operation: "DAMAGE",
      target: "enemy",
      base: 20,
      scaling: [{ attribute: "INT", multiplier: 1 }],
      damageType: "magic",
      status: "",
      duration: 0,
      chance: 100,
      stacks: 0,
      maxStacks: 0,
      distance: 0,
      modifiers: [],
    },
  ],
};

const stunSkill: ClassSkill = {
  ...fireSkill,
  key: "impacto-atordoante",
  name: "Impacto Atordoante",
  effect: "Atordoa o alvo.",
  systemRule: "Dano seguido de STUN.",
  operations: [
    ...fireSkill.operations,
    {
      operation: "STUN",
      target: "enemy",
      base: 0,
      scaling: [],
      damageType: "none",
      status: "",
      duration: 2,
      chance: 100,
      stacks: 1,
      maxStacks: 1,
      distance: 0,
      modifiers: [],
    },
  ],
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

  it("reconhece fraqueza e resistência pela afinidade da habilidade", () => {
    expect(findMatchedCreatureWeakness(fireSkill, ["fogo", "ataques simultâneos"])).toBe("fogo");
    expect(findMatchedCreatureResistance(fireSkill, ["fogo", "medo"])).toBe("fogo");
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

  it("reduz exatamente 25% do dano quando a resistência é ativada", () => {
    const before = target(500);
    const after = target(400);
    const result = applyCreatureDamageTraits({
      before,
      after,
      skill: fireSkill,
      weaknesses: [],
      resistances: ["fogo"],
    });
    expect(result.reducedDamage).toBe(25);
    expect(result.target.hp).toBe(425);
    expect(result.resistance).toBe("fogo");
  });

  it("anula fraqueza e resistência quando ambas descrevem a mesma afinidade", () => {
    const before = target(500);
    const after = target(400);
    const result = applyCreatureDamageTraits({
      before,
      after,
      skill: fireSkill,
      weaknesses: ["fogo"],
      resistances: ["fogo"],
    });
    expect(result.neutralized).toBe(true);
    expect(result.target.hp).toBe(400);
    expect(result.bonusDamage).toBe(0);
    expect(result.reducedDamage).toBe(0);
  });

  it("aplica resistência física ou mágica também ao ataque básico", () => {
    const before = target(500);
    const after = target(400);
    const result = applyCreatureBasicAttackResistance({
      before,
      after,
      damageType: "physical",
      resistances: ["dano físico"],
    });
    expect(result.reducedDamage).toBe(25);
    expect(result.target.hp).toBe(425);
  });

  it("reduz controle em um turno e nega controles de duração 1", () => {
    const before = target(500);
    const afterTwoTurns = {
      ...before,
      statuses: {
        ...before.statuses,
        [`stun-${stunSkill.key}`]: {
          name: "STUN",
          duration: 2,
          stacks: 1,
          modifiers: {},
          beneficial: false,
        },
      },
    };
    const reduced = applyCreatureControlResistances({
      before,
      after: afterTwoTurns,
      skill: stunSkill,
      resistances: ["atordoamento"],
    });
    expect(reduced.target.statuses[`stun-${stunSkill.key}`]?.duration).toBe(1);

    const afterOneTurn = {
      ...afterTwoTurns,
      statuses: {
        ...before.statuses,
        [`stun-${stunSkill.key}`]: {
          name: "STUN",
          duration: 1,
          stacks: 1,
          modifiers: {},
          beneficial: false,
        },
      },
    };
    const negated = applyCreatureControlResistances({
      before,
      after: afterOneTurn,
      skill: stunSkill,
      resistances: ["stun"],
    });
    expect(negated.target.statuses[`stun-${stunSkill.key}`]).toBeUndefined();
  });
});
