import { describe, expect, it } from "vitest";

import type { ClassSkill } from "@/lib/game/classes";
import { applyTacticalSpatialSkill } from "@/lib/game/tactical-spatial-skill";

const grid = { width: 6, height: 6 };

function spatialSkill(
  operation: "MOVE" | "TELEPORT" | "PUSH",
  target: "self" | "enemy",
  distance: number,
): ClassSkill {
  return {
    key: operation.toLowerCase(),
    name: operation,
    level: 1,
    category: "Mobilidade",
    type: "Ativa",
    effect: operation,
    kind: "utility",
    damageType: "none",
    target,
    resource: "none",
    resourceKey: "class",
    cost: 0,
    cooldown: 0,
    range: distance,
    area: 0,
    duration: 0,
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
        target,
        base: 0,
        scaling: [],
        damageType: "none",
        status: "",
        duration: 0,
        chance: 100,
        stacks: 0,
        maxStacks: 0,
        distance,
        modifiers: [],
      },
    ],
  };
}

describe("applyTacticalSpatialSkill", () => {
  it("does not execute a spatial operation that failed its chance", () => {
    const result = applyTacticalSpatialSkill({
      skill: spatialSkill("TELEPORT", "self", 3),
      successfulOperationIndexes: [],
      playerPosition: { x: 0, y: 0 },
      enemyPosition: { x: 5, y: 5 },
      selectedPosition: { x: 2, y: 0 },
      obstacles: new Set(),
      grid,
    });
    expect(result.playerPosition).toEqual({ x: 0, y: 0 });
  });

  it("MOVE cannot cross an obstacle wall", () => {
    const result = applyTacticalSpatialSkill({
      skill: spatialSkill("MOVE", "self", 3),
      successfulOperationIndexes: [0],
      playerPosition: { x: 0, y: 1 },
      enemyPosition: { x: 5, y: 5 },
      selectedPosition: { x: 2, y: 1 },
      obstacles: new Set(["1,0", "1,1", "1,2", "1,3", "1,4", "1,5"]),
      grid,
    });
    expect(result.playerPosition).toEqual({ x: 0, y: 1 });
    expect(result.messages.join(" ")).toContain("não existe caminho");
  });

  it("TELEPORT may cross obstacles but cannot land on one", () => {
    const result = applyTacticalSpatialSkill({
      skill: spatialSkill("TELEPORT", "self", 3),
      successfulOperationIndexes: [0],
      playerPosition: { x: 0, y: 1 },
      enemyPosition: { x: 5, y: 5 },
      selectedPosition: { x: 2, y: 1 },
      obstacles: new Set(["1,1"]),
      grid,
    });
    expect(result.playerPosition).toEqual({ x: 2, y: 1 });
  });

  it("PUSH stops before obstacles", () => {
    const result = applyTacticalSpatialSkill({
      skill: spatialSkill("PUSH", "enemy", 3),
      successfulOperationIndexes: [0],
      playerPosition: { x: 0, y: 1 },
      enemyPosition: { x: 1, y: 1 },
      selectedPosition: { x: 1, y: 1 },
      obstacles: new Set(["3,1"]),
      grid,
    });
    expect(result.enemyPosition).toEqual({ x: 2, y: 1 });
  });
});
