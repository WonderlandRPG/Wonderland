import { describe, expect, it } from "vitest";

import { createCombatant } from "@/lib/game/combat";
import type { ClassSkill } from "@/lib/game/classes";
import { applyTacticalRacialReaction } from "@/lib/game/tactical-race-reactions";

function fighter() {
  return createCombatant({
    id: "hero",
    name: "Hero",
    attributes: { FOR: 50, DEF: 50, RES: 50, INI: 50, INT: 50, ARC: 50 },
    baseHp: 500,
    baseMana: 100,
    usesMana: true,
    raceResource: { name: "Racial", initial: 0, maximum: 9 },
  });
}

function skill(operation: ClassSkill["operations"][number]["operation"], damageType: ClassSkill["damageType"] = "none"): ClassSkill {
  return {
    key: `skill-${operation}`,
    name: operation,
    level: 1,
    category: "Teste",
    type: "Ativa",
    effect: "Teste",
    kind: damageType === "none" ? "utility" : "damage",
    damageType,
    target: operation === "HEAL" || operation === "SHIELD" ? "self" : "enemy",
    resource: "none",
    resourceKey: "race",
    cost: 0,
    cooldown: 0,
    range: 4,
    area: 0,
    duration: 1,
    scaling: [],
    reachText: "Teste",
    conditions: [],
    systemRule: "Teste",
    playerDescription: "Teste",
    chance: 100,
    maxStacks: 1,
    operations: [
      {
        operation,
        target: operation === "HEAL" || operation === "SHIELD" ? "self" : "enemy",
        base: 10,
        scaling: [],
        damageType,
        status: operation.toLowerCase(),
        duration: 1,
        chance: 100,
        stacks: 1,
        maxStacks: 1,
        distance: 0,
        modifiers: [],
      },
    ],
  };
}

describe("tactical racial reactions", () => {
  it("gives Aengel resource after healing or shielding", () => {
    const result = applyTacticalRacialReaction(fighter(), "Aengel", { skill: skill("HEAL") });
    expect(result.triggered).toBe(true);
    expect(result.combatant.raceResource).toBe(1);
  });

  it("requires Draconato to take at least 10% max HP in one action", () => {
    expect(applyTacticalRacialReaction(fighter(), "Draconato", { tookDamage: 49 }).triggered).toBe(false);
    expect(applyTacticalRacialReaction(fighter(), "Draconato", { tookDamage: 50 }).triggered).toBe(true);
  });

  it("gives Elfo resource for a hit from at least three cells", () => {
    const result = applyTacticalRacialReaction(fighter(), "Elfo", { dealtDamage: 20, distance: 3 });
    expect(result.triggered).toBe(true);
  });

  it("gives Fada resource for control", () => {
    expect(applyTacticalRacialReaction(fighter(), "Fada", { skill: skill("ROOT") }).triggered).toBe(true);
  });

  it("gives Humano resource on the first successful action of a round", () => {
    expect(applyTacticalRacialReaction(fighter(), "Humano", { firstSuccessfulActionThisRound: true }).triggered).toBe(true);
    expect(applyTacticalRacialReaction(fighter(), "Humano", { firstSuccessfulActionThisRound: false }).triggered).toBe(false);
  });

  it("gives Kitsune resource after applying a negative status", () => {
    expect(applyTacticalRacialReaction(fighter(), "Kitsune", { skill: skill("DEBUFF") }).triggered).toBe(true);
  });

  it("gives Leonis resource after shield or taunt", () => {
    expect(applyTacticalRacialReaction(fighter(), "Leonis", { skill: skill("SHIELD") }).triggered).toBe(true);
  });

  it("gives Lobisomem resource when hitting a target already below half HP", () => {
    const result = applyTacticalRacialReaction(fighter(), "Lobisomem", {
      dealtDamage: 30,
      targetHpBefore: 200,
      targetMaxHp: 500,
    });
    expect(result.triggered).toBe(true);
  });

  it("gives Orc resource whenever damage is received", () => {
    expect(applyTacticalRacialReaction(fighter(), "Orc", { tookDamage: 1 }).triggered).toBe(true);
  });

  it("gives Tiefling resource after magic damage", () => {
    expect(applyTacticalRacialReaction(fighter(), "Tiefling", { dealtDamage: 10, damageType: "magic" }).triggered).toBe(true);
  });

  it("gives Vampiro resource after damaging an already injured target", () => {
    expect(
      applyTacticalRacialReaction(fighter(), "Vampiro", {
        dealtDamage: 10,
        targetHpBefore: 499,
        targetMaxHp: 500,
      }).triggered,
    ).toBe(true);
  });

  it("caps resource at its maximum", () => {
    const maxed = { ...fighter(), raceResource: 9 };
    const result = applyTacticalRacialReaction(maxed, "Orc", { tookDamage: 10 });
    expect(result.triggered).toBe(false);
    expect(result.combatant.raceResource).toBe(9);
  });
});
