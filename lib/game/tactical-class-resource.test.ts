import { describe, expect, it } from "vitest";

import { createCombatant } from "@/lib/game/combat";
import type { ClassSkill } from "@/lib/game/classes";
import {
  applyTacticalClassResourceGeneration,
  initialTacticalClassResourceTracker,
  markTacticalMovement,
  resetTacticalClassResourceRound,
} from "@/lib/game/tactical-class-resource";

function fighter(resource = "Recurso") {
  return createCombatant({
    id: "hero",
    name: "Hero",
    attributes: { FOR: 100, DEF: 100, RES: 100, INI: 100, INT: 100, ARC: 100 },
    baseHp: 500,
    baseMana: 100,
    classResource: { name: resource, initial: 0, maximum: 100 },
  });
}

function skill(operation: ClassSkill["operations"][number]["operation"], category = "Dano", cost = 10): ClassSkill {
  return {
    key: `skill-${operation}-${category}`,
    name: "Skill",
    level: 1,
    category,
    type: "Ativa",
    effect: "Teste",
    kind: operation === "DAMAGE" ? "damage" : "utility",
    damageType: operation === "DAMAGE" ? "magic" : "none",
    target: operation === "HEAL" || operation === "SHIELD" ? "self" : "enemy",
    resource: "special",
    resourceKey: "class",
    cost,
    cooldown: 1,
    range: 3,
    area: 0,
    duration: 1,
    scaling: [],
    reachText: "Teste",
    conditions: [],
    systemRule: "Teste",
    playerDescription: "Teste",
    chance: 100,
    maxStacks: 1,
    operations: [{ operation, target: operation === "HEAL" || operation === "SHIELD" ? "self" : "enemy", base: 10, scaling: [], damageType: operation === "DAMAGE" ? "magic" : "none", status: operation.toLowerCase(), duration: 1, chance: 100, stacks: 1, maxStacks: 1, distance: 0, modifiers: operation === "DEBUFF" ? [{ attribute: "DEF", value: -10 }] : [] }],
  };
}

function run(className: string, context: Parameters<typeof applyTacticalClassResourceGeneration>[0]["context"], tracker = initialTacticalClassResourceTracker) {
  return applyTacticalClassResourceGeneration({ combatant: fighter(), className, tracker, context });
}

describe("tactical class resource generation", () => {
  it("Arqueiro only gains Foco from damage at 3+ cells", () => {
    expect(run("Arqueiro", { action: "basic", dealtDamage: 20, distance: 2 }).gained).toBe(0);
    expect(run("Arqueiro", { action: "basic", dealtDamage: 20, distance: 3 }).gained).toBe(10);
  });

  it("Bárbaro generates on dealing and receiving damage", () => {
    expect(run("Bárbaro", { action: "skill", dealtDamage: 20 }).gained).toBe(10);
    expect(run("Bárbaro", { action: "incoming", tookDamage: 20 }).gained).toBe(5);
  });

  it("Clérigo generates from effective heal or shield", () => {
    expect(run("Clérigo", { action: "skill", skill: skill("HEAL"), healed: 50 }).gained).toBe(10);
    expect(run("Clérigo", { action: "skill", skill: skill("SHIELD"), shieldGranted: 30 }).gained).toBe(10);
  });

  it("Bruxo and Ladino generate from successful negative status operations", () => {
    const debuff = skill("DEBUFF");
    expect(run("Bruxo", { action: "skill", skill: debuff, successfulOperationIndexes: [0] }).gained).toBe(1);
    expect(run("Ladino", { action: "skill", skill: debuff, successfulOperationIndexes: [0] }).gained).toBe(1);
  });

  it("Feiticeiro generates 15 from magic damage", () => {
    expect(run("Feiticeiro", { action: "skill", dealtDamage: 30, damageType: "magic" }).gained).toBe(15);
  });

  it("Guerreiro generates from basic hit and shield absorption", () => {
    expect(run("Guerreiro", { action: "basic", dealtDamage: 20 }).gained).toBe(10);
    expect(run("Guerreiro", { action: "incoming", tookDamage: 10, shieldAbsorbed: 15 }).gained).toBe(10);
  });

  it("Mago generates from a successful skill with cost", () => {
    const magic = skill("DAMAGE", "Dano", 10);
    expect(run("Mago", { action: "skill", skill: magic, successfulOperationIndexes: [0] }).gained).toBe(1);
  });

  it("Monge only gains once per round", () => {
    const first = run("Monge", { action: "basic", dealtDamage: 10 });
    const second = run("Monge", { action: "basic", dealtDamage: 10 }, first.tracker);
    expect(first.gained).toBe(1);
    expect(second.gained).toBe(0);
    expect(resetTacticalClassResourceRound(first.tracker).generatedThisRound).toBe(0);
  });

  it("Ninja gains after moving before a skill and respects 2-per-round cap", () => {
    const moved = markTacticalMovement(initialTacticalClassResourceTracker, true);
    const first = run("Ninja", { action: "skill", skill: skill("DAMAGE"), dealtDamage: 10 }, moved);
    expect(first.gained).toBe(1);
    const marked = run("Ninja", { action: "skill", skill: skill("DAMAGE"), dealtDamage: 10, targetMarked: true }, first.tracker);
    expect(marked.gained).toBe(1);
    const capped = run("Ninja", { action: "skill", skill: skill("DAMAGE"), dealtDamage: 10, targetMarked: true }, marked.tracker);
    expect(capped.gained).toBe(0);
  });

  it("Alquimista only generates when category changes and caps at 10 per round", () => {
    const first = run("Alquimista", { action: "skill", skill: skill("DAMAGE", "Dano") });
    expect(first.gained).toBe(0);
    const second = run("Alquimista", { action: "skill", skill: skill("SHIELD", "Escudo") }, first.tracker);
    expect(second.gained).toBe(5);
    const third = run("Alquimista", { action: "skill", skill: skill("DAMAGE", "Dano") }, second.tracker);
    expect(third.gained).toBe(5);
    const fourth = run("Alquimista", { action: "skill", skill: skill("SHIELD", "Escudo") }, third.tracker);
    expect(fourth.gained).toBe(0);
  });

  it("Necromante generates when a unit loses at least 20% max HP", () => {
    expect(run("Necromante", { action: "skill", dealtDamage: 199, targetMaxHp: 1000 }).gained).toBe(0);
    expect(run("Necromante", { action: "skill", dealtDamage: 200, targetMaxHp: 1000 }).gained).toBe(5);
  });

  it("Paladino generates from support and incoming damage", () => {
    expect(run("Paladino", { action: "skill", healed: 20 }).gained).toBe(10);
    expect(run("Paladino", { action: "incoming", tookDamage: 20 }).gained).toBe(5);
  });
});
