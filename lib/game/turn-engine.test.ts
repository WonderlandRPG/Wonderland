import { describe, expect, it } from "vitest";

import {
  buildTurnOrder,
  canMoveTo,
  getNextTurn,
  isTargetInRange,
} from "@/lib/game/turn-engine";

describe("turn engine", () => {
  it("orders fighters by initiative with a deterministic tie breaker", () => {
    expect(
      buildTurnOrder([
        { id: "b", initiative: 20 },
        { id: "a", initiative: 20 },
        { id: "c", initiative: 10 },
      ]),
    ).toEqual(["a", "b", "c"]);
  });

  it("advances rounds after the last fighter acts", () => {
    expect(
      getNextTurn({
        round: 1,
        turn: 3,
        turnOrder: ["a", "b"],
        activeCharacterId: "b",
      }),
    ).toEqual({ round: 2, turn: 4, activeCharacterId: "a" });
  });

  it("validates tactical movement and occupied cells", () => {
    expect(
      canMoveTo({
        from: { x: 2, y: 2 },
        to: { x: 4, y: 3 },
        movementRange: 3,
        grid: { width: 10, height: 10 },
      }),
    ).toBe(true);

    expect(
      canMoveTo({
        from: { x: 2, y: 2 },
        to: { x: 3, y: 2 },
        movementRange: 3,
        grid: { width: 10, height: 10 },
        occupied: [{ x: 3, y: 2 }],
      }),
    ).toBe(false);
  });

  it("uses the same range rule for attacks and skills", () => {
    expect(isTargetInRange({ x: 1, y: 1 }, { x: 3, y: 2 }, 3)).toBe(true);
    expect(isTargetInRange({ x: 1, y: 1 }, { x: 4, y: 2 }, 3)).toBe(false);
  });
});
