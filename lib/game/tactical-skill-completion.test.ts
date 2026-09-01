import { describe, expect, it } from "vitest";

import type { ClassSkill } from "@/lib/game/classes";
import { hasTacticalMechanicalEffect } from "@/lib/game/tactical-skill";
import { getTacticalTransformationModifiers } from "@/lib/game/tactical-skill-repair";

const finalizedTransformations = [
  "forma-serafinica",
  "forma-draconica",
  "transe-ancestral",
  "glamour-supremo",
  "improvisacao",
  "nove-caudas",
  "soberania-leonis",
  "forma-lunar",
  "frenesi-orc",
  "avatar-infernal",
  "senhor-da-noite",
] as const;

function oneOperation(operation: ClassSkill["operations"][number]["operation"]): ClassSkill {
  const modifierOperations = new Set(["BUFF", "DEBUFF", "APPLY_STATUS", "SUMMON"]);
  return {
    key: operation.toLowerCase(),
    name: operation,
    level: 1,
    category: "Teste",
    type: "Ativa",
    effect: "Teste",
    kind: operation === "DAMAGE" ? "damage" : "utility",
    damageType: operation === "DAMAGE" ? "physical" : "none",
    target: "enemy",
    resource: "none",
    resourceKey: "class",
    cost: 0,
    cooldown: 0,
    range: 1,
    area: 0,
    duration: 1,
    scaling: [],
    reachText: "Teste",
    conditions: [],
    systemRule: "Teste",
    playerDescription: "Teste",
    chance: 100,
    maxStacks: 1,
    operations: [{
      operation,
      target: "enemy",
      base: operation === "DAMAGE" ? 10 : 0,
      scaling: [],
      damageType: operation === "DAMAGE" ? "physical" : "none",
      status: "teste",
      duration: 1,
      chance: 100,
      stacks: 1,
      maxStacks: 1,
      distance: operation === "MOVE" || operation === "TELEPORT" || operation === "PUSH" ? 2 : 0,
      modifiers: modifierOperations.has(operation) ? [{ attribute: "DEF", value: -10 }] : [],
    }],
  };
}

describe("finalized tactical skill contract", () => {
  it("has permanent mechanics for every published inert racial transformation", () => {
    for (const status of finalizedTransformations) {
      expect(getTacticalTransformationModifiers(status)?.length).toBeGreaterThan(0);
    }
  });

  it("recognizes every operation family currently used by published active skills", () => {
    const operations: ClassSkill["operations"][number]["operation"][] = [
      "DAMAGE",
      "DEBUFF",
      "BUFF",
      "HEAL",
      "FEAR",
      "SHIELD",
      "REMOVE_STATUS",
      "APPLY_STATUS",
      "SILENCE",
      "TAUNT",
      "SUMMON",
      "MOVE",
      "STUN",
      "ROOT",
      "TELEPORT",
    ];
    for (const operation of operations) {
      expect(hasTacticalMechanicalEffect(oneOperation(operation)), operation).toBe(true);
    }
  });
});
