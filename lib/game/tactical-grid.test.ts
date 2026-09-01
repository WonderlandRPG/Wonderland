import { describe, expect, it } from "vitest";

import {
  getReachableTacticalCells,
  getTacticalAreaCells,
  getTacticalDistance,
  tacticalPositionKey,
} from "@/lib/game/tactical-grid";

const grid = { width: 5, height: 5 };

describe("tactical grid", () => {
  it("uses orthogonal Manhattan distance", () => {
    expect(getTacticalDistance({ x: 0, y: 0 }, { x: 3, y: 2 })).toBe(5);
  });

  it("never moves through blocked cells", () => {
    const blocked = new Set(["1,0", "1,1", "1,2", "1,3"]);
    const reachable = getReachableTacticalCells({
      start: { x: 0, y: 0 },
      blocked,
      movement: 4,
      grid,
    });

    expect(reachable.has("1,0")).toBe(false);
    expect(reachable.has("2,0")).toBe(false);
    expect(reachable.get("0,4")).toBe(4);
  });

  it("stores the real movement cost for each reachable cell", () => {
    const reachable = getReachableTacticalCells({
      start: { x: 2, y: 2 },
      blocked: new Set(),
      movement: 3,
      grid,
    });

    expect(reachable.get("2,1")).toBe(1);
    expect(reachable.get("4,2")).toBe(2);
    expect(reachable.get("4,3")).toBe(3);
    expect(reachable.has("4,4")).toBe(false);
  });

  it("does not include the starting cell as a movement destination", () => {
    const start = { x: 2, y: 2 };
    const reachable = getReachableTacticalCells({
      start,
      blocked: new Set(),
      movement: 2,
      grid,
    });

    expect(reachable.has(tacticalPositionKey(start))).toBe(false);
  });

  it("creates area cells without leaving the grid", () => {
    const area = getTacticalAreaCells({ center: { x: 0, y: 0 }, radius: 2, grid });

    expect(area).toEqual(new Set(["0,0", "1,0", "2,0", "0,1", "1,1", "0,2"]));
    expect(area.has("-1,0")).toBe(false);
  });
});
