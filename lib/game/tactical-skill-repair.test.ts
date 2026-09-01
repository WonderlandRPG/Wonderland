import { describe, expect, it } from "vitest";

import type { ClassSkill } from "@/lib/game/classes";
import {
  getTacticalTransformationModifiers,
  repairTacticalInertSkill,
} from "@/lib/game/tactical-skill-repair";

function transformation(status: string): ClassSkill {
  return {
    key: status,
    name: status,
    level: 50,
    category: "Transformação",
    type: "Ativa",
    effect: "Transformação",
    kind: "utility",
    damageType: "none",
    target: "self",
    resource: "special",
    resourceKey: "race",
    cost: 3,
    cooldown: 6,
    range: 0,
    area: 0,
    duration: 3,
    scaling: [],
    reachText: "Próprio usuário",
    conditions: [],
    systemRule: "Ativa o estado.",
    playerDescription: "Ativa o estado.",
    chance: 100,
    maxStacks: 1,
    operations: [
      {
        operation: "APPLY_STATUS",
        target: "self",
        base: 0,
        scaling: [],
        damageType: "none",
        status,
        duration: 3,
        chance: 100,
        stacks: 1,
        maxStacks: 1,
        distance: 0,
        modifiers: [],
      },
    ],
  };
}

describe("tactical inert skill repair", () => {
  it.each([
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
  ])("gives %s a real temporary mechanical effect", (status) => {
    const repaired = repairTacticalInertSkill(transformation(status));

    expect(repaired.operations[0]?.modifiers.length).toBeGreaterThan(0);
    expect(getTacticalTransformationModifiers(status)?.length).toBeGreaterThan(0);
    expect(repaired.playerDescription).toContain("No mapa tático");
  });

  it("does not invent mechanics for unknown statuses", () => {
    const original = transformation("estado-desconhecido");
    expect(repairTacticalInertSkill(original)).toEqual(original);
  });
});
