import { describe, expect, it } from "vitest";

import {
  getForcedMovementDestination,
  getReachableTacticalCells,
  getTacticalAreaCells,
  getTacticalDistance,
  hasTacticalLineOfSight,
  tacticalPositionKey,
} from "@/lib/game/tactical-grid";

const grid = { width: 5, height: 5 };

describe("tactical grid", () => {
  it("uses orthogonal Manhattan distance", () => {
    expect(getTacticalDistance({ x: 0, y: 0 }, { x: 3, y: 2 })).toBe(5);
  });

  it("never moves through blocked cells", () => {
    const blocked = new Set(["1,0", "1,1", "1,2", "1,3"]);
    const reachable = getReachableTacticalCells({ start: { x: 0, y: 0 }, blocked, movement: 4, grid });
    expect(reachable.has("1,0")).toBe(false);
    expect(reachable.has("2,0")).toBe(false);
    expect(reachable.get("0,4")).toBe(4);
  });

  it("stores the real movement cost for each reachable cell", () => {
    const reachable = getReachableTacticalCells({ start: { x: 2, y: 2 }, blocked: new Set(), movement: 3, grid });
    expect(reachable.get("2,1")).toBe(1);
    expect(reachable.get("4,2")).toBe(2);
    expect(reachable.get("4,3")).toBe(3);
    expect(reachable.has("4,4")).toBe(false);
  });

  it("does not include the starting cell as a movement destination", () => {
    const start = { x: 2, y: 2 };
    const reachable = getReachableTacticalCells({ start, blocked: new Set(), movement: 2, grid });
    expect(reachable.has(tacticalPositionKey(start))).toBe(false);
  });

  it("creates area cells without leaving the grid", () => {
    const area = getTacticalAreaCells({ center: { x: 0, y: 0 }, radius: 2, grid });
    expect(area).toEqual(new Set(["0,0", "1,0", "2,0", "0,1", "1,1", "0,2"]));
  });

  it("blocks line of sight when an obstacle crosses the ray", () => {
    expect(hasTacticalLineOfSight({ from: { x: 0, y: 0 }, to: { x: 4, y: 0 }, blocked: new Set(["2,0"]) })).toBe(false);
    expect(hasTacticalLineOfSight({ from: { x: 0, y: 0 }, to: { x: 4, y: 0 }, blocked: new Set(["2,1"]) })).toBe(true);
  });

  it("pushes until distance, obstacle or border", () => {
    expect(getForcedMovementDestination({ source: { x: 0, y: 2 }, target: { x: 1, y: 2 }, distance: 3, blocked: new Set(["3,2"]), grid })).toEqual({ position: { x: 2, y: 2 }, moved: 1 });
    expect(getForcedMovementDestination({ source: { x: 0, y: 4 }, target: { x: 1, y: 4 }, distance: 8, blocked: new Set(), grid })).toEqual({ position: { x: 4, y: 4 }, moved: 3 });
  });
});
